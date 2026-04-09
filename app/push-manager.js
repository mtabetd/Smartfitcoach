(function() {
  'use strict';

  var PUSH_KEY = 'mtd_push_prefs'; // Préférences stockées en localStorage

  // NOTE: window.PushManager is reserved by the Web Push API (browsers expose it natively).
  // We use window.SFCPushManager to avoid clobbering the native interface.
  window.SFCPushManager = {
    // Demande la permission et configure les notifications locales
    init: function() {
      if (!('Notification' in window)) return;
      var prefs = this.getPrefs();
      if (prefs.asked) return; // Ne demander qu'une fois
      // Délai de 30 secondes après le premier chargement pour ne pas spammer
      setTimeout(function() {
        window.SFCPushManager.askPermission();
      }, 30000);
    },

    askPermission: function() {
      if (!('Notification' in window)) return;
      if (Notification.permission === 'granted') {
        window.SFCPushManager.scheduleLocalNotifs();
        return;
      }
      if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(function(perm) {
          var prefs = window.SFCPushManager.getPrefs();
          prefs.asked = true;
          prefs.granted = perm === 'granted';
          window.SFCPushManager.savePrefs(prefs);
          if (perm === 'granted') window.SFCPushManager.scheduleLocalNotifs();
        });
      }
    },

    // Notifications locales planifiées (pas de serveur requis)
    scheduleLocalNotifs: function() {
      var prefs = this.getPrefs();
      if (!prefs.granted) return;

      // Vérifier si le checkin du jour a été fait
      // wellness.date est stocké en UTC (cohérent avec app-sport.js) → utiliser UTC ici aussi
      var today = new Date().toISOString().slice(0, 10);
      var wellness = null;
      try { wellness = JSON.parse(localStorage.getItem('S') || '{}').todayWellness; } catch(e) {}
      if (!wellness || wellness.date !== today) {
        // Rappel checkin si pas fait avant 10h
        var now = new Date();
        var reminderTime = new Date(now);
        reminderTime.setHours(10, 0, 0, 0);
        if (now < reminderTime) {
          this.scheduleAndPersist('checkin', 'SmartFitCoach', 'Bonjour\u00a0! Comment tu te sens aujourd\'hui\u00a0? Fais ton bilan en 30 secondes.', reminderTime.getTime());
        }
      }

      // Rappel du soir pour clôturer le journal alimentaire (20h)
      var eveningTime = new Date();
      eveningTime.setHours(20, 0, 0, 0);
      if (new Date() < eveningTime) {
        this.scheduleAndPersist('journal', 'SmartFitCoach', 'N\'oublie pas de cl\u00f4turer ton journal alimentaire pour aujourd\'hui.', eveningTime.getTime());
      }

      // Rappels repas
      this.scheduleMealReminders();

      // Rappel comeback si inactif 3+ jours
      this.scheduleInactivityCheck();
    },

    showLocal: function(title, body, tag) {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      try {
        new Notification(title, {
          body: body,
          icon: '/icons/icon-192.png',
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

      // Déjeuner 12h00
      var lunch = new Date(now);
      lunch.setHours(12, 0, 0, 0);
      if (now < lunch) {
        this.scheduleAndPersist('meal-lunch', 'SmartFitCoach', 'C\'est l\'heure du d\u00e9jeuner \u2014 consulte ton plan repas.', lunch.getTime());
      }

      // Dîner 19h00
      var dinner = new Date(now);
      dinner.setHours(19, 0, 0, 0);
      if (now < dinner) {
        this.scheduleAndPersist('meal-dinner', 'SmartFitCoach', 'Pr\u00e9pare ton d\u00eener \u2014 ta recette t\'attend.', dinner.getTime());
      }
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
        if (diff >= 3) {
          // Inactif depuis 3+ jours — envoyer la notification maintenant (ou à 11h si avant 11h)
          var now = new Date();
          var notifTime = new Date(now);
          notifTime.setHours(11, 0, 0, 0);
          var streak = streakData.current || 0;
          var msg = streak > 0
            ? 'Tu n\'as pas encore agi aujourd\'hui. Ton streak de ' + streak + ' jour' + (streak > 1 ? 's' : '') + ' t\'attend — ne le laisse pas tomber !'
            : 'Ça fait ' + diff + ' jours qu\'on ne t\'a pas vu. Reprends là où tu t\'es arrêté(e) — chaque action compte !';
          if (now < notifTime) {
            this.scheduleAndPersist('comeback', 'SmartFitCoach', msg, notifTime.getTime());
          } else {
            window.SFCPushManager.showLocal('SmartFitCoach', msg, 'comeback');
          }
        }
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
    checkPersistentReminders: function() {
      var self = this;
      var prefs = self.getPrefs();
      if (!prefs.granted || !Array.isArray(prefs.scheduledNotifs)) return;
      var now = Date.now();
      var remaining = [];
      prefs.scheduledNotifs.forEach(function(notif) {
        if (!notif || !notif.targetTime) return; // ignorer les entrées corrompues
        if (notif.targetTime <= now) {
          // Rappel manqué — le déclencher immédiatement
          self.showLocal(notif.title, notif.body, notif.tag);
        } else {
          // Futur — reprogrammer
          var delay = notif.targetTime - now;
          if (delay < 2147483647) {
            setTimeout(function() { self.showLocal(notif.title, notif.body, notif.tag); }, delay);
          }
          remaining.push(notif);
        }
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
