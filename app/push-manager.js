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
      var today = new Date().toISOString().slice(0, 10);
      var wellness = null;
      try { wellness = JSON.parse(localStorage.getItem('S') || '{}').todayWellness; } catch(e) {}
      if (!wellness || wellness.date !== today) {
        // Rappel checkin si pas fait avant 10h
        var now = new Date();
        var reminderTime = new Date(now);
        reminderTime.setHours(10, 0, 0, 0);
        if (now < reminderTime) {
          var delay = reminderTime - now;
          setTimeout(function() {
            window.SFCPushManager.showLocal('SmartFitCoach', 'Bonjour ! Comment tu te sens aujourd\'hui ? Fais ton bilan en 30 secondes.', 'checkin');
          }, delay);
        }
      }

      // Rappel du soir pour clôturer le journal alimentaire (20h)
      var eveningTime = new Date();
      eveningTime.setHours(20, 0, 0, 0);
      if (new Date() < eveningTime) {
        var eveningDelay = eveningTime - new Date();
        setTimeout(function() {
          window.SFCPushManager.showLocal('SmartFitCoach', 'N\'oublie pas de clôturer ton journal alimentaire pour aujourd\'hui.', 'journal');
        }, eveningDelay);
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
        var lunchDelay = lunch - now;
        setTimeout(function() {
          window.SFCPushManager.showLocal('SmartFitCoach', 'C\'est l\'heure du déjeuner — consulte ton plan repas.', 'meal-lunch');
        }, lunchDelay);
      }

      // Dîner 19h00
      var dinner = new Date(now);
      dinner.setHours(19, 0, 0, 0);
      if (now < dinner) {
        var dinnerDelay = dinner - now;
        setTimeout(function() {
          window.SFCPushManager.showLocal('SmartFitCoach', 'Prépare ton dîner — ta recette t\'attend.', 'meal-dinner');
        }, dinnerDelay);
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
      var delay = target - now;
      setTimeout(function() {
        window.SFCPushManager.showLocal('SmartFitCoach', 'C\'est l\'heure de ta séance ! Prêt à te dépasser ?', 'workout-reminder');
      }, delay);
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
        var today = new Date().toISOString().slice(0, 10);
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
            var notifDelay = notifTime - now;
            setTimeout(function() {
              window.SFCPushManager.showLocal('SmartFitCoach', msg, 'comeback');
            }, notifDelay);
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
    }
  };

  // Init automatique au chargement
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { window.SFCPushManager.init(); });
  } else {
    window.SFCPushManager.init();
  }
})();
