/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
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

  // ─── SYNC STATUS TRACKING (2026-04 N2) ───
  // Compte les échecs consécutifs de sync cloud pour alerter l'user si persistant.
  var _syncFailCount = 0;
  var _syncFailWarnedAt = 0;
  function _trackSyncSuccess() {
    if (_syncFailCount > 0) {
      // Transition offline → online : toast de rétablissement si on avait alerté
      if (_syncFailWarnedAt > 0 && window.showToast) {
        try { window.showToast('Synchronisation cloud rétablie.', 'info', 3000); } catch(e) {}
      }
    }
    _syncFailCount = 0;
    _syncFailWarnedAt = 0;
  }
  function _trackSyncFailure(reason) {
    _syncFailCount++;
    // Alerter l'utilisateur après 3 échecs consécutifs ET pas plus qu'une fois par 10 min
    if (_syncFailCount >= 3 && (Date.now() - _syncFailWarnedAt > 10 * 60 * 1000)) {
      _syncFailWarnedAt = Date.now();
      if (window.showToast) {
        try { window.showToast('Synchronisation cloud indisponible. Vos modifications sont conservées localement.', 'warning', 5000); } catch(e) {}
      }
    }
  }
  // Expose pour consultation externe (badge UI éventuel)
  window._sfcSyncStatus = function() {
    return { failCount: _syncFailCount, online: _syncFailCount === 0, lastWarnedAt: _syncFailWarnedAt };
  };

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
      // 2026-04 P1 FIX : stopper la sync automatique avant logout
      // (sinon l'interval continue à tenter des saves vers le user déco)
      try { if (window.SupaSync && window.SupaSync.stopAutoSync) window.SupaSync.stopAutoSync(); } catch(e) {}
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

  // UUID v4 generator (no crypto dependency, sufficient for client-side row IDs)
  function _uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  // ─── SYNC MODULE ──────────────────────────────────────────
  // Stratégie : localStorage = source primaire (rapide, offline)
  //             Supabase = backup cloud (sync en arrière-plan)
  var SupaSync = {
    _syncing: false,
    _lastSync: 0,
    _syncInterval: null,
    _debounceTimer: null,
    _syncPending: false,
    _counterTimers: {},

    // Sauvegarder le profil complet vers Supabase
    saveProfile: function() {
      var self = this;
      // Mutex : si un upsert est déjà en vol, marquer un re-flush pour après
      if (self._syncing) {
        self._savePendingDuringSync = true;
        return Promise.resolve();
      }
      self._syncing = true;
      var client = getClient();
      if (!client) { self._syncing = false; return Promise.resolve(); }

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
          // FIX V2 2026-04 : étendu pour inclure les charges/progression/cycle muscu
          // qui étaient PERDUES au changement de device (jamais sync cloud).
          var SYNC_PREFIXES = [
            // Historiques génériques
            'mtd_perf_hist_', 'mtd_badges_', 'mtd_streak_', 'mtd_nutrition_streak_',
            'mtd_food_journal_', 'mtd_water_', 'mtd_weight_history_',
            // Gamification counters
            'mtd_counter_',
            // Sport — séances loggées
            'mtd_muscu_session_',
            // Sport — charges & progression (étaient absents)
            'mtd_muscu_weights_',       // charges de travail par exercice
            'mtd_muscu_progression_',   // historique de progression
            'mtd_muscu_strength_',      // profil de force (1RM estimés)
            'mtd_muscu_week_',          // semaine actuelle dans le cycle
            'mtd_muscu_cycle_',         // numéro de cycle
            'mtd_muscu_start_',         // date de début du programme
            // CrossFit
            'mtd_cf_1rm_',
            // Daily challenges
            'mtd_daily_challenge_'
          ];
          // Clés exactes sans UID (programme IA, progression, générations)
          var SYNC_EXACT = ['mtd_muscu_program', 'mtd_muscu_ia_progress', 'mtd_muscu_generations'];
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
            if (matches) {
              try { legacy[key] = localStorage.getItem(key); } catch(e) {}
            }
          }
          if (Object.keys(legacy).length > 0) data._legacy_storage = legacy;
        } catch(e) { console.warn('[SupaSync] legacy storage scan failed:', e); }

        // Note: birth_date and email_optin removed from dedicated columns
        // (not in schema) — already preserved inside the `data` JSONB field below.
        // Strip server-authoritative keys before upsert. These values live in
        // dedicated DB columns protected from user modification:
        //   subscription_plan/end  — since 2026-04 migration
        //   first_login_date       — write-once column (20260505 migration)
        // Stripping them from the JSONB blob keeps data clean and prevents a
        // compromised client from polluting the JSONB fallback path.
        var _safeData = data;
        try {
          if (data && (data.subscriptionPlan !== undefined || data.subscriptionEnd !== undefined || data.firstLoginDate !== undefined)) {
            _safeData = Object.assign({}, data);
            delete _safeData.subscriptionPlan;
            delete _safeData.subscriptionEnd;
            delete _safeData.firstLoginDate;
          }
        } catch(e) { _safeData = data; }

        return client
          .from('profiles')
          .upsert({
            id: userId,
            email: session.user.email,
            name: data.name || session.user.user_metadata.name || '',
            data: _safeData,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' })
          .then(function(result) {
            if (result.error) {
              console.warn('[SupaSync] saveProfile error:', result.error.message);
              // 2026-04 N2 : tracker les échecs successifs pour alerter l'utilisateur
              _trackSyncFailure(result.error.message);
            } else {
              console.log('[SupaSync] Profile saved to cloud');
              _trackSyncSuccess();
              try {
                window.S._cloudUpdatedAt = new Date().toISOString();
              } catch(e) {}
            }
            self._syncing = false;
            // Re-flush if a save was queued while this one was in-flight
            if (self._savePendingDuringSync) {
              self._savePendingDuringSync = false;
              setTimeout(function() { try { self.saveProfile(); } catch(_) {} }, 200);
            }
            return result;
          });
      }).catch(function(e) {
        self._syncing = false;
        self._savePendingDuringSync = false;
        console.warn('[SupaSync] saveProfile failed:', e);
        _trackSyncFailure((e && e.message) || String(e));
        if (window.SFCLogger) window.SFCLogger.capture(e, { module: 'SupaSync.saveProfile' });
      });
    },

    // Charger le profil depuis Supabase.
    // Resilient to the subscription migration state: tries the new columns
    // first, falls back to the pre-migration SELECT if Supabase answers
    // "column does not exist" (error code 42703). This means the code can
    // ship BEFORE the SQL migration runs without breaking any user login.
    loadProfile: function() {
      var client = getClient();
      if (!client) return Promise.reject('No client');

      function mergePayload(row) {
        if (!row) return null;
        var payload = row.data || {};
        // Server-authoritative columns override any stale JSONB value.
        // firstLoginDate comes from the write-once first_login_date column
        // (see migration 20260505_secure_first_login_date.sql) — users cannot
        // manipulate it via Supabase client to extend their trial window.
        if (row.subscription_plan) payload.subscriptionPlan = row.subscription_plan;
        if (row.subscription_end)  payload.subscriptionEnd  = row.subscription_end;
        if (row.first_login_date)  payload.firstLoginDate   = row.first_login_date;
        if (row.updated_at) payload._cloudUpdatedAt = row.updated_at;
        return payload;
      }

      return SupaAuth.getSession().then(function(session) {
        if (!session || !session.user) return null;
        var userId = session.user.id;

        var _loadTimeout = new Promise(function(_, reject) {
          setTimeout(function() { reject(new Error('SupaSync.loadProfile timeout (8s)')); }, 8000);
        });

        var _loadQuery = client
          .from('profiles')
          .select('data, subscription_plan, subscription_end, first_login_date, updated_at')
          .eq('id', userId)
          .single()
          .then(function(result) {
            // Pre-migration fallback: 42703 = undefined_column. Retry with
            // the legacy SELECT so users can still log in before the DB
            // migration has been executed.
            if (result.error && (result.error.code === '42703' || /column .* does not exist/i.test(result.error.message || ''))) {
              console.warn('[SupaSync] new columns missing — falling back to legacy select. Run migrations in supabase/migrations/.');
              return client
                .from('profiles')
                .select('data, updated_at')
                .eq('id', userId)
                .single()
                .then(function(r2) {
                  if (r2.error || !r2.data) return null;
                  return mergePayload(r2.data);
                });
            }
            if (result.error || !result.data) return null;
            return mergePayload(result.data);
          });

        return Promise.race([_loadQuery, _loadTimeout]).then(function(result) {
          // Snapshot last-known-good on every successful load
          if (result && typeof result === 'object' && !Array.isArray(result)) {
            try {
              if (window.SFCLastGood) window.SFCLastGood.save('profile', result);
            } catch(_) {}
          }
          return result;
        }).catch(function(e) {
          console.warn('[SupaSync] loadProfile failed or timed out:', e && e.message ? e.message : e);
          _trackSyncFailure(e && e.message ? e.message : 'timeout');
          if (window.SFCLogger) window.SFCLogger.capture(e, { module: 'SupaSync.loadProfile' });
          // Attempt last-known-good fallback before returning null
          var lkg = window.SFCLastGood ? window.SFCLastGood.get('profile') : null;
          return lkg || null;
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
      var sessionId = sessionData.sessionId || _uuid();

      return SupaAuth.getSession().then(function(session) {
        if (!session || !session.user) return;
        return client
          .from('sport_sessions')
          .upsert({
            session_id: sessionId,
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
          }, { onConflict: 'session_id' })
          .then(function(r) {
            if (!r || !r.error) {
              if (window.TRACKER) window.TRACKER.track('workout_completed', { sport_type: window.S && window.S.sportType, kcal: sessionData.kcalTotal, duration: sessionData.duration });
            }
            return r;
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
      var entryId = entry.entryId || _uuid();

      return SupaAuth.getSession().then(function(session) {
        if (!session || !session.user) return;
        return client
          .from('food_journal')
          .upsert({
            entry_id: entryId,
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
          }, { onConflict: 'entry_id' });
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

    // Sauvegarder un compteur gamification (debounced 2s pour éviter des upserts répétés)
    saveCounter: function(counterName, value) {
      var self = this;
      if (self._counterTimers[counterName]) clearTimeout(self._counterTimers[counterName]);
      self._counterTimers[counterName] = setTimeout(function() {
        delete self._counterTimers[counterName];
        var client = getClient();
        if (!client) return;
        SupaAuth.getSession().then(function(session) {
          if (!session || !session.user) return;
          return client
            .from('counters')
            .upsert({
              user_id: session.user.id,
              counter_name: counterName,
              value: value
            }, { onConflict: 'user_id,counter_name' });
        }).catch(function(e) { console.warn('[SupaSync] saveCounter failed:', e); });
      }, 2000);
    },

    // Sauvegarder une analyse corporelle IA
    saveBodyAnalysis: function(analyse, programme) {
      var client = getClient();
      if (!client) return Promise.resolve();

      return SupaAuth.getSession().then(function(session) {
        if (!session || !session.user) return;
        return client
          .from('body_analyses')
          .insert({
            user_id: session.user.id,
            analyse: analyse || {},
            programme: programme || {}
          });
      }).catch(function(e) { console.warn('[SupaSync] saveBodyAnalysis failed:', e); });
    },

    // Sauvegarder un scan de plat IA ajouté au journal
    savePlateScan: function(scanData) {
      var client = getClient();
      if (!client) return Promise.resolve();

      return SupaAuth.getSession().then(function(session) {
        if (!session || !session.user) return;
        return client
          .from('plate_scan_history')
          .insert({
            user_id: session.user.id,
            name: scanData.name || '',
            kcal: scanData.kcal || 0,
            protein: scanData.p || 0,
            carbs: scanData.g || 0,
            fat: scanData.l || 0,
            portion: scanData.portion || null,
            meal_slot: scanData.mealSlot || null,
            meal_date: scanData.mealDate || new Date().toISOString().slice(0, 10),
            added_to_plan: scanData.addedToPlan || false
          });
      }).catch(function(e) { console.warn('[SupaSync] savePlateScan failed:', e); });
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
      // FIX V3 2026-04 : ne pas SKIP les saves pendant syncOnLogin — au lieu de ça,
      // on flag qu'il y a une save en attente. À la fin de syncOnLogin, on déclenche
      // le save différé pour ne PAS perdre les modifs user pendant la fenêtre de sync.
      if (self._syncPending) {
        self._savePendingDuringSync = true;
        return;
      }
      if (self._debounceTimer) clearTimeout(self._debounceTimer);
      self._debounceTimer = setTimeout(function() {
        self.saveProfile();
      }, 5000); // 5s debounce
    },

    // Sync initial au login : charger depuis Supabase si localStorage vide ou moins avancé
    // 2026-04 P0 FIX : attendre AUTH.ready() avant de toucher au storage. Avant ce fix,
    // getUser() pouvait retourner null si la session Supabase n'était pas hydratée, ce qui
    // faisait sauvegarder les données sous uid='anon' → perte multi-device (bug ta femme).
    syncOnLogin: function() {
      if (!getClient()) return Promise.resolve('no_client');
      if (this._syncLoginInProgress) return Promise.resolve('already_syncing');
      // Set flag synchronously at entry — before any async tick — to block concurrent calls
      this._syncLoginInProgress = true;
      var self = this;

      // 1) Attendre que la session Supabase soit hydratée (ou timeout 12s)
      var authReadyPromise = (window.AUTH && window.AUTH.ready)
        ? window.AUTH.ready()
        : Promise.resolve();

      return authReadyPromise.then(function() {
        // 2) Vérifier qu'on a bien un uid valide. Si pas, on abandonne — on ne crée
        //    PAS de clé 'anon' qui pourrait écraser des données existantes.
        var userNow = window.AUTH && window.AUTH.getUser ? window.AUTH.getUser() : null;
        var uidNow = (userNow && userNow.id) ? userNow.id : null;
        if (!uidNow) {
          // Tentative ultime via getSession() direct (v2 API)
          var client = getClient();
          if (client && client.auth && client.auth.getSession) {
            return client.auth.getSession().then(function(res) {
              var session = res && res.data && res.data.session;
              if (session && session.user && session.user.id) {
                // Session trouvée tardivement : on continue
                return _doSync(session.user.id);
              }
              console.warn('[SupaSync] syncOnLogin abandonné : aucune session utilisateur valide');
              return 'no_session';
            }).catch(function() {
              console.warn('[SupaSync] syncOnLogin abandonné : getSession failed');
              return 'no_session';
            });
          }
          console.warn('[SupaSync] syncOnLogin abandonné : AUTH non initialisé');
          return 'no_session';
        }
        return _doSync(uidNow);
      });

      function _doSync(validUid) {
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
          // 2026-04 P0 FIX : on utilise validUid (uid garanti valide depuis AUTH.ready())
          // au lieu de retomber sur 'anon' ce qui causait le bug multi-device.
          var uid = validUid;
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
          // Clés "précieuses" — on refuse qu'un cloud null/vide écrase des données locales valides.
          // Cas typique : sync partielle (debounce pas flushé) → cloud manque sportProgram/weekPlan alors
          // que le local les a. Voir diagnostic bug persistance 2026-04.
          var _PROTECTED_KEYS = {
            // Programmes sport (tous)
            _sportProgramVersion: 1,
            sportProgram: 1, runningProgram: 1, cyclingProgram: 1,
            triathlonProgram: 1, hyroxProgram: 1, padelProgram: 1,
            golfProgram: 1, yogaWeek: 1, calisthenicsWeek: 1,
            // Nutrition
            weekPlan: 1, favoriteRecipes: 1, nutritionLog: 1,
            mealTimes: 1, mealsLogged: 1, shopChecked: 1,
            // Historiques & progression sport
            muscuSessionLog: 1, musculationWeights: 1,
            muscuProgressionHistory: 1, sessionHistory: 1,
            bonusExercises: 1, sportFocus: 1,
            weightHistory: 1,
            // Benchmarks & profils de force
            crossfit1RM: 1, muscuStrengthProfile: 1,
            hyroxBenchmarks: 1, crossfitBenchmarks: 1,
            // CrossFit calendrier
            cfProgress: 1,
            // Smart Calendar
            weeklyCalendar: 1,
            // IA coach + jours d'entraînement
            aiCoachHistory: 1, trainingDaysSelected: 1,
            installations: 1, sportHobbies: 1
          };
          // FIX 2026-04-16 : flags de validation utilisateur (jamais dévalider via cloud).
          // Bug : si un device A vient de valider son plan (flag = true) et qu'un device B
          // (ou un sync stale) renvoie le flag à null/false, le bandeau "valider mon plan"
          // réapparaît et oblige l'utilisateur à re-cliquer. Très chiant en multi-device.
          // Règle : un flag de validation est une ACTION UTILISATEUR explicite ; le cloud
          // ne doit JAMAIS le rabaisser (false/null/'') quand le local est à true.
          var _VALIDATION_KEYS = {
            weekPlanValidated: 1,
            weekPlanValidatedISOWeek: 1,
            sportProgramValidated: 1,
            sportProgramValidatedAt: 1,
            _planHash: 1
          };
          function _isEmptyValue(v) {
            if (v === null || v === undefined) return true;
            if (Array.isArray(v) && v.length === 0) return true;
            if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return true;
            return false;
          }
          function _isMeaningful(v) {
            if (v === null || v === undefined) return false;
            if (Array.isArray(v)) return v.length > 0;
            if (typeof v === 'object') return Object.keys(v).length > 0;
            return true;
          }
          for (var k in cloudData) {
            if (cloudData.hasOwnProperty(k) && _PROTO_BLOCKED.indexOf(k) === -1) {
              var cv = cloudData[k];
              // Protection : si la clé est "précieuse" et que le cloud est vide mais le local non → on garde le local
              if (_PROTECTED_KEYS[k] && _isEmptyValue(cv) && _isMeaningful(window.S[k])) {
                console.log('[SupaSync] Skip overwrite of protected key "' + k + '" (cloud empty, local has data)');
                continue;
              }
              // Anti-dévalidation : un flag de validation utilisateur ne doit jamais être rabaissé par le cloud.
              if (_VALIDATION_KEYS[k] && window.S[k] && (cv === null || cv === undefined || cv === '' || cv === false)) {
                console.log('[SupaSync] Skip devalidation of "' + k + '" (cloud empty, local validated)');
                continue;
              }
              window.S[k] = cv;
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
                  // FIX V1 2026-04 : ne pas écraser un local plus riche par un cloud plus pauvre.
                  // Avant : 6 mois d'historique muscu local pouvaient être écrasés par 1 séance
                  //         du device B (cloud stale). Bug silencieux.
                  // Maintenant : on compare les tailles JSON. On garde le plus riche.
                  // Pour les histories (sessions, weights, perf-history, food journal etc.) qui
                  // sont des objets/arrays accumulant des entrées, "plus de bytes = plus de données".
                  // Hypothèse confirmée par audit (10 vulnérabilités diagnostiquées 2026-04).
                  var existing = null;
                  try { existing = localStorage.getItem(lk); } catch(eg) {}
                  var cloudVal = cloudData._legacy_storage[lk];
                  // Tester la richesse seulement si les deux sont des strings non triviales
                  if (typeof existing === 'string' && existing.length > 0 &&
                      typeof cloudVal === 'string' && cloudVal.length > 0) {
                    // Heuristique : si local est plus volumineux ET pas trivialement égal,
                    // on garde local (probablement plus d'entrées historiques).
                    if (existing.length > cloudVal.length && existing !== cloudVal) {
                      console.log('[SupaSync] Skip restore "' + lk + '" — local plus riche (' +
                                  existing.length + ' vs cloud ' + cloudVal.length + ')');
                      continue;
                    }
                  }
                  localStorage.setItem(lk, cloudVal);
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
          // Mark subscription status as known — unblocks isTrialUser() / isPremium()
          try { window.S._subStatusReady = true; } catch(_sr) {}
        }

        if (!hasValidLocalData && cloudData.goal != null) {
          console.log('[SupaSync] Loading profile from cloud (no valid local data for user)');
          _applyCloudData();
          // FIX 2026-04-18 : persister IMMÉDIATEMENT en localStorage pour éviter que la donnée
          // soit perdue si l'utilisatrice ferme l'onglet avant l'autosave 30s.
          // Bug rapporté : femme se reconnecte, voit ses données, ferme l'app → rien n'a été
          // écrit en local → prochaine session re-dépend du cloud (potentiellement lent/partiel).
          try { if (window.saveProfile) window.saveProfile(); } catch(e) { console.warn('[SupaSync] post-cloud saveProfile failed:', e); }
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
          // ── DURCISSEMENT bug persistance 2026-04 ────────────────────────────
          // Même si le cloud est "plus récent", on ne préfère PAS le cloud s'il a PERDU
          // des données précieuses que le local détient (sportProgram/weekPlan).
          // Typiquement : sync partielle non flushée → cloud stale sans ces données.
          var localHasSportProg = Array.isArray(window.S.sportProgram) && window.S.sportProgram.length > 0;
          var cloudHasSportProg = Array.isArray(cloudData.sportProgram) && cloudData.sportProgram.length > 0;
          var cloudWouldLoseSport = localHasSportProg && !cloudHasSportProg;
          var cloudWouldLosePlan  = localHasPlan && !cloudHasPlan;
          if (cloudWouldLoseSport || cloudWouldLosePlan) {
            console.log('[SupaSync] Cloud stale — missing local data (sport=' + cloudWouldLoseSport + ', plan=' + cloudWouldLosePlan + '). Keeping local, forcing cloud resave.');
            // Forcer une re-sync pour repousser les données locales vers le cloud
            try { if (window.SupaSync && window.SupaSync.saveProfile) window.SupaSync.saveProfile(); } catch(e) {}
            // Server-authoritative fields applied even when local wins — subscription is never in localStorage
            try {
              if (cloudData.subscriptionPlan) window.S.subscriptionPlan = cloudData.subscriptionPlan;
              if (cloudData.subscriptionEnd !== undefined) window.S.subscriptionEnd = cloudData.subscriptionEnd;
              if (cloudData.firstLoginDate) window.S.firstLoginDate = cloudData.firstLoginDate;
            } catch(_e) {}
          } else if (cloudIsNewer || cloudNStep > localNStep || cloudSStep > localSStep || (cloudHasPlan && !localHasPlan)) {
            console.log('[SupaSync] Cloud preferred — cloudTime=' + new Date(cloudTime).toISOString() + ' localTime=' + (localTime ? new Date(localTime).toISOString() : 'none') + ' nStep cloud/local=' + cloudNStep + '/' + localNStep);
            _applyCloudData();
            // FIX 2026-04-18 : même principe — persister immédiatement en localStorage.
            try { if (window.saveProfile) window.saveProfile(); } catch(e) { console.warn('[SupaSync] post-cloud saveProfile failed:', e); }
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
        // Subscription fields live in dedicated DB columns and are intentionally stripped
        // from the localStorage JSONB blob (see saveProfile). They must always be applied
        // from cloudData regardless of which data path won (cloud vs local).
        try {
          if (cloudData.subscriptionPlan) window.S.subscriptionPlan = cloudData.subscriptionPlan;
          if (cloudData.subscriptionEnd !== undefined) window.S.subscriptionEnd = cloudData.subscriptionEnd;
          if (cloudData.firstLoginDate) window.S.firstLoginDate = cloudData.firstLoginDate;
          // Mark subscription status as known so isTrialUser() / isPremium() use real values
          window.S._subStatusReady = true;
        } catch(_se) {}
        return 'local_data_exists';
      }).catch(function(e) {
        self._syncPending = false;
        self._syncLoginInProgress = false;
        console.warn('[SupaSync] syncOnLogin failed:', e);
        return null;
      }).then(function(result) {
        // FIX V3 2026-04 : si l'utilisateur a tenté un saveProfile pendant le sync
        // (qui a été skippé par scheduleSave car _syncPending=true), on le rejoue
        // maintenant pour ne pas perdre ses modifs.
        if (self._savePendingDuringSync) {
          self._savePendingDuringSync = false;
          console.log('[SupaSync] Re-flushing saveProfile (modifs user pendant sync)');
          try {
            self.saveProfile(); // fire-and-forget — la promise prochaine devient idempotente
          } catch(eFlush) { console.warn('[SupaSync] re-flush failed:', eFlush); }
        }
        return result;
      });
      }  // end of function _doSync
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
    },

    // Fetch authoritative premium/trial status from server.
    // Result is cached for 15 min to avoid hammering the endpoint.
    // On success, S.firstLoginDate / subscriptionPlan / subscriptionEnd are
    // updated in-memory with server-confirmed values.
    // Returns a Promise<{ premium, plan, planEnd, trialDaysLeft, firstLoginDate }|null>.
    fetchUserStatus: function() {
      var self = this;
      var NOW = Date.now();
      var TTL = 15 * 60 * 1000; // 15 minutes
      if (self._userStatusCache && (NOW - self._userStatusCacheTs) < TTL) {
        return Promise.resolve(self._userStatusCache);
      }
      return SupaAuth.getSession().then(function(session) {
        if (!session || !session.access_token) return null;
        var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var tid = setTimeout(function() { if (ctrl) ctrl.abort(); }, 8000);
        return fetch('/.netlify/functions/user-status', {
          method: 'GET',
          headers: { 'Authorization': 'Bearer ' + session.access_token },
          signal: ctrl ? ctrl.signal : undefined
        }).then(function(res) {
          clearTimeout(tid);
          if (!res.ok) return null;
          return res.json();
        }).then(function(status) {
          // Always mark as ready — even null means server responded (no plan = trial)
          try { if (window.S) window.S._subStatusReady = true; } catch(_) {}
          if (!status || typeof status.premium !== 'boolean') return null;
          self._userStatusCache   = status;
          self._userStatusCacheTs = Date.now();
          // Propagate server-authoritative values into S
          try {
            if (window.S) {
              if (status.firstLoginDate)   window.S.firstLoginDate   = status.firstLoginDate;
              if (status.plan)             window.S.subscriptionPlan = status.plan;
              if (status.planEnd !== undefined) window.S.subscriptionEnd = status.planEnd;
            }
          } catch(e) {}
          return status;
        }).catch(function() {
          clearTimeout(tid);
          // Network failure — mark ready so trial UI is gated by actual subscription fields,
          // not the loading guard. isPremium() failsafe will grant access on error.
          try { if (window.S) window.S._subStatusReady = true; } catch(_) {}
          return null;
        });
      }).catch(function() { return null; });
    }
  };

  // ─── EXPORTS ──────────────────────────────────────────────
  window.SupaAuth = SupaAuth;
  window.SupaSync = SupaSync;
  window.getSupabaseClient = getClient;
  window.resetSupabaseClient = resetClient;
})();

// ─── SAFE PREMIUM STATUS CHECK ────────────────────────────────────────────────
// safeUserStatusCheck(opts) — single entry point for all premium action gates.
// opts: { force?: boolean }
//   force: true  → bypass TTL cache, always verify with server  (for critical actions)
//   force: false → use 15-min TTL cache when fresh (default)
//
// Returns Promise<{ ok, isPremium, trialActive, source, reason? }>
//   ok: false means the check itself failed (offline / server error) — deny but don't crash
//   source: 'server' | 'cache' | 'fallback'
//
// Never throws. Always resolves.
window.safeUserStatusCheck = function(opts) {
  var force  = opts && opts.force === true;
  var online = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
  var sync   = window.SupaSync;
  var CACHE_TTL = 15 * 60 * 1000;

  function _deny(source, reason)  { return { ok: false, isPremium: false, trialActive: false, source: source, reason: reason }; }
  function _allow(source, status) {
    return {
      ok: true,
      isPremium: true,
      trialActive: !!(status && status.plan === 'trial' && status.trialDaysLeft > 0),
      source: source
    };
  }

  // Offline → safe deny immediately
  if (!online) return Promise.resolve(_deny('fallback', 'offline'));

  var now = Date.now();

  // Non-forced: serve from TTL cache when still fresh
  if (!force && sync && sync._userStatusCache &&
      (now - (sync._userStatusCacheTs || 0)) < CACHE_TTL) {
    var c = sync._userStatusCache;
    if (typeof c.premium !== 'boolean') return Promise.resolve(_deny('fallback', 'corrupt_cache'));
    return Promise.resolve(c.premium ? _allow('cache', c) : _deny('cache', 'not_premium'));
  }

  if (!sync || typeof sync.fetchUserStatus !== 'function') {
    // No sync module (unit tests, pre-login) — deny; never trust localStorage alone
    return Promise.resolve(_deny('fallback', 'no_sync'));
  }

  // Force: invalidate cache timestamp so fetchUserStatus hits server
  if (force) sync._userStatusCacheTs = 0;

  return sync.fetchUserStatus().then(function(status) {
    if (!status || typeof status.premium !== 'boolean') {
      return _deny('fallback', 'corrupt_response');
    }
    return status.premium ? _allow('server', status) : _deny('server', 'not_premium');
  }).catch(function() {
    return _deny('fallback', 'server_error');
  });
};

// ─── PREMIUM CHECK FAILED MESSAGE ─────────────────────────────────────────────
// Shown when safeUserStatusCheck() returns source:'fallback' — server unreachable.
// Displays a non-blocking toast with Retry + Home actions. Never crashes the app.
window._showPremiumCheckFailed = function(retryFn) {
  var isEN = typeof window.isEnglish === 'function' && window.isEnglish();
  var msg  = isEN
    ? 'Unstable connection. Verifying your access…'
    : 'Connexion instable. Vérification de votre accès…';

  // Toast for brief notice
  if (window.showToast) window.showToast(msg, 'warning', 5000);

  // Floating action strip (auto-removes after 8s or on interaction)
  try {
    var existing = document.getElementById('sfc-prem-check-strip');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    var strip = document.createElement('div');
    strip.id = 'sfc-prem-check-strip';
    strip.style.cssText = [
      'position:fixed', 'bottom:72px', 'left:50%', 'transform:translateX(-50%)',
      'z-index:10000', 'background:#1a1a18', 'color:#faf9f6',
      'padding:12px 20px', 'border-radius:0', 'display:flex', 'gap:12px',
      'align-items:center', 'font-family:"Helvetica Neue",Arial,sans-serif',
      'font-size:9px', 'letter-spacing:2px', 'text-transform:uppercase',
      'box-shadow:0 4px 24px rgba(0,0,0,.5)'
    ].join(';');

    function _remove() { if (strip.parentNode) strip.parentNode.removeChild(strip); }

    if (typeof retryFn === 'function') {
      var retryBtn = document.createElement('button');
      retryBtn.textContent = isEN ? 'Retry' : 'Réessayer';
      retryBtn.style.cssText = 'background:#3E5C3A;color:#faf9f6;border:none;padding:6px 14px;cursor:pointer;font-size:9px;letter-spacing:2px;text-transform:uppercase;';
      retryBtn.onclick = function() { _remove(); try { retryFn(); } catch(e) {} };
      strip.appendChild(retryBtn);
    }

    var homeBtn = document.createElement('button');
    homeBtn.textContent = isEN ? 'Home' : 'Accueil';
    homeBtn.style.cssText = 'background:transparent;color:#faf9f6;border:1px solid #555;padding:6px 14px;cursor:pointer;font-size:9px;letter-spacing:2px;text-transform:uppercase;';
    homeBtn.onclick = function() { _remove(); try { if (window.navigateTo) window.navigateTo('home'); } catch(e) {} };
    strip.appendChild(homeBtn);

    document.body.appendChild(strip);
    setTimeout(_remove, 8000);
  } catch(e) {}
};
