'use strict';

// ─── SUPABASE CLIENT ────────────────────────────────────────
(function() {
  var SUPABASE_URL = 'https://uwaoxkgsgbzohakzgyvq.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3YW94a2dzZ2J6b2hha3pneXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODUxMjUsImV4cCI6MjA5MDQ2MTEyNX0.N2ohXmi6ctG322205S0yE2UaE4fS43QCc8xBhO9iVyo';

  // Attendre que le SDK soit chargé
  var _client = null;

  function getClient() {
    if (!_client && window.supabase) {
      try {
        _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('[Supabase] Client created OK');
      } catch (e) {
        console.error('[Supabase] createClient failed:', e);
        _client = null;
      }
    }
    return _client;
  }

  // Force-recreate a fresh client (used when auth state is stuck)
  function resetClient() {
    console.log('[Supabase] Resetting client');
    _client = null;
    // Clear stale auth tokens
    try {
      Object.keys(localStorage).forEach(function(k) {
        if (k.indexOf('sb-') === 0 && k.indexOf('-auth-token') !== -1) {
          localStorage.removeItem(k);
        }
      });
    } catch (e) {}
    return getClient();
  }

  // ─── AUTH MODULE ──────────────────────────────────────────
  var SupaAuth = {
    // Inscription
    signUp: function(email, password, name) {
      var client = getClient();
      if (!client) return Promise.reject('Supabase not loaded');
      return client.auth.signUp({
        email: email,
        password: password,
        options: { data: { name: name } }
      }).then(function(result) {
        if (result.error) throw result.error;
        return result.data;
      });
    },

    // Connexion
    signIn: function(email, password) {
      var client = getClient();
      if (!client) return Promise.reject('Supabase not loaded');
      return client.auth.signInWithPassword({
        email: email,
        password: password
      }).then(function(result) {
        if (result.error) throw result.error;
        return result.data;
      });
    },

    // Déconnexion
    signOut: function() {
      var client = getClient();
      if (!client) return Promise.reject('Supabase not loaded');
      return client.auth.signOut();
    },

    // User actuel (async — returns Promise)
    getUser: function() {
      var client = getClient();
      if (!client) return Promise.resolve(null);
      return client.auth.getSession().then(function(r) {
        var session = r.data && r.data.session;
        return session ? session.user : null;
      }).catch(function() { return null; });
    },

    // Session actuelle (async)
    getSession: function() {
      var client = getClient();
      if (!client) return Promise.reject('Supabase not loaded');
      return client.auth.getSession().then(function(result) {
        return (result && result.data) ? result.data.session : null;
      });
    },

    // Écouter les changements d'auth
    onAuthStateChange: function(callback) {
      var client = getClient();
      if (!client) return;
      client.auth.onAuthStateChange(function(event, session) {
        callback(event, session);
      });
    }
  };

  // ─── SYNC MODULE ──────────────────────────────────────────
  // Stratégie : localStorage = source primaire (rapide, offline)
  //             Supabase = backup cloud (sync en arrière-plan)
  var SupaSync = {
    _syncing: false,
    _lastSync: 0,
    _syncInterval: null,
    _debounceTimer: null,
    _syncPending: false,

    // Sauvegarder le profil complet vers Supabase
    saveProfile: function() {
      var client = getClient();
      if (!client) return;

      return SupaAuth.getSession().then(function(session) {
        if (!session || !session.user) return; // pas connecté

        var userId = session.user.id;
        // Copier S sans les propriétés transitoires
        var data = {};
        var skip = ['authError', 'view', 'sessionCompleting', 'swapPanel', 'nStep', 'sStep'];
        for (var k in window.S) {
          if (window.S.hasOwnProperty(k) && skip.indexOf(k) === -1) {
            data[k] = window.S[k];
          }
        }

        return client
          .from('profiles')
          .upsert({
            id: userId,
            email: session.user.email,
            name: data.name || session.user.user_metadata.name || '',
            birth_date: data.birthDate || null,
            email_optin: (data.emailOptin !== undefined) ? data.emailOptin : true,
            data: data,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' })
          .then(function(result) {
            if (result.error) console.warn('[SupaSync] saveProfile error:', result.error.message);
            else console.log('[SupaSync] Profile saved to cloud');
            return result;
          });
      }).catch(function(e) {
        console.warn('[SupaSync] saveProfile failed:', e);
      });
    },

    // Charger le profil depuis Supabase
    loadProfile: function() {
      var client = getClient();
      if (!client) return Promise.reject('No client');

      return SupaAuth.getSession().then(function(session) {
        if (!session || !session.user) return null;

        return client
          .from('profiles')
          .select('data')
          .eq('id', session.user.id)
          .single()
          .then(function(result) {
            if (result.error || !result.data) return null;
            return result.data.data;
          });
      });
    },

    // Sauvegarder une entrée de poids
    saveWeight: function(date, weight) {
      var client = getClient();
      if (!client) return;

      return SupaAuth.getSession().then(function(session) {
        if (!session || !session.user) return;
        return client
          .from('weight_history')
          .upsert({
            user_id: session.user.id,
            date: date,
            weight: weight
          }, { onConflict: 'user_id,date' });
      }).catch(function(e) { console.warn('[SupaSync] saveWeight failed:', e); });
    },

    // Sauvegarder une séance sport
    saveSession: function(sessionData) {
      var client = getClient();
      if (!client) return;

      return SupaAuth.getSession().then(function(session) {
        if (!session || !session.user) return;
        return client
          .from('sport_sessions')
          .insert({
            user_id: session.user.id,
            date: sessionData.date || new Date().toISOString().slice(0, 10),
            sport_type: window.S.sportType || 'musculation',
            day_index: sessionData.dayIndex,
            duration: sessionData.duration,
            kcal_base: sessionData.kcalBase,
            kcal_epoc: sessionData.kcalEpoc,
            kcal_total: sessionData.kcalTotal,
            rpe: sessionData.rpe,
            heart_rate: sessionData.hr
          });
      }).catch(function(e) { console.warn('[SupaSync] saveSession failed:', e); });
    },

    // Sauvegarder les logs muscu du jour
    saveMuscuLog: function(date, exerciseName, sets) {
      var client = getClient();
      if (!client) return;

      return SupaAuth.getSession().then(function(session) {
        if (!session || !session.user) return;
        return client
          .from('muscu_session_logs')
          .upsert({
            user_id: session.user.id,
            date: date,
            exercise_name: exerciseName,
            sets: sets
          }, { onConflict: 'user_id,date,exercise_name' });
      }).catch(function(e) { console.warn('[SupaSync] saveMuscuLog failed:', e); });
    },

    // Sauvegarder le journal alimentaire
    saveFoodEntry: function(entry) {
      var client = getClient();
      if (!client) return;

      return SupaAuth.getSession().then(function(session) {
        if (!session || !session.user) return;
        return client
          .from('food_journal')
          .insert({
            user_id: session.user.id,
            date: entry.date || new Date().toISOString().slice(0, 10),
            meal: entry.meal,
            name: entry.name,
            kcal: entry.kcal,
            protein: entry.p,
            carbs: entry.g,
            fat: entry.l,
            qty: entry.qty,
            time: entry.time,
            source: entry.source || 'manual'
          });
      }).catch(function(e) { console.warn('[SupaSync] saveFoodEntry failed:', e); });
    },

    // Sauvegarder l'eau
    saveWater: function(date, glasses) {
      var client = getClient();
      if (!client) return;

      return SupaAuth.getSession().then(function(session) {
        if (!session || !session.user) return;
        return client
          .from('water_log')
          .upsert({
            user_id: session.user.id,
            date: date,
            glasses: glasses
          }, { onConflict: 'user_id,date' });
      }).catch(function(e) { console.warn('[SupaSync] saveWater failed:', e); });
    },

    // Sauvegarder un badge
    saveBadge: function(badgeId) {
      var client = getClient();
      if (!client) return;

      return SupaAuth.getSession().then(function(session) {
        if (!session || !session.user) return;
        return client
          .from('badges')
          .upsert({
            user_id: session.user.id,
            badge_id: badgeId
          }, { onConflict: 'user_id,badge_id' });
      }).catch(function(e) { console.warn('[SupaSync] saveBadge failed:', e); });
    },

    // Sauvegarder le streak
    saveStreak: function(streakData) {
      var client = getClient();
      if (!client) return;

      return SupaAuth.getSession().then(function(session) {
        if (!session || !session.user) return;
        return client
          .from('streaks')
          .upsert({
            user_id: session.user.id,
            current_streak: streakData.current,
            best_streak: streakData.best,
            last_date: streakData.lastDate,
            dates: streakData.dates
          }, { onConflict: 'user_id' });
      }).catch(function(e) { console.warn('[SupaSync] saveStreak failed:', e); });
    },

    // Sauvegarder le plan nutrition
    saveMealPlan: function(weekStart, plan) {
      var client = getClient();
      if (!client) return;

      return SupaAuth.getSession().then(function(session) {
        if (!session || !session.user) return;
        return client
          .from('meal_plans')
          .upsert({
            user_id: session.user.id,
            week_start: weekStart,
            plan: plan
          }, { onConflict: 'user_id,week_start' });
      }).catch(function(e) { console.warn('[SupaSync] saveMealPlan failed:', e); });
    },

    // ─── SYNC COMPLET ───────────────────────────────────────
    // Sync le profil toutes les 30 secondes (debounced)
    scheduleSave: function() {
      var self = this;
      // Don't save while initial cloud sync is pending (prevents overwriting cloud data with defaults)
      if (self._syncPending) return;
      if (self._debounceTimer) clearTimeout(self._debounceTimer);
      self._debounceTimer = setTimeout(function() {
        self.saveProfile();
      }, 5000); // 5s debounce
    },

    // Sync initial au login : charger depuis Supabase si localStorage vide
    syncOnLogin: function() {
      var self = this;
      self._syncPending = true;
      return self.loadProfile().then(function(cloudData) {
        self._syncPending = false;
        if (!cloudData) return 'no_cloud_data';

        // Check localStorage directly for this user's actual persisted data
        // (don't rely on window.S which may have stale values from a previous session)
        var hasValidLocalData = false;
        try {
          var user = window.AUTH && window.AUTH.getUser ? window.AUTH.getUser() : null;
          // Fallback: try to get uid from Supabase session directly (avoids async timing issue)
          var uid = (user && user.id) ? user.id : null;
          if (!uid) {
            try {
              var _sbClient = window.getSupabaseClient ? window.getSupabaseClient() : null;
              if (_sbClient) {
                // Synchronous session cache in supabase-js v2
                var _cachedSession = _sbClient.auth.session ? _sbClient.auth.session() : null;
                if (_cachedSession && _cachedSession.user) uid = _cachedSession.user.id;
              }
            } catch(e2) {}
          }
          uid = uid || 'anon';
          var raw = localStorage.getItem('mtd_profile_' + uid);
          if (raw) {
            var localData = null;
            if (window._storageDecode) { localData = window._storageDecode(raw); }
            if (!localData) { try { localData = JSON.parse(raw); } catch(e2) {} }
            // Local data is valid only if the user completed onboarding (goal is set)
            hasValidLocalData = localData && localData.goal != null;
          }
        } catch(e) {}

        if (!hasValidLocalData && cloudData.goal != null) {
          console.log('[SupaSync] Loading profile from cloud (no valid local data for user)');
          for (var k in cloudData) {
            if (cloudData.hasOwnProperty(k)) {
              window.S[k] = cloudData[k];
            }
          }
          // Restore language & units before render so UI shows correct locale
          if (window.I18N && window.S.lang) window.I18N.current = window.S.lang;
          if (window.UNITS) {
            window.UNITS.weight = window.S.weightUnit || 'kg';
            window.UNITS.height = window.S.heightUnit || 'cm';
          }
          if (window.render) window.render();
          return 'loaded_from_cloud';
        }
        return 'local_data_exists';
      }).catch(function(e) {
        self._syncPending = false;
        console.warn('[SupaSync] syncOnLogin failed:', e);
      });
    },

    // Démarrer la sync périodique
    startAutoSync: function() {
      var self = this;
      if (self._syncInterval) return;
      // Sync toutes les 2 minutes
      self._syncInterval = setInterval(function() {
        self.saveProfile();
      }, 120000);
      console.log('[SupaSync] Auto-sync started (every 2 min)');
    },

    // Arrêter la sync
    stopAutoSync: function() {
      if (this._syncInterval) {
        clearInterval(this._syncInterval);
        this._syncInterval = null;
      }
    }
  };

  // ─── EXPORTS ──────────────────────────────────────────────
  window.SupaAuth = SupaAuth;
  window.SupaSync = SupaSync;
  window.getSupabaseClient = getClient;
  window.resetSupabaseClient = resetClient;
})();
