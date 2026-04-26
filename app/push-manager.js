/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
(function() {
  'use strict';

  var PUSH_KEY = 'mtd_push_prefs'; // Préférences stockées en localStorage

  // VAPID public key — fill in after running: npx web-push generate-vapid-keys
  // Leave empty to skip server-side push subscription (graceful degradation).
  var VAPID_PUBLIC_KEY = '';

  // Convert a URL-safe base64 string to Uint8Array (required by pushManager.subscribe)
  function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    var rawData = atob(base64);
    var outputArray = new Uint8Array(rawData.length);
    for (var i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  // NOTE: window.PushManager is reserved by the Web Push API (browsers expose it natively).
  // We use window.SFCPushManager to avoid clobbering the native interface.
  window.SFCPushManager = {
    // FIX POLISH 2026-04 : respect de l'opt-out explicite user (S.pushNotifsEnabled).
    // Si user a désactivé via profil → pas de demande ni de scheduling.
    _userOptedOut: function() {
      try {
        var S = window.S;
        if (S && typeof S.pushNotifsEnabled === 'boolean' && S.pushNotifsEnabled === false) {
          return true;
        }
      } catch(e) {}
      return false;
    },

    // Demande la permission et configure les notifications locales
    init: function() {
      if (!('Notification' in window)) return;
      if (this._userOptedOut()) return; // user a désactivé → rien
      var prefs = this.getPrefs();
      // FIX 2026-04-16 — Avant : if (prefs.asked) return → notifications JAMAIS reschedulées
      // après la première visite. L'user ne recevait rien après la session initiale.
      // Maintenant : si permission déjà accordée, on reschedule à chaque session.
      if (prefs.asked && Notification.permission === 'granted') {
        this.scheduleLocalNotifs();
        return;
      }
      if (prefs.asked) return; // Permission refusée ou dismissed → ne pas re-demander
      // Délai de 30 secondes après le premier chargement pour ne pas spammer
      setTimeout(function() {
        if (window.SFCPushManager._userOptedOut()) return; // revérifier au tick
        window.SFCPushManager.askPermission();
      }, 30000);
    },

    askPermission: function() {
      if (!('Notification' in window)) return;
      if (this._userOptedOut()) return;
      if (Notification.permission === 'granted') {
        window.SFCPushManager.scheduleLocalNotifs();
        return;
      }
      if (Notification.permission !== 'denied') {
        return Notification.requestPermission().then(function(perm) {
          var prefs = window.SFCPushManager.getPrefs();
          prefs.asked = true;
          prefs.granted = perm === 'granted';
          window.SFCPushManager.savePrefs(prefs);
          if (perm === 'granted') window.SFCPushManager.scheduleLocalNotifs();
          return perm;
        });
      }
    },

    // FIX POLISH 2026-04 : API pour désactiver/réactiver proprement les notifs
    // côté user (via toggle profil). Clear setTimeouts scheduled + flag.
    disable: function() {
      try {
        var prefs = this.getPrefs();
        prefs.granted = false;
        this.savePrefs(prefs);
        // Annuler les setTimeouts scheduled s'ils existent (keyed par tag dans _SFCTimers)
        if (window._SFCTimers && typeof window._SFCTimers === 'object') {
          Object.keys(window._SFCTimers).forEach(function(tag) {
            try { clearTimeout(window._SFCTimers[tag]); } catch(e) {}
          });
          window._SFCTimers = {};
        }
      } catch(e) {}
    },

    enable: function() {
      // Re-demande permission + scheduling si user réactive
      var self = this;
      var result = this.askPermission();
      // If askPermission returned a Promise (permission dialog was shown), chain subscribe
      if (result && typeof result.then === 'function') {
        result.then(function(perm) {
          if (perm === 'granted') self.subscribe();
        });
      } else if (Notification.permission === 'granted') {
        // Permission was already granted — subscribe now
        this.subscribe();
      }
    },

    // Register this browser with the push server so server-side notifications work.
    // Silently skips when VAPID_PUBLIC_KEY is empty or SW is unavailable.
    subscribe: function() {
      try {
        if (!VAPID_PUBLIC_KEY) return; // No VAPID key configured — skip silently
        if (!('serviceWorker' in navigator)) return;
        navigator.serviceWorker.ready.then(function(registration) {
          if (!registration.pushManager) return;
          registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          }).then(function(subscription) {
            // Get auth token for the request
            var token = '';
            try {
              if (window.AUTH && typeof window.AUTH.getSession === 'function') {
                var session = window.AUTH.getSession();
                if (session && session.access_token) token = session.access_token;
              }
            } catch(e) {}

            var payload = JSON.stringify({
              action: 'subscribe',
              subscription: {
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: subscription.toJSON().keys.p256dh,
                  auth: subscription.toJSON().keys.auth
                }
              }
            });

            var fetchOpts = {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: payload
            };
            if (token) fetchOpts.headers['Authorization'] = 'Bearer ' + token;

            fetch('/.netlify/functions/push-subscribe', fetchOpts).catch(function(err) {
              console.warn('[SFCPushManager] subscribe fetch error:', err && err.message);
            });
          }).catch(function(err) {
            console.warn('[SFCPushManager] pushManager.subscribe error:', err && err.message);
          });
        }).catch(function(err) {
          console.warn('[SFCPushManager] serviceWorker.ready error:', err && err.message);
        });
      } catch(e) {
        console.warn('[SFCPushManager] subscribe exception:', e && e.message);
      }
    },

    // Notifications locales planifiées (pas de serveur requis)
    scheduleLocalNotifs: function() {
      var prefs = this.getPrefs();
      if (!prefs.granted) return;

      // ─── Motivation quotidienne ─── (Lun-Ven 8h30, Sam-Dim 10h)
      this.scheduleDailyMotivation();

      // Rappels repas basés sur S.mealTimes
      this.scheduleMealReminders();

      // Rappel comeback si inactif 3+ jours
      this.scheduleInactivityCheck();

      // "Rien loggé aujourd'hui" à 20h si journal vide
      this.scheduleNotLoggedToday();

      // Résumé hebdomadaire dimanche 19h
      this.scheduleWeeklySummary();
    },

    // ── Motivation quotidienne — Lun-Ven 8h30 / Sam-Dim 10h ─────────────────
    // Utilise MOTIVATION_LIBRARY (si disponible) pour une phrase personnalisée.
    // Fallback élégant si la biblio n'est pas chargée.
    scheduleDailyMotivation: function() {
      var prefs = this.getPrefs();
      if (!prefs.granted) return;
      if (!window.MOTIVATION_LIBRARY || typeof window.MOTIVATION_LIBRARY.getNextMotivationTime !== 'function') {
        return; // biblio pas chargée — on skip proprement
      }
      var nextTime = window.MOTIVATION_LIBRARY.getNextMotivationTime();
      if (!nextTime) return;
      // Construire le profil pour personnaliser la phrase
      var profile = this._buildMotivationProfile(nextTime);
      var msg = window.MOTIVATION_LIBRARY.getDailyMotivation(profile);
      if (!msg || !msg.body) return;
      this.scheduleAndPersist('daily-motivation', msg.title, msg.body, nextTime.getTime());
    },

    // Construit le profil transmis à MOTIVATION_LIBRARY pour personnalisation
    _buildMotivationProfile: function(targetDate) {
      var S = window.S || {};
      // Streak (depuis localStorage dédié)
      var streak = 0;
      try {
        var user = window.AUTH ? window.AUTH.getUser() : null;
        if (user) {
          var sd = JSON.parse(localStorage.getItem('mtd_streak_' + user.id) || '{}');
          streak = (typeof sd.current === 'number') ? sd.current : 0;
        }
      } catch(e) {}
      // Jour d'entraînement ?
      var isTrainingDay = null;
      try {
        if (window.getDayType) {
          var dayIdx = ((targetDate || new Date()).getDay() + 6) % 7; // 0=Lun
          var info = window.getDayType(dayIdx);
          if (info && typeof info.isTraining === 'boolean') isTrainingDay = info.isTraining;
        }
      } catch(e) {}
      // Nom de l'objectif (optionnel)
      var goalName = '';
      try {
        if (window.GOALS && S.goal != null && window.GOALS[S.goal]) goalName = window.GOALS[S.goal].name || '';
      } catch(e) {}
      return {
        prenom: (window.getDisplayFirstName ? window.getDisplayFirstName() : (S.prenom || '')),
        streak: streak,
        isTrainingDay: isTrainingDay,
        goalName: goalName,
        date: targetDate || new Date()
      };
    },

    showLocal: function(title, body, tag) {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      try {
        new Notification(title, {
          body: body,
          icon: './icon-192.png',
          tag: tag || 'sfc-local',
          requireInteraction: false
        });
      } catch(e) {
        console.warn('[SFCPushManager] Notification error:', e);
      }
    },

    scheduleMealReminders: function() {
      var prefs = this.getPrefs();
      if (!prefs.granted) return;
      var now = new Date();
      var mt = (window.S && window.S.mealTimes && typeof window.S.mealTimes === 'object') ? window.S.mealTimes : {};

      // Utilise S.mealTimes (format "HH:MM") si disponible, fallback sur 12h00 / 19h00
      var lunchTime = this._parseHHMM(mt.lunch) || { h: 12, m: 0 };
      var dinnerTime = this._parseHHMM(mt.dinner) || { h: 19, m: 0 };

      var lunch = new Date(now);
      lunch.setHours(lunchTime.h, lunchTime.m, 0, 0);
      if (now < lunch) {
        this.scheduleAndPersist('meal-lunch', 'SmartFitCoach', 'L\'heure du d\u00e9jeuner approche. Consultez votre plan repas.', lunch.getTime());
      }

      var dinner = new Date(now);
      dinner.setHours(dinnerTime.h, dinnerTime.m, 0, 0);
      if (now < dinner) {
        this.scheduleAndPersist('meal-dinner', 'SmartFitCoach', 'Pr\u00e9parez votre d\u00eener. Votre recette vous attend.', dinner.getTime());
      }
    },

    _parseHHMM: function(str) {
      if (!str || typeof str !== 'string') return null;
      var m = str.match(/^(\d{1,2}):(\d{2})$/);
      if (!m) return null;
      var h = parseInt(m[1], 10), min = parseInt(m[2], 10);
      if (isNaN(h) || isNaN(min) || h < 0 || h > 23 || min < 0 || min > 59) return null;
      return { h: h, m: min };
    },

    scheduleWorkoutReminder: function(hour, minute) {
      var prefs = this.getPrefs();
      if (!prefs.granted) return;
      hour = hour !== undefined ? hour : 17;
      minute = minute !== undefined ? minute : 30;
      var now = new Date();
      var target = new Date(now);
      target.setHours(hour, minute, 0, 0);
      if (now >= target) return; // Passé pour aujourd'hui
      this.scheduleAndPersist('workout-reminder', 'SmartFitCoach', 'C\'est l\'heure de ta s\u00e9ance\u00a0! Pr\u00eat \u00e0 te d\u00e9passer\u00a0?', target.getTime());
    },

    notifyRestOver: function(exerciseName, setNum) {
      this.showLocal('Repos terminé !', (exerciseName ? exerciseName + ' — ' : '') + 'c\'est parti pour la série ' + (setNum || '') + ' !', 'rest-timer');
    },

    // Rappel comeback : si le streak a été mis à jour il y a 3+ jours, envoie une notification d'encouragement
    scheduleInactivityCheck: function() {
      var prefs = this.getPrefs();
      if (!prefs.granted) return;
      try {
        var user = window.AUTH ? window.AUTH.getUser() : null;
        if (!user) return;
        var streakData = {};
        try { streakData = JSON.parse(localStorage.getItem('mtd_streak_' + user.id) || '{}'); } catch(e) {}
        var lastDate = streakData.lastDate;
        if (!lastDate) return;
        var _d1 = new Date();
        var today = _d1.getFullYear() + '-' + String(_d1.getMonth() + 1).padStart(2, '0') + '-' + String(_d1.getDate()).padStart(2, '0');
        var last = new Date(lastDate);
        var diff = Math.floor((new Date(today) - last) / 86400000);
        if (diff >= 2) {
          // Inactif depuis 2+ jours — relance douce dès J+2 (pas J+3 comme avant)
          var now = new Date();
          var notifTime = new Date(now);
          notifTime.setHours(11, 0, 0, 0);
          var streak = streakData.current || 0;
          var msg = diff === 2
            ? (streak > 0
                ? ((window.isEnglish && window.isEnglish()) ? ('Your ' + streak + '-' + window.locPlural(streak, {fr:{one:'jour',other:'jours'},en:{one:'day',other:'days'}}) + ' streak is waiting. Today still counts.') : ('Votre séquence de ' + streak + ' ' + window.locPlural(streak, {fr:{one:'jour',other:'jours'},en:{one:'day',other:'days'}}) + ' vous attend. C\'est encore aujourd\'hui.'))
                : 'Hier, vous n\'avez pas loggé. Aujourd\'hui, c\'est possible.')
            : (streak > 0
                ? ((window.isEnglish && window.isEnglish()) ? ('Your ' + streak + '-' + window.locPlural(streak, {fr:{one:'jour',other:'jours'},en:{one:'day',other:'days'}}) + ' streak is waiting — don\'t let it slip!') : ('Ton streak de ' + streak + ' ' + window.locPlural(streak, {fr:{one:'jour',other:'jours'},en:{one:'day',other:'days'}}) + ' t\'attend — ne le laisse pas tomber !'))
                : 'Ça fait ' + diff + ' jours qu\'on ne t\'a pas vu. Reprends là où tu t\'es arrêté(e) — chaque action compte !');
          if (now < notifTime) {
            this.scheduleAndPersist('comeback', 'SmartFitCoach', msg, notifTime.getTime());
          } else {
            window.SFCPushManager.showLocal('SmartFitCoach', msg, 'comeback');
          }
        }
      } catch(e) {}
    },

    // ── "Rien loggé aujourd'hui" — à 20h si journal vide ──────────────────────
    // Loss aversion : l'utilisateur ne veut pas perdre sa journée de suivi.
    scheduleNotLoggedToday: function() {
      var prefs = this.getPrefs();
      if (!prefs.granted) return;
      try {
        var now = new Date();
        var notifTime = new Date(now);
        notifTime.setHours(20, 0, 0, 0);
        if (notifTime <= now) return; // déjà passé aujourd'hui

        // Vérifier si le journal est vide aujourd'hui
        var user = window.AUTH ? window.AUTH.getUser() : null;
        var today = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
        var journalKey = 'mtd_food_journal_' + (user ? user.id : 'anon');
        var journal = {}; try { journal = JSON.parse(localStorage.getItem(journalKey) || '{}'); } catch(e2) {}
        var todayEntries = journal[today] || [];
        if (todayEntries.length > 0) return; // déjà loggé — pas de rappel

        var prenom = (window.S && window.S.prenom) ? window.S.prenom : '';
        var msg = prenom
          ? prenom + ', vous n\'avez rien enregistré aujourd\'hui. Prenez 30 secondes pour compléter votre journal !'
          : 'Vous n\'avez rien enregistré aujourd\'hui. Prenez 30 secondes pour compléter votre journal !';
        this.scheduleAndPersist('not-logged-today', 'SmartFitCoach', msg, notifTime.getTime());
      } catch(e) {}
    },

    // ── Résumé hebdomadaire — dimanche à 19h ──────────────────────────────────
    // Bilan positif de la semaine : workouts, repas loggés, évolution poids.
    scheduleWeeklySummary: function() {
      var prefs = this.getPrefs();
      if (!prefs.granted) return;
      try {
        var now = new Date();
        var dayOfWeek = now.getDay(); // 0 = dimanche
        if (dayOfWeek !== 0) return; // uniquement le dimanche
        var notifTime = new Date(now);
        notifTime.setHours(19, 0, 0, 0);
        if (notifTime <= now) return; // déjà passé aujourd'hui

        // Compiler le bilan semaine depuis le journal
        var user = window.AUTH ? window.AUTH.getUser() : null;
        var journalKey = 'mtd_food_journal_' + (user ? user.id : 'anon');
        var journal = {}; try { journal = JSON.parse(localStorage.getItem(journalKey) || '{}'); } catch(e2) {}
        var daysLogged = 0;
        for (var i = 0; i < 7; i++) {
          var d = new Date(now); d.setDate(d.getDate() - i);
          var dk = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
          if (journal[dk] && journal[dk].length > 0) daysLogged++;
        }

        // Bilan poids
        var weightMsg = '';
        try {
          var wh = JSON.parse(localStorage.getItem('mtd_weight_history_' + (user ? user.id : 'anon')) || '[]');
          if (wh.length >= 2) {
            var lastW = wh[wh.length - 1].weight;
            var prevW = wh[Math.max(0, wh.length - 8)].weight;
            var diff = Math.round((lastW - prevW) * 10) / 10;
            if (Math.abs(diff) > 0) weightMsg = ' Poids : ' + (diff > 0 ? '+' : '') + diff + ' kg cette semaine.';
          }
        } catch(e3) {}

        var msg = 'Bilan semaine : ' + daysLogged + '/7 jours de suivi nutritionnel.' + weightMsg + ' Continuez sur cette lancée !';
        this.scheduleAndPersist('weekly-summary', 'SmartFitCoach — Bilan Semaine', msg, notifTime.getTime());
      } catch(e) {}
    },

    // Notifications opt-in (configurables par l'utilisateur)
    getPrefs: function() {
      try { return JSON.parse(localStorage.getItem(PUSH_KEY) || '{}'); } catch(e) { return {}; }
    },

    savePrefs: function(prefs) {
      try { localStorage.setItem(PUSH_KEY, JSON.stringify(prefs)); } catch(e) {}
    },

    // Planifie un rappel ET le persiste en localStorage pour survie entre sessions
    scheduleAndPersist: function(tag, title, body, targetTime) {
      var self = this;
      var prefs = self.getPrefs();
      // Garantir que scheduledNotifs est un Array (localStorage potentiellement corrompu)
      if (!Array.isArray(prefs.scheduledNotifs)) prefs.scheduledNotifs = [];
      // Dédupliquer par tag — on ne garde que le plus récent pour chaque tag
      prefs.scheduledNotifs = prefs.scheduledNotifs.filter(function(n) { return n && n.tag !== tag; });
      prefs.scheduledNotifs.push({ tag: tag, title: title, body: body, targetTime: targetTime });
      self.savePrefs(prefs);
      // Annuler le timer précédent pour ce tag (évite les double-notifications)
      if (!window._SFCTimers) window._SFCTimers = {};
      if (window._SFCTimers[tag]) clearTimeout(window._SFCTimers[tag]);
      var delay = Math.max(0, targetTime - Date.now());
      if (delay < 2147483647) {
        window._SFCTimers[tag] = setTimeout(function() {
          self.showLocal(title, body, tag);
          if (window._SFCTimers) delete window._SFCTimers[tag];
        }, delay);
      }
    },

    // Vérifie au démarrage les rappels persistés et les déclenche/reprogramme
    // FIX PWA #2 2026-04 : anti-spam après absence prolongée.
    //   Avant : si user fermait l'app 3 jours, ALL les notifs en retard se déclenchaient
    //           d'un coup au retour (4-5 notifs en 50ms) → spam → désinstall.
    //   Maintenant :
    //     - On DROP les notifs en retard de plus de 6 heures (trop vieilles, hors contexte)
    //     - On CAP à 2 notifs déclenchées immédiatement maximum (les plus récentes)
    //     - On dédup par tag (1 seule notif par catégorie)
    checkPersistentReminders: function() {
      var self = this;
      var prefs = self.getPrefs();
      if (!prefs.granted || !Array.isArray(prefs.scheduledNotifs)) return;
      var now = Date.now();
      var MAX_LATE_MS = 6 * 60 * 60 * 1000;     // 6h : au-delà, on drop (hors contexte)
      var MAX_IMMEDIATE_FIRES = 2;              // pas plus de 2 notifs en rafale
      var remaining = [];
      var late = [];                            // candidates à déclencher immédiatement
      prefs.scheduledNotifs.forEach(function(notif) {
        if (!notif || !notif.targetTime) return; // ignorer les entrées corrompues
        if (notif.targetTime <= now) {
          var lateBy = now - notif.targetTime;
          if (lateBy <= MAX_LATE_MS) {
            // Rappel récent (< 6h) → candidat à déclencher
            late.push(notif);
          }
          // Sinon (> 6h) : drop silencieux, hors contexte
        } else {
          // Futur — reprogrammer
          var delay = notif.targetTime - now;
          if (delay < 2147483647) {
            setTimeout(function() { self.showLocal(notif.title, notif.body, notif.tag); }, delay);
          }
          remaining.push(notif);
        }
      });
      // Dédupliquer les notifs en retard par tag (garder la plus récente targetTime par tag)
      var byTag = {};
      late.forEach(function(n) {
        if (!byTag[n.tag] || n.targetTime > byTag[n.tag].targetTime) byTag[n.tag] = n;
      });
      // Trier les notifs par targetTime DÉCROISSANT (plus récent d'abord) et cap à 2
      var dedupedLate = Object.keys(byTag).map(function(t) { return byTag[t]; });
      dedupedLate.sort(function(a, b) { return b.targetTime - a.targetTime; });
      var firedCount = 0;
      dedupedLate.forEach(function(n) {
        if (firedCount >= MAX_IMMEDIATE_FIRES) return;
        self.showLocal(n.title, n.body, n.tag);
        firedCount++;
      });
      prefs.scheduledNotifs = remaining;
      self.savePrefs(prefs);
    }
  };

  // Init automatique au chargement
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.SFCPushManager.init();
      window.SFCPushManager.checkPersistentReminders();
    });
  } else {
    window.SFCPushManager.init();
    window.SFCPushManager.checkPersistentReminders();
  }
})();
