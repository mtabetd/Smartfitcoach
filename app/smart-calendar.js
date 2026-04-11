/* ═══════════════════════════════════════════════════════════════
   SMART-CALENDAR.JS — SmartFitCoach
   Calendrier intelligent sport+nutrition avec détection conflits musculaires
   ═══════════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  var DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  // ─── SPORTS DISPONIBLES SELON PROFIL ───
  function getAvailableSports() {
    var S = window.S;
    var sports = [];
    sports.push({ value: 'repos', label: 'Repos' });
    if (S) {
      if (S.sportType === 'musculation' || S.sportMixEnabled) {
        sports.push({ value: 'musculation', label: 'Musculation' });
      }
      if (S.sportType === 'crossfit' ||
          (S.sportMixEnabled && S.sportMixSecondary && S.sportMixSecondary.type === 'crossfit')) {
        sports.push({ value: 'crossfit', label: 'CrossFit' });
      }
      if (S.sportType === 'running') {
        sports.push({ value: 'running', label: 'Running' });
      }
      if (S.sportType === 'padel') {
        sports.push({ value: 'padel', label: 'Padel' });
      }
      if (S.sportType === 'golf') {
        sports.push({ value: 'golf', label: 'Golf' });
      }
      if (S.sportType === 'yoga') {
        sports.push({ value: 'yoga', label: 'Yoga' });
      }
    }
    sports.push({ value: 'autre', label: 'Autre' });
    return sports;
  }

  // ─── INIT CALENDRIER PAR DÉFAUT ───
  function initCalendar() {
    var S = window.S;
    if (!S) return;
    if (!S.weeklyCalendar || typeof S.weeklyCalendar !== 'object') {
      S.weeklyCalendar = {
        '0': 'repos',
        '1': 'repos',
        '2': 'repos',
        '3': 'repos',
        '4': 'repos',
        '5': 'repos',
        '6': 'repos'
      };
    }
  }

  // ─── DÉTECTION DE CONFLITS MUSCULAIRES ───
  function detectConflicts(calendar) {
    var conflicts = [];
    if (!calendar) return conflicts;
    if (!window.MUSCLE_TAXONOMY || !window.MUSCLE_TAXONOMY.getMusclesForSport) {
      return conflicts;
    }
    for (var i = 0; i < 7; i++) {
      var dayKey = String(i);
      var sport = calendar[dayKey] || 'repos';
      if (sport === 'repos' || sport === 'autre') continue;
      var nextKey = String((i + 1) % 7);
      var nextSport = calendar[nextKey] || 'repos';
      if (nextSport === 'repos' || nextSport === 'autre') continue;
      var musclesCurrent = window.MUSCLE_TAXONOMY.getMusclesForSport(sport);
      var musclesNext = window.MUSCLE_TAXONOMY.getMusclesForSport(nextSport);
      if (!musclesCurrent || !musclesNext) continue;
      var overlap = [];
      for (var m = 0; m < musclesCurrent.length; m++) {
        for (var n = 0; n < musclesNext.length; n++) {
          if (musclesCurrent[m] === musclesNext[n]) {
            var alreadyIn = false;
            for (var o = 0; o < overlap.length; o++) {
              if (overlap[o] === musclesCurrent[m]) { alreadyIn = true; break; }
            }
            if (!alreadyIn) overlap.push(musclesCurrent[m]);
          }
        }
      }
      if (overlap.length > 0) {
        var recoveryNeeded = 48;
        var recoveryAvailable = 24;
        var severity = overlap.length >= 2 ? 'critique' : 'attention';
        conflicts.push({
          dayIndex: i,
          dayName: DAY_NAMES[i],
          nextDayName: DAY_NAMES[(i + 1) % 7],
          muscles: overlap,
          severity: severity,
          recoveryNeeded: recoveryNeeded,
          recoveryAvailable: recoveryAvailable
        });
      }
    }
    return conflicts;
  }

  // ─── AFFICHER UN TOAST ───
  function showToast(message) {
    var toast = window.h('div', {
      style: 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);' +
             'background:#2ECC71;color:#fff;padding:12px 24px;border-radius:24px;' +
             'font-family:"Helvetica Neue",Arial,sans-serif;font-size:14px;font-weight:600;' +
             'box-shadow:0 4px 16px rgba(46,204,113,0.4);z-index:9999;' +
             'white-space:nowrap;'
    }, message);
    document.body.appendChild(toast);
    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2500);
  }

  // ─── RENDER ZONE CONFLITS ───
  function buildConflictZone(conflicts) {
    if (!conflicts || conflicts.length === 0) return null;
    var items = [];
    for (var i = 0; i < conflicts.length; i++) {
      var c = conflicts[i];
      var isCritique = c.severity === 'critique';
      var icon = isCritique ? 'Critique' : 'Attention';
      var color = isCritique ? '#E74C3C' : '#F39C12';
      var bgColor = isCritique ? '#FEF5F5' : '#FFFBF0';
      var muscleList = c.muscles.join(', ');
      var msg = 'Vos muscles (' + muscleList + ') seront encore en récupération le ' +
                c.nextDayName + '. ' + c.recoveryNeeded + 'h nécessaires, ' +
                c.recoveryAvailable + 'h disponibles.';
      var row = window.h('div', {
        style: 'display:flex;align-items:flex-start;gap:10px;padding:12px;' +
               'background:' + bgColor + ';border-radius:8px;margin-bottom:8px;' +
               'border-left:3px solid ' + color + ';'
      }, [
        window.h('div', {
          style: 'flex-shrink:0;background:' + color + ';color:#fff;' +
                 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;font-weight:700;' +
                 'padding:2px 8px;border-radius:12px;margin-top:1px;text-transform:uppercase;letter-spacing:1px;'
        }, icon),
        window.h('div', {
          style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:#1a1a2e;line-height:1.5;'
        }, msg)
      ]);
      items.push(row);
    }
    var zone = window.h('div', {
      style: 'background:#fff;border:1px solid #E0E0E0;border-radius:12px;padding:16px;margin-bottom:12px;'
    }, [
      window.h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:14px;font-weight:700;' +
               'color:#1a1a2e;margin-bottom:12px;display:flex;align-items:center;gap:8px;'
      }, 'Conflits detectes')
    ]);
    for (var j = 0; j < items.length; j++) {
      zone.appendChild(items[j]);
    }
    return zone;
  }

  // ─── RENDER PRINCIPAL ───
  function render(container) {
    var S = window.S;
    if (!S) return;
    initCalendar();
    if (!container) return;

    // Vider le container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    var availableSports = getAvailableSports();

    // ── Header ──
    var btnBack = window.h('button', {
      style: 'background:none;border:none;cursor:pointer;color:#1a1a2e;' +
             'font-family:"Helvetica Neue",Arial,sans-serif;font-size:14px;font-weight:600;' +
             'padding:0;display:flex;align-items:center;gap:6px;'
    }, [
      window.h('span', {}, '\u2190'),
      window.h('span', {}, 'Retour')
    ]);
    btnBack.addEventListener('click', function() {
      S.view = 'today';
      if (window.render) window.render();
    });

    var header = window.h('div', {
      style: 'margin-bottom:20px;'
    }, [
      window.h('div', {
        style: 'margin-bottom:12px;'
      }, btnBack),
      window.h('h1', {
        style: 'font-family:Georgia,serif;font-size:22px;font-weight:normal;color:#1a1a2e;margin:0 0 6px 0;'
      }, 'Calendrier Intelligent'),
      window.h('p', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:#6B6B65;margin:0;line-height:1.5;'
      }, 'Planifiez vos entrainements & detectez les conflits musculaires')
    ]);

    // ── Grille 7 jours ──
    var selects = [];
    var conflictBadges = [];
    var dayCards = [];

    var currentConflicts = detectConflicts(S.weeklyCalendar);
    var conflictsByDay = {};
    for (var ci = 0; ci < currentConflicts.length; ci++) {
      conflictsByDay[currentConflicts[ci].dayIndex] = currentConflicts[ci];
    }

    for (var di = 0; di < 7; di++) {
      (function(dayIdx) {
        var dayKey = String(dayIdx);
        var currentSport = (S.weeklyCalendar && S.weeklyCalendar[dayKey]) ? S.weeklyCalendar[dayKey] : 'repos';

        // Badge conflit
        var badgeEl = window.h('span', {
          style: 'display:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;font-weight:700;' +
                 'padding:2px 8px;border-radius:12px;margin-left:auto;text-transform:uppercase;letter-spacing:1px;'
        }, '');
        conflictBadges[dayIdx] = badgeEl;

        // Options du select
        var optionEls = [];
        for (var si = 0; si < availableSports.length; si++) {
          var sport = availableSports[si];
          var optAttrs = { value: sport.value };
          if (sport.value === currentSport) {
            optAttrs.selected = 'selected';
          }
          optionEls.push(window.h('option', optAttrs, sport.label));
        }

        var selectEl = window.h('select', {
          style: 'width:100%;padding:8px 10px;border:1px solid #E0E0E0;border-radius:8px;' +
                 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:14px;color:#1a1a2e;' +
                 'background:#F8F9FA;cursor:pointer;-webkit-appearance:none;appearance:none;'
        }, optionEls);
        selects[dayIdx] = selectEl;

        selectEl.addEventListener('change', function() {
          if (!S.weeklyCalendar) S.weeklyCalendar = {};
          S.weeklyCalendar[dayKey] = selectEl.value;
          var newConflicts = detectConflicts(S.weeklyCalendar);
          var newConflictsByDay = {};
          for (var nci = 0; nci < newConflicts.length; nci++) {
            newConflictsByDay[newConflicts[nci].dayIndex] = newConflicts[nci];
          }
          // Mettre à jour tous les badges
          for (var bdi = 0; bdi < 7; bdi++) {
            var badge = conflictBadges[bdi];
            if (!badge) continue;
            if (newConflictsByDay[bdi]) {
              var conf = newConflictsByDay[bdi];
              var isCrit = conf.severity === 'critique';
              badge.textContent = isCrit ? 'Critique' : 'Attention';
              badge.style.display = 'inline-block';
              badge.style.background = isCrit ? '#E74C3C' : '#F39C12';
              badge.style.color = '#fff';
            } else {
              badge.textContent = '';
              badge.style.display = 'none';
            }
          }
          // Mettre à jour la zone de conflits
          if (conflictZoneWrapper) {
            while (conflictZoneWrapper.firstChild) {
              conflictZoneWrapper.removeChild(conflictZoneWrapper.firstChild);
            }
            var updatedZone = buildConflictZone(newConflicts);
            if (updatedZone) conflictZoneWrapper.appendChild(updatedZone);
          }
        });

        // Mettre à jour le badge initial
        if (conflictsByDay[dayIdx]) {
          var conf0 = conflictsByDay[dayIdx];
          var isCrit0 = conf0.severity === 'critique';
          badgeEl.textContent = isCrit0 ? 'Critique' : 'Attention';
          badgeEl.style.display = 'inline-block';
          badgeEl.style.background = isCrit0 ? '#E74C3C' : '#F39C12';
          badgeEl.style.color = '#fff';
        }

        var card = window.h('div', {
          style: 'background:#fff;border:1px solid #E0E0E0;border-radius:12px;padding:12px;' +
                 'margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.06);'
        }, [
          window.h('div', {
            style: 'display:flex;align-items:center;margin-bottom:8px;'
          }, [
            window.h('span', {
              style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;font-weight:700;color:#1a1a2e;'
            }, DAY_NAMES[dayIdx]),
            badgeEl
          ]),
          selectEl
        ]);
        dayCards.push(card);
      })(di);
    }

    var grid = window.h('div', {
      style: 'margin-bottom:16px;'
    }, dayCards);

    // ── Zone conflits ──
    var conflictZoneWrapper = window.h('div', {});
    var initialConflictZone = buildConflictZone(currentConflicts);
    if (initialConflictZone) conflictZoneWrapper.appendChild(initialConflictZone);

    // ── Section nutrition intelligente ──
    var nutritionInfo = window.h('div', {
      style: 'background:#F8F9FA;border:1px solid #E0E0E0;border-radius:12px;padding:14px;' +
             'margin-bottom:16px;display:flex;align-items:flex-start;gap:10px;'
    }, [
      window.h('span', { style: 'font-size:20px;flex-shrink:0;' }, '\uD83D\uDCCA'),
      window.h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:#1a1a2e;line-height:1.6;'
      }, [
        window.h('strong', {}, 'Nutrition adaptee : '),
        window.h('span', {
          style: 'color:#6B6B65;'
        }, 'les jours d\'entrainement, vos glucides sont automatiquement +20% pour optimiser les performances et la recuperation.')
      ])
    ]);

    // ── Bouton sauvegarder ──
    var btnSave = window.h('button', {
      style: 'width:100%;padding:14px;background:#2ECC71;color:#fff;border:none;border-radius:12px;' +
             'font-family:"Helvetica Neue",Arial,sans-serif;font-size:15px;font-weight:700;' +
             'cursor:pointer;box-shadow:0 2px 8px rgba(46,204,113,0.3);'
    }, 'Sauvegarder le calendrier');
    btnSave.addEventListener('click', function() {
      if (!S.weeklyCalendar) S.weeklyCalendar = {};
      for (var si = 0; si < selects.length; si++) {
        if (selects[si]) {
          S.weeklyCalendar[String(si)] = selects[si].value;
        }
      }
      // Invalider le plan nutritionnel — les jours d'entraînement ont peut-être changé
      // → il sera régénéré avec les nouvelles données à la prochaine visite du planning
      S.weekPlan = null;
      S._planHash = null;
      btnSave.textContent = 'Sauvegarde...';
      btnSave.style.background = '#27AE60';
      btnSave.disabled = true;
      if (window.saveProfile) window.saveProfile();
      showToast('\u2705 Calendrier sauvegarde !');
      setTimeout(function() {
        btnSave.textContent = 'Sauvegarder le calendrier';
        btnSave.style.background = '#2ECC71';
        btnSave.disabled = false;
      }, 1500);
    });

    var saveSection = window.h('div', {
      style: 'margin-bottom:24px;'
    }, btnSave);

    // ── Assemblage ──
    var wrapper = window.h('div', {
      style: 'max-width:480px;margin:0 auto;padding:16px;box-sizing:border-box;'
    }, [
      header,
      grid,
      conflictZoneWrapper,
      nutritionInfo,
      saveSection
    ]);

    container.appendChild(wrapper);
  }

  // ─── RENDER BANNER ───
  function renderBanner() {
    var banner = window.h('div', {
      style: 'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);' +
             'color:#fff;border-radius:16px;margin:0 0 16px 0;padding:20px;' +
             'position:relative;box-sizing:border-box;'
    });

    var btnClose = window.h('button', {
      style: 'position:absolute;top:12px;right:12px;background:rgba(255,255,255,0.15);' +
             'border:none;color:#fff;width:24px;height:24px;border-radius:50%;cursor:pointer;' +
             'font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;' +
             'line-height:1;padding:0;'
    }, '\u00D7');
    btnClose.addEventListener('click', function() {
      var S = window.S;
      if (S) S.smartCalendarDismissed = true;
      if (window.saveProfile) window.saveProfile();
      if (banner.parentElement) banner.parentElement.removeChild(banner);
    });

    var title = window.h('div', {
      style: 'font-family:Georgia,serif;font-size:17px;font-weight:normal;margin-bottom:6px;' +
             'padding-right:32px;'
    }, '\u2728 Mise a jour \u2014 Calendrier Intelligent');

    var subtitle = window.h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.80);' +
             'margin-bottom:16px;line-height:1.5;padding-right:32px;'
    }, 'Planifiez vos sports sur 7 jours et evitez les conflits musculaires');

    var btnCta = window.h('button', {
      style: 'background:transparent;color:#fff;border:1.5px solid #fff;border-radius:24px;' +
             'padding:8px 20px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;font-weight:600;' +
             'cursor:pointer;'
    }, 'Decouvrir \u2192');
    btnCta.addEventListener('click', function() {
      var S = window.S;
      if (S) S.view = 'calendar';
      if (window.render) window.render();
    });

    banner.appendChild(btnClose);
    banner.appendChild(title);
    banner.appendChild(subtitle);
    banner.appendChild(btnCta);

    return banner;
  }

  // ─── EXPORT ───
  window.SMART_CALENDAR = {
    render: render,
    renderBanner: renderBanner
  };

})();
