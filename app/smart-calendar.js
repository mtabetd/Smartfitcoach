/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
/* ═══════════════════════════════════════════════════════════════
   SMART-CALENDAR.JS — SmartFitCoach
   Calendrier intelligent sport+nutrition avec détection conflits musculaires
   ═══════════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  var _calLang = (function(){ try { var p = JSON.parse(localStorage.getItem('sfc_profile')||'{}'); return p.lang || 'fr'; } catch(e){ return 'fr'; } })();
  var DAY_NAMES = (function() {
    try {
      var locale = _calLang === 'en' ? 'en-US' : 'fr-FR';
      var fmt = new Intl.DateTimeFormat(locale, {weekday:'long'});
      var monday = new Date(2024, 0, 1); // Monday Jan 1 2024
      return [0,1,2,3,4,5,6].map(function(i){ var d = new Date(monday); d.setDate(monday.getDate()+i); var s = fmt.format(d); return s.charAt(0).toUpperCase()+s.slice(1); });
    } catch(e) {
      return _calLang === 'en' ? ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] : ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
    }
  })();

  // ─── SPORTS DISPONIBLES SELON PROFIL ───
  function getAvailableSports() {
    var S = window.S;
    var sports = [];
    sports.push({ value: 'repos', label: _calLang === 'en' ? 'Rest' : 'Repos' });
    if (S) {
      if (S.sportType === 'musculation' || S.sportMixEnabled) {
        sports.push({ value: 'musculation', label: 'Musculation' });
      }
      if (S.sportType === 'crossfit' ||
          (S.sportMixEnabled && S.sportMixSecondary && S.sportMixSecondary.type === 'crossfit')) {
        sports.push({ value: 'crossfit', label: 'CrossFit' });
      }
      if (S.sportType === 'running' ||
          (S.sportMixEnabled && S.sportMixSecondary && S.sportMixSecondary.type === 'running')) {
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
      // FIX D7 COHÉRENCE SMART-CALENDAR 2026-04 : ajout des 4 sports manquants
      // Avant : hyrox, triathlon, calisthenics, cycling absents → users sur ces disciplines
      //         voyaient leur jour forcé à 'repos' → getDayType() isTraining=false
      //         → split calorique faux (pas de bonus +200 kcal post-séance).
      if (S.sportType === 'hyrox') {
        sports.push({ value: 'hyrox', label: 'Hyrox' });
      }
      if (S.sportType === 'triathlon') {
        // BUG-FIX: was hardcoded 'Triathlon' (FR only) — now bilingual
        sports.push({ value: 'triathlon', label: _calLang === 'en' ? 'Triathlon' : 'Triathlon' });
      }
      if (S.sportType === 'calisthenics') {
        // BUG-FIX: was hardcoded 'Calisthénie' (FR only) — now bilingual
        sports.push({ value: 'calisthenics', label: _calLang === 'en' ? 'Calisthenics' : 'Calisthénie' });
      }
      if (S.sportType === 'cycling') {
        // BUG-FIX: was hardcoded 'Cyclisme' (FR only) — now bilingual
        sports.push({ value: 'cycling', label: _calLang === 'en' ? 'Cycling' : 'Cyclisme' });
      }
    }
    // BUG-FIX: 'Autre' was always French — now bilingual
    sports.push({ value: 'autre', label: _calLang === 'en' ? 'Other' : 'Autre' });
    return sports;
  }

  // ─── INIT CALENDRIER PAR DÉFAUT ───
  // FIX SPRINT P2.4 — Sync depuis trainingDaysSelected (audit symbiose).
  // Avant : initialisé à TOUT 'repos' sans regarder S.trainingDaysSelected.
  // L'utilisateur configurait 2 fois la même chose (onboarding + smart calendar).
  // Maintenant : pré-rempli depuis trainingDaysSelected + sportType.
  function initCalendar() {
    var S = window.S;
    if (!S) return;
    var sportLabel = S.sportType || 'muscu';
    if (!S.weeklyCalendar || typeof S.weeklyCalendar !== 'object') {
      S.weeklyCalendar = {
        '0': 'repos', '1': 'repos', '2': 'repos', '3': 'repos',
        '4': 'repos', '5': 'repos', '6': 'repos'
      };
      // Pré-remplissage depuis trainingDaysSelected
      if (Array.isArray(S.trainingDaysSelected) && S.trainingDaysSelected.length > 0) {
        S.trainingDaysSelected.forEach(function(dayIdx) {
          if (dayIdx >= 0 && dayIdx <= 6) {
            S.weeklyCalendar[String(dayIdx)] = sportLabel;
          }
        });
      }
    } else if (S._calendarSportType && S._calendarSportType !== sportLabel) {
      // Sport type changed — update training day labels to new sport
      var oldLabel = S._calendarSportType;
      for (var dk = 0; dk < 7; dk++) {
        if (S.weeklyCalendar[String(dk)] === oldLabel) {
          S.weeklyCalendar[String(dk)] = sportLabel;
        }
      }
    }
    S._calendarSportType = sportLabel;
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
             'background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);padding:12px 24px;border-radius:2px;' +
             'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;font-weight:400;' +
             'letter-spacing:4px;text-transform:uppercase;' +
             'z-index:9999;white-space:nowrap;'
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
      // BUG-FIX: hardcoded French strings — now bilingual
      var icon = isCritique ? (_calLang === 'en' ? 'Critical' : 'Critique') : (_calLang === 'en' ? 'Warning' : 'Attention');
      var color = isCritique ? 'var(--red,#5A1010)' : 'var(--orange,#6A4A1A)';
      var bgColor = isCritique ? 'var(--redbg,rgba(90,16,16,.06))' : 'var(--orangebg,rgba(106,74,26,.06))';
      var muscleList = c.muscles.join(', ');
      var msg = _calLang === 'en'
        ? 'Your muscles (' + muscleList + ') will still be recovering on ' +
          c.nextDayName + '. ' + c.recoveryNeeded + 'h needed, ' +
          c.recoveryAvailable + 'h available.'
        : 'Vos muscles (' + muscleList + ') seront encore en récupération le ' +
          c.nextDayName + '. ' + c.recoveryNeeded + 'h nécessaires, ' +
          c.recoveryAvailable + 'h disponibles.';
      var row = window.h('div', {
        style: 'display:flex;align-items:flex-start;gap:10px;padding:12px;' +
               'background:' + bgColor + ';border-radius:2px;margin-bottom:8px;' +
               'border-left:3px solid ' + color + ';'
      }, [
        window.h('div', {
          style: 'flex-shrink:0;color:' + color + ';' +
                 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;font-weight:400;' +
                 'padding:2px 6px;border:1px solid ' + color + ';border-radius:2px;margin-top:1px;text-transform:uppercase;letter-spacing:2px;'
        }, icon),
        window.h('div', {
          style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--black,#0A0A09);line-height:1.6;'
        }, msg)
      ]);
      items.push(row);
    }
    var zone = window.h('div', {
      style: 'background:var(--ivory2,#F4F4F0);border:1px solid var(--border,#D8D8D0);border-radius:2px;padding:16px;margin-bottom:12px;'
    }, [
      window.h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;font-weight:400;letter-spacing:4px;text-transform:uppercase;' +
               'color:var(--grey,#6B6B65);margin-bottom:12px;'
      }, _calLang === 'en' ? 'Conflicts detected' : 'Conflits détectés')
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
      style: 'background:none;border:none;cursor:pointer;color:var(--grey,#6B6B65);' +
             'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;font-weight:400;' +
             'letter-spacing:3px;text-transform:uppercase;' +
             'padding:10px 0;display:inline-flex;align-items:center;gap:8px;min-height:44px;'
    }, [
      window.h('span', {}, '\u2190'),
      window.h('span', {}, _calLang === 'en' ? 'Back' : 'Retour')
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
        style: 'font-family:Georgia,serif;font-size:24px;font-weight:normal;color:var(--black,#0A0A09);margin:0 0 6px 0;letter-spacing:-0.5px;'
      }, _calLang === 'en' ? 'Smart Calendar' : 'Calendrier Intelligent'),
      window.h('p', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey,#6B6B65);margin:0;line-height:1.7;font-weight:300;'
      }, _calLang === 'en' ? 'Plan your training & detect muscle conflicts' : 'Planifiez vos entraînements & détectez les conflits musculaires')
    ]);

    // ── Grille 7 jours ──
    var selects = [];
    var conflictBadges = [];
    var dayCards = [];

    // FIX COHÉRENCE CALENDRIER 2026-04 : today detection + session state for checkmark.
    // (new Date().getDay()+6)%7 → 0=Lun…6=Dim, cohérent avec getDayType() et trainingDaysSelected.
    var _todayDayIdx = (new Date().getDay() + 6) % 7;
    var _todayDateStr = new Date().toISOString().slice(0, 10);
    // Détecter si la séance du jour est terminée ou en cours (muscu + autres sports)
    var _calSessionDoneToday = false;
    var _calSessionInProgress = false;
    try {
      // sessionHistory key = "<dayIdx>_<date>" → chercher n'importe quel dayIdx pour aujourd'hui
      var _sh = S.sessionHistory || {};
      var _shKeys = Object.keys(_sh);
      for (var _ski = 0; _ski < _shKeys.length; _ski++) {
        if (_shKeys[_ski].indexOf(_todayDateStr) !== -1) { _calSessionDoneToday = true; break; }
      }
      if (!_calSessionDoneToday && S.muscuSessionLog && S.muscuSessionLog[_todayDateStr]) {
        var _ml = S.muscuSessionLog[_todayDateStr];
        var _anyV = false, _anyU = false;
        Object.keys(_ml).forEach(function(ex) {
          (_ml[ex] || []).forEach(function(set) {
            if (set.validated) _anyV = true; else _anyU = true;
          });
        });
        if (_anyV && !_anyU) _calSessionDoneToday = true;
        else if (_anyV && _anyU) _calSessionInProgress = true;
      }
    } catch(_calSessErr) {}

    var currentConflicts = detectConflicts(S.weeklyCalendar);
    var conflictsByDay = {};
    for (var ci = 0; ci < currentConflicts.length; ci++) {
      conflictsByDay[currentConflicts[ci].dayIndex] = currentConflicts[ci];
    }

    for (var di = 0; di < 7; di++) {
      (function(dayIdx) {
        var dayKey = String(dayIdx);
        var currentSport = (S.weeklyCalendar && S.weeklyCalendar[dayKey]) ? S.weeklyCalendar[dayKey] : 'repos';
        var isToday = (dayIdx === _todayDayIdx);

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
          style: 'width:100%;padding:10px 12px;border:1px solid var(--border,#D8D8D0);border-radius:2px;' +
                 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--black,#0A0A09);' +
                 'background:var(--ivory,#FAF9F6);cursor:pointer;-webkit-appearance:none;appearance:none;' +
                 'min-height:44px;'
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
              badge.textContent = isCrit ? (_calLang === 'en' ? 'Critical' : 'Critique') : (_calLang === 'en' ? 'Warning' : 'Attention');
              badge.style.display = 'inline-block';
              badge.style.background = isCrit ? 'var(--redbg,rgba(90,16,16,.06))' : 'var(--orangebg,rgba(106,74,26,.06))';
              badge.style.color = isCrit ? 'var(--red,#5A1010)' : 'var(--orange,#6A4A1A)';
              badge.style.border = isCrit ? '1px solid var(--red,#5A1010)' : '1px solid var(--orange,#6A4A1A)';
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
          badgeEl.textContent = isCrit0 ? (_calLang === 'en' ? 'Critical' : 'Critique') : (_calLang === 'en' ? 'Warning' : 'Attention');
          badgeEl.style.display = 'inline-block';
          badgeEl.style.background = isCrit0 ? 'var(--redbg,rgba(90,16,16,.06))' : 'var(--orangebg,rgba(106,74,26,.06))';
          badgeEl.style.color = isCrit0 ? 'var(--red,#5A1010)' : 'var(--orange,#6A4A1A)';
          badgeEl.style.border = isCrit0 ? '1px solid var(--red,#5A1010)' : '1px solid var(--orange,#6A4A1A)';
        }

        // FIX COHÉRENCE CALENDRIER 2026-04 : today highlight (bordure noire) + chips session
        var _cardStyle = isToday
          ? 'background:var(--ivory2,#F4F4F0);border:1px solid var(--black,#0A0A09);border-left:3px solid var(--black,#0A0A09);border-radius:2px;padding:16px;margin-bottom:8px;'
          : 'background:var(--ivory2,#F4F4F0);border:1px solid var(--border,#D8D8D0);border-radius:2px;padding:16px;margin-bottom:8px;';

        // Chip session (aujourd'hui uniquement)
        var _sessionChip = null;
        if (isToday && (_calSessionDoneToday || _calSessionInProgress)) {
          var _chipText = _calSessionDoneToday ? ('✔ ' + (_calLang === 'en' ? 'Done' : 'Terminée')) : ('○ ' + (_calLang === 'en' ? 'In progress' : 'En cours'));
          var _chipColor = _calSessionDoneToday ? 'var(--success,#3E5C3A)' : 'var(--orange,#6A4A1A)';
          _sessionChip = window.h('span', {
            style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;' +
                   'padding:2px 6px;border:1px solid ' + _chipColor + ';color:' + _chipColor + ';border-radius:2px;flex-shrink:0;'
          }, _chipText);
        }

        // Chip "Aujourd'hui" si pas de chip session
        var _todayChip = (isToday && !_sessionChip)
          ? window.h('span', {
              style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;' +
                     'padding:2px 6px;border:1px solid var(--black,#0A0A09);color:var(--black,#0A0A09);border-radius:2px;flex-shrink:0;'
            }, _calLang === 'en' ? 'Today' : "Aujourd'hui")
          : null;

        var _hdrChildren = [
          window.h('span', {
            style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;font-weight:400;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);flex:1;'
          }, DAY_NAMES[dayIdx])
        ];
        if (_todayChip) _hdrChildren.push(_todayChip);
        if (_sessionChip) _hdrChildren.push(_sessionChip);
        _hdrChildren.push(badgeEl);

        var card = window.h('div', { style: _cardStyle }, [
          window.h('div', {
            style: 'display:flex;align-items:center;gap:6px;margin-bottom:8px;'
          }, _hdrChildren),
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
    // FIX COHÉRENCE CALENDRIER 2026-04 (Check 9) : afficher l'état du weekPlan nutrition.
    // Si S.weekPlan existe (7 jours), indiquer combien de jours ont un plan repas validé
    // et si le plan est synchronisé avec le calendrier sport actuel.
    var _hasWeekPlan = Array.isArray(S.weekPlan) && S.weekPlan.length >= 7;
    var _weekPlanDaysWithMeals = 0;
    if (_hasWeekPlan) {
      for (var _wpi = 0; _wpi < 7; _wpi++) {
        var _wpDay = S.weekPlan[_wpi];
        if (_wpDay && (_wpDay.breakfast || _wpDay.lunch || _wpDay.dinner)) _weekPlanDaysWithMeals++;
      }
    }
    var _nutritionStatusText = '';
    if (_hasWeekPlan && _weekPlanDaysWithMeals >= 5) {
      var _planSyncStatus = S.weekPlanValidated
        ? (_calLang === 'en' ? 'Plan validated — calories adapted per day type.' : 'Plan validé — calories adaptées par type de jour.')
        : (_calLang === 'en' ? 'Plan pending validation — save calendar then re-validate.' : 'Plan en attente de validation — sauvegardez le calendrier puis revalidez.');
      _nutritionStatusText = _planSyncStatus;
    } else if (_hasWeekPlan) {
      _nutritionStatusText = _calLang === 'en'
        ? 'Partial nutrition plan (' + _weekPlanDaysWithMeals + '/7 days). Generate a full week from the Nutrition tab.'
        : 'Plan nutrition partiel (' + _weekPlanDaysWithMeals + '/7 jours). Générez une semaine complète depuis l\'onglet Nutrition.';
    } else {
      _nutritionStatusText = _calLang === 'en'
        ? 'On training days, your carbohydrates are automatically +20% to optimise performance and recovery.'
        : 'Les jours d\'entraînement, vos glucides sont automatiquement +20% pour optimiser les performances et la récupération.';
    }

    var nutritionInfo = window.h('div', {
      style: 'background:var(--ivory2,#F4F4F0);border:1px solid var(--border,#D8D8D0);border-radius:2px;padding:14px;' +
             'margin-bottom:16px;border-left:2px solid var(--black,#0A0A09);'
    }, [
      window.h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:6px;'
      }, _calLang === 'en' ? 'Nutrition & Calendar' : 'Nutrition & Calendrier'),
      window.h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);line-height:1.6;'
      }, _nutritionStatusText)
    ]);

    // ── Bouton sauvegarder ──
    var btnSave = window.h('button', {
      style: 'width:100%;padding:18px 28px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);' +
             'border:1px solid var(--black,#0A0A09);border-radius:2px;' +
             'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;font-weight:400;' +
             'letter-spacing:6px;text-transform:uppercase;cursor:pointer;min-height:44px;' +
             'transition:background 0.2s ease;'
    }, _calLang === 'en' ? 'Save calendar' : 'Sauvegarder le calendrier');
    btnSave.addEventListener('click', function() {
      if (!S.weeklyCalendar) S.weeklyCalendar = {};
      for (var si = 0; si < selects.length; si++) {
        if (selects[si]) {
          S.weeklyCalendar[String(si)] = selects[si].value;
        }
      }
      // FIX VALIDATION WEEKPLAN 2026-04 : dévalider au lieu de supprimer.
      // Le plan reste visible, l'user clique "Revalider" pour intégrer les nouveaux
      // jours d'entraînement (split calorique adapté).
      if (window.devalidateWeekPlan) window.devalidateWeekPlan('smart-calendar saved');
      else if (typeof S.weekPlanValidated !== 'undefined') S.weekPlanValidated = false;
      btnSave.textContent = _calLang === 'en' ? 'Saving...' : 'Sauvegarde...';
      btnSave.style.opacity = '0.6';
      btnSave.disabled = true;
      if (window.saveProfile) window.saveProfile();
      showToast(_calLang === 'en' ? 'Calendar saved' : 'Calendrier sauvegardé');
      setTimeout(function() {
        btnSave.textContent = _calLang === 'en' ? 'Save calendar' : 'Sauvegarder le calendrier';
        btnSave.style.opacity = '1';
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
      style: 'background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);' +
             'border-radius:2px;margin:0 0 16px 0;padding:20px;' +
             'position:relative;box-sizing:border-box;'
    });

    var btnClose = window.h('button', {
      style: 'position:absolute;top:12px;right:12px;background:transparent;' +
             'border:1px solid rgba(250,250,247,0.3);color:var(--ivory,#FAF9F6);' +
             'width:28px;height:28px;border-radius:2px;cursor:pointer;' +
             'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;font-weight:400;' +
             'display:flex;align-items:center;justify-content:center;line-height:1;padding:0;'
    }, '\u00D7');
    btnClose.addEventListener('click', function() {
      var S = window.S;
      if (S) S.smartCalendarDismissed = true;
      if (window.saveProfile) window.saveProfile();
      if (banner.parentElement) banner.parentElement.removeChild(banner);
    });

    var title = window.h('div', {
      style: 'font-family:Georgia,serif;font-size:16px;font-style:italic;font-weight:normal;margin-bottom:6px;' +
             'padding-right:40px;'
    }, _calLang === 'en' ? 'Update — Smart Calendar' : 'Mise à jour — Calendrier Intelligent');

    var subtitle = window.h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:rgba(250,250,247,0.65);' +
             'margin-bottom:16px;line-height:1.6;padding-right:40px;letter-spacing:0.3px;'
    }, _calLang === 'en' ? 'Plan your sports over 7 days and avoid muscle conflicts' : 'Planifiez vos sports sur 7 jours et évitez les conflits musculaires');

    var btnCta = window.h('button', {
      style: 'background:transparent;color:var(--ivory,#FAF9F6);border:1px solid rgba(250,250,247,0.4);' +
             'border-radius:2px;padding:10px 20px;min-height:44px;' +
             'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;font-weight:400;' +
             'letter-spacing:4px;text-transform:uppercase;cursor:pointer;'
    }, _calLang === 'en' ? 'Discover' : 'Découvrir');
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
