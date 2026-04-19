/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
/* ═══════════════════════════════════════════════════════════════
   AUTH.JS — Authentication & BlackBox Activity Tracking
   Smart Fit Coach
   Supabase Auth with localStorage fallback
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';

// ─── LEGACY PASSWORD HASHING (kept for localStorage fallback) ───

var PBKDF2_ITERATIONS = 100000;
var PBKDF2_KEYLEN = 32;

function bufToHex(buf) {
  return Array.from(new Uint8Array(buf)).map(function(b){ return ('00'+b.toString(16)).slice(-2); }).join('');
}
function hexToBuf(hex) {
  var arr = [];
  for (var i = 0; i < hex.length; i += 2) arr.push(parseInt(hex.substr(i,2), 16));
  return new Uint8Array(arr).buffer;
}

function hashPasswordAsync(password, saltHex) {
  var enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']
  ).then(function(key) {
    var saltBuf = saltHex ? hexToBuf(saltHex) : crypto.getRandomValues(new Uint8Array(16)).buffer;
    var saltHexOut = bufToHex(saltBuf);
    return crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: saltBuf, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      key, PBKDF2_KEYLEN * 8
    ).then(function(bits) {
      return 'pbkdf2:' + saltHexOut + ':' + bufToHex(bits);
    });
  });
}

function verifyPasswordAsync(password, storedHash) {
  if (storedHash && storedHash.indexOf('pbkdf2:') === 0) {
    var parts = storedHash.split(':');
    if (parts.length === 3) {
      return hashPasswordAsync(password, parts[1]).then(function(computed) {
        return computed === storedHash;
      });
    }
    return Promise.resolve(false);
  }
  return Promise.resolve(legacyHashPassword(password) === storedHash);
}

function legacyHashPassword(password) {
  var salt = 'MtdMacroCalculator2024!';
  var str = salt + password + salt;
  var hash = 0x811c9dc5;
  for (var i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  for (var r = 0; r < 1000; r++) {
    hash ^= (hash >>> 16);
    hash = Math.imul(hash, 0x45d9f3b);
  }
  return (hash >>> 0).toString(36);
}

// ─── TIMING DELAY ───
function withTimingDelay(promise, startTime) {
  var MIN_DELAY = 300;
  return promise.then(function(result) {
    var elapsed = Date.now() - startTime;
    var wait = Math.max(0, MIN_DELAY - elapsed);
    return new Promise(function(resolve) {
      setTimeout(function() { resolve(result); }, wait);
    });
  });
}

// ─── SESSION TOKEN GENERATOR ───
function generateSessionToken() {
  var arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return bufToHex(arr.buffer);
}

// ─── INPUT SANITIZATION ───
function sanitize(str) {
  if (typeof str !== 'string') return '';
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function validateEmail(email) {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateName(name) {
  if (typeof name !== 'string') return false;
  var clean = name.trim();
  return clean.length >= 2 && clean.length <= 50;
}

function validatePassword(password) {
  if (typeof password !== 'string') return false;
  return password.length >= 6 && password.length <= 128;
}

// ─── STORAGE KEYS ───
var USERS_KEY = 'mtd_users';
var SESSION_KEY = 'mtd_session';
var SESSION_START_KEY = 'mtd_session_start';
var LOG_KEY = 'mtd_blackbox';
var RATE_LIMIT_KEY = 'mtd_login_rl';

// ─── RATE LIMITING ───
var MAX_ATTEMPTS = 5;
var LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

function getRateLimit(email) {
  try {
    var data = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '{}');
    return data[email] || { attempts: 0, lockedUntil: 0 };
  } catch (e) {
    return { attempts: 0, lockedUntil: 0 };
  }
}

function setRateLimit(email, attempts, lockedUntil) {
  try {
    var data = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '{}');
    data[email] = { attempts: attempts, lockedUntil: lockedUntil || 0 };
    var now = Date.now();
    Object.keys(data).forEach(function(k) {
      // Supprimer uniquement les lockouts expirés — conserver les tentatives partielles
      if (data[k].lockedUntil && data[k].lockedUntil < now) delete data[k];
    });
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
  } catch (e) {
    // Storage unavailable — fail open
  }
}

function clearRateLimit(email) {
  setRateLimit(email, 0, 0);
}

function checkRateLimit(email) {
  var rl = getRateLimit(email);
  var now = Date.now();
  if (rl.lockedUntil && now < rl.lockedUntil) {
    var remaining = Math.ceil((rl.lockedUntil - now) / 1000);
    return { blocked: true, remaining: remaining };
  }
  return { blocked: false, attempts: rl.attempts };
}

function recordFailedAttempt(email) {
  var rl = getRateLimit(email);
  var now = Date.now();
  if (rl.lockedUntil && now >= rl.lockedUntil) {
    rl.attempts = 0;
    rl.lockedUntil = 0;
  }
  rl.attempts += 1;
  var lockout = rl.attempts >= MAX_ATTEMPTS ? now + LOCKOUT_DURATION : 0;
  setRateLimit(email, rl.attempts, lockout);
}

// ─── LEGACY USER STORAGE HELPERS (localStorage fallback) ───
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {}
}

function getLegacySession() {
  try {
    var s = localStorage.getItem(SESSION_KEY);
    return s ? JSON.parse(s) : null;
  } catch (e) {
    return null;
  }
}

function buildFingerprint() {
  try {
    return [
      String(screen.width || 0),
      String(screen.colorDepth || 0),
      navigator.language || ''
    ].join('|');
  } catch(e) { return 'unknown'; }
}

function setLegacySession(user) {
  try {
    var token = generateSessionToken();
    var fingerprint = buildFingerprint();
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      nom: user.nom || '',
      phone: user.phone || '',
      token: token,
      fingerprint: fingerprint,
      tokenIssuedAt: Date.now()
    }));
    localStorage.setItem(SESSION_START_KEY, String(Date.now()));
  } catch (e) {}
}

function clearLegacySession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_START_KEY);
  } catch (e) {}
}

function isLegacySessionValid() {
  var s = getLegacySession();
  if (!s) return false;
  var now = Date.now();
  var start = parseInt(localStorage.getItem(SESSION_START_KEY) || '0');
  if (start && now - start > 30 * 24 * 60 * 60 * 1000) {
    clearLegacySession();
    return false;
  }
  if (s.fingerprint) {
    var currentFP = buildFingerprint();
    if (currentFP !== s.fingerprint) {
      clearLegacySession();
      return false;
    }
  }
  if (s.tokenIssuedAt && now - s.tokenIssuedAt > 24 * 60 * 60 * 1000) {
    try {
      var updated = JSON.parse(localStorage.getItem(SESSION_KEY));
      if (updated) {
        updated.token = generateSessionToken();
        updated.tokenIssuedAt = now;
        localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      }
    } catch(e) {}
  }
  return true;
}

// ─── SUPABASE ERROR MAPPING ───
function mapSupabaseError(err) {
  var msg = (err && err.message) ? err.message : String(err || '');
  if (msg.indexOf('Invalid login credentials') !== -1) return 'Email ou mot de passe incorrect';
  if (msg.indexOf('User already registered') !== -1) return 'Cet email est d\u00e9j\u00e0 utilis\u00e9';
  if (msg.indexOf('Email not confirmed') !== -1) return 'Email non confirm\u00e9. V\u00e9rifiez votre bo\u00eete mail.';
  if (msg.indexOf('Password should be at least 6 characters') !== -1) return 'Le mot de passe doit contenir au moins 6 caract\u00e8res';
  if (msg.indexOf('Unable to validate email address') !== -1) return 'Format d\'email invalide';
  if (msg.indexOf('Invalid API key') !== -1 || msg.indexOf('apikey') !== -1) return 'Erreur serveur. Contactez le support.';
  if (msg.indexOf('rate limit') !== -1 || msg.indexOf('too many') !== -1) return 'Trop de tentatives. R\u00e9essayez dans quelques minutes.';
  if (msg.indexOf('network') !== -1 || msg.indexOf('fetch') !== -1) return 'Erreur r\u00e9seau. V\u00e9rifiez votre connexion.';
  console.warn('[AUTH] Unmapped Supabase error:', msg);
  return 'Erreur de connexion. R\u00e9essayez.';
}

// ─── SUPABASE AVAILABILITY CHECK ───
function _getClient() {
  if (!_useSupabase) return null;
  try {
    return (window.getSupabaseClient && window.getSupabaseClient()) || null;
  } catch (e) {
    console.error('[AUTH] getClient error:', e);
    return null;
  }
}

// Get raw client (bypasses _useSupabase flag, for init only)
function _getRawClient() {
  try {
    return (window.getSupabaseClient && window.getSupabaseClient()) || null;
  } catch (e) {
    return null;
  }
}

// ─── SESSION LOCALE (pour le mode synchrone) ───
var _currentSession = null; // {id, name, email}
var _useSupabase = false;
var _authReady = Promise.resolve(); // resolved when Supabase session is loaded
// FIX V4 2026-04 : flag pour distinguer "session pas encore chargée" vs "vraiment anon"
// (sinon getUser() retournait null pendant 12s au démarrage → saveProfile écrivait
// dans mtd_profile_anon au lieu de mtd_profile_<vrai_uid>)
var _authReadyResolved = false;
var _visibilityListener = null;   // ref for cleanup on logout
var _beforeUnloadListener = null; // ref for cleanup on logout
var _authStateSubscription = null; // ref for Supabase onAuthStateChange unsubscribe

function _loadLegacySession() {
  if (isLegacySessionValid()) {
    var s = getLegacySession();
    if (s) {
      _currentSession = { id: s.id, name: s.name, email: s.email, nom: s.nom || '', phone: s.phone || '' };
      console.log('[AUTH] Legacy session restored for:', s.email);
    }
  }
}

function _extractUser(supaUser) {
  if (!supaUser) return null;
  var email = supaUser.email || '';
  var meta = supaUser.user_metadata || {};
  var u = {
    id: supaUser.id,
    name: meta.full_name || meta.name || email.split('@')[0] || 'Utilisateur',
    email: email
  };
  if (meta.nom)   u.nom   = meta.nom;
  if (meta.phone) u.phone = meta.phone;
  return u;
}

// ─── INIT : charger la session Supabase au boot ───
function _initAuth() {
  if (window._authInitialized) return;
  window._authInitialized = true;

  // Re-register session tracking listeners if they were cleaned up during logout
  if (!_visibilityListener) {
    _visibilityListener = function() {
      if (document.hidden) { BLACKBOX.log('page_hidden', {}); }
      else { BLACKBOX.log('page_visible', {}); }
    };
    document.addEventListener('visibilitychange', _visibilityListener);
  }
  if (!_beforeUnloadListener) {
    _beforeUnloadListener = function() {
      if (AUTH.isLoggedIn()) BLACKBOX.log('page_unload', { sessionMinutes: BLACKBOX.getSessionMinutes() });
    };
    window.addEventListener('beforeunload', _beforeUnloadListener);
  }

  var client = _getRawClient();
  if (!client) {
    console.warn('[AUTH] Supabase SDK not loaded, using localStorage fallback');
    _loadLegacySession();
    return;
  }

  _useSupabase = true;

  // Ecouter les changements d'auth — désabonner toute subscription précédente d'abord
  if (_authStateSubscription) {
    try { _authStateSubscription.unsubscribe(); } catch(e) {}
    _authStateSubscription = null;
  }
  var _authStateSub = client.auth.onAuthStateChange(function(event, session) {
    console.log('[AUTH] onAuthStateChange:', event);
    if (event === 'PASSWORD_RECOVERY') {
      if (session && session.user) {
        _currentSession = _extractUser(session.user);
      }
      if (window.S) {
        window.S.view = 'authNewPassword';
        window.S.authError = '';
      }
      if (window.render) window.render();
      return;
    }
    if (event === 'TOKEN_REFRESHED') {
      if (session && session.user) {
        _currentSession = _extractUser(session.user);
        if (_currentSession) console.log('[AUTH] Token refreshed — session maintenue pour:', _currentSession.email);
      }
      return;
    }
    if (session && session.user) {
      _currentSession = _extractUser(session.user);
      // Restore nom/phone from user_metadata into window.S if not already set
      if (window.S && _currentSession) {
        if (_currentSession.nom   && !window.S.nom)   window.S.nom   = _currentSession.nom;
        if (_currentSession.phone && !window.S.phone) window.S.phone = _currentSession.phone;
      }
    } else {
      _currentSession = null;
    }
  });
  // Stocker la subscription pour pouvoir la libérer au logout
  if (_authStateSub && _authStateSub.data && _authStateSub.data.subscription) {
    _authStateSubscription = _authStateSub.data.subscription;
  }

  // Charger la session existante (async)
  // Store the promise so app-main.js can await it before first render
  _authReady = client.auth.getSession().then(function(result) {
    if (result.error) {
      console.error('[AUTH] Supabase getSession error:', result.error.message || result.error);
      _useSupabase = false;
      _loadLegacySession();
      _authReadyResolved = true; // FIX V4 : restore terminé même en erreur
      return;
    }
    console.log('[AUTH] Supabase connected OK');
    if (result.data && result.data.session && result.data.session.user) {
      _currentSession = _extractUser(result.data.session.user);
      console.log('[AUTH] Session restored for:', _currentSession.email);
      if (window.S && _currentSession) {
        if (_currentSession.nom   && !window.S.nom)   window.S.nom   = _currentSession.nom;
        if (_currentSession.phone && !window.S.phone) window.S.phone = _currentSession.phone;
      }
    }
    _authReadyResolved = true; // FIX V4 : restore terminé (avec ou sans session)
  }).catch(function(err) {
    console.error('[AUTH] Supabase connection failed:', err);
    _useSupabase = false;
    _loadLegacySession();
    _authReadyResolved = true; // FIX V4 : restore terminé même en exception
  });
}

// ─── FALLBACK REGISTER (localStorage) ───
function _fallbackRegister(name, email, password, extra, startTime) {
  // Support old call signature without extra
  if (typeof extra === 'number') { startTime = extra; extra = {}; }
  extra = extra || {};
  var users = getUsers();
  for (var i = 0; i < users.length; i++) {
    if (users[i].email === email) {
      return withTimingDelay(Promise.resolve({ ok: false, error: 'Cet email est d\u00e9j\u00e0 utilis\u00e9' }), startTime);
    }
  }

  var promise = hashPasswordAsync(password).then(function(pwHash) {
    var user = {
      id: 'u_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      name: name,
      email: email,
      pwHash: pwHash,
      createdAt: Date.now()
    };
    if (extra.nom)   user.nom   = sanitize(extra.nom);
    if (extra.phone) user.phone = sanitize(extra.phone);
    var currentUsers = getUsers();
    for (var j = 0; j < currentUsers.length; j++) {
      if (currentUsers[j].email === email) {
        return { ok: false, error: 'Cet email est d\u00e9j\u00e0 utilis\u00e9' };
      }
    }
    currentUsers.push(user);
    saveUsers(currentUsers);
    setLegacySession(user);
    _currentSession = { id: user.id, name: user.name, email: user.email, nom: user.nom || '', phone: user.phone || '' };
    BLACKBOX.log('register', { email: email });
    return { ok: true, user: { id: user.id, name: user.name, email: user.email } };
  });

  return withTimingDelay(promise, startTime);
}

// ─── MIGRATION ANON → UID (localStorage keys) ───
function _migrateAnonKeys(uid) {
  try {
    var _anonRaw = localStorage.getItem('mtd_profile_anon');
    var _userRaw = localStorage.getItem('mtd_profile_' + uid);
    if (_anonRaw && !_userRaw) {
      localStorage.setItem('mtd_profile_' + uid, _anonRaw);
      localStorage.removeItem('mtd_profile_anon');
    }

    // Migrer les clés legacy anon → uid (historique, badges, streaks, logs)
    var _LEGACY_PREFIXES = ['mtd_perf_hist_', 'mtd_badges_', 'mtd_streak_', 'mtd_food_journal_', 'mtd_water_', 'mtd_muscu_session_', 'mtd_weight_history_'];
    _LEGACY_PREFIXES.forEach(function(prefix) {
      var anonKey = prefix + 'anon';
      var uidKey = prefix + uid;
      try {
        var anonVal = localStorage.getItem(anonKey);
        if (anonVal && !localStorage.getItem(uidKey)) {
          localStorage.setItem(uidKey, anonVal);
          localStorage.removeItem(anonKey);
        }
      } catch(e) {}
    });
  } catch(e) {}
}

// ─── FALLBACK LOGIN (localStorage) ───
function _fallbackLogin(email, password, startTime) {
  var users = getUsers();
  var user = null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].email === email) { user = users[i]; break; }
  }

  if (!user) {
    recordFailedAttempt(email);
    var dummyPromise = hashPasswordAsync(password).then(function() {
      return { ok: false, error: 'Email ou mot de passe incorrect' };
    });
    return withTimingDelay(dummyPromise, startTime);
  }

  var loginPromise = verifyPasswordAsync(password, user.pwHash).then(function(valid) {
    if (!valid) {
      recordFailedAttempt(email);
      BLACKBOX.log('login_failed', { email: email });
      var rlAfter = getRateLimit(email);
      var attemptsLeft = Math.max(0, MAX_ATTEMPTS - rlAfter.attempts);
      var errMsg = 'Email ou mot de passe incorrect';
      if (attemptsLeft > 0 && attemptsLeft <= 2) {
        errMsg += ' (' + attemptsLeft + ' tentative' + (attemptsLeft > 1 ? 's' : '') + ' restante' + (attemptsLeft > 1 ? 's' : '') + ')';
      }
      return { ok: false, error: errMsg };
    }

    if (user.pwHash && user.pwHash.indexOf('pbkdf2:') !== 0) {
      hashPasswordAsync(password).then(function(newHash) {
        var freshUsers = getUsers();
        for (var k = 0; k < freshUsers.length; k++) {
          if (freshUsers[k].id === user.id) {
            freshUsers[k].pwHash = newHash;
            saveUsers(freshUsers);
            break;
          }
        }
      }).catch(function() {});
    }

    clearRateLimit(email);
    _migrateAnonKeys(user.id);
    setLegacySession(user);
    _currentSession = { id: user.id, name: user.name, email: user.email, nom: user.nom || '', phone: user.phone || '' };
    BLACKBOX.log('login', { email: email });
    return { ok: true, user: { id: user.id, name: user.name, email: user.email, nom: user.nom || '', phone: user.phone || '' } };
  });

  return withTimingDelay(loginPromise, startTime);
}

// ─── AUTH MODULE ───
window.AUTH = {

  /** Promise that resolves when the initial session check is done (with 12s timeout) */
  ready: function() {
    var timeout = new Promise(function(resolve) {
      setTimeout(function() {
        // Timeout: Supabase is slow (free tier cold start can take 10-15s).
        // DO NOT clear tokens here — they may still be valid when Supabase responds.
        // Just let the app continue; _authReady will resolve later and _currentSession
        // will be set, triggering a re-render via the _authReady.then() callback below.
        console.warn('[AUTH] ready() timed out after 12s — continuing without session (Supabase may be slow)');
        resolve();
      }, 12000);
    });
    // When _authReady resolves AFTER the timeout (late Supabase response),
    // trigger a full profile restore + re-render so the user sees their dashboard.
    _authReady.then(function() {
      if (!_currentSession || !window.S) return;
      // FIX 2026-04-18 : si l'utilisateur est déjà sur le dashboard (auto-login localStorage)
      // mais que Supabase répond tardivement, on déclenche quand même le sync cloud.
      // Avant : sync ignoré si view !== 'auth' → données jamais sauvegardées vers Supabase.
      if (window.S.view !== 'auth') {
        if (window.SupaSync && !window.SupaSync._syncInterval) {
          console.log('[AUTH] Late session — triggering cloud sync (user already on dashboard)');
          window.SupaSync.syncOnLogin();
          window.SupaSync.startAutoSync();
        }
        return;
      }
      if (window.S.view === 'auth') {
        console.log('[AUTH] Late session restore — loading profile and re-rendering dashboard');
        // Restore profile from localStorage (same as _doAutoLogin does)
        if (window.loadProfile) window.loadProfile();
        if (window.S.nStep === 0 && (window.S.sex || window.S.goal || window.S.weekPlan)) {
          window.S.nStep = window.S.weekPlan ? 12 : (window.S.goal ? 11 : 1);
        }
        // Préserver les steps programme (final steps après onboarding)
        // Réinitialiser uniquement les steps intermédiaires d'onboarding [1,2,3,5,7,9,11,13,17,19,22,24]
        var _PROG_STEPS_AUTH = [4, 6, 8, 10, 12, 14, 15, 16, 18, 20, 21, 23, 25];
        if (window.S.sStep > 0 && _PROG_STEPS_AUTH.indexOf(window.S.sStep) === -1) {
          window.S.sStep = 0;
        }
        // FIX 2026-04-16 : résolution vue cohérente avec _resolvePostLoginView / _doAutoLogin.
        // Avant : hard-set 'today' → user avec onboarding incomplet voyait le dashboard vide.
        // Maintenant : même logique que les deux autres flows.
        var _lsSetup = !!window.S.sportType;
        var _lsProg = (Array.isArray(window.S.sportProgram) && window.S.sportProgram.length > 0) || !!window.S.muscuIAProgram;
        if (window.S.sStep > 0 && _PROG_STEPS_AUTH.indexOf(window.S.sStep) !== -1 && !_lsSetup) { window.S.view = 'sport'; }
        else if (window.S.appMode === 'sport' && !_lsSetup && !_lsProg) { window.S.view = 'sport'; }
        else if (window.S.appMode === 'both' && window.S.nStep === 12 && !_lsSetup && !_lsProg) { window.S.view = 'sport'; }
        else if (window.S.nStep > 0 && window.S.nStep < 12) { window.S.view = 'nutrition'; }
        else { window.S.view = 'today'; }
        if (window.I18N && window.S.lang) window.I18N.current = window.S.lang;
        if (window.UNITS) {
          window.UNITS.weight = window.S.weightUnit || 'kg';
          window.UNITS.height = window.S.heightUnit || 'cm';
        }
        // Sync from cloud too
        if (window.SupaSync) {
          window.SupaSync.syncOnLogin();
          window.SupaSync.startAutoSync();
        }
        if (window.render) window.render();
      }
    }).catch(function() {});
    return Promise.race([_authReady, timeout]);
  },

  /**
   * Register a new user (async — returns Promise)
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @param {object} [extra] - optional: { nom, phone }
   * @returns {Promise<{ok:boolean, user?:object, error?:string}>}
   */
  register: function(name, email, password, extra) {
    var startTime = Date.now();
    name = sanitize((name || '').trim());
    email = (email || '').trim().toLowerCase();
    extra = extra || {};

    // Validation locale
    if (!validateName(name)) {
      return withTimingDelay(Promise.resolve({ ok: false, error: 'Pr\u00e9nom requis (min 2 caract\u00e8res)' }), startTime);
    }
    if (!validateEmail(email)) {
      return withTimingDelay(Promise.resolve({ ok: false, error: 'Email invalide' }), startTime);
    }
    if (!validatePassword(password)) {
      return withTimingDelay(Promise.resolve({ ok: false, error: 'Mot de passe min 6 caract\u00e8res' }), startTime);
    }

    var metaData = { name: name };
    if (extra.nom)   metaData.nom   = sanitize(extra.nom.trim());
    if (extra.phone) metaData.phone = sanitize(extra.phone.trim());

    // Tenter Supabase
    var client = _getClient();
    if (!client) {
      return _fallbackRegister(name, email, password, extra, startTime);
    }

    var promise = client.auth.signUp({
      email: email,
      password: password,
      options: { data: metaData }
    }).then(function(result) {
      if (result.error) {
        console.error('[AUTH] Supabase register error:', result.error.message || result.error);
        return { ok: false, error: mapSupabaseError(result.error) };
      }
      var data = result.data;
      if (data && data.user) {
        var u = {
          id: data.user.id,
          name: name,
          email: email
        };
        // NE PAS assigner _currentSession ici — l'email n'est pas encore confirmé
        // L'utilisateur doit confirmer son email avant d'avoir accès
        BLACKBOX.log('register', { email: email });
        return { ok: true, user: u, needsConfirmation: true };
      }
      return { ok: false, error: 'Erreur de connexion. R\u00e9essayez.' };
    }).catch(function(err) {
      console.error('[AUTH] Supabase register exception:', err);
      // Fallback localStorage en cas d'erreur reseau
      try {
        return _fallbackRegister(name, email, password, extra, Date.now()).then(function(r) { return r; });
      } catch (e2) {
        return { ok: false, error: mapSupabaseError(err) };
      }
    });

    return withTimingDelay(promise, startTime);
  },

  /**
   * Login an existing user (async — returns Promise)
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ok:boolean, user?:object, error?:string}>}
   */
  login: function(email, password) {
    var startTime = Date.now();
    email = (email || '').trim().toLowerCase();

    if (!validateEmail(email)) {
      return Promise.resolve({ ok: false, error: 'Email invalide' });
    }

    // Rate limiting
    var rl = checkRateLimit(email);
    if (rl.blocked) {
      var mins = Math.ceil(rl.remaining / 60);
      return Promise.resolve({ ok: false, error: 'Trop de tentatives. R\u00e9essayez dans ' + mins + ' minute' + (mins > 1 ? 's' : '') + '.' });
    }

    // Tenter Supabase
    var client = _getClient();
    if (!client) {
      return _fallbackLogin(email, password, startTime);
    }

    var _retried = false;

    function _trySupabaseLogin(c) {
      return c.auth.signInWithPassword({
        email: email,
        password: password
      }).then(function(result) {
        if (result.error) {
          console.error('[AUTH] Supabase login error:', result.error.message || result.error);

          // If credentials rejected and we haven't retried yet, the Supabase client
          // may be stuck from a hung getSession(). Reset and retry once.
          if (!_retried && result.error.message &&
              result.error.message.indexOf('Invalid login credentials') !== -1 &&
              window.resetSupabaseClient) {
            _retried = true;
            console.log('[AUTH] Retrying login with fresh Supabase client');
            var freshClient = window.resetSupabaseClient();
            if (freshClient) {
              _useSupabase = true;
              return _trySupabaseLogin(freshClient);
            }
          }

          recordFailedAttempt(email);
          BLACKBOX.log('login_failed', { email: email });
          var rlAfter = getRateLimit(email);
          var attemptsLeft = Math.max(0, MAX_ATTEMPTS - rlAfter.attempts);
          var errMsg = mapSupabaseError(result.error);
          if (attemptsLeft > 0 && attemptsLeft <= 2) {
            errMsg += ' (' + attemptsLeft + ' tentative' + (attemptsLeft > 1 ? 's' : '') + ' restante' + (attemptsLeft > 1 ? 's' : '') + ')';
          }
          return { ok: false, error: errMsg };
        }
        var data = result.data;
        if (data && data.user) {
          var u = _extractUser(data.user);
          _migrateAnonKeys(u.id);
          _currentSession = u;
          setLegacySession(_currentSession); // sync localStorage pour survivre à un refresh immédiat
          _useSupabase = true;
          clearRateLimit(email);
          BLACKBOX.log('login', { email: email });
          return { ok: true, user: u };
        }
        return { ok: false, error: 'Erreur de connexion. R\u00e9essayez.' };
      });
    }

    var promise = _trySupabaseLogin(client).catch(function(err) {
      console.error('[AUTH] Supabase login exception:', err);
      // Fallback localStorage en cas d'erreur reseau
      try {
        return _fallbackLogin(email, password, Date.now()).then(function(r) { return r; });
      } catch (e2) {
        recordFailedAttempt(email);
        return { ok: false, error: mapSupabaseError(err) };
      }
    });

    return withTimingDelay(promise, startTime);
  },

  /**
   * Logout the current user
   */
  /**
   * FIX V6 2026-04 : logout devient asynchrone — flush BLOQUANT avant cleanup.
   * Avant : saveProfile fire-and-forget → signOut invalide token → upsert échoue
   *         → reset S écrit les valeurs par défaut dans le cloud à la 2e itération.
   * Maintenant : on attend la fin du save (timeout 5s pour ne pas bloquer l'UX si
   *              Supabase est lent) AVANT signOut + reset. Données utilisateur préservées.
   */
  logout: function() {
    var self = this;
    var _started = Date.now();
    var _done = false;
    var _runCleanup = function() {
      if (_done) return; // anti-double-trigger (timeout vs then)
      _done = true;
      try { self._performLogoutCleanup(); }
      catch (e) { console.warn('[AUTH] logout cleanup error:', e); }
    };

    if (window.SupaSync && typeof window.SupaSync.saveProfile === 'function') {
      try {
        var _p = window.SupaSync.saveProfile();
        if (_p && typeof _p.then === 'function') {
          _p.then(_runCleanup, _runCleanup);
          // Timeout 5s : si Supabase trop lent, on continue le logout sans bloquer l'UX
          setTimeout(_runCleanup, 5000);
        } else {
          _runCleanup();
        }
      } catch (e) {
        console.warn('[AUTH] logout flush error:', e);
        _runCleanup();
      }
    } else {
      _runCleanup();
    }
  },

  /**
   * Cleanup proprement dit (ex-corps de logout). Appelé par logout() après flush.
   */
  _performLogoutCleanup: function() {
    BLACKBOX.log('logout', { duration: BLACKBOX.getSessionMinutes() });

    // Arreter la sync
    if (window.SupaSync) {
      try { SupaSync.stopAutoSync(); } catch (e) {}
    }

    // Supabase signOut
    var client = _getClient();
    if (client) {
      try {
        client.auth.signOut().catch(function() {});
      } catch (e) {}
    }

    // Reset window.S profile data to prevent stale values from polluting next login
    // (localStorage data is kept intact so returning users can restore from it)
    if (window.S) {
      window.S.sex = null; window.S.age = 28; window.S.birthDate = null; window.S.weight = 75; window.S.height = 175;
      window.S.activity = null; window.S.train = []; window.S.sleep = null;
      window.S.medical = []; window.S.goal = null; window.S.targetWeight = null;
      window.S.mealsPerDay = 3; window.S.eatingLocation = null; window.S.mealPrepTime = null;
      window.S.snacking = null; window.S.alcoholFreq = null; window.S.alcoholTypes = [];
      window.S.hydration = null; window.S.cookLevel = 2; window.S.whey = null;
      window.S.allergies = []; window.S.intolerances = []; window.S.regime = 0;
      window.S.halal = false; window.S.excluded = ''; window.S.cuisines = [0];
      window.S.weekPlan = null; window.S.selectedDay = 0;
      window.S.nStep = 0; window.S.sStep = 0;
      window.S.sportType = null; window.S.sportGoals = []; window.S.sportLevel = null;
      window.S.sportDays = 3; window.S.sportEquipment = 'gym';
      window.S.weightHistory = [];
      window.S.bodyZones = {}; window.S.strongZones = []; window.S.weakZones = [];
      window.S.muscuWeek = 1; window.S.muscuCycle = 1; window.S.muscuProgramCount = 0; window.S.sportSplashDone = false;
      window.S.sportMixEnabled = false; window.S.sportMixSecondary = null;
      // FIX F4 CONTRE-AUDIT 2026-04 : reset flags validation au logout pour éviter
      // leak inter-users sur device partagé (user2 voyait sportProgram=validé de user1).
      window.S.sportProgramValidated = false; window.S.sportProgramValidatedAt = null;
      window.S.weekPlanValidated = false; window.S.weekPlanValidatedISOWeek = null;
      // FIX P0 audit cohérence : pushNotifsEnabled reset (sinon user B hérite
      // du flag user A → reçoit notifications d'un autre user, fuite confidentialité)
      window.S.pushNotifsEnabled = true; // défaut activé (l'user pourra désactiver via toggle)
      // COACH ADAPTATIF 2026-04 : reset feedback séances (sinon fuite inter-users).
      window.S.sessionFeedback = {};
      window.S.bonusExercises = {}; window.S.sessionHistory = {};
      window.S.muscuSessionLog = {}; window.S.muscuProgressionHistory = {};
      window.S.musculationWeights = {};
      window.S.crossfitLevel = null; window.S.cfCurrentDay = 1; window.S.cfProgress = {};
      window.S.crossfit1RM = {}; window.S.muscuStrengthProfile = {};
      // Pregnancy & cycle
      window.S.pregnant = false; window.S.pregnancyWeek = null; window.S.dueDate = null;
      window.S.prePregnancyWeight = null;
      window.S.cycleTracking = false; window.S.cycleLength = 28; window.S.lastPeriodDate = null;
      // Supplements
      window.S.creatine = false; window.S.creatineDose = 0;
      window.S.supplements = []; window.S.wheyFlavors = [];
      // Photos
      window.S.photoFront = null; window.S.photoBack = null;
      // Nutrition extras
      window.S.wantsDessert = false; window.S.saladBar = null; window.S.saladBuilder = null;
      window.S.smoothieBarOpen = false; window.S.modalRecipe = null; window.S.modalSmoothie = null;
      window.S._nm = null; window.S.calories = null; window.S.caloriesTarget = 2000;
      // Shopping
      window.S.shopListOpen = false; window.S.shopArMode = null;
      window.S.shopFreq = null; window.S.shopStores = []; window.S.shopBudget = null;
      window.S.shopPrefs = []; window.S.shopChecked = {};
      // Sport general
      window.S.sportFocus = {}; window.S.sportModalExercise = null;
      window.S.sportProgram = null; window.S.sportSessionDuration = null;
      window.S.muscuMedical = {}; window.S.muscuProgramStart = null;
      window.S.swapPanel = null; window.S.sessionCompleting = null;
      window.S.selectedSportDay = 0; window.S.crossfitCycleWeek = 1;
      window.S.trainTime = null; window.S.heartRateRest = null;
      // Running
      window.S.runningDays = null; window.S.runningGoal = null;
      window.S.runningLevel = null; window.S.runningPace = null;
      window.S.runningWeek = 1; window.S.runningProgram = null; window.S.selectedRunDay = 0;
      // Cycling
      window.S.cyclingDays = null; window.S.cyclingGoal = null;
      window.S.cyclingLevel = null; window.S.cyclingType = null;
      window.S.cyclingSpeed = null; window.S.cyclingFTP = null;
      window.S.cyclingRelief = null; window.S.cyclingWeek = 1;
      window.S.cyclingProgram = null; window.S.selectedCyclingDay = 0;
      // Triathlon
      window.S.triathlonGoal = null; window.S.triathlonLevel = null;
      window.S.triathlonWeek = 1; window.S.triathlonProgram = null;
      window.S.selectedTriDay = 0; window.S.triathlonSwimPace = null;
      window.S.triathlonBikePace = null; window.S.triathlonRunPace = null;
      window.S.triathlonWeak = null;
      // Hyrox
      window.S.hyroxDays = null; window.S.hyroxGoal = null;
      window.S.hyroxLevel = null; window.S.hyroxWeek = 1;
      window.S.hyroxProgram = null; window.S.selectedHyroxDay = 0;
      window.S.hyroxBenchmarks = {};
      // Padel
      window.S.padelDays = null; window.S.padelGoal = null;
      window.S.padelLevel = null; window.S.padelWeek = 1;
      window.S.padelProgram = null; window.S.selectedPadelDay = 0;
      window.S.padelProfile = null;
      // Golf
      window.S.golfDays = null; window.S.golfGoal = null;
      window.S.golfLevel = null; window.S.golfHandicap = null;
      window.S.golfWeek = 1; window.S.golfProgram = null;
      window.S.selectedGolfDay = 0; window.S.golfProfile = null;
      // Yoga
      window.S.yogaLevel = null; window.S.yogaGoal = null; window.S.yogaDays = 3;
      window.S.yogaDuration = null; window.S.yogaStyle = null;
      window.S.yogaObjectif = null; window.S.yogaWeek = 1; window.S.yogaDay = 0;
      // Calisthenics
      window.S.calisthenicsLevel = null; window.S.calisthenicsGoal = null;
      window.S.calisthPullups = null; window.S.calisthPushups = null;
      window.S.calisthenicsdays = 3; window.S.calisthenicsOnboardingStep = null;
      window.S.calisthenicsProgram = null; window.S.calisthenicsWeek = 1; window.S.selectedCalisthDay = 0;
      window.S.calisthCurrentWeek = 1; window.S.calisthDips = null;
      window.S.crossfitBenchmarks = {};
      // Lang/Units (reset to defaults)
      window.S.lang = 'fr'; window.S.weightUnit = 'kg'; window.S.heightUnit = 'cm';
      window.S.emailOptin = true; window.S.profilePhoto = null;
      // UI state
      window.S.view = 'auth'; window.S.authError = '';
      window.S.cfCalendarOpen = false;
      // App state — must be reset to avoid stale values polluting next login
      window.S.appMode = null; window.S.prenom = ''; window.S.nom = null; window.S.phone = null; window.S.welcomeShown = false;
      window.S.todayWellness = null; window.S.firstLoginDate = null;
      // Additional PROFILE_KEYS missing from reset — prevent stale data leaking to next user on shared device
      window.S.crossfitWeek = 1; window.S.selectedCrossfitDay = 0;
      window.S.mealsLogged = {}; window.S._weekPlanGeneratedAt = null; window.S._planHash = '';
      window.S.aiCoachHistory = []; window.S.nutritionLog = {};
      window.S.weeklyCalendar = null; window.S.smartCalendarEnabled = false; window.S.smartCalendarDismissed = false;
      window.S.bodyScanDone = false; window.S._bodyFatEstimate = null;
      window.S._bodyCompositionProfile = null; window.S._bodyCompositionWeight = null;
      window.S.waist = null; window.S.parqDone = false; window.S.parqResult = null;
      window.S._parqNextStep = null; window.S._sportProfileDone = false;
      window.S._switchedFromSport = null; window.S._switchedFromNutrition = null;
      window.S.streakFreezeUsedMonth = null; window.S.streakFreezeAvailable = true; window.S.swapCount = 0;
      window.S.cfDeloadRecommended = false; window.S.sessionPostponed = false; window.S.stress = null;
      window.S.trainingDaysSelected = []; window.S.muscuObjectifSpecifique = null;
      window.S.muscuZonesCibles = []; window.S.muscuRenforcementNote = '';
      // PROFILE_KEYS non réinitialisées précédemment — fuite inter-utilisateurs sur appareil partagé
      window.S.mealTimes = {breakfast:'08:00',lunch:'12:30',snack:'16:00',dinner:'19:30'};
      window.S.restDayMood = null;
      window.S.competitionGoal = null; window.S.competitionDate = null; window.S.competitionType = null;
      window.S.sportHobbies = []; window.S.installations = []; window.S.calisthenicsEquipment = [];
      window.S.crossfitCompGoal = null; window.S.crossfitOpenDate = null;
      window.S.runningVO2max = null; window.S.triathlonFTP = null; window.S.triathlonRaceDate = null;
    }

    // ── Nettoyer UNIQUEMENT les tokens Supabase (session fantôme) ──
    // FIX BUG PERSISTANCE 2026-04 : on NE SUPPRIME PLUS les clés mtd_* car :
    //   1. Elles sont keyées par uid → user2 qui log in sur le même device
    //      ne verra pas les données de user1 (loadProfile lit mtd_profile_<uid2>)
    //   2. Supprimer annulait la reconnexion rapide : à la re-connexion, le cloud
    //      stale (debounce pas flushé) redevenait la seule source → perte de données
    //   3. La RGPD "suppression compte" reste dispo via la fiche perso
    try {
      var _keysToRemove = [];
      for (var _ki = 0; _ki < localStorage.length; _ki++) {
        var _k = localStorage.key(_ki);
        // Tokens Supabase uniquement (sb-*) → évite session fantôme entre comptes
        if (_k && _k.indexOf('sb-') === 0) {
          _keysToRemove.push(_k);
        }
      }
      for (var _ri = 0; _ri < _keysToRemove.length; _ri++) {
        localStorage.removeItem(_keysToRemove[_ri]);
      }
    } catch(e) { console.warn('localStorage cleanup error:', e); }

    // Nettoyer la session locale + legacy
    _currentSession = null;
    clearLegacySession();
    window._authInitialized = false;
    // FIX F1 (contre-audit V4 2026-04) : reset _authReadyResolved sinon au re-login
    // sans reload, isAuthRestoring() retourne false (car flag stale=true) →
    // saveProfile écrit dans mtd_profile_anon pendant que la nouvelle session se charge.
    // Reproduction du bug V4 d'origine.
    // NOTE : on garde _useSupabase=true sinon isAuthRestoring() retourne false.
    //        Le flag sera de toute façon re-positionné par _initAuth au re-login.
    _authReadyResolved = false;

    // Désabonner la subscription Supabase onAuthStateChange
    if (_authStateSubscription) {
      try { _authStateSubscription.unsubscribe(); } catch(e) {}
      _authStateSubscription = null;
    }

    // Supprimer les event listeners pour éviter les fuites mémoire
    if (_visibilityListener) {
      try { document.removeEventListener('visibilitychange', _visibilityListener); } catch(e) {}
      _visibilityListener = null;
    }
    if (_beforeUnloadListener) {
      try { window.removeEventListener('beforeunload', _beforeUnloadListener); } catch(e) {}
      _beforeUnloadListener = null;
    }

    // Rediriger vers l'écran de connexion
    if (window.render) window.render();
  },

  /**
   * Check if a user is currently logged in
   * @returns {boolean}
   */
  isLoggedIn: function() {
    return _currentSession !== null;
  },

  /**
   * Get the current user's session data
   * @returns {{id:string, name:string, email:string}|null}
   */
  getUser: function() {
    return _currentSession;
  },

  /**
   * FIX V4 2026-04 : indique si on est en train de restorer la session Supabase au démarrage.
   * Pendant cette fenêtre (~12s max), getUser() peut retourner null à tort. Les
   * appelants critiques (saveProfile) doivent éviter de sauvegarder pour ne pas
   * écrire dans `mtd_profile_anon` à la place du vrai uid.
   * @returns {boolean} true si Supabase est disponible mais que la session n'est pas encore chargée
   */
  isAuthRestoring: function() {
    return _useSupabase && !_authReadyResolved && _currentSession === null;
  },

  /**
   * Logout cleanup helper — reset le flag de restore (utilisé par tests)
   */
  _resetAuthReadyFlag: function() {
    _authReadyResolved = false;
  },

  /**
   * Update user profile data (name)
   * @param {string} newName
   * @returns {{ok:boolean, error?:string}}
   */
  updateProfile: function(newName) {
    if (!_currentSession) return { ok: false, error: 'Non connect\u00e9' };

    newName = sanitize((newName || '').trim());
    if (!validateName(newName)) {
      return { ok: false, error: 'Pr\u00e9nom invalide (min 2 caract\u00e8res)' };
    }

    // Mettre a jour Supabase (fire and forget)
    var client = _getClient();
    if (client) {
      try {
        client.auth.updateUser({ data: { name: newName } }).catch(function(e) {
          console.warn('[AUTH] updateProfile Supabase error:', e);
        });
      } catch (e) {}
    }

    // Mettre a jour la session locale immediatement
    _currentSession.name = newName;

    // Fallback : aussi mettre a jour le localStorage legacy
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
      if (users[i].id === _currentSession.id) {
        users[i].name = newName;
        saveUsers(users);
        break;
      }
    }

    BLACKBOX.log('profile_update', { name: newName });
    return { ok: true };
  },

  /**
   * Change user password (async — returns Promise)
   * @param {string} currentPassword
   * @param {string} newPassword
   * @returns {Promise<{ok:boolean, error?:string}>}
   */
  changePassword: function(currentPassword, newPassword) {
    if (!_currentSession) return Promise.resolve({ ok: false, error: 'Non connect\u00e9' });

    if (!validatePassword(newPassword)) {
      return Promise.resolve({ ok: false, error: 'Nouveau mot de passe min 6 caract\u00e8res' });
    }

    // Tenter Supabase
    var client = _getClient();
    if (client) {
      return client.auth.updateUser({ password: newPassword }).then(function(result) {
        if (result.error) {
          return { ok: false, error: mapSupabaseError(result.error) };
        }
        BLACKBOX.log('password_change', {});
        return { ok: true };
      }).catch(function(err) {
        // Fallback localStorage
        return _fallbackChangePassword(currentPassword, newPassword);
      });
    }

    // Fallback localStorage
    return _fallbackChangePassword(currentPassword, newPassword);
  },

  /**
   * Send a password reset email via Supabase
   * @param {string} email
   * @returns {Promise<{ok:boolean, error?:string}>}
   */
  resetPassword: function(email) {
    if (!email || !validateEmail(email)) {
      return Promise.resolve({ ok: false, error: 'Adresse email invalide' });
    }

    // Use raw client for reset — this must work even if _useSupabase is false
    var client = _getClient() || _getRawClient();
    if (!client) {
      return Promise.resolve({ ok: false, error: 'Service indisponible. R\u00e9essayez plus tard.' });
    }

    var redirectUrl = window.location.origin + window.location.pathname;
    console.log('[AUTH] resetPassword for:', email, 'redirectTo:', redirectUrl);

    return client.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    }).then(function(result) {
      if (result.error) {
        console.error('[AUTH] Supabase resetPassword error:', result.error.message || result.error);
        var msg = (result.error.message || '').toLowerCase();
        if (msg.indexOf('security') !== -1 || msg.indexOf('60 second') !== -1) {
          return { ok: false, error: 'Veuillez patienter 60 secondes avant de r\u00e9essayer.' };
        }
        if (msg.indexOf('rate') !== -1 || msg.indexOf('limit') !== -1) {
          return { ok: false, error: 'Trop de tentatives. R\u00e9essayez dans quelques minutes.' };
        }
        return { ok: false, error: 'Erreur lors de l\u2019envoi. R\u00e9essayez.' };
      }
      BLACKBOX.log('password_reset_requested', { email: email });
      return { ok: true };
    }).catch(function(err) {
      console.error('[AUTH] resetPassword exception:', err);
      return { ok: false, error: 'Erreur r\u00e9seau. V\u00e9rifiez votre connexion.' };
    });
  },

  /**
   * Delete the current user account (async — returns Promise)
   * @param {string} password
   * @returns {Promise<{ok:boolean, error?:string}>}
   */
  deleteAccount: function(password) {
    if (!_currentSession) return Promise.resolve({ ok: false, error: 'Non connect\u00e9' });

    var sessionId = _currentSession.id;
    var sessionEmail = _currentSession.email;

    // Tenter Supabase — suppression RÉELLE via Netlify function (GDPR)
    var client = _getClient();
    if (client) {
      BLACKBOX.log('account_delete_requested', { email: sessionEmail });

      // Arreter la sync
      if (window.SupaSync) {
        try { SupaSync.stopAutoSync(); } catch (e) {}
      }

      // Récupérer le token JWT pour authentifier la requête serveur
      return client.auth.getSession().then(function(res) {
        var token = (res && res.data && res.data.session) ? res.data.session.access_token : null;
        if (!token) {
          // Pas de token — fallback : déconnexion + nettoyage local seulement
          _currentSession = null; clearLegacySession(); _cleanupLocalData(sessionId);
          return { ok: true, warning: 'Compte déconnecté localement. Contactez support@smartfitcoach.com pour suppression serveur.' };
        }
        // Appel serveur — suppression réelle du compte et des données
        return fetch('/.netlify/functions/delete-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
        }).then(function(resp) { return resp.json(); }).then(function(data) {
          _currentSession = null; clearLegacySession(); _cleanupLocalData(sessionId);
          BLACKBOX.log('account_deleted_server', { email: sessionEmail, success: !!data.success });
          return { ok: true };
        }).catch(function(err) {
          // Erreur réseau — déconnexion locale + message
          console.error('[AUTH] deleteAccount server error:', err);
          _currentSession = null; clearLegacySession(); _cleanupLocalData(sessionId);
          return { ok: true, warning: 'Compte déconnecté. La suppression serveur sera finalisée sous 72h.' };
        });
      });
    }

    // Fallback localStorage
    return _fallbackDeleteAccount(password, sessionId);
  }
};

// ─── FALLBACK CHANGE PASSWORD (localStorage) ───
function _fallbackChangePassword(currentPassword, newPassword) {
  var session = _currentSession;
  if (!session) return Promise.resolve({ ok: false, error: 'Non connect\u00e9' });

  var users = getUsers();
  var targetUser = null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === session.id) { targetUser = users[i]; break; }
  }
  if (!targetUser) return Promise.resolve({ ok: false, error: 'Utilisateur introuvable' });

  return verifyPasswordAsync(currentPassword, targetUser.pwHash).then(function(valid) {
    if (!valid) return { ok: false, error: 'Mot de passe actuel incorrect' };
    return hashPasswordAsync(newPassword).then(function(newHash) {
      var freshUsers = getUsers();
      for (var j = 0; j < freshUsers.length; j++) {
        if (freshUsers[j].id === session.id) {
          freshUsers[j].pwHash = newHash;
          saveUsers(freshUsers);
          BLACKBOX.log('password_change', {});
          return { ok: true };
        }
      }
      return { ok: false, error: 'Utilisateur introuvable' };
    });
  });
}

// ─── FALLBACK DELETE ACCOUNT (localStorage) ───
function _fallbackDeleteAccount(password, sessionId) {
  var users = getUsers();
  var targetUser = null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === sessionId) { targetUser = users[i]; break; }
  }
  if (!targetUser) return Promise.resolve({ ok: false, error: 'Utilisateur introuvable' });

  return verifyPasswordAsync(password, targetUser.pwHash).then(function(valid) {
    if (!valid) return { ok: false, error: 'Mot de passe incorrect' };
    BLACKBOX.log('account_deleted', { email: targetUser.email });
    var freshUsers = getUsers();
    for (var j = 0; j < freshUsers.length; j++) {
      if (freshUsers[j].id === sessionId) {
        freshUsers.splice(j, 1);
        saveUsers(freshUsers);
        _currentSession = null;
        clearLegacySession();
        return { ok: true };
      }
    }
    return { ok: false, error: 'Utilisateur introuvable' };
  });
}

// ─── CLEANUP LOCAL DATA ───
function _cleanupLocalData(userId) {
  try {
    // Supprimer le user du localStorage legacy
    var users = getUsers();
    for (var j = 0; j < users.length; j++) {
      if (users[j].id === userId) {
        users.splice(j, 1);
        saveUsers(users);
        break;
      }
    }
    // Supprimer TOUTES les clés localStorage spécifiques à cet utilisateur
    if (userId) {
      var _keysToRemove = [];
      for (var _ki = 0; _ki < localStorage.length; _ki++) {
        var _k = localStorage.key(_ki);
        if (_k && _k.indexOf(userId) !== -1) _keysToRemove.push(_k);
      }
      for (var _ri = 0; _ri < _keysToRemove.length; _ri++) {
        localStorage.removeItem(_keysToRemove[_ri]);
      }
    }
    // Supprimer les clés globales (sans userId) liées au profil
    var _globalKeys = ['mtd_onboarding_done', 'mtd_login_rl'];
    for (var _gi = 0; _gi < _globalKeys.length; _gi++) {
      try { localStorage.removeItem(_globalKeys[_gi]); } catch(e2) {}
    }
    // Supprimer mtd_profile_anon — créé quand saveProfile() s'exécute sans session active
    try { localStorage.removeItem('mtd_profile_anon'); } catch(e3) {}
    try { localStorage.removeItem('mtd_weight_history_anon'); } catch(e4) {}
  } catch (e) {}
}

// ─── BLACKBOX — Activity Logging ───
window.BLACKBOX = {

  /**
   * Log an activity event
   * @param {string} action
   * @param {object} data
   */
  log: function(action, data) {
    try {
      var user = _currentSession;
      var logs = [];
      try {
        logs = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
      } catch (e) {
        logs = [];
      }

      logs.push({
        userId: user ? user.id : 'anonymous',
        userName: user ? user.name : 'anonymous',
        action: String(action || 'unknown'),
        data: data || {},
        timestamp: Date.now(),
        date: new Date().toISOString(),
        page: window.location.pathname
      });

      if (logs.length > 10000) {
        logs = logs.slice(-10000);
      }

      localStorage.setItem(LOG_KEY, JSON.stringify(logs));
    } catch (e) {
      // Silently fail if storage is unavailable
    }
  },

  /**
   * Get duration of current session in minutes
   * @returns {number}
   */
  getSessionMinutes: function() {
    try {
      var start = parseInt(localStorage.getItem(SESSION_START_KEY) || '0', 10);
      if (!start || isNaN(start)) return 0;
      return Math.round((Date.now() - start) / 60000);
    } catch (e) {
      return 0;
    }
  },

  /**
   * Get all logs, optionally filtered by userId
   * @param {string} [userId]
   * @returns {Array}
   */
  getUserLogs: function(userId) {
    try {
      var logs = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
      if (userId) {
        return logs.filter(function(l) { return l.userId === userId; });
      }
      return logs;
    } catch (e) {
      return [];
    }
  },

  /**
   * Get a summary report of user activity
   * @param {string} [userId]
   * @returns {{totalActions:number, actions:object, firstSeen:string|null, lastSeen:string|null}}
   */
  getReport: function(userId) {
    var logs = this.getUserLogs(userId);
    var actions = {};
    for (var i = 0; i < logs.length; i++) {
      var a = logs[i].action;
      actions[a] = (actions[a] || 0) + 1;
    }
    return {
      totalActions: logs.length,
      actions: actions,
      firstSeen: logs.length ? logs[0].date : null,
      lastSeen: logs.length ? logs[logs.length - 1].date : null
    };
  },

  /**
   * Get logs for a specific date range
   * @param {number} startTimestamp
   * @param {number} endTimestamp
   * @param {string} [userId]
   * @returns {Array}
   */
  getLogsByDateRange: function(startTimestamp, endTimestamp, userId) {
    var logs = this.getUserLogs(userId);
    return logs.filter(function(l) {
      return l.timestamp >= startTimestamp && l.timestamp <= endTimestamp;
    });
  },

  /**
   * Clear all logs (admin utility)
   */
  clearLogs: function() {
    try {
      localStorage.removeItem(LOG_KEY);
    } catch (e) {}
  },

  /**
   * Export logs as JSON string (for download/debug)
   * @param {string} [userId]
   * @returns {string}
   */
  exportJSON: function(userId) {
    var logs = this.getUserLogs(userId);
    return JSON.stringify(logs, null, 2);
  }
};

// ─── AUTOMATIC SESSION TRACKING ───

_visibilityListener = function() {
  if (document.hidden) {
    BLACKBOX.log('page_hidden', {});
  } else {
    BLACKBOX.log('page_visible', {});
  }
};
document.addEventListener('visibilitychange', _visibilityListener);

// Track unload for session duration — must be set BEFORE _initAuth() to prevent double-registration
_beforeUnloadListener = function() {
  if (AUTH.isLoggedIn()) {
    BLACKBOX.log('page_unload', { sessionMinutes: BLACKBOX.getSessionMinutes() });
  }
};
window.addEventListener('beforeunload', _beforeUnloadListener);

// ─── INIT BOOT ───
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _initAuth);
} else {
  _initAuth();
}

// Resume session tracking on page load (after init)
setTimeout(function() {
  if (AUTH.isLoggedIn()) {
    if (!localStorage.getItem(SESSION_START_KEY)) {
      localStorage.setItem(SESSION_START_KEY, String(Date.now()));
    }
    BLACKBOX.log('session_resume', {});
  }
}, 0);

})();
