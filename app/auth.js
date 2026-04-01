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
      // Clean up expired lockouts AND old entries (>24h)
      if (data[k].lockedUntil && data[k].lockedUntil < now) delete data[k];
      else if (!data[k].lockedUntil && data[k].attempts < MAX_ATTEMPTS) delete data[k];
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
      navigator.userAgent || '',
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

function _loadLegacySession() {
  if (isLegacySessionValid()) {
    var s = getLegacySession();
    if (s) {
      _currentSession = { id: s.id, name: s.name, email: s.email };
      console.log('[AUTH] Legacy session restored for:', s.email);
    }
  }
}

function _extractUser(supaUser) {
  if (!supaUser) return null;
  var email = supaUser.email || '';
  return {
    id: supaUser.id,
    name: (supaUser.user_metadata && supaUser.user_metadata.name) || email.split('@')[0] || 'Utilisateur',
    email: email
  };
}

// ─── INIT : charger la session Supabase au boot ───
function _initAuth() {
  var client = _getRawClient();
  if (!client) {
    console.warn('[AUTH] Supabase SDK not loaded, using localStorage fallback');
    _loadLegacySession();
    return;
  }

  _useSupabase = true;

  // Ecouter les changements d'auth
  client.auth.onAuthStateChange(function(event, session) {
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
    if (session && session.user) {
      _currentSession = _extractUser(session.user);
    } else {
      _currentSession = null;
    }
  });

  // Charger la session existante (async)
  // Store the promise so app-main.js can await it before first render
  _authReady = client.auth.getSession().then(function(result) {
    if (result.error) {
      console.error('[AUTH] Supabase getSession error:', result.error.message || result.error);
      _useSupabase = false;
      _loadLegacySession();
      return;
    }
    console.log('[AUTH] Supabase connected OK');
    if (result.data && result.data.session && result.data.session.user) {
      _currentSession = _extractUser(result.data.session.user);
      console.log('[AUTH] Session restored for:', _currentSession.email);
    }
  }).catch(function(err) {
    console.error('[AUTH] Supabase connection failed:', err);
    _useSupabase = false;
    _loadLegacySession();
  });
}

// ─── FALLBACK REGISTER (localStorage) ───
function _fallbackRegister(name, email, password, startTime) {
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
    var currentUsers = getUsers();
    for (var j = 0; j < currentUsers.length; j++) {
      if (currentUsers[j].email === email) {
        return { ok: false, error: 'Cet email est d\u00e9j\u00e0 utilis\u00e9' };
      }
    }
    currentUsers.push(user);
    saveUsers(currentUsers);
    setLegacySession(user);
    _currentSession = { id: user.id, name: user.name, email: user.email };
    BLACKBOX.log('register', { email: email });
    return { ok: true, user: { id: user.id, name: user.name, email: user.email } };
  });

  return withTimingDelay(promise, startTime);
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
    setLegacySession(user);
    _currentSession = { id: user.id, name: user.name, email: user.email };
    BLACKBOX.log('login', { email: email });
    return { ok: true, user: { id: user.id, name: user.name, email: user.email } };
  });

  return withTimingDelay(loginPromise, startTime);
}

// ─── AUTH MODULE ───
window.AUTH = {

  /** Promise that resolves when the initial session check is done (with 5s timeout) */
  ready: function() {
    var timeout = new Promise(function(resolve) {
      setTimeout(function() {
        console.warn('[AUTH] ready() timed out after 5s, clearing stale tokens');
        // Clear stale Supabase auth tokens that caused getSession() to hang.
        // Keep _useSupabase = true so login() still tries Supabase.
        // The login retry mechanism will reset the client if needed.
        try {
          Object.keys(localStorage).forEach(function(k) {
            if (k.indexOf('sb-') === 0 && k.indexOf('-auth-token') !== -1) {
              localStorage.removeItem(k);
            }
          });
          console.log('[AUTH] Cleared stale Supabase tokens');
        } catch (e) {}
        resolve();
      }, 5000);
    });
    return Promise.race([_authReady, timeout]);
  },

  /**
   * Register a new user (async — returns Promise)
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ok:boolean, user?:object, error?:string}>}
   */
  register: function(name, email, password) {
    var startTime = Date.now();
    name = sanitize((name || '').trim());
    email = (email || '').trim().toLowerCase();

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

    // Tenter Supabase
    var client = _getClient();
    if (!client) {
      return _fallbackRegister(name, email, password, startTime);
    }

    var promise = client.auth.signUp({
      email: email,
      password: password,
      options: { data: { name: name } }
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
        return _fallbackRegister(name, email, password, Date.now()).then(function(r) { return r; });
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
          _currentSession = u;
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
  logout: function() {
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
      window.S.muscuWeek = 1; window.S.muscuCycle = 1; window.S.sportSplashDone = false;
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
      window.S.cyclingPlan = null; window.S.selectedCyclingDay = 0;
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
      // Lang/Units (reset to defaults)
      window.S.lang = 'fr'; window.S.weightUnit = 'kg'; window.S.heightUnit = 'cm';
      window.S.emailOptin = true; window.S.profilePhoto = null;
      // UI state
      window.S.view = 'auth'; window.S.authError = '';
      window.S.cfCalendarOpen = false;
    }

    // Nettoyer la session locale + legacy
    _currentSession = null;
    clearLegacySession();
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
        if (msg.indexOf('not found') !== -1 || msg.indexOf('not registered') !== -1) {
          // Don't reveal if email exists — always show success for security
          BLACKBOX.log('password_reset_requested', { email: email });
          return { ok: true };
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

    // Tenter Supabase
    var client = _getClient();
    if (client) {
      // La suppression reelle necessite une Edge Function (pas encore en place)
      // Pour l'instant : deconnecter + supprimer les donnees locales
      BLACKBOX.log('account_deleted', { email: sessionEmail });

      // Arreter la sync
      if (window.SupaSync) {
        try { SupaSync.stopAutoSync(); } catch (e) {}
      }

      return client.auth.signOut().then(function() {
        _currentSession = null;
        clearLegacySession();
        // Nettoyer les donnees locales
        _cleanupLocalData(sessionId);
        return { ok: true };
      }).catch(function() {
        _currentSession = null;
        clearLegacySession();
        _cleanupLocalData(sessionId);
        return { ok: true };
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

document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    BLACKBOX.log('page_hidden', {});
  } else {
    BLACKBOX.log('page_visible', {});
  }
});

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

// Track unload for session duration
window.addEventListener('beforeunload', function() {
  if (AUTH.isLoggedIn()) {
    BLACKBOX.log('page_unload', { sessionMinutes: BLACKBOX.getSessionMinutes() });
  }
});

})();
