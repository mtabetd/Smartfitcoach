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
      if (!client) return Promise.resolve();
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
      if (!client) return Promise.resolve();

      return SupaAuth.getSession().then(function(session) {
        if (!session || !session.user) return; // pas connecté

        var userId = session.user.id;
        // Copier S sans les propriétés transitoires ni les clés dangereuses
        var data = {};
        // Note: nStep and sStep are intentionally included so cloud backup tracks
        // the user's onboarding progress and program step.
        var skip = ['authError', 'view', 'sessionCompleting', 'swapPanel', '__proto__', 'constructor', 'prototype'];
        for (var k in window.S) {
          if (window.S.hasOwnProperty(k) && skip.indexOf(k) === -1) {
            data[k] = window.S[k];
          }
        }

        // ── Sync ALL localStorage history keys for this user ──
        // perf-history, badges, streaks, food journal, CF 1RM are stored in
        // dedicated localStorage keys (NOT in window.S) → must be backed up
        // separately to avoid losing user history on a new device.
        try {
          var legacy = {};
          var uidSuffix = '_' + userId;
          var SYNC_PREFIXES = ['mtd_perf_hist_', 'mtd_badges_', 'mtd_streak_', 'mtd_food_journal_', 'mtd_cf_1rm_', 'mtd_water_', 'mtd_muscu_session_', 'mtd_weight_history_'];
          // Clés namespaced par UID (programme IA, progression, générations) — préfixe seulement
          var SYNC_EXACT = [];
          var SYNC_IA_PREFIXES = ['mtd_muscu_program_', 'mtd_muscu_ia_progress_', 'mtd_muscu_generations_'];
          for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (!key) continue;
            var matches = false;
            for (var p = 0; p < SYNC_PREFIXES.length; p++) {
              if (key.indexOf(SYNC_PREFIXES[p]) === 0 && key.indexOf(uidSuffix) !== -1) {
                matches = true;
                break;
              }
            }
            if (!matches && SYNC_EXACT.indexOf(key) !== -1) matches = true;
            if (!matches) {
              for (var ia = 0; ia < SYNC_IA_PREFIXES.length; ia++) {
                if (key.indexOf(SYNC_IA_PREFIXES[ia]) === 0) { matches = true; break; }
              }
            }
            if (matches) {
              try { legacy[key] = localStorage.getItem(key); } catch(e) {}
            }
          }
          if (Object.keys(legacy).length > 0) data._legacy_storage = legacy;
        } catch(e) { console.warn('[SupaSync] legacy storage scan failed:', e); }

        // Note: birth_date and email_optin removed from dedicated columns
        // (not in schema) — already preserved inside the `data` JSONB field below.
        return client
          .from('profiles')
          .upsert({
            id: userId,
            email: session.user.email,
            name: data.name || session.user.user_metadata.name || '',
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
          .select('data, updated_at')
          .eq('id', session.user.id)
          .single()
          .then(function(result) {
            if (result.error || !result.data) return null;
            var payload = result.data.data || {};
            // Attacher le timestamp cloud pour comparaison multidevice dans syncOnLogin
            if (result.data.updated_at) payload._cloudUpdatedAt = result.data.updated_at;
            return payload;
          });
      });
    },

    // Sauvegarder une entrée de poids
    saveWeight: function(date, weight) {
      var client = getClient();
      if (!client) return Promise.resolve();

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
      if (!client) return Promise.resolve();

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
      if (!client) return Promise.resolve();

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
      if (!client) return Promise.resolve();

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
      if (!client) return Promise.resolve();

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
      if (!client) return Promise.resolve();

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
      if (!client) return Promise.resolve();

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
      if (!client) return Promise.resolve();

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

    // Sync initial au login : charger depuis Supabase si localStorage vide ou moins avancé
    syncOnLogin: function() {
      if (!getClient()) return Promise.resolve('no_client');
      if (this._syncLoginInProgress) return Promise.resolve('already_syncing');
      var self = this;
      self._syncLoginInProgress = true;
      self._syncPending = true;
      return self.loadProfile().then(function(cloudData) {
        self._syncPending = false;
        self._syncLoginInProgress = false;
        if (!cloudData) return 'no_cloud_data';

        // Check localStorage directly for this user's actual persisted data
        // (don't rely on window.S which may have stale values from a previous session)
        var hasValidLocalData = false;
        var localData = null;
        try {
          var user = window.AUTH && window.AUTH.getUser ? window.AUTH.getUser() : null;
          // Fallback: try to get uid from Supabase session directly (avoids async timing issue)
          var uid = (user && user.id) ? user.id : null;
          // Note: auth.session() est API v1 Supabase — non disponible en v2
          // uid reste null si AUTH n'est pas encore initialisé, on utilise 'anon'
          uid = uid || 'anon';
          var raw = localStorage.getItem('mtd_profile_' + uid);
          if (raw) {
            if (window._storageDecode) { localData = window._storageDecode(raw); }
            if (!localData) { try { localData = JSON.parse(raw); } catch(e2) {} }
            // Local data is valid only if the user completed onboarding (goal is set)
            hasValidLocalData = localData && localData.goal != null;
          }
        } catch(e) {}

        // Helper to apply cloud data to S and save locally
        function _applyCloudData() {
          var _PROTO_BLOCKED = ['__proto__', 'constructor', 'prototype', '_legacy_storage'];
          for (var k in cloudData) {
            if (cloudData.hasOwnProperty(k) && _PROTO_BLOCKED.indexOf(k) === -1) {
              window.S[k] = cloudData[k];
            }
          }
          // ── Restore localStorage history keys (perf-history, badges, streaks, food journal) ──
          if (cloudData._legacy_storage && typeof cloudData._legacy_storage === 'object') {
            try {
              var restored = 0;
              for (var lk in cloudData._legacy_storage) {
                if (!cloudData._legacy_storage.hasOwnProperty(lk)) continue;
                if (lk.indexOf('mtd_') !== 0) continue; // safety: only restore mtd_ keys
                try {
                  localStorage.setItem(lk, cloudData._legacy_storage[lk]);
                  restored++;
                } catch(e) {}
              }
              console.log('[SupaSync] Restored ' + restored + ' history keys from cloud');
            } catch(e) { console.warn('[SupaSync] legacy storage restore failed:', e); }
          }
          // Restore language & units before render so UI shows correct locale
          if (window.I18N && window.S.lang) window.I18N.current = window.S.lang;
          if (window.UNITS) {
            window.UNITS.weight = window.S.weightUnit || 'kg';
            window.UNITS.height = window.S.heightUnit || 'cm';
          }
        }

        if (!hasValidLocalData && cloudData.goal != null) {
          console.log('[SupaSync] Loading profile from cloud (no valid local data for user)');
          _applyCloudData();
          if (window.render) window.render();
          return 'loaded_from_cloud';
        }

        // ── Cloud data exists AND local data exists ──
        // If cloud data is more advanced (higher nStep/sStep), prefer cloud.
        // This handles the case where localStorage was cleared or the user is on a new device.
        if (hasValidLocalData && cloudData.goal != null) {
          var cloudNStep = cloudData.nStep || 0;
          var localNStep = (localData && localData.nStep) ? localData.nStep : (window.S.nStep || 0);
          var cloudSStep = cloudData.sStep || 0;
          var localSStep = (localData && localData.sStep) ? localData.sStep : (window.S.sStep || 0);
          // Also check if cloud has a weekPlan that local is missing
          var cloudHasPlan = cloudData.weekPlan != null;
          var localHasPlan = (localData && localData.weekPlan != null) || window.S.weekPlan != null;
          // Priorité au profil le plus récent (timestamp) plutôt que le plus avancé (nStep)
          var cloudTime = cloudData._cloudUpdatedAt ? new Date(cloudData._cloudUpdatedAt).getTime() : 0;
          var localTime = (localData && localData._cloudUpdatedAt) ? new Date(localData._cloudUpdatedAt).getTime() : 0;
          var cloudIsNewer = cloudTime > 0 && cloudTime > localTime + 5000; // 5s de tolérance
          if (cloudIsNewer || cloudNStep > localNStep || cloudSStep > localSStep || (cloudHasPlan && !localHasPlan)) {
            console.log('[SupaSync] Cloud preferred — cloudTime=' + new Date(cloudTime).toISOString() + ' localTime=' + (localTime ? new Date(localTime).toISOString() : 'none') + ' nStep cloud/local=' + cloudNStep + '/' + localNStep);
            _applyCloudData();
            if (window.render) window.render();
            return 'loaded_from_cloud';
          }
        }
        // ── Even if local data exists, merge missing history keys from cloud ──
        // (e.g. user has a partial profile locally but the cloud has fresher history)
        if (cloudData._legacy_storage && typeof cloudData._legacy_storage === 'object') {
          try {
            for (var lk2 in cloudData._legacy_storage) {
              if (!cloudData._legacy_storage.hasOwnProperty(lk2)) continue;
              if (lk2.indexOf('mtd_') !== 0) continue;
              // Only restore if local key doesn't exist (don't overwrite local history)
              if (localStorage.getItem(lk2) == null) {
                try { localStorage.setItem(lk2, cloudData._legacy_storage[lk2]); } catch(e) {}
              }
            }
          } catch(e) {}
        }
        return 'local_data_exists';
      }).catch(function(e) {
        self._syncPending = false;
        self._syncLoginInProgress = false;
        console.warn('[SupaSync] syncOnLogin failed:', e);
        return null;
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
