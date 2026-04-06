(function() {
  'use strict';

  var PUSH_KEY = 'mtd_push_prefs'; // Préférences stockées en localStorage

  window.PushManager = {
    // Demande la permission et configure les notifications locales
    init: function() {
      if (!('Notification' in window)) return;
      var prefs = this.getPrefs();
      if (prefs.asked) return; // Ne demander qu'une fois
      // Délai de 30 secondes après le premier chargement pour ne pas spammer
      setTimeout(function() {
        window.PushManager.askPermission();
      }, 30000);
    },

    askPermission: function() {
      if (Notification.permission === 'granted') {
        window.PushManager.scheduleLocalNotifs();
        return;
      }
      if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(function(perm) {
          var prefs = window.PushManager.getPrefs();
          prefs.asked = true;
          prefs.granted = perm === 'granted';
          window.PushManager.savePrefs(prefs);
          if (perm === 'granted') window.PushManager.scheduleLocalNotifs();
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
            window.PushManager.showLocal('SmartFitCoach', 'Bonjour ! Comment vous sentez-vous aujourd\'hui ? Faites votre bilan en 30 secondes.', 'checkin');
          }, delay);
        }
      }

      // Rappel du soir pour clôturer le journal alimentaire (20h)
      var eveningTime = new Date();
      eveningTime.setHours(20, 0, 0, 0);
      if (new Date() < eveningTime) {
        var eveningDelay = eveningTime - new Date();
        setTimeout(function() {
          window.PushManager.showLocal('SmartFitCoach', 'N\'oubliez pas de clôturer votre journal alimentaire pour aujourd\'hui.', 'journal');
        }, eveningDelay);
      }
    },

    showLocal: function(title, body, tag) {
      if (Notification.permission !== 'granted') return;
      try {
        new Notification(title, {
          body: body,
          icon: '/icons/icon-192.png',
          tag: tag || 'sfc-local',
          requireInteraction: false
        });
      } catch(e) {
        console.warn('[PushManager] Notification error:', e);
      }
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
    document.addEventListener('DOMContentLoaded', function() { window.PushManager.init(); });
  } else {
    window.PushManager.init();
  }
})();
