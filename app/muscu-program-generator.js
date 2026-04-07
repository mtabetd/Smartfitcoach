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

  // Installations/facilities options
  var INSTALLATIONS = [
    { id: 'muscu',       label: 'Salle de musculation',  desc: 'Barres, haltères, machines, câbles',         icon: '🏋️' },
    { id: 'home_gym',    label: 'Home gym',               desc: 'Haltères + banc à domicile',                 icon: '🏠' },
    { id: 'poids_corps', label: 'Maison / PDC',           desc: 'Sans matériel, poids du corps uniquement',   icon: '🤸' },
    { id: 'crossfit',    label: 'Box CrossFit',           desc: 'WODs, rower, anneaux, barbell olympique',    icon: '🔥' },
    { id: 'piscine',     label: 'Piscine',                desc: 'Natation, aquagym',                          icon: '🏊' },
    { id: 'course',      label: 'Course à pied',          desc: 'Piste, route, tapis de course',              icon: '🏃' },
    { id: 'velo',        label: 'Vélo / cardio',          desc: 'Vélo, home trainer, elliptique',             icon: '🚴' },
    { id: 'terrain',     label: 'Terrain de sport',       desc: 'Padel, tennis, foot, sports collectifs',     icon: '🎾' },
    { id: 'gymnase',     label: 'Gymnase / yoga',         desc: 'Studio yoga, danse, arts martiaux',          icon: '🧘' }
  ];

  var LOADING_PHRASES = [
    'Lecture de tes 1RM. Calcul de tes ratios squat, bench, deadlift, overhead.',
    'Sélection du split adapté à tes jours, ton équipement, tes blessures.',
    'Calibrage des charges cibles, semaine par semaine, kilo par kilo.',
    'Écriture de ton diagnostic. Encore quelques secondes.'
  ];

  var FOOTER_QUOTES = [
    'Donne ce programme à quelqu\u2019un d\u2019autre. Il ne fonctionnera pas.',
    'Le sur-mesure n\u2019est pas une option. C\u2019est la seule manière de progresser.'
  ];

  // --- P6 : Compteur de générations restantes ---

  function getWeekKey(date) {
    // Returns "YYYY-Www" for the ISO week containing `date`
    var d = new Date(date);
    // Set to nearest Thursday (ISO week starts Monday)
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    var yearStart = new Date(d.getFullYear(), 0, 1);
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return d.getFullYear() + '-W' + (weekNo < 10 ? '0' : '') + weekNo;
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

        html += '<div class="program-week" id="week-' + weekIdx + '" style="border:1px solid var(--border,#E5E5E0);margin-bottom:8px;">';
        html += '<div class="week-header" data-week="' + weekIdx + '" style="padding:14px 16px;cursor:pointer;font-family:Georgia,serif;font-size:14px;display:flex;justify-content:space-between;align-items:center;background:var(--ivory2,#F5F4F1);">';
        html += '<span>' + escapeHTML(week.title) + '</span>';
        html += '<span style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);">';
        if (totalExercises > 0) {
          html += '\u2713 ' + completedExercises + '/' + totalExercises + ' exercices';
        }
        html += '</span>';
        html += '</div>';

        html += '<div class="week-body" style="padding:0 16px 12px;' + (isFirstWeek ? '' : 'display:none;') + '">';

        for (var dd3 = 0; dd3 < week.days.length; dd3++) {
          var day = week.days[dd3];
          if (day.title) {
            html += '<div class="day-title" style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);margin:12px 0 8px;">' + escapeHTML(day.title) + '</div>';
          }

          var exerciseIdx = 0;
          for (var ex3 = 0; ex3 < day.exercises.length; ex3++) {
            var exerciseLine = day.exercises[ex3];
            var isCheckable = /^\d+[\.\)]/.test(exerciseLine);
            if (isCheckable) {
              var pKey2 = getProgressKey(weekIdx, day.title, exerciseIdx);
              var isChecked = progressMap[pKey2] ? true : false;
              html += '<div class="exercise-row" style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:13px;margin-bottom:6px;display:flex;align-items:flex-start;gap:8px;">';
              html += '<label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;width:100%;">';
              html += '<input type="checkbox"' + (isChecked ? ' checked' : '') + ' data-week="' + weekIdx + '" data-day="' + escapeHTML(day.title) + '" data-exercise="' + exerciseIdx + '" style="margin-top:3px;flex-shrink:0;">';
              html += '<span' + (isChecked ? ' style="text-decoration:line-through;color:var(--grey,#6B6B65);"' : '') + '>' + escapeHTML(exerciseLine) + '</span>';
              html += '</label>';
              html += '</div>';
              exerciseIdx++;
            } else {
              // Non-exercise line (note, rest info, etc.) — display as small note
              html += '<div style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin-bottom:4px;padding-left:4px;">' + escapeHTML(exerciseLine) + '</div>';
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

    // Checkbox progress save + strikethrough
    var checkboxes = container.querySelectorAll('.exercise-row input[type="checkbox"]');
    for (var j = 0; j < checkboxes.length; j++) {
      checkboxes[j].addEventListener('change', function(e) {
        var cb = e.currentTarget;
        var weekIdx = parseInt(cb.getAttribute('data-week'), 10);
        var dayName = cb.getAttribute('data-day');
        var exerciseIdx = parseInt(cb.getAttribute('data-exercise'), 10);
        var checked = cb.checked;
        updateProgress(weekIdx, dayName, exerciseIdx, checked);
        // Toggle strikethrough on sibling span
        var span = cb.parentElement.querySelector('span');
        if (span) {
          span.style.textDecoration = checked ? 'line-through' : '';
          span.style.color = checked ? 'var(--grey,#6B6B65)' : '';
        }
        // Update counter in week header
        var weekEl = cb.closest('.program-week');
        if (weekEl) {
          var allCbs = weekEl.querySelectorAll('input[type="checkbox"]');
          var total = allCbs.length;
          var done = 0;
          for (var k = 0; k < allCbs.length; k++) { if (allCbs[k].checked) done++; }
          var counterSpan = weekEl.querySelector('.week-header span:last-child');
          if (counterSpan && total > 0) {
            counterSpan.textContent = '\u2713 ' + done + '/' + total + ' exercices';
          }
        }
      });
    }
  }

  function buildProfileFromState() {
    var S = window.S || {};
    return {
      prenom: S.prenom || S.name || 'Athlète',
      age: S.age || null,
      sexe: S.sex === 'femme' ? 'femme' : 'homme',
      poids: S.weight || null,
      taille: S.height || null,
      objectif: window.GOALS && S.goal != null ? (window.GOALS[S.goal] && window.GOALS[S.goal].label) : 'hypertrophie',
      niveau: S.sportLevel || (S.activity >= 3 ? 'avancé' : S.activity >= 2 ? 'intermédiaire' : 'débutant'),
      joursDispo: S.muscuFreq || S.sportFreq || 4,
      dureeMaxSeance: S.muscuDuration || 60,
      equipement: S.equipement || S.gymType || 'salle complète',
      installations: Array.isArray(S.installations) && S.installations.length
        ? S.installations.map(function(id) {
            var found = INSTALLATIONS.filter(function(x) { return x.id === id; })[0];
            return found ? found.label + ' (' + found.desc + ')' : id;
          }).join(' | ')
        : null,
      sommeil: S.sleep || 7,
      stress: S.stress || 5,
      blessures: Array.isArray(S.blessures) ? S.blessures : [],
      bench1RM: (S.muscu1RM && S.muscu1RM.bench) || null,
      squat1RM: (S.muscu1RM && S.muscu1RM.squat) || null,
      deadlift1RM: (S.muscu1RM && S.muscu1RM.deadlift) || null,
      ohp1RM: (S.muscu1RM && S.muscu1RM.ohp) || null,
      pointsForts: S.pointsForts || '',
      pointsFaibles: S.pointsFaibles || '',
      preferences: S.preferences || '',
      historique: S.historique || ''
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
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid var(--border,#E5E5E0);padding-bottom:12px;">' +
        '<h2 style="margin:0;font-family:Georgia,serif;font-size:20px;font-weight:normal;letter-spacing:2px;text-transform:uppercase;">Programme Musculation</h2>' +
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
    if (_modalEl) _modalEl.style.display = 'none';
    if (_previousFocus && _previousFocus.focus) {
      try { _previousFocus.focus(); } catch(e) {}
    }
  }

  function showInstallationsStep() {
    var content = document.getElementById('muscu-prog-content');
    var current = Array.isArray(window.S && window.S.installations) ? window.S.installations : [];
    var cardStyle = 'display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border:1px solid var(--border,#E5E5E0);border-radius:2px;cursor:pointer;transition:border-color 0.15s,background 0.15s;margin-bottom:8px;font-family:"Helvetica Neue",Arial,sans-serif;';
    var cardsHTML = INSTALLATIONS.map(function(inst) {
      var sel = current.indexOf(inst.id) !== -1;
      return '<div class="install-card" data-id="' + inst.id + '" style="' + cardStyle + (sel ? 'border-color:var(--accent,#1A4A1A);background:rgba(26,74,26,0.06);' : '') + '">' +
        '<span style="font-size:20px;flex-shrink:0;line-height:1;">' + inst.icon + '</span>' +
        '<div style="flex:1;">' +
          '<div style="font-size:13px;font-weight:600;color:var(--black,#0A0A09);margin-bottom:2px;">' + inst.label + '</div>' +
          '<div style="font-size:11px;color:var(--grey,#6B6B65);">' + inst.desc + '</div>' +
        '</div>' +
        '<div class="install-check" style="width:18px;height:18px;border:1.5px solid ' + (sel ? 'var(--accent,#1A4A1A)' : 'var(--border,#E5E5E0)') + ';border-radius:2px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:' + (sel ? 'var(--accent,#1A4A1A)' : 'transparent') + ';">' +
          (sel ? '<svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 4L4 7L10 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '') +
        '</div>' +
      '</div>';
    }).join('');
    content.innerHTML =
      '<div style="padding:8px 4px 24px 4px;">' +
        '<div style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:16px;font-family:\'Helvetica Neue\',Arial,sans-serif;">ÉTAPE PRÉALABLE</div>' +
        '<h3 style="font-family:Georgia,serif;font-size:20px;font-weight:normal;letter-spacing:1px;color:var(--black,#0A0A09);margin:0 0 8px 0;">À quoi as-tu accès ?</h3>' +
        '<p style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);margin:0 0 20px 0;line-height:1.6;">Coche toutes tes installations disponibles. Le programme ne prescrira que ce que tu peux réellement faire. <strong>Sélection multiple.</strong></p>' +
        '<div id="install-cards-wrap">' + cardsHTML + '</div>' +
        '<div id="install-error" style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;color:#B02020;margin:8px 0 0 0;display:none;">Sélectionne au moins une installation.</div>' +
        '<div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap;">' +
          '<button id="install-confirm" style="background:var(--accent,#1A4A1A);color:var(--ivory,#FAF9F6);border:none;padding:12px 28px;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;border-radius:2px;font-family:\'Helvetica Neue\',Arial,sans-serif;">Continuer →</button>' +
        '</div>' +
      '</div>';

    // Toggle card selection
    var wrap = document.getElementById('install-cards-wrap');
    wrap.addEventListener('click', function(e) {
      var card = e.target.closest('.install-card');
      if (!card) return;
      var id = card.getAttribute('data-id');
      var sel = Array.isArray(window.S.installations) ? window.S.installations.slice() : [];
      var idx = sel.indexOf(id);
      if (idx === -1) { sel.push(id); } else { sel.splice(idx, 1); }
      window.S.installations = sel;
      if (window.saveProfile) window.saveProfile();
      // Update visual state
      var isSel = sel.indexOf(id) !== -1;
      card.style.borderColor = isSel ? 'var(--accent,#1A4A1A)' : 'var(--border,#E5E5E0)';
      card.style.background = isSel ? 'rgba(26,74,26,0.06)' : '';
      var chk = card.querySelector('.install-check');
      if (chk) {
        chk.style.borderColor = isSel ? 'var(--accent,#1A4A1A)' : 'var(--border,#E5E5E0)';
        chk.style.background = isSel ? 'var(--accent,#1A4A1A)' : 'transparent';
        chk.innerHTML = isSel ? '<svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 4L4 7L10 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '';
      }
    });

    document.getElementById('install-confirm').addEventListener('click', function() {
      var sel = Array.isArray(window.S.installations) ? window.S.installations : [];
      if (sel.length === 0) {
        var err = document.getElementById('install-error');
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
    var sel = Array.isArray(window.S && window.S.installations) ? window.S.installations : [];
    var instSummary = sel.length
      ? sel.map(function(id) {
          var found = INSTALLATIONS.filter(function(x) { return x.id === id; })[0];
          return found ? found.icon + ' ' + found.label : id;
        }).join('  ·  ')
      : '';
    content.innerHTML = '<div style="text-align:center;padding:32px 24px;">' +
      '<div style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:24px;font-family:\'Helvetica Neue\',Arial,sans-serif;">UN PROGRAMME. LE TIEN. PERSONNE D\u2019AUTRE.</div>' +
      '<h3 style="font-family:Georgia,serif;font-size:24px;font-weight:normal;letter-spacing:1px;color:var(--black,#0A0A09);margin:0 0 20px 0;">Ton programme t\u2019attend.</h3>' +
      '<p style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:13px;line-height:1.7;color:var(--grey,#6B6B65);margin:0 auto 24px auto;max-width:520px;">Nous allons croiser tes 1RM, tes disponibilités, ton équipement et ton historique pour construire douze semaines qui n\u2019existent que pour toi. Aucune ligne ne sera générique. Aucune charge ne sera approximative.</p>' +
      (instSummary ? '<div style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin-bottom:8px;line-height:1.8;">' + instSummary + '</div>' +
        '<button id="install-change" style="background:transparent;border:none;font-size:10px;color:var(--grey,#6B6B65);cursor:pointer;text-decoration:underline;margin-bottom:20px;font-family:\'Helvetica Neue\',Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;">Modifier mes accès</button>' : '') +
      '<p style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;color:var(--grey3,#9A9A90);margin-bottom:20px;">Génération limitée à 3 fois par semaine. Compte 30 à 60 secondes.</p>' +
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
    // Show installations step if not yet configured, otherwise go straight to generation
    var hasInstallations = Array.isArray(window.S && window.S.installations) && window.S.installations.length > 0;
    if (!hasInstallations) {
      showInstallationsStep();
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
    var content = document.getElementById('muscu-prog-content');
    content.innerHTML = '<div style="text-align:center;padding:48px 24px;">' +
      '<div style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:24px;font-family:\'Helvetica Neue\',Arial,sans-serif;">G\u00c9N\u00c9RATION EN COURS</div>' +
      '<div style="display:inline-block;width:40px;height:40px;border:2px solid var(--border,#E5E5E0);border-top-color:var(--accent,#1A4A1A);border-radius:50%;animation:spin 1s linear infinite;"></div>' +
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
    fetch('/.netlify/functions/generate-muscu-program', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: profile })
    })
    .then(function(r) {
      if (!r.ok) {
        return r.json().then(function(err) { throw new Error(err.error || 'Erreur HTTP ' + r.status); });
      }
      return r.json();
    })
    .then(function(data) {
      _generating = false;
      if (_loadingInterval) { clearInterval(_loadingInterval); _loadingInterval = null; }

      // Record this generation for the weekly counter
      recordGeneration();

      var programText = data.program || '';
      var footerQuote = FOOTER_QUOTES[Math.floor(Math.random() * FOOTER_QUOTES.length)];

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

      content.innerHTML = '<div style="text-align:center;padding:8px 0 24px 0;border-bottom:1px solid var(--border,#E5E5E0);margin-bottom:24px;">' +
          '<p style="font-family:Georgia,serif;font-style:italic;font-size:16px;line-height:1.6;color:var(--accent,#1A4A1A);margin:0 auto;max-width:520px;">Voici douze semaines. Elles n\u2019appartiennent qu\u2019à toi.</p>' +
        '</div>' +
        programBodyHTML +
        '<div style="margin-top:24px;text-align:center;border-top:1px solid var(--border,#E5E5E0);padding-top:16px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">' +
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
      _generating = false;
      if (_loadingInterval) { clearInterval(_loadingInterval); _loadingInterval = null; }
      console.error('[muscu-prog] generation error:', err);
      content.innerHTML = '<div style="text-align:center;padding:40px;">' +
        '<div style="font-size:14px;color:var(--red,#5A1010);margin-bottom:16px;">\u26a0 ' + escapeHTML(err.message || 'Erreur de génération') + '</div>' +
        '<button id="muscu-prog-retry" style="background:transparent;border:1px solid var(--grey,#6B6B65);color:var(--grey,#6B6B65);padding:10px 20px;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;border-radius:2px;font-family:\'Helvetica Neue\',Arial,sans-serif;">Réessayer</button>' +
      '</div>';
      var retryBtn = document.getElementById('muscu-prog-retry');
      if (retryBtn) { retryBtn.addEventListener('click', function() { window.openMuscuProgramGenerator(); }); }
    });
  }

  function shareMuscuProgram(programText) {
    var shareData = {
      title: 'Mon programme SmartFitCoach',
      text: 'Mon programme sur 12 semaines — SmartFitCoach.',
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
})();
