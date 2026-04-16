/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
(function() {
  'use strict';

  var _modalEl = null;
  var _generating = false;
  var _loadingInterval = null;
  var _previousFocus = null;

  var MAX_GENERATIONS_PER_WEEK = 3;
  var LS_KEY_PROGRAM = 'mtd_muscu_program';
  var LS_KEY_PROGRESS = 'mtd_muscu_ia_progress';
  var LS_KEY_GENERATIONS = 'mtd_muscu_generations';

  // FIX Hermès : icônes unicode sobres (◆ ● ○ ◇ ■ □ ▲ △) — remplacement des emojis
  // décoratifs colorés par des marqueurs typographiques tonal-on-tonal.
  var INSTALLATIONS = [
    { id: 'muscu',       label: 'Salle de musculation',  desc: 'Barres, haltères, machines, câbles',         icon: '\u25A0' },
    { id: 'home_gym',    label: 'Home gym',               desc: 'Haltères + banc à domicile',                 icon: '\u25A1' },
    { id: 'poids_corps', label: 'Maison / PDC',           desc: 'Sans matériel, poids du corps uniquement',   icon: '\u25CB' },
    { id: 'crossfit',    label: 'Box CrossFit',           desc: 'WODs, rower, anneaux, barbell olympique',    icon: '\u25C6' },
    { id: 'piscine',     label: 'Piscine',                desc: 'Natation, aquagym',                          icon: '\u2248' },
    { id: 'course',      label: 'Course à pied',          desc: 'Piste, route, tapis de course',              icon: '\u2192' },
    { id: 'velo',        label: 'Vélo / cardio',          desc: 'Vélo, home trainer, elliptique',             icon: '\u29BF' },
    { id: 'terrain',     label: 'Terrain de sport',       desc: 'Padel, tennis, foot, sports collectifs',     icon: '\u25A2' },
    { id: 'gymnase',     label: 'Gymnase / yoga',         desc: 'Studio yoga, danse, arts martiaux',          icon: '\u25B3' }
  ];

  var LOADING_PHRASES = [
    'On analyse ton profil et on calcule tes charges adapt\u00e9es.',
    'On choisit le split qui colle \u00e0 tes jours dispo et ton matos.',
    'On calibre chaque charge pour cette semaine.',
    'On construit ta semaine en tenant compte de ta progression\u2026',
    'On r\u00e9dige les conseils techniques pour chaque exo.',
    'On int\u00e8gre tes restrictions m\u00e9dicales et ta r\u00e9cup\u00e9ration.',
    'Dernier ajustement sur ton programme. C\'est bient\u00f4t pr\u00eat\u2026'
  ];

  var FOOTER_QUOTES = [
    'Donne ce programme à quelqu\u2019un d\u2019autre. Il ne fonctionnera pas.',
    'Le sur-mesure n\u2019est pas une option. C\u2019est la seule manière de progresser.'
  ];

  // --- P6 : Compteur de générations restantes ---

  function getWeekKey(date) {
    // Returns "YYYY-Www" for the ISO week containing `date` — uses UTC to match server
    var d = new Date(date);
    // Set to nearest Thursday in UTC (ISO week starts Monday)
    var dayUTC = d.getUTCDay() || 7; // Sunday=0 → 7
    var thursdayUTC = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + (4 - dayUTC)));
    var jan4UTC = new Date(Date.UTC(thursdayUTC.getUTCFullYear(), 0, 4));
    var jan4Day = jan4UTC.getUTCDay() || 7;
    var weekNo = Math.round((thursdayUTC - new Date(Date.UTC(jan4UTC.getUTCFullYear(), 0, jan4Day - 3))) / 604800000) + 1;
    return thursdayUTC.getUTCFullYear() + '-W' + (weekNo < 10 ? '0' : '') + weekNo;
  }

  function getGenerationsData() {
    try {
      var raw = localStorage.getItem(LS_KEY_GENERATIONS);
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return { week: '', count: 0 };
  }

  function saveGenerationsData(data) {
    try { localStorage.setItem(LS_KEY_GENERATIONS, JSON.stringify(data)); } catch(e) {}
  }

  function getGenerationsRemaining() {
    var now = new Date();
    var data = getGenerationsData();
    var currentWeek = getWeekKey(now);
    if (data.week !== currentWeek) return MAX_GENERATIONS_PER_WEEK;
    return Math.max(0, MAX_GENERATIONS_PER_WEEK - (data.count || 0));
  }

  function recordGeneration() {
    var now = new Date();
    var currentWeek = getWeekKey(now);
    var data = getGenerationsData();
    if (data.week !== currentWeek) {
      data = { week: currentWeek, count: 0 };
    }
    data.count = (data.count || 0) + 1;
    saveGenerationsData(data);
  }

  function getNextMondayMidnight() {
    var now = new Date();
    var day = now.getDay(); // 0=dim, 1=lun...6=sam
    var daysUntilMonday = (day === 0) ? 1 : (8 - day);
    var next = new Date(now);
    next.setDate(now.getDate() + daysUntilMonday);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  function formatNextGenerationDate(date) {
    var days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    var months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    var dayName = days[date.getDay()];
    var dayNum = date.getDate();
    var monthName = months[date.getMonth()];
    var h = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
    var m = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
    return dayName + ' ' + dayNum + ' ' + monthName + ' à ' + h + 'h' + m;
  }

  function buildGenerationCounterHTML() {
    var remaining = getGenerationsRemaining();
    if (remaining >= 2) {
      return '<p id="muscu-prog-counter" style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;text-align:center;color:var(--accent,#1A4A1A);margin:0 auto 16px auto;">' +
        remaining + ' g\u00e9n\u00e9ration' + (remaining > 1 ? 's' : '') + ' restante' + (remaining > 1 ? 's' : '') + ' cette semaine' +
      '</p>';
    } else if (remaining === 1) {
      return '<p id="muscu-prog-counter" style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;text-align:center;color:var(--orange,#B85C00);margin:0 auto 16px auto;">' +
        '1 g\u00e9n\u00e9ration restante cette semaine' +
      '</p>';
    } else {
      var nextDate = getNextMondayMidnight();
      return '<p id="muscu-prog-counter" style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;text-align:center;color:var(--grey,#6B6B65);margin:0 auto 16px auto;">' +
        'Prochaine g\u00e9n\u00e9ration disponible\u00a0: ' + formatNextGenerationDate(nextDate) +
      '</p>';
    }
  }

  // --- P7 : Parser le texte du programme en cartes interactives ---

  var DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loadProgress() {
    try {
      var raw = localStorage.getItem(LS_KEY_PROGRESS);
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  }

  function saveProgress(progressArray) {
    try { localStorage.setItem(LS_KEY_PROGRESS, JSON.stringify(progressArray)); } catch(e) {}
  }

  function getProgressKey(weekIdx, dayName, exerciseIdx) {
    return weekIdx + '|' + dayName + '|' + exerciseIdx;
  }

  function buildProgressMap(progressArray) {
    var map = {};
    for (var i = 0; i < progressArray.length; i++) {
      var e = progressArray[i];
      map[getProgressKey(e.week, e.day, e.exercise)] = e.checked;
    }
    return map;
  }

  function updateProgress(weekIdx, dayName, exerciseIdx, checked) {
    var progressArray = loadProgress();
    var key = getProgressKey(weekIdx, dayName, exerciseIdx);
    var found = false;
    for (var i = 0; i < progressArray.length; i++) {
      if (getProgressKey(progressArray[i].week, progressArray[i].day, progressArray[i].exercise) === key) {
        progressArray[i].checked = checked;
        progressArray[i].date = new Date().toISOString().slice(0, 10);
        found = true;
        break;
      }
    }
    if (!found) {
      progressArray.push({ week: weekIdx, day: dayName, exercise: exerciseIdx, checked: checked, date: new Date().toISOString().slice(0, 10) });
    }
    saveProgress(progressArray);
  }

  function parseProgramToHTML(programText) {
    try {
      var lines = programText.split('\n');
      var weeks = [];
      var currentWeek = null;
      var currentDay = null;

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line) continue;

        // Detect week headers: SEMAINE or Semaine at start
        if (/^(SEMAINE|Semaine)\s+\d+/i.test(line)) {
          if (currentWeek) weeks.push(currentWeek);
          currentDay = null;
          currentWeek = { title: line, days: [] };
          continue;
        }

        if (!currentWeek) {
          // Before first week, skip or collect preamble
          continue;
        }

        // Detect day headers: line contains a French day name
        var isDayLine = false;
        for (var d = 0; d < DAYS_FR.length; d++) {
          if (line.indexOf(DAYS_FR[d]) === 0 || line.indexOf(DAYS_FR[d].toUpperCase()) === 0) {
            isDayLine = true;
            break;
          }
        }
        // Also detect if line starts with day name in the middle after week patterns
        if (!isDayLine) {
          for (var d2 = 0; d2 < DAYS_FR.length; d2++) {
            var re = new RegExp('^' + DAYS_FR[d2], 'i');
            if (re.test(line)) { isDayLine = true; break; }
          }
        }

        if (isDayLine) {
          currentDay = { title: line, exercises: [] };
          currentWeek.days.push(currentDay);
          continue;
        }

        // Detect exercise lines: start with digit followed by dot or parenthesis
        if (/^\d+[\.\)]/.test(line)) {
          if (!currentDay) {
            currentDay = { title: '', exercises: [] };
            currentWeek.days.push(currentDay);
          }
          currentDay.exercises.push(line);
          continue;
        }

        // Other lines: if we have a current day, treat as note/extra info
        if (currentDay && line.length > 0) {
          // Append to last exercise as note, or add as separate note exercise
          currentDay.exercises.push(line);
        }
      }

      if (currentWeek) weeks.push(currentWeek);

      // If no weeks detected, return null to trigger fallback
      if (weeks.length === 0) return null;

      var progressArray = loadProgress();
      var progressMap = buildProgressMap(progressArray);

      var html = '';
      for (var w = 0; w < weeks.length; w++) {
        var week = weeks[w];
        var weekIdx = w + 1;
        var isFirstWeek = (w === 0);

        // Count checkable exercises across all days for this week
        var totalExercises = 0;
        for (var dd = 0; dd < week.days.length; dd++) {
          for (var ex = 0; ex < week.days[dd].exercises.length; ex++) {
            if (/^\d+[\.\)]/.test(week.days[dd].exercises[ex])) totalExercises++;
          }
        }

        // Count completed exercises for this week
        var completedExercises = 0;
        for (var dd2 = 0; dd2 < week.days.length; dd2++) {
          var exCount = 0;
          for (var ex2 = 0; ex2 < week.days[dd2].exercises.length; ex2++) {
            if (/^\d+[\.\)]/.test(week.days[dd2].exercises[ex2])) {
              var pKey = getProgressKey(weekIdx, week.days[dd2].title, exCount);
              if (progressMap[pKey]) completedExercises++;
              exCount++;
            }
          }
        }

        // Split "Semaine 1 — Fondations" into number + subtitle for editorial typography
        var weekNumStr = ('0' + weekIdx).slice(-2);
        var weekSubtitle = week.title.replace(/^(SEMAINE|Semaine)\s+\d+\s*[—\-–:]?\s*/i, '').trim();
        if (!weekSubtitle) weekSubtitle = 'Semaine ' + weekIdx;

        // ───────── SEMAINE CONTAINER (un seul trait, pas de double border) ─────────
        html += '<div class="program-week" id="week-' + weekIdx + '" style="background:var(--ivory,#FAF9F6);border-top:1px solid var(--black,#0A0A09);margin-bottom:32px;border-radius:2px;overflow:hidden;">';

        // ───────── WEEK HEADER (grand numéro Georgia XXL + subtitle italique) ─────────
        html += '<div class="week-header" data-week="' + weekIdx + '" style="padding:28px 22px 24px;cursor:pointer;background:var(--ivory,#FAF9F6);display:grid;grid-template-columns:auto 1fr auto;column-gap:20px;align-items:center;position:relative;">';

        // Large numeral "01"
        html += '<div aria-hidden="true" style="font-family:Georgia,serif;font-size:54px;line-height:0.9;font-weight:400;color:var(--black,#0A0A09);letter-spacing:-2px;">' + weekNumStr + '</div>';

        // Label + subtitle stack
        html += '<div style="display:flex;flex-direction:column;gap:6px;min-width:0;">';
        html += '<span style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:9px;letter-spacing:5px;text-transform:uppercase;color:var(--grey,#6B6B65);font-weight:500;">Semaine</span>';
        html += '<span style="font-family:Georgia,serif;font-style:italic;font-size:18px;line-height:1.2;color:var(--black,#0A0A09);letter-spacing:-0.2px;overflow:hidden;text-overflow:ellipsis;">' + escapeHTML(weekSubtitle) + '</span>';
        html += '</div>';

        // Counter chip (no border, no chip-box — just a numeric signature)
        html += '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;">';
        if (totalExercises > 0) {
          html += '<span style="font-family:Georgia,serif;font-size:20px;line-height:1;color:var(--black,#0A0A09);letter-spacing:-0.5px;"><span style="color:' + (completedExercises === totalExercises ? 'var(--green,#1A4A1A)' : 'var(--black,#0A0A09)') + ';">' + completedExercises + '</span><span style="color:var(--grey,#6B6B65);"> / ' + totalExercises + '</span></span>';
          html += '<span style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:8px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);">Exercices</span>';
        }
        html += '</div>';

        html += '</div>'; // .week-header

        // ───────── WEEK BODY ─────────
        html += '<div class="week-body" style="padding:0 22px 28px;background:var(--ivory,#FAF9F6);' + (isFirstWeek ? '' : 'display:none;') + '">';

        // Bocuse signature: 40px thin black rule under the header
        html += '<div aria-hidden="true" style="width:40px;height:1px;background:var(--black,#0A0A09);margin:0 0 22px;"></div>';

        for (var dd3 = 0; dd3 < week.days.length; dd3++) {
          var day = week.days[dd3];

          // Spacer between days (editorial breathing)
          if (dd3 > 0) {
            html += '<div aria-hidden="true" style="height:1px;background:var(--border,#D8D8D0);margin:28px 0 0;"></div>';
          }

          if (day.title) {
            // Split day name from muscle groups if dash present
            var dayParts = day.title.split(/\s*[—\-–:]\s*/);
            var dayName = dayParts[0] || day.title;
            var dayFocus = dayParts.slice(1).join(' — ').trim();

            html += '<div class="day-title" style="margin:' + (dd3 === 0 ? '4px' : '22px') + ' 0 18px;display:flex;flex-direction:column;gap:4px;">';
            html += '<span style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:9px;letter-spacing:5px;text-transform:uppercase;color:var(--grey,#6B6B65);font-weight:500;">' + escapeHTML(dayName) + '</span>';
            if (dayFocus) {
              html += '<span style="font-family:Georgia,serif;font-style:italic;font-size:15px;line-height:1.3;color:var(--black,#0A0A09);letter-spacing:-0.1px;">' + escapeHTML(dayFocus) + '</span>';
            }
            html += '</div>';
          }

          var exerciseIdx = 0;
          for (var ex3 = 0; ex3 < day.exercises.length; ex3++) {
            var exerciseLine = day.exercises[ex3];
            var isCheckable = /^\d+[\.\)]/.test(exerciseLine);
            if (isCheckable) {
              var pKey2 = getProgressKey(weekIdx, day.title, exerciseIdx);
              var isChecked = progressMap[pKey2] ? true : false;

              // Parse "1. Développé couché — 4 × 8-10" into name + scheme
              var cleanLine = exerciseLine.replace(/^\d+[\.\)]\s*/, '');
              var exParts = cleanLine.split(/\s*[—\-–]\s*/);
              var exName = exParts[0] || cleanLine;
              var exScheme = exParts.slice(1).join(' — ').trim();
              var exNumStr = ('0' + (exerciseIdx + 1)).slice(-2);

              // ───── EXERCISE ROW (no box, just a fine left rule — livre gastronomique) ─────
              html += '<label class="exercise-row" style="display:grid;grid-template-columns:18px auto 1fr;column-gap:12px;align-items:center;padding:12px 0 12px 14px;border-left:1px solid ' + (isChecked ? 'var(--black,#0A0A09)' : 'var(--border,#D8D8D0)') + ';cursor:pointer;transition:border-color 0.2s ease;margin-bottom:2px;">';

              // Minimal square checkbox
              html += '<span style="position:relative;display:inline-block;width:18px;height:18px;flex-shrink:0;">';
              html += '<input type="checkbox"' + (isChecked ? ' checked' : '') + ' data-week="' + weekIdx + '" data-day="' + escapeHTML(day.title) + '" data-exercise="' + exerciseIdx + '" style="appearance:none;-webkit-appearance:none;width:18px;height:18px;margin:0;border:1px solid var(--black,#0A0A09);border-radius:2px;background:' + (isChecked ? 'var(--black,#0A0A09)' : 'var(--ivory,#FAF9F6)') + ';cursor:pointer;display:block;position:relative;transition:background 0.15s ease;">';
              if (isChecked) {
                html += '<span aria-hidden="true" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-55%) rotate(45deg);width:5px;height:9px;border-right:1.5px solid var(--ivory,#FAF9F6);border-bottom:1.5px solid var(--ivory,#FAF9F6);pointer-events:none;"></span>';
              }
              html += '</span>';

              // Small numeral
              html += '<span style="font-family:Georgia,serif;font-size:11px;color:var(--grey,#6B6B65);letter-spacing:1px;min-width:18px;">' + exNumStr + '</span>';

              // Name + scheme
              html += '<span style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:13px;line-height:1.5;color:var(--black,#0A0A09);letter-spacing:0.1px;display:flex;flex-wrap:wrap;align-items:baseline;gap:0 10px;' + (isChecked ? 'text-decoration:line-through;text-decoration-color:var(--grey,#6B6B65);color:var(--grey,#6B6B65);' : '') + '">';
              html += '<span style="font-weight:500;">' + escapeHTML(exName) + '</span>';
              if (exScheme) {
                html += '<span style="font-family:Georgia,serif;font-style:italic;font-size:12px;color:var(--grey,#6B6B65);letter-spacing:0;">' + escapeHTML(exScheme) + '</span>';
              }
              html += '</span>';

              html += '</label>';
              exerciseIdx++;
            } else {
              // Non-exercise line (note) — discreet italic, aligned to exercises grid
              html += '<div style="font-family:Georgia,serif;font-style:italic;font-size:12px;color:var(--grey,#6B6B65);margin:6px 0 6px 14px;padding:4px 0;line-height:1.6;letter-spacing:0.1px;">' + escapeHTML(exerciseLine) + '</div>';
            }
          }
        }

        html += '</div>'; // .week-body
        html += '</div>'; // .program-week
      }

      return html;
    } catch(e) {
      console.error('[muscu-prog] parse error:', e);
      return null;
    }
  }

  function attachProgramInteractivity(container) {
    // Week accordion toggle
    var headers = container.querySelectorAll('.week-header');
    for (var i = 0; i < headers.length; i++) {
      headers[i].addEventListener('click', function(e) {
        var weekEl = e.currentTarget.parentElement;
        var body = weekEl.querySelector('.week-body');
        if (!body) return;
        var isOpen = body.style.display !== 'none';
        body.style.display = isOpen ? 'none' : '';
      });
    }

    // Checkbox progress save + strikethrough (editorial Bocuse styling)
    var checkboxes = container.querySelectorAll('.exercise-row input[type="checkbox"]');
    for (var j = 0; j < checkboxes.length; j++) {
      checkboxes[j].addEventListener('change', function(e) {
        var cb = e.currentTarget;
        var weekIdx = parseInt(cb.getAttribute('data-week'), 10);
        var dayName = cb.getAttribute('data-day');
        var exerciseIdx = parseInt(cb.getAttribute('data-exercise'), 10);
        var checked = cb.checked;
        updateProgress(weekIdx, dayName, exerciseIdx, checked);

        // Visual state on the custom checkbox (fill + check mark)
        var cbWrap = cb.parentElement;
        cb.style.background = checked ? 'var(--black,#0A0A09)' : 'var(--ivory,#FAF9F6)';
        var existingCheck = cbWrap.querySelector('span[aria-hidden="true"]');
        if (checked && !existingCheck) {
          var checkMark = document.createElement('span');
          checkMark.setAttribute('aria-hidden', 'true');
          checkMark.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-55%) rotate(45deg);width:5px;height:9px;border-right:1.5px solid var(--ivory,#FAF9F6);border-bottom:1.5px solid var(--ivory,#FAF9F6);pointer-events:none;';
          cbWrap.appendChild(checkMark);
        } else if (!checked && existingCheck) {
          existingCheck.parentNode.removeChild(existingCheck);
        }

        // Row: left-rule turns black when checked, text strikethrough
        var row = cb.closest('.exercise-row');
        if (row) {
          row.style.borderLeftColor = checked ? 'var(--black,#0A0A09)' : 'var(--border,#D8D8D0)';
          // The text span is the last grid child of the row
          var textSpan = row.children[row.children.length - 1];
          if (textSpan) {
            textSpan.style.textDecoration = checked ? 'line-through' : '';
            textSpan.style.textDecorationColor = checked ? 'var(--grey,#6B6B65)' : '';
            textSpan.style.color = checked ? 'var(--grey,#6B6B65)' : 'var(--black,#0A0A09)';
          }
        }

        // Update counter in week header (new structure: two spans inside first .week-header child)
        var weekEl = cb.closest('.program-week');
        if (weekEl) {
          var allCbs = weekEl.querySelectorAll('input[type="checkbox"]');
          var total = allCbs.length;
          var done = 0;
          for (var k = 0; k < allCbs.length; k++) { if (allCbs[k].checked) done++; }
          var header = weekEl.querySelector('.week-header');
          if (header && total > 0) {
            // counter block is last child of the header grid
            var counterBlock = header.children[header.children.length - 1];
            if (counterBlock) {
              var spans = counterBlock.querySelectorAll('span');
              if (spans.length >= 1) {
                var doneColor = (done === total) ? 'var(--green,#1A4A1A)' : 'var(--black,#0A0A09)';
                spans[0].innerHTML = '<span style="color:' + doneColor + ';">' + done + '</span><span style="color:var(--grey,#6B6B65);"> / ' + total + '</span>';
              }
            }
          }
        }
      });
    }
  }

  // ── Calcul 1RM (Epley) depuis poids × reps enregistrés ──────────────────────
  function epley1RM(weight, reps) {
    if (!weight || !reps || reps <= 0) return null;
    if (reps === 1) return weight;
    return Math.round((weight * (1 + reps / 30)) / 2.5) * 2.5;
  }

  // ── Sérialisation du bilan médical S.muscuMedical → texte lisible par l'IA ──
  function serializeMuscuMedical(med) {
    if (!med || typeof med !== 'object' || !med.done) return 'aucune donnée médicale renseignée';
    var lines = [];

    // Zones douloureuses
    var zoneLabels = {
      shoulders: 'Épaules', elbows: 'Coudes', wrists: 'Poignets',
      neck: 'Nuque/Cervicales', upperBack: 'Haut du dos', lowerBack: 'Bas du dos',
      hips: 'Hanches', knees: 'Genoux', ankles: 'Chevilles', feet: 'Pieds (fasciite)'
    };
    var activeZones = [];
    Object.keys(zoneLabels).forEach(function(k) {
      if (med[k]) activeZones.push(zoneLabels[k]);
    });
    if (activeZones.length) lines.push('Zones douloureuses/fragiles : ' + activeZones.join(', '));

    // Diagnostics confirmés
    var diagLabels = {
      herniaDisc: 'Hernie discale', herniaInguinal: 'Hernie inguinale',
      rotatorCuff: 'Déchirure coiffe des rotateurs', acl: 'LCA opéré/fragilisé',
      osteoporosis: 'Ostéoporose', hypertension: 'HTA sévère (≥180/110)',
      rheumatoidArthritis: 'Polyarthrite rhumatoïde', fibromyalgia: 'Fibromyalgie',
      meniscus: 'Ménisque lésé/opéré', spondylarthritis: 'Spondylarthrite ankylosante',
      kneeOsteoarthritis: 'Gonarthrose (arthrose du genou)',
      epicondylitis: 'Épicondylite latérale (tennis elbow)'
    };
    var activeDiag = [];
    Object.keys(diagLabels).forEach(function(k) {
      if (med[k]) activeDiag.push(diagLabels[k]);
    });
    if (activeDiag.length) lines.push('Diagnostics confirmés : ' + activeDiag.join(', '));

    // Niveau de douleur
    var painMap = { 0: 'Aucune', 1: 'Légère', 2: 'Modérée', 3: 'Sévère' };
    if (med.painLevel !== undefined && med.painLevel !== null) {
      lines.push('Intensité de la douleur : ' + (painMap[med.painLevel] || med.painLevel) + '/3');
    }

    // Notes libres
    if (med.notes && typeof med.notes === 'string' && med.notes.trim()) {
      lines.push('Notes du patient : ' + med.notes.trim().slice(0, 300));
    }

    return lines.length ? lines.join(' | ') : 'bilan complété, aucune restriction signalée';
  }

  // ── Calcul 1RM depuis muscuStrengthProfile (poids entraînement × reps) ──────
  function resolveStrength1RM(profile) {
    var sp = profile || {};
    var result = {};
    // bench_press → bench1RM
    if (sp.bench_press) {
      var bReps = sp.bench_press_reps || 8;
      result.bench1RM = epley1RM(sp.bench_press, bReps);
    }
    // squat → squat1RM
    if (sp.squat) {
      var sReps = sp.squat_reps || 8;
      result.squat1RM = epley1RM(sp.squat, sReps);
    }
    // deadlift → deadlift1RM
    if (sp.deadlift) {
      var dReps = sp.deadlift_reps || 8;
      result.deadlift1RM = epley1RM(sp.deadlift, dReps);
    }
    // overhead_press → ohp1RM
    if (sp.overhead_press) {
      var oReps = sp.overhead_press_reps || 8;
      result.ohp1RM = epley1RM(sp.overhead_press, oReps);
    }
    // barbell_row → row1RM
    if (sp.barbell_row) {
      var rReps = sp.barbell_row_reps || 8;
      result.row1RM = epley1RM(sp.barbell_row, rReps);
    }
    // hip_thrust → hipThrust1RM
    if (sp.hip_thrust) {
      var hReps = sp.hip_thrust_reps || 10;
      result.hipThrust1RM = epley1RM(sp.hip_thrust, hReps);
    }
    // leg_press → legPress1RM
    if (sp.leg_press) {
      var lpReps = sp.leg_press_reps || 10;
      result.legPress1RM = epley1RM(sp.leg_press, lpReps);
    }
    return result;
  }

  function buildProfileFromState() {
    var S = window.S || {};

    // ── Résolution des 1RM : priorité à muscuStrengthProfile (données réelles
    //    entrées par l'utilisateur), avec fallback sur crossfit1RM si disponible.
    var strengthProfile = S.muscuStrengthProfile || {};
    // FIX P0 audit user Karim : mapping CF→muscu complet (avant : 60% des 1RM CF perdus au switch).
    // Maintenant : tous les lifts CF (bench_press, back/front_squat, deadlift, push_press, jerk,
    // thruster, overhead_squat) alimentent muscuStrengthProfile avec facteurs de scaling appropriés.
    var cfMap = {
      'bench_press':    { k: 'bench_press',    factor: 1.00 },
      'back_squat':     { k: 'squat',          factor: 1.00 },
      'front_squat':    { k: 'squat',          factor: 1.18 }, // FS≈85% BS → BS = FS/0.85
      'deadlift':       { k: 'deadlift',       factor: 1.00 },
      'overhead_press': { k: 'overhead_press', factor: 1.00 },
      'push_press':     { k: 'overhead_press', factor: 0.85 }, // PP exploit leg drive → OHP strict ~85%
      'shoulder_to_oh': { k: 'overhead_press', factor: 0.85 },
      'jerk':           { k: 'overhead_press', factor: 0.80 },
      'overhead_squat': { k: 'squat',          factor: 1.67 }, // OHS≈60% BS → BS = OHS/0.6
      'thruster':       { k: 'squat',          factor: 1.43 }  // Thruster≈70% FS → approx squat/0.70
    };
    var cf1rm = S.crossfit1RM || {};
    Object.keys(cfMap).forEach(function(cfKey) {
      var entry = cfMap[cfKey];
      var muscuKey = entry.k;
      // On ne remplace pas si l'user a entré une valeur muscu directe (priorité données réelles).
      if (cf1rm[cfKey] && !strengthProfile[muscuKey]) {
        // 1RM CF supposé = 1 rep exacte (les 1RM CF sont à la rep max).
        // Si l'user a entré "clean" sans back_squat, on n'en déduit pas le squat (mouvement différent).
        strengthProfile[muscuKey] = Math.round(cf1rm[cfKey] * entry.factor);
        strengthProfile[muscuKey + '_reps'] = 1;
      }
    });
    var computed1RM = resolveStrength1RM(strengthProfile);

    // ── Résolution du niveau ──────────────────────────────────────────────────
    var niveauMap = { beginner: 'débutant', intermediate: 'intermédiaire',
                      advanced: 'avancé', pro: 'élite' };
    var niveauRaw = S.sportLevel || '';
    var niveauLabel = niveauMap[niveauRaw] ||
      (S.activity >= 3 ? 'avancé' : S.activity >= 2 ? 'intermédiaire' : 'débutant');

    // ── Résolution de l'objectif ──────────────────────────────────────────────
    var objectifLabel = 'hypertrophie';
    if (window.GOALS && S.goal != null && window.GOALS[S.goal]) {
      objectifLabel = window.GOALS[S.goal].label || window.GOALS[S.goal].key || 'hypertrophie';
    }

    // ── Sommeil : S.sleep est un index (0='<6h',1='6-7h',2='7-8h',3='8h+') ──
    var sleepMap = { 0: 5.5, 1: 6.5, 2: 7.5, 3: 8.5 };
    var sommeilVal = (S.sleep !== null && S.sleep !== undefined && sleepMap[S.sleep] !== undefined)
      ? sleepMap[S.sleep] : (S.sleep || 7);

    // ── Sérialisation du bilan médical ───────────────────────────────────────
    var medicalText = serializeMuscuMedical(S.muscuMedical);

    // ── Semaine et cycle courants ─────────────────────────────────────────────
    var semaineActuelle = S.muscuWeek || 1;
    var cycleActuel = S.muscuCycle || 1;

    return {
      prenom: S.prenom || S.name || 'Athlète',
      age: S.age || null,
      sexe: S.sex === 'femme' ? 'femme' : (S.sex === 'female' ? 'femme' : 'homme'),
      poids: S.weight || null,
      taille: S.height || null,
      objectif: objectifLabel,
      niveau: niveauLabel,
      niveauRaw: niveauRaw,
      joursDispo: S.muscuWeek ? Math.min(6, Math.max(2, S.sportDays || 4))
                              : (S.muscuFreq || S.sportFreq || S.sportDays || 4),
      dureeMaxSeance: S.muscuDuration || 60,
      equipement: S.sportEquipment || S.equipement || S.gymType || 'salle complète',
      installations: Array.isArray(S.installations) && S.installations.length
        ? S.installations.map(function(id) {
            var found = INSTALLATIONS.filter(function(x) { return x.id === id; })[0];
            return found ? found.label + ' (' + found.desc + ')' : id;
          }).join(' | ')
        : null,
      sommeil: sommeilVal,
      stress: S.stress || 5,
      // Bilan médical complet (zones + diagnostics + intensité + notes)
      medical: medicalText,
      // Champs 1RM calculés par Epley depuis les poids d'entraînement réels
      bench1RM: computed1RM.bench1RM || null,
      squat1RM: computed1RM.squat1RM || null,
      deadlift1RM: computed1RM.deadlift1RM || null,
      ohp1RM: computed1RM.ohp1RM || null,
      row1RM: computed1RM.row1RM || null,
      hipThrust1RM: computed1RM.hipThrust1RM || null,
      legPress1RM: computed1RM.legPress1RM || null,
      // Données brutes du profil de force (poids × reps)
      strengthProfile: (function() {
        var keys = ['bench_press','squat','deadlift','overhead_press',
                    'barbell_row','barbell_curl','hip_thrust','leg_press'];
        var out = [];
        keys.forEach(function(k) {
          if (strengthProfile[k]) {
            var reps = strengthProfile[k + '_reps'] || 8;
            out.push(k.replace(/_/g,' ') + ' : ' + strengthProfile[k] + 'kg × ' + reps + 'reps');
          }
        });
        return out.length ? out.join(' | ') : 'non renseigné';
      })(),
      // Contexte de progression dans le plan 12 semaines
      semaineActuelle: semaineActuelle,
      cycleActuel: cycleActuel,
      // Données démographiques supplémentaires
      pregnant: !!(S.pregnant && (S.sex === 'femme' || S.sex === 'female')),
      // Points forts/faibles et préférences (champs libres si renseignés)
      pointsForts: S.pointsForts || '',
      pointsFaibles: S.pointsFaibles || '',
      preferences: S.preferences || '',
      historique: S.historique || '',
      heureEntrainement: S.trainTime || null,
      competitionGoal: !!S.competitionGoal,
      competitionDate: S.competitionDate || '',
      competitionType: S.competitionType || '',
      sportHobbies: Array.isArray(S.sportHobbies) && S.sportHobbies.length ? S.sportHobbies.join(', ') : '',
      // Nouvelles données collectées par le questionnaire enrichi
      muscuObjectifSpecifique: S.muscuObjectifSpecifique || '',
      muscuZonesCibles: Array.isArray(S.muscuZonesCibles) && S.muscuZonesCibles.length ? S.muscuZonesCibles.join(', ') : '',
      muscuRenforcementNote: S.muscuRenforcementNote || '',
      muscuProgramCount: S.muscuProgramCount || 0,
      // FIX BIBLE MUSCU §5 : bodyZones + muscuMedical ABSENTS du payload IA (bug Sophie/Marie).
      // Sans ça, l'IA ne sait pas que fessiers='high' ou equipment='home' → programme générique.
      bodyZones: S.bodyZones || null,
      weakZones: Array.isArray(S.weakZones) && S.weakZones.length ? S.weakZones : null,
      priorityMuscles: (function() {
        var prio = [];
        if (S.bodyZones) {
          Object.keys(S.bodyZones).forEach(function(z) { if (S.bodyZones[z] === 'high') prio.push(z); });
        }
        if (Array.isArray(S.weakZones)) S.weakZones.forEach(function(z) { if (prio.indexOf(z) < 0) prio.push(z); });
        return prio.length ? prio.join(', ') : null;
      })(),
      muscuMedical: S.muscuMedical && S.muscuMedical.done ? S.muscuMedical : null,
      medicalConditions: Array.isArray(S.medical) && S.medical.length ? S.medical.join(', ') : null,
      cycleTracking: !!(S.cycleTracking && S.sex === 'femme'),
      lastPeriodDate: S.lastPeriodDate || null
    };
  }

  function ensureModal() {
    if (_modalEl) return _modalEl;
    _modalEl = document.createElement('div');
    _modalEl.id = 'muscu-program-modal';
    _modalEl.setAttribute('role', 'dialog');
    _modalEl.setAttribute('aria-modal', 'true');
    _modalEl.style.cssText = 'display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:9998;overflow-y:auto;padding:20px;';
    // Inject responsive styles for mobile (<480px)
    if (!document.getElementById('muscu-modal-styles')) {
      var styleEl = document.createElement('style');
      styleEl.id = 'muscu-modal-styles';
      styleEl.textContent = '@media(max-width:480px){#muscu-program-modal{padding:8px!important;}#muscu-program-modal .muscu-modal-inner{max-width:100%!important;padding:16px!important;margin:8px auto!important;}#muscu-program-modal h2{font-size:14px!important;}}';
      document.head.appendChild(styleEl);
    }
    _modalEl.innerHTML = '<div class="muscu-modal-inner" style="max-width:780px;margin:20px auto;background:var(--ivory,#FAF9F6);border-radius:2px;padding:24px;font-family:Georgia,serif;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid var(--border,#D8D8D0);padding-bottom:12px;">' +
        '<h2 style="margin:0;font-family:Georgia,serif;font-size:20px;font-weight:normal;letter-spacing:2px;text-transform:uppercase;">SMART FIT COACH — Programme</h2>' +
        '<button id="muscu-prog-close" aria-label="Fermer" style="background:transparent;border:none;font-size:24px;cursor:pointer;color:var(--grey,#6B6B65);">×</button>' +
      '</div>' +
      '<div id="muscu-prog-content" style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:13px;line-height:1.7;color:var(--black,#0A0A09);"></div>' +
    '</div>';
    document.body.appendChild(_modalEl);
    document.getElementById('muscu-prog-close').addEventListener('click', closeModal);
    _modalEl.addEventListener('click', function(e) { if (e.target === _modalEl) closeModal(); });
    // Focus trap : empêche le tab de sortir de la modal
    _modalEl.addEventListener('keydown', function(e) {
      if (_modalEl.style.display === 'none') return;
      if (e.key === 'Escape') {
        closeModal();
        return;
      }
      if (e.key !== 'Tab') return;
      var focusables = _modalEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusables.length === 0) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
    return _modalEl;
  }

  function closeModal() {
    if (_loadingInterval) { clearInterval(_loadingInterval); _loadingInterval = null; }
    _generating = false; // toujours réinitialiser pour éviter le blocage si fermé pendant génération
    if (_modalEl) _modalEl.style.display = 'none';
    if (_previousFocus && _previousFocus.focus) {
      try { _previousFocus.focus(); } catch(e) {}
    }
  }

  // FIX SPRINT P1.4 — Stepper visuel wizard 6 étapes (audit UX flow).
  // Avant : labels texte uniquement, l'user ne savait pas combien de pages restaient.
  // Maintenant : barre de progression typographique en haut de chaque step.
  function renderStepperBar(currentStep, totalSteps) {
    var dots = '';
    for (var i = 1; i <= totalSteps; i++) {
      var active = i <= currentStep;
      dots += '<span style="display:inline-block;width:24px;height:2px;margin:0 3px;background:' + (active ? 'var(--ink-900,#0A0A09)' : 'var(--line,#D8D8D0)') + ';vertical-align:middle;"></span>';
    }
    return '<div style="text-align:center;margin:0 0 24px;font-family:\'Helvetica Neue\',Arial,sans-serif;">' +
      '<div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--ink-500,#6B6B65);margin-bottom:8px;font-weight:500;">Étape ' + currentStep + ' sur ' + totalSteps + '</div>' +
      '<div>' + dots + '</div>' +
      '</div>';
  }

  function showInstallationsStep() {
    var content = document.getElementById('muscu-prog-content');
    var current = (window.S && Array.isArray(window.S.installations)) ? window.S.installations : [];
    var cardStyle = 'display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border:1px solid var(--border,#D8D8D0);border-radius:2px;cursor:pointer;transition:border-color 0.15s,background 0.15s;margin-bottom:8px;font-family:"Helvetica Neue",Arial,sans-serif;';
    var cardsHTML = INSTALLATIONS.map(function(inst) {
      var sel = current.indexOf(inst.id) !== -1;
      return '<div class="install-card" data-id="' + inst.id + '" style="' + cardStyle + (sel ? 'border-color:var(--accent,#1A4A1A);background:rgba(26,74,26,0.06);' : '') + '">' +
        '<span style="font-size:20px;flex-shrink:0;line-height:1;">' + inst.icon + '</span>' +
        '<div style="flex:1;">' +
          '<div style="font-size:13px;font-weight:600;color:var(--black,#0A0A09);margin-bottom:2px;">' + inst.label + '</div>' +
          '<div style="font-size:11px;color:var(--grey,#6B6B65);">' + inst.desc + '</div>' +
        '</div>' +
        '<div class="install-check" style="width:18px;height:18px;border:1.5px solid ' + (sel ? 'var(--accent,#1A4A1A)' : 'var(--border,#D8D8D0)') + ';border-radius:2px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:' + (sel ? 'var(--accent,#1A4A1A)' : 'transparent') + ';">' +
          (sel ? '<svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 4L4 7L10 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '') +
        '</div>' +
      '</div>';
    }).join('');
    content.innerHTML =
      '<div style="padding:8px 4px 24px 4px;">' +
        renderStepperBar(1, 6) +
        '<h3 style="font-family:Georgia,serif;font-size:20px;font-weight:normal;letter-spacing:1px;color:var(--ink-900,#0A0A09);margin:0 0 8px 0;">Quels équipements as-tu à disposition ?</h3>' +
        '<p style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:12px;color:var(--ink-500,#6B6B65);margin:0 0 20px 0;line-height:1.6;">Sélectionne toutes tes installations disponibles. Le programme ne prescrira que ce que tu peux réellement faire. <strong>Sélection multiple.</strong></p>' +
        '<div id="install-cards-wrap">' + cardsHTML + '</div>' +
        '<div id="install-error" style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;color:#B02020;margin:8px 0 0 0;display:none;">Sélectionne au moins une installation pour continuer.</div>' +
        '<div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap;">' +
          '<button id="install-confirm" style="background:var(--ink-900,#0A0A09);color:var(--paper,#FAF9F6);border:none;padding:14px 28px;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;border-radius:2px;font-family:\'Helvetica Neue\',Arial,sans-serif;min-height:48px;">Continuer →</button>' +
        '</div>' +
      '</div>';

    // Toggle card selection
    var wrap = document.getElementById('install-cards-wrap');
    wrap.addEventListener('click', function(e) {
      var card = e.target.closest('.install-card');
      if (!card) return;
      var id = card.getAttribute('data-id');
      var sel = window.S && Array.isArray(window.S.installations) ? window.S.installations.slice() : [];
      var idx = sel.indexOf(id);
      if (idx === -1) { sel.push(id); } else { sel.splice(idx, 1); }
      if (window.S) window.S.installations = sel;
      if (window.saveProfile) window.saveProfile();
      // Update visual state
      var isSel = sel.indexOf(id) !== -1;
      card.style.borderColor = isSel ? 'var(--accent,#1A4A1A)' : 'var(--border,#D8D8D0)';
      card.style.background = isSel ? 'rgba(26,74,26,0.06)' : '';
      var chk = card.querySelector('.install-check');
      if (chk) {
        chk.style.borderColor = isSel ? 'var(--accent,#1A4A1A)' : 'var(--border,#D8D8D0)';
        chk.style.background = isSel ? 'var(--accent,#1A4A1A)' : 'transparent';
        chk.innerHTML = isSel ? '<svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 4L4 7L10 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '';
      }
    });

    document.getElementById('install-confirm').addEventListener('click', function() {
      var sel = window.S && Array.isArray(window.S.installations) ? window.S.installations : [];
      if (sel.length === 0) {
        var err = document.getElementById('install-error');
        if (err) err.style.display = 'block';
        return;
      }
      showObjectifStep();
    });
  }

  function showObjectifStep() {
    var content = document.getElementById('muscu-prog-content');
    if (!content) return;
    var OBJECTIFS = [
      { id: 'hypertrophie',   label: 'Hypertrophie',          desc: 'Prise de masse musculaire — volume et définition' },
      { id: 'force',          label: 'Force maximale',         desc: 'Progression sur les charges — maximiser les 1RM' },
      { id: 'esthétique',     label: 'Esthétique / définition',desc: 'Sèche et proportions — corps sculpté et défini' },
      { id: 'endurance',      label: 'Endurance musculaire',   desc: 'Résistance à l\'effort — haute répétition, circuit' },
      { id: 'recomposition',  label: 'Recomposition',          desc: 'Réduire la masse grasse et gagner du muscle simultanément' },
      { id: 'competition',    label: 'Prépa compétition',      desc: 'Périodisation haute intensité — podium et performance' }
    ];
    var current = (window.S && window.S.muscuObjectifSpecifique) ? window.S.muscuObjectifSpecifique : '';
    // Pré-remplir depuis l'objectif nutritionnel si pas encore choisi
    if (!current && window.S && window.S.goal != null) {
      var _gMap = { 0:'hypertrophie', 1:'recomposition', 2:'endurance', 3:'esthétique', 4:'recomposition', 5:'recomposition' };
      current = _gMap[window.S.goal] || '';
    }
    var cardBase = 'display:flex;align-items:center;gap:12px;padding:13px 16px;border:1px solid var(--border,#D8D8D0);border-radius:2px;cursor:pointer;margin-bottom:8px;transition:border-color 0.15s,background 0.15s;font-family:"Helvetica Neue",Arial,sans-serif;';
    var cardsHTML = OBJECTIFS.map(function(obj) {
      var sel = (current === obj.id);
      return '<div class="obj-card" data-id="' + obj.id + '" style="' + cardBase + (sel ? 'border-color:var(--accent,#1A4A1A);background:rgba(26,74,26,0.06);' : '') + '">' +
        '<div style="flex:1;">' +
          '<div style="font-size:13px;font-weight:600;color:var(--black,#0A0A09);margin-bottom:2px;">' + obj.label + '</div>' +
          '<div style="font-size:11px;color:var(--grey,#6B6B65);">' + obj.desc + '</div>' +
        '</div>' +
        '<div class="obj-dot" style="width:18px;height:18px;border:1.5px solid ' + (sel ? 'var(--accent,#1A4A1A)' : 'var(--border,#D8D8D0)') + ';border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:' + (sel ? 'var(--accent,#1A4A1A)' : 'transparent') + ';">' +
          (sel ? '<div style="width:7px;height:7px;border-radius:50%;background:white;"></div>' : '') +
        '</div>' +
      '</div>';
    }).join('');
    content.innerHTML =
      '<div style="padding:8px 4px 24px 4px;">' +
        renderStepperBar(2, 6) +
        '<h3 style="font-family:Georgia,serif;font-size:20px;font-weight:normal;color:var(--ink-900,#0A0A09);margin:0 0 8px 0;">Quel résultat veux-tu obtenir en priorité ?</h3>' +
        '<p style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:12px;color:var(--ink-500,#6B6B65);margin:0 0 18px 0;line-height:1.6;">Ton programme sera entièrement construit autour de cet objectif — split, charges et périodisation s\'adapteront en conséquence.</p>' +
        '<div id="obj-cards-wrap">' + cardsHTML + '</div>' +
        '<div id="obj-error" style="font-size:11px;color:#B02020;margin:6px 0 0 0;display:none;font-family:\'Helvetica Neue\',Arial,sans-serif;">Sélectionne un objectif pour continuer.</div>' +
        '<div style="margin-top:20px;">' +
          '<button id="obj-confirm" style="background:var(--ink-900,#0A0A09);color:var(--paper,#FAF9F6);border:none;padding:14px 28px;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;border-radius:2px;font-family:\'Helvetica Neue\',Arial,sans-serif;min-height:48px;">Continuer \u2192</button>' +
        '</div>' +
      '</div>';
    var wrap = document.getElementById('obj-cards-wrap');
    wrap.addEventListener('click', function(e) {
      var card = e.target.closest('.obj-card');
      if (!card) return;
      var id = card.getAttribute('data-id');
      if (!window.S) window.S = {};
      window.S.muscuObjectifSpecifique = id;
      try { if (window.saveProfile) window.saveProfile(); } catch(e2) {}
      wrap.querySelectorAll('.obj-card').forEach(function(c) {
        var isSel = (c.getAttribute('data-id') === id);
        c.style.borderColor = isSel ? 'var(--accent,#1A4A1A)' : 'var(--border,#D8D8D0)';
        c.style.background  = isSel ? 'rgba(26,74,26,0.06)' : '';
        var dot = c.querySelector('.obj-dot');
        if (dot) {
          dot.style.borderColor = isSel ? 'var(--accent,#1A4A1A)' : 'var(--border,#D8D8D0)';
          dot.style.background  = isSel ? 'var(--accent,#1A4A1A)' : 'transparent';
          dot.innerHTML = isSel ? '<div style="width:7px;height:7px;border-radius:50%;background:white;"></div>' : '';
        }
      });
      var errEl = document.getElementById('obj-error');
      if (errEl) errEl.style.display = 'none';
    });
    document.getElementById('obj-confirm').addEventListener('click', function() {
      if (!window.S || !window.S.muscuObjectifSpecifique) {
        var errEl = document.getElementById('obj-error');
        if (errEl) errEl.style.display = 'block';
        return;
      }
      showZonesCibleesStep();
    });
  }

  function showZonesCibleesStep() {
    var content = document.getElementById('muscu-prog-content');
    if (!content) return;
    var ZONES = [
      { id: 'pectoraux',  label: 'Pectoraux',  desc: 'Poitrine — grand et petit pectoral' },
      { id: 'dos',        label: 'Dos',         desc: 'Dorsaux, trapèzes, rhomboïdes' },
      { id: 'jambes',     label: 'Jambes',      desc: 'Quadriceps, ischios, mollets' },
      { id: 'epaules',    label: '\u00c9paules',desc: 'Deltoïdes — 3 faisceaux' },
      { id: 'bras',       label: 'Bras',        desc: 'Biceps et triceps' },
      { id: 'fessiers',   label: 'Fessiers',    desc: 'Glutes — volume et galbe' },
      { id: 'abdominaux', label: 'Abdominaux',  desc: 'Core — gainages et sangle abdominale' }
    ];
    var current = (window.S && Array.isArray(window.S.muscuZonesCibles)) ? window.S.muscuZonesCibles.slice() : [];
    // Pré-remplir depuis sportFocus si disponible
    if (!current.length && window.S && window.S.sportFocus) {
      var _fMap = { chest:'pectoraux', back:'dos', legs:'jambes', shoulders:'epaules', arms:'bras', glutes:'fessiers', abs:'abdominaux' };
      Object.keys(window.S.sportFocus).forEach(function(k) {
        if ((window.S.sportFocus[k] || 0) > 0 && _fMap[k]) current.push(_fMap[k]);
      });
    }
    var currentNote = (window.S && window.S.muscuRenforcementNote) ? window.S.muscuRenforcementNote : '';
    var cardBase = 'display:flex;align-items:center;gap:10px;padding:11px 14px;border:1px solid var(--border,#D8D8D0);border-radius:2px;cursor:pointer;transition:border-color 0.15s,background 0.15s;font-family:"Helvetica Neue",Arial,sans-serif;';
    var svgCheck = '<svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 4L4 7L10 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var cardsHTML = ZONES.map(function(zone) {
      var sel = current.indexOf(zone.id) !== -1;
      return '<div class="zone-card" data-id="' + zone.id + '" style="' + cardBase + (sel ? 'border-color:var(--accent,#1A4A1A);background:rgba(26,74,26,0.06);' : '') + '">' +
        '<div style="flex:1;">' +
          '<div style="font-size:12px;font-weight:600;color:var(--black,#0A0A09);">' + zone.label + '</div>' +
          '<div style="font-size:10px;color:var(--grey,#6B6B65);">' + zone.desc + '</div>' +
        '</div>' +
        '<div class="zone-chk" style="width:18px;height:18px;border:1.5px solid ' + (sel ? 'var(--accent,#1A4A1A)' : 'var(--border,#D8D8D0)') + ';border-radius:2px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:' + (sel ? 'var(--accent,#1A4A1A)' : 'transparent') + ';">' +
          (sel ? svgCheck : '') +
        '</div>' +
      '</div>';
    }).join('');
    content.innerHTML =
      '<div style="padding:8px 4px 24px 4px;">' +
        renderStepperBar(3, 6) +
        '<h3 style="font-family:Georgia,serif;font-size:20px;font-weight:normal;color:var(--ink-900,#0A0A09);margin:0 0 8px 0;">Quels groupes musculaires veux-tu développer ?</h3>' +
        '<p style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:12px;color:var(--ink-500,#6B6B65);margin:0 0 16px 0;line-height:1.6;">Sélection multiple. Laisse vide pour un programme équilibré sur tout le corps.</p>' +
        '<div id="zone-cards-wrap" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:18px;">' + cardsHTML + '</div>' +
        '<div style="margin-bottom:20px;">' +
          '<label style="display:block;font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:8px;">Ce que vous voulez renforcer / améliorer (optionnel)</label>' +
          '<textarea id="zone-note" placeholder="Ex\u00a0: renforcer le bas du dos, rattraper mon retard sur les \u00e9paules, am\u00e9liorer ma posture, d\u00e9velopper les fessiers\u2026" rows="3" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:12px;color:var(--black,#0A0A09);background:var(--ivory,#FAF9F6);resize:vertical;outline:none;line-height:1.5;">' + escapeHTML(currentNote) + '</textarea>' +
        '</div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
          '<button id="zone-skip" style="background:transparent;border:1px solid var(--border,#D8D8D0);color:var(--grey,#6B6B65);padding:12px 20px;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;border-radius:2px;font-family:\'Helvetica Neue\',Arial,sans-serif;min-height:44px;">Programme \u00e9quilibr\u00e9</button>' +
          '<button id="zone-confirm" style="background:var(--accent,#1A4A1A);color:var(--ivory,#FAF9F6);border:none;padding:12px 28px;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;border-radius:2px;font-family:\'Helvetica Neue\',Arial,sans-serif;min-height:44px;">Continuer \u2192</button>' +
        '</div>' +
      '</div>';
    var svgCheckInner = '<svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 4L4 7L10 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var wrap = document.getElementById('zone-cards-wrap');
    wrap.addEventListener('click', function(e) {
      var card = e.target.closest('.zone-card');
      if (!card) return;
      var id = card.getAttribute('data-id');
      if (!window.S) window.S = {};
      var sel = Array.isArray(window.S.muscuZonesCibles) ? window.S.muscuZonesCibles.slice() : [];
      var idx = sel.indexOf(id);
      if (idx === -1) { sel.push(id); } else { sel.splice(idx, 1); }
      window.S.muscuZonesCibles = sel;
      var isSel = sel.indexOf(id) !== -1;
      card.style.borderColor = isSel ? 'var(--accent,#1A4A1A)' : 'var(--border,#D8D8D0)';
      card.style.background  = isSel ? 'rgba(26,74,26,0.06)' : '';
      var chk = card.querySelector('.zone-chk');
      if (chk) {
        chk.style.borderColor = isSel ? 'var(--accent,#1A4A1A)' : 'var(--border,#D8D8D0)';
        chk.style.background  = isSel ? 'var(--accent,#1A4A1A)' : 'transparent';
        chk.innerHTML = isSel ? svgCheckInner : '';
      }
    });
    function _saveAndContinue() {
      if (!window.S) window.S = {};
      var noteEl = document.getElementById('zone-note');
      window.S.muscuRenforcementNote = noteEl ? noteEl.value.trim().slice(0, 500) : '';
      if (!Array.isArray(window.S.muscuZonesCibles)) window.S.muscuZonesCibles = [];
      try { if (window.saveProfile) window.saveProfile(); } catch(e) {}
      showStressStep();
    }
    document.getElementById('zone-skip').addEventListener('click', function() {
      if (!window.S) window.S = {};
      window.S.muscuZonesCibles = [];
      window.S.muscuRenforcementNote = '';
      try { if (window.saveProfile) window.saveProfile(); } catch(e) {}
      showStressStep();
    });
    document.getElementById('zone-confirm').addEventListener('click', _saveAndContinue);
  }

  function showStressStep() {
    var content = document.getElementById('muscu-prog-content');
    if (!content) return;
    var currentStress = (window.S && typeof window.S.stress === 'number') ? window.S.stress : 5;
    var stressLabels = [
      '', // index 0 unused
      'Très faible — Complètement zen',
      'Faible — Peu de stress',
      'Modéré-bas — Gérable',
      'Modéré — Stressé mais équilibré',
      'Modéré-haut — Stressé régulièrement',
      'Élevé — Très stressé',
      'Très élevé — Sous pression constante',
      'Extrême — Surcharge chronique',
      'Critique — Épuisé',
      'Maximum — Au bout du rouleau'
    ];
    var optionsHTML = '';
    for (var i = 1; i <= 10; i++) {
      var isSel = (i === currentStress);
      optionsHTML +=
        '<div class="stress-opt" data-v="' + i + '" style="display:flex;align-items:center;gap:10px;padding:9px 8px;margin-bottom:3px;cursor:pointer;border-radius:2px;background:' + (isSel ? 'rgba(26,74,26,0.08)' : 'transparent') + ';transition:background 0.15s;">' +
          '<span style="min-width:20px;font-size:12px;font-weight:' + (isSel ? '700' : '400') + ';color:var(--grey,#6B6B65);font-family:\'Helvetica Neue\',Arial,sans-serif;">' + i + '</span>' +
          '<div style="flex:1;height:3px;background:var(--border,#D8D8D0);border-radius:2px;overflow:hidden;">' +
            '<div style="height:100%;width:' + (i * 10) + '%;background:' + (isSel ? 'var(--accent,#1A4A1A)' : 'var(--grey,#6B6B65)') + ';border-radius:2px;"></div>' +
          '</div>' +
          '<span style="font-size:11px;color:var(--grey,#6B6B65);font-family:\'Helvetica Neue\',Arial,sans-serif;min-width:200px;">' + stressLabels[i] + '</span>' +
        '</div>';
    }
    content.innerHTML =
      '<div style="padding:8px 4px 24px 4px;">' +
        renderStepperBar(4, 6) +
        '<h3 style="font-family:Georgia,serif;font-size:20px;font-weight:normal;color:var(--ink-900,#0A0A09);margin:0 0 6px 0;">Ton niveau de stress actuel ?</h3>' +
        '<p style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:12px;color:var(--ink-500,#6B6B65);margin:0 0 18px 0;line-height:1.6;">Ton programme s\'adaptera : volume, repos inter-séries et intensité s\'ajustent selon ta capacité de récupération.</p>' +
        '<div id="stress-opts">' + optionsHTML + '</div>' +
        '<div style="font-size:11px;color:var(--ink-900,#0A0A09);font-family:\'Helvetica Neue\',Arial,sans-serif;font-weight:600;margin:12px 0 20px;text-align:center;">Niveau sélectionné : <span id="stress-val">' + currentStress + '</span>/10</div>' +
        '<button id="stress-next" style="background:var(--ink-900,#0A0A09);color:var(--paper,#FAF9F6);border:none;padding:14px 28px;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;border-radius:2px;font-family:\'Helvetica Neue\',Arial,sans-serif;min-height:48px;">Continuer \u2192</button>' +
      '</div>';

    var opts = document.getElementById('stress-opts');
    opts.addEventListener('click', function(e) {
      var opt = e.target.closest('.stress-opt');
      if (!opt) return;
      var val = parseInt(opt.getAttribute('data-v'), 10);
      if (!window.S) window.S = {};
      window.S.stress = val;
      try { if (window.saveProfile) window.saveProfile(); } catch(e2) {}
      var allOpts = opts.querySelectorAll('.stress-opt');
      allOpts.forEach(function(o) {
        var v = parseInt(o.getAttribute('data-v'), 10);
        var isSel2 = (v === val);
        o.style.background = isSel2 ? 'rgba(26,74,26,0.08)' : 'transparent';
        var num = o.querySelector('span:first-child');
        if (num) num.style.fontWeight = isSel2 ? '700' : '400';
        var bar = o.querySelector('div > div');
        if (bar) bar.style.background = isSel2 ? 'var(--accent,#1A4A1A)' : 'var(--grey,#6B6B65)';
      });
      var valEl = document.getElementById('stress-val');
      if (valEl) valEl.textContent = val;
    });

    document.getElementById('stress-next').addEventListener('click', function() {
      if (!window.S || typeof window.S.stress !== 'number') {
        if (!window.S) window.S = {};
        window.S.stress = 5; // safe default
      }
      showProfilSportifStep();
    });
  }

  // ─── ÉTAPE 5 bis : PROFIL SPORTIF DÉTAILLÉ ─────────────────────────────────
  // FIX 2026-04-16 — user s'est plaint qu'aucun questionnaire détaillé n'était
  // posé. Cette étape collecte/confirme fréquence, niveau, sports pratiqués.
  function showProfilSportifStep() {
    var content = document.getElementById('muscu-prog-content');
    if (!content) return;
    var S = window.S || {};
    var currentDays = S.sportDays || 3;
    var currentLevel = S.sportLevel || '';
    var currentHobbies = Array.isArray(S.sportHobbies) ? S.sportHobbies.slice() : [];
    var currentDuration = S.muscuDuration || 60;
    var currentTrainTime = S.trainTime || '';
    var LEVELS = [
      { id: 'beginner',     label: 'Débutant',       desc: 'Moins de 6 mois de pratique régulière' },
      { id: 'intermediate', label: 'Intermédiaire',  desc: '6 mois à 2 ans, maîtrise des bases' },
      { id: 'advanced',     label: 'Avancé',         desc: '2 à 5 ans, technique solide' },
      { id: 'pro',          label: 'Expert',         desc: '5+ ans, programmation autonome' }
    ];
    var HOBBIES = [
      { id: 'running',   label: 'Course à pied' },
      { id: 'cycling',   label: 'Vélo' },
      { id: 'swimming',  label: 'Natation' },
      { id: 'football',  label: 'Football' },
      { id: 'tennis',    label: 'Tennis' },
      { id: 'basketball',label: 'Basketball' },
      { id: 'climbing',  label: 'Escalade' },
      { id: 'martial',   label: 'Arts martiaux' },
      { id: 'yoga',      label: 'Yoga' },
      { id: 'hiking',    label: 'Randonnée' }
    ];
    var levelCards = LEVELS.map(function(lv) {
      var sel = (currentLevel === lv.id);
      return '<div class="lvl-card" data-id="' + lv.id + '" style="display:flex;align-items:center;gap:12px;padding:11px 14px;border:1px solid var(--border,#D8D8D0);border-radius:2px;cursor:pointer;margin-bottom:6px;font-family:\'Helvetica Neue\',Arial,sans-serif;' + (sel ? 'border-color:var(--accent,#1A4A1A);background:rgba(26,74,26,0.06);' : '') + '">' +
        '<div style="flex:1;"><div style="font-size:13px;font-weight:600;color:var(--black,#0A0A09);margin-bottom:2px;">' + lv.label + '</div><div style="font-size:11px;color:var(--grey,#6B6B65);">' + lv.desc + '</div></div>' +
        '<div class="lvl-dot" style="width:16px;height:16px;border:1.5px solid ' + (sel ? 'var(--accent,#1A4A1A)' : 'var(--border,#D8D8D0)') + ';border-radius:50%;background:' + (sel ? 'var(--accent,#1A4A1A)' : 'transparent') + ';flex-shrink:0;"></div>' +
      '</div>';
    }).join('');
    var hobbyChips = HOBBIES.map(function(hb) {
      var sel = currentHobbies.indexOf(hb.id) !== -1;
      return '<span class="hob-chip" data-id="' + hb.id + '" style="display:inline-block;padding:7px 12px;margin:0 6px 6px 0;border:1px solid ' + (sel ? 'var(--accent,#1A4A1A)' : 'var(--border,#D8D8D0)') + ';border-radius:2px;cursor:pointer;font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;color:' + (sel ? 'var(--accent,#1A4A1A)' : 'var(--black,#0A0A09)') + ';background:' + (sel ? 'rgba(26,74,26,0.06)' : 'transparent') + ';user-select:none;min-height:34px;line-height:18px;">' + hb.label + '</span>';
    }).join('');
    content.innerHTML =
      '<div style="padding:8px 4px 24px 4px;">' +
        renderStepperBar(5, 6) +
        '<h3 style="font-family:Georgia,serif;font-size:20px;font-weight:normal;color:var(--ink-900,#0A0A09);margin:0 0 8px 0;">Votre profil sportif</h3>' +
        '<p style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:12px;color:var(--ink-500,#6B6B65);margin:0 0 20px 0;line-height:1.6;">Votre programme sera adapté à votre niveau, votre fréquence et les autres sports que vous pratiquez en parallèle.</p>' +

        '<div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin:0 0 8px 0;font-family:\'Helvetica Neue\',Arial,sans-serif;">Fréquence hebdomadaire</div>' +
        '<div style="display:flex;gap:6px;margin-bottom:18px;flex-wrap:wrap;">' +
          [2,3,4,5,6].map(function(n) {
            var sel = (currentDays === n);
            return '<button class="day-btn" data-v="' + n + '" style="flex:1;min-width:50px;min-height:44px;padding:10px;border:1px solid ' + (sel ? 'var(--accent,#1A4A1A)' : 'var(--border,#D8D8D0)') + ';background:' + (sel ? 'rgba(26,74,26,0.08)' : 'transparent') + ';color:' + (sel ? 'var(--accent,#1A4A1A)' : 'var(--black,#0A0A09)') + ';font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:13px;font-weight:' + (sel ? '600' : '400') + ';border-radius:2px;cursor:pointer;">' + n + ' j</button>';
          }).join('') +
        '</div>' +

        '<div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin:0 0 8px 0;font-family:\'Helvetica Neue\',Arial,sans-serif;">Niveau d\'expérience</div>' +
        '<div id="lvl-wrap" style="margin-bottom:18px;">' + levelCards + '</div>' +

        '<div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin:0 0 8px 0;font-family:\'Helvetica Neue\',Arial,sans-serif;">Sports pratiqués en parallèle <span style="text-transform:none;letter-spacing:0;font-size:10px;color:var(--grey,#6B6B65);">(optionnel)</span></div>' +
        '<div id="hob-wrap" style="margin-bottom:18px;">' + hobbyChips + '</div>' +

        '<div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin:0 0 8px 0;font-family:\'Helvetica Neue\',Arial,sans-serif;">Durée de séance souhaitée</div>' +
        '<div style="display:flex;gap:6px;margin-bottom:18px;flex-wrap:wrap;">' +
          [45, 60, 75, 90].map(function(n) {
            var sel = (currentDuration === n);
            return '<button class="dur-btn" data-v="' + n + '" style="flex:1;min-width:60px;min-height:44px;padding:10px;border:1px solid ' + (sel ? 'var(--accent,#1A4A1A)' : 'var(--border,#D8D8D0)') + ';background:' + (sel ? 'rgba(26,74,26,0.08)' : 'transparent') + ';color:' + (sel ? 'var(--accent,#1A4A1A)' : 'var(--black,#0A0A09)') + ';font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:12px;font-weight:' + (sel ? '600' : '400') + ';border-radius:2px;cursor:pointer;">' + n + ' min</button>';
          }).join('') +
        '</div>' +

        '<div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin:0 0 8px 0;font-family:\'Helvetica Neue\',Arial,sans-serif;">Heure d\'entraînement habituelle <span style="text-transform:none;letter-spacing:0;font-size:10px;color:var(--grey,#6B6B65);">(optionnel)</span></div>' +
        '<div style="display:flex;gap:6px;margin-bottom:20px;flex-wrap:wrap;">' +
          [{v:'morning',l:'Matin'},{v:'noon',l:'Midi'},{v:'evening',l:'Soir'}].map(function(opt) {
            var sel = (currentTrainTime === opt.v);
            return '<button class="time-btn" data-v="' + opt.v + '" style="flex:1;min-width:80px;min-height:44px;padding:10px;border:1px solid ' + (sel ? 'var(--accent,#1A4A1A)' : 'var(--border,#D8D8D0)') + ';background:' + (sel ? 'rgba(26,74,26,0.08)' : 'transparent') + ';color:' + (sel ? 'var(--accent,#1A4A1A)' : 'var(--black,#0A0A09)') + ';font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:12px;font-weight:' + (sel ? '600' : '400') + ';border-radius:2px;cursor:pointer;">' + opt.l + '</button>';
          }).join('') +
        '</div>' +

        '<div id="ps-error" style="font-size:11px;color:#B02020;margin:0 0 10px 0;display:none;font-family:\'Helvetica Neue\',Arial,sans-serif;">Sélectionne un niveau pour continuer.</div>' +
        '<button id="ps-next" style="background:var(--ink-900,#0A0A09);color:var(--paper,#FAF9F6);border:none;padding:14px 28px;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;border-radius:2px;font-family:\'Helvetica Neue\',Arial,sans-serif;min-height:48px;">Continuer \u2192</button>' +
      '</div>';

    // Handlers fréquence
    content.querySelectorAll('.day-btn').forEach(function(b) {
      b.addEventListener('click', function() {
        var v = parseInt(b.getAttribute('data-v'));
        if (!window.S) window.S = {};
        window.S.sportDays = v;
        try { if (window.saveProfile) window.saveProfile(); } catch(e) {}
        showProfilSportifStep();
      });
    });

    // Handlers niveau
    document.getElementById('lvl-wrap').addEventListener('click', function(e) {
      var card = e.target.closest('.lvl-card');
      if (!card) return;
      var id = card.getAttribute('data-id');
      if (!window.S) window.S = {};
      window.S.sportLevel = id;
      try { if (window.saveProfile) window.saveProfile(); } catch(e2) {}
      showProfilSportifStep();
    });

    // Handlers hobbies (toggle multi)
    document.getElementById('hob-wrap').addEventListener('click', function(e) {
      var chip = e.target.closest('.hob-chip');
      if (!chip) return;
      var id = chip.getAttribute('data-id');
      if (!window.S) window.S = {};
      if (!Array.isArray(window.S.sportHobbies)) window.S.sportHobbies = [];
      var idx = window.S.sportHobbies.indexOf(id);
      if (idx >= 0) window.S.sportHobbies.splice(idx, 1);
      else window.S.sportHobbies.push(id);
      try { if (window.saveProfile) window.saveProfile(); } catch(e2) {}
      showProfilSportifStep();
    });

    // Handlers durée de séance
    content.querySelectorAll('.dur-btn').forEach(function(b) {
      b.addEventListener('click', function() {
        if (!window.S) window.S = {};
        window.S.muscuDuration = parseInt(b.getAttribute('data-v'));
        try { if (window.saveProfile) window.saveProfile(); } catch(e) {}
        showProfilSportifStep();
      });
    });

    // Handlers heure d'entraînement
    content.querySelectorAll('.time-btn').forEach(function(b) {
      b.addEventListener('click', function() {
        if (!window.S) window.S = {};
        window.S.trainTime = b.getAttribute('data-v');
        try { if (window.saveProfile) window.saveProfile(); } catch(e) {}
        showProfilSportifStep();
      });
    });

    document.getElementById('ps-next').addEventListener('click', function() {
      if (!window.S || !window.S.sportLevel) {
        var err = document.getElementById('ps-error');
        if (err) err.style.display = 'block';
        return;
      }
      showGenerationStep();
    });
  }

  function showGenerationStep() {
    var content = document.getElementById('muscu-prog-content');
    var remaining = getGenerationsRemaining();
    var counterHTML = buildGenerationCounterHTML();
    var btnDisabled = remaining === 0;
    var btnStyle = btnDisabled
      ? 'background:var(--grey,#7A7A72);color:var(--ivory,#FAF9F6);border:none;padding:14px 32px;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:not-allowed;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;opacity:0.6;'
      : 'background:var(--accent,#1A4A1A);color:var(--ivory,#FAF9F6);border:none;padding:14px 32px;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;';
    // Summary of selected installations
    var sel = (window.S && Array.isArray(window.S.installations)) ? window.S.installations : [];
    var instSummary = sel.length
      ? sel.map(function(id) {
          var found = INSTALLATIONS.filter(function(x) { return x.id === id; })[0];
          return found ? found.icon + ' ' + found.label : id;
        }).join('  ·  ')
      : '';
    content.innerHTML = '<div style="text-align:center;padding:32px 24px;">' +
      renderStepperBar(6, 6) +
      '<h3 style="font-family:Georgia,serif;font-size:24px;font-weight:normal;letter-spacing:1px;color:var(--ink-900,#0A0A09);margin:0 0 20px 0;">Ton programme t\'attend.</h3>' +
      '<p style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:13px;line-height:1.7;color:var(--ink-500,#6B6B65);margin:0 auto 24px auto;max-width:520px;">On va croiser ton profil complet — niveau, disponibilités, équipement, objectifs et données de force — pour construire douze semaines qui n\'existent que pour toi. Aucune ligne ne sera générique. Chaque charge sera calculée sur ton profil réel.</p>' +
      (instSummary ? '<div style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin-bottom:8px;line-height:1.8;">' + instSummary + '</div>' +
        '<button id="install-change" style="background:transparent;border:none;font-size:10px;color:var(--grey,#6B6B65);cursor:pointer;text-decoration:underline;margin-bottom:20px;font-family:\'Helvetica Neue\',Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;">Modifier mes équipements</button>' : '') +
      '<p style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;color:var(--grey3,#9A9A90);margin-bottom:20px;">Génération limitée à 3 fois par semaine. Patientez 30 à 60 secondes.</p>' +
      counterHTML +
      '<button id="muscu-prog-generate"' + (btnDisabled ? ' disabled' : '') + ' style="' + btnStyle + '">Construire mon programme</button>' +
    '</div>';
    if (instSummary) {
      document.getElementById('install-change').addEventListener('click', showInstallationsStep);
    }
    if (!btnDisabled) {
      document.getElementById('muscu-prog-generate').addEventListener('click', generateMuscuProgram);
    }
  }

  function openMuscuProgramGenerator() {
    ensureModal();
    _previousFocus = document.activeElement;
    if (_loadingInterval) { clearInterval(_loadingInterval); _loadingInterval = null; }
    _modalEl.style.display = 'block';
    // Show installations step if not yet configured, stress step if stress not collected, otherwise generate
    var hasInstallations = (window.S && Array.isArray(window.S.installations)) && window.S.installations.length > 0;
    var hasObjectif = !!(window.S && window.S.muscuObjectifSpecifique);
    var hasZones    = (window.S && Array.isArray(window.S.muscuZonesCibles)); // null/undefined = pas encore répondu
    var hasStress   = (window.S && typeof window.S.stress === 'number');
    // FIX 2026-04-16 — étape profil sportif obligatoire pour personnalisation réelle
    var hasProfilSportif = !!(window.S && window.S.sportLevel && window.S.sportDays);
    if (!hasInstallations) {
      showInstallationsStep();
    } else if (!hasObjectif) {
      showObjectifStep();
    } else if (!hasZones) {
      showZonesCibleesStep();
    } else if (!hasStress) {
      showStressStep();
    } else if (!hasProfilSportif) {
      showProfilSportifStep();
    } else {
      showGenerationStep();
    }
    setTimeout(function() {
      var firstBtn = _modalEl.querySelector('button');
      if (firstBtn) firstBtn.focus();
    }, 50);
  }

  function generateMuscuProgram() {
    if (_generating) return;
    _generating = true;
    // Détecter si c'est la première génération
    var _S = window.S || {};
    var _isFirstProgram = (!_S.muscuProgramCount || _S.muscuProgramCount === 0);
    var content = document.getElementById('muscu-prog-content');
    content.innerHTML = '<div style="text-align:center;padding:48px 24px;">' +
      '<div style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:24px;font-family:\'Helvetica Neue\',Arial,sans-serif;">G\u00c9N\u00c9RATION EN COURS</div>' +
      '<div style="display:inline-block;width:40px;height:40px;border:2px solid var(--border,#D8D8D0);border-top-color:var(--accent,#1A4A1A);border-radius:50%;animation:spin 1s linear infinite;"></div>' +
      '<p id="muscu-prog-loading-text" style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:12px;line-height:1.7;color:var(--grey,#6B6B65);margin:24px auto 0 auto;max-width:480px;min-height:34px;transition:opacity 0.4s ease;">' + LOADING_PHRASES[0] + '</p>' +
      '<style>@keyframes spin{to{transform:rotate(360deg)}}</style>' +
    '</div>';

    if (_loadingInterval) clearInterval(_loadingInterval);
    var idx = 0;
    _loadingInterval = setInterval(function() {
      var el = document.getElementById('muscu-prog-loading-text');
      if (!el) { clearInterval(_loadingInterval); _loadingInterval = null; return; }
      idx = (idx + 1) % LOADING_PHRASES.length;
      el.style.opacity = '0';
      setTimeout(function() {
        var el2 = document.getElementById('muscu-prog-loading-text');
        if (el2) { el2.textContent = LOADING_PHRASES[idx]; el2.style.opacity = '1'; }
      }, 400);
    }, 8000);

    var profile = buildProfileFromState();
    // Validation profil avant envoi serveur — évite requête vide et erreur cryptique
    if (!profile || !window.S || !window.S.sex || !window.S.weight || !window.S.height) {
      _generating = false;
      if (_loadingInterval) { clearInterval(_loadingInterval); _loadingInterval = null; }
      alert('Profil incomplet — complétez d\u2019abord votre onboarding (sexe, poids, taille).');
      return;
    }
    // FIX BIBLE MUSCU §4 : timeout 25s → 10s. L'utilisateur perd la foi après.
    var _mcCtrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var _mcTimer = _mcCtrl ? setTimeout(function() { _mcCtrl.abort(); }, 10000) : null;
    fetch('/.netlify/functions/generate-muscu-program', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: profile }),
      signal: _mcCtrl ? _mcCtrl.signal : undefined
    })
    .then(function(r) {
      if (!r.ok) {
        return r.json()
          .then(function(err) { throw new Error(err.error || 'Erreur HTTP ' + r.status); })
          .catch(function() { throw new Error('Le serveur a mis trop de temps à répondre. Réessayez dans quelques instants.'); });
      }
      return r.json();
    })
    .then(function(data) {
      if (_mcTimer) clearTimeout(_mcTimer);
      _generating = false;
      if (_loadingInterval) { clearInterval(_loadingInterval); _loadingInterval = null; }

      // Record this generation for the weekly counter
      recordGeneration();

      // Incrémenter le compteur de programmes générés
      var _Snow = window.S || {};
      _Snow.muscuProgramCount = (_Snow.muscuProgramCount || 0) + 1;
      if (window.saveProfile) { try { window.saveProfile(); } catch(e2) {} }

      var programText = typeof data.program === 'string' ? data.program : '';
      var footerQuote = FOOTER_QUOTES[Math.floor(Math.random() * FOOTER_QUOTES.length)];

      // Sauvegarder le programme IA pour l'afficher dans la vue Sport + Dashboard
      _Snow.muscuIAProgram = programText;
      _Snow.muscuIAProgramDate = new Date().toISOString();
      if (window.saveProfile) { try { window.saveProfile(); } catch(e3) {} }

      // Try to parse into interactive cards; fall back to plain text if it fails
      var parsedHTML = parseProgramToHTML(programText);
      var programBodyHTML;
      if (parsedHTML) {
        programBodyHTML = '<div id="muscu-prog-cards">' + parsedHTML + '</div>';
      } else {
        // Fallback: plain text display
        var escaped = programText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        programBodyHTML = '<div style="white-space:pre-wrap;font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:13px;line-height:1.7;">' + escaped + '</div>';
      }

      var _firstProgramBanner = _isFirstProgram
        ? '<div style="border:1px solid var(--accent,#1A4A1A);background:rgba(26,74,26,0.05);padding:16px 20px;margin-bottom:20px;border-left:4px solid var(--accent,#1A4A1A);">' +
            '<p style="font-family:Georgia,serif;font-style:italic;font-size:15px;line-height:1.6;color:var(--accent,#1A4A1A);margin:0;">C\u2019est votre premier programme SmartFitCoach. Chaque semaine sera plus forte que la pr\u00e9c\u00e9dente.</p>' +
          '</div>'
        : '';

      content.innerHTML = _firstProgramBanner +
        '<div style="text-align:center;padding:8px 0 24px 0;border-bottom:1px solid var(--border,#D8D8D0);margin-bottom:24px;">' +
          '<p style="font-family:Georgia,serif;font-style:italic;font-size:16px;line-height:1.6;color:var(--accent,#1A4A1A);margin:0 auto;max-width:520px;">Voici douze semaines. Elles n\u2019appartiennent qu\u2019\u00e0 vous.</p>' +
        '</div>' +
        programBodyHTML +
        '<div style="margin-top:24px;text-align:center;border-top:1px solid var(--border,#D8D8D0);padding-top:16px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">' +
          '<button id="muscu-prog-print" style="background:transparent;border:1px solid var(--accent,#1A4A1A);color:var(--accent,#1A4A1A);padding:10px 20px;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;border-radius:2px;font-family:\'Helvetica Neue\',Arial,sans-serif;">Imprimer / PDF</button>' +
          '<button id="muscu-prog-share" style="background:var(--accent,#1A4A1A);color:var(--ivory,#FAF9F6);border:none;padding:14px 20px;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;border-radius:2px;font-family:\'Helvetica Neue\',Arial,sans-serif;">\u2934 Partager</button>' +
        '</div>' +
        '<div style="margin-top:20px;text-align:center;">' +
          '<p style="font-family:Georgia,serif;font-style:italic;font-size:11px;color:var(--grey,#7A7A72);margin:0;letter-spacing:0.3px;">' + escapeHTML(footerQuote) + '</p>' +
        '</div>' +
        '<div style="margin-top:10px;text-align:center;">' +
          '<a href="https://instagram.com/smart.fitcoach" target="_blank" rel="noopener noreferrer" style="font-family:Georgia,serif;font-style:italic;font-size:10px;color:var(--grey,#7A7A72);text-decoration:none;letter-spacing:1px;">@smart.fitcoach</a>' +
        '</div>';

      // Attache le listener du bouton Imprimer (pas d'inline onclick pour CSP)
      var printBtn = document.getElementById('muscu-prog-print');
      if (printBtn) {
        printBtn.addEventListener('click', function() { window.print(); });
      }
      // Attache le listener du bouton Partager (pas d'inline onclick pour CSP)
      var shareBtn = document.getElementById('muscu-prog-share');
      if (shareBtn) {
        shareBtn.addEventListener('click', function() { shareMuscuProgram(programText); });
      }
      // Attach accordion + checkbox interactivity for parsed program
      if (parsedHTML) {
        var cardsContainer = document.getElementById('muscu-prog-cards');
        if (cardsContainer) attachProgramInteractivity(cardsContainer);
      }
      // Sauvegarder localement
      try { localStorage.setItem(LS_KEY_PROGRAM, JSON.stringify({ program: programText, generatedAt: data.generatedAt })); } catch(e) { console.error('[muscu-prog] save fail:', e); }
    })
    .catch(function(err) {
      if (_mcTimer) clearTimeout(_mcTimer);
      _generating = false;
      if (_loadingInterval) { clearInterval(_loadingInterval); _loadingInterval = null; }
      console.warn('[muscu-prog] serveur indisponible, bascule fallback local:', err && err.message);

      // FIX BIBLE MUSCU §4 : FALLBACK LOCAL SILENCIEUX.
      // Si Netlify tombe (timeout, 405, 500, etc.) → on bascule sur buildPersonalizedMuscuPlan.
      // L'utilisateur ne doit jamais voir "serveur indisponible" — on parle d'appareil.
      try {
        if (typeof window.buildPersonalizedMuscuPlan === 'function') {
          var localPlan = window.buildPersonalizedMuscuPlan(window.S || {});
          if (localPlan && Array.isArray(localPlan.weekProgram) && localPlan.weekProgram.length > 0) {
            var _Snow2 = window.S || {};
            _Snow2.muscuProgramCount = (_Snow2.muscuProgramCount || 0) + 1;
            _Snow2.muscuIAProgram = localPlan;
            _Snow2.muscuIAProgramDate = new Date().toISOString();
            if (window.saveProfile) { try { window.saveProfile(); } catch(eSv) {} }

            // Affichage minimal du plan local (texte + parse si possible)
            var planSummary = localPlan.weekProgram.map(function(day, i) {
              var exos = Array.isArray(day.exercises) ? day.exercises.map(function(ex, j) {
                return (j + 1) + '. ' + (ex.n || ex.name || '') + ' — ' + (ex.sets || 3) + 'x' + (ex.reps || 10);
              }).join('\n') : '';
              return 'JOUR ' + (i + 1) + ' — ' + (day.label || day.focus || 'Séance ' + (i + 1)) + '\n' + exos;
            }).join('\n\n');

            var escaped = planSummary.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            content.innerHTML =
              '<div style="padding:16px 20px;margin-bottom:16px;border-left:3px solid var(--ink-500,#6B6B65);background:var(--paper-2,#F4F1EA);">' +
                '<p style="font-family:Georgia,serif;font-style:italic;font-size:13px;color:var(--ink-500,#6B6B65);margin:0;line-height:1.55;">Programme personnalisé sur ton appareil.</p>' +
              '</div>' +
              '<div style="white-space:pre-wrap;font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:13px;line-height:1.7;color:var(--ink-900,#0A0A09);">' + escaped + '</div>' +
              '<div style="margin-top:24px;text-align:center;border-top:1px solid var(--line,#D8D8D0);padding-top:16px;">' +
                '<button id="muscu-prog-retry-ia" style="background:transparent;border:1px solid var(--ink-900,#0A0A09);color:var(--ink-900,#0A0A09);padding:12px 20px;font-family:Georgia,serif;font-style:italic;font-size:13px;cursor:pointer;border-radius:2px;min-height:44px;">Régénérer avec l\u2019IA</button>' +
              '</div>';
            var retryIaBtn = document.getElementById('muscu-prog-retry-ia');
            if (retryIaBtn) retryIaBtn.addEventListener('click', function() { window.openMuscuProgramGenerator(); });
            return;
          }
        }
      } catch(eFallback) {
        console.error('[muscu-prog] fallback local failed:', eFallback);
      }

      // Dernier recours : vue "Réessayer" sobre (pas d'alert, pas de rouge agressif).
      content.innerHTML = '<div style="text-align:center;padding:40px 20px;">' +
        '<div style="font-family:Georgia,serif;font-style:italic;font-size:15px;color:var(--ink-500,#6B6B65);margin-bottom:20px;line-height:1.55;">On n\u2019a pas pu construire ton programme. Vérifie ta connexion.</div>' +
        '<button id="muscu-prog-retry" style="background:transparent;border:1px solid var(--ink-900,#0A0A09);color:var(--ink-900,#0A0A09);padding:12px 20px;font-family:Georgia,serif;font-style:italic;font-size:13px;cursor:pointer;border-radius:2px;min-height:44px;">Réessayer</button>' +
      '</div>';
      var retryBtn = document.getElementById('muscu-prog-retry');
      if (retryBtn) { retryBtn.addEventListener('click', function() { window.openMuscuProgramGenerator(); }); }
    });
  }

  function shareMuscuProgram(programText) {
    var shareData = {
      title: 'Mon programme SmartFitCoach',
      text: 'Mon programme hebdomadaire — SmartFitCoach.',
      url: window.location.origin
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData).catch(function(e) {
        if (e.name !== 'AbortError') console.error('[muscu-prog] share error:', e);
      });
    } else {
      // Fallback : copier dans le presse-papier
      var fallbackText = shareData.title + '\n\n' + shareData.text + '\n\n' + shareData.url;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fallbackText).then(function() {
          alert('Lien copié dans le presse-papier !');
        }).catch(function() {
          alert('Partage non disponible sur ce navigateur.');
        });
      } else {
        alert('Partage non disponible sur ce navigateur.');
      }
    }
  }

  window.openMuscuProgramGenerator = openMuscuProgramGenerator;
  window.generateMuscuProgram = generateMuscuProgram;
  window.shareMuscuProgram = shareMuscuProgram;
  window.MUSCU_PROGRAM = {
    open: openMuscuProgramGenerator,
    parseToHTML: parseProgramToHTML
  };
})();
