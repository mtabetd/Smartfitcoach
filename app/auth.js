/* ═══════════════════════════════════════════════════════════════
   AUTH.JS — Authentication & BlackBox Activity Tracking
   MTD Macro Calculator
   localStorage-based auth with hashed passwords and session management
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';

// ─── PASSWORD HASHING (SubtleCrypto PBKDF2 / SHA-256, NIST-compliant) ───
// Async: returns Promise<string>
// Salt is per-user (stored alongside hash as "salt:hash")
// Falls back to legacy FNV-1a only when verifying old hashes

var PBKDF2_ITERATIONS = 100000;
var PBKDF2_KEYLEN = 32; // 256 bits

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

// Verify password against stored hash (handles both PBKDF2 and legacy FNV-1a)
function verifyPasswordAsync(password, storedHash) {
  if (storedHash && storedHash.indexOf('pbkdf2:') === 0) {
    var parts = storedHash.split(':');
    // format: pbkdf2:<saltHex>:<hashHex>
    if (parts.length === 3) {
      return hashPasswordAsync(password, parts[1]).then(function(computed) {
        return computed === storedHash;
      });
    }
    return Promise.resolve(false);
  }
  // Legacy FNV-1a hash — verify then migrate on next login
  return Promise.resolve(legacyHashPassword(password) === storedHash);
}

// Legacy FNV-1a (kept only for backward compatibility with existing accounts)
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

// Anti-timing-attack delay: normalize response time to ~300ms minimum
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
    // Clean old entries (> 24h)
    var now = Date.now();
    Object.keys(data).forEach(function(k) {
      if (data[k].lockedUntil < now - 86400000 && data[k].attempts < MAX_ATTEMPTS) delete data[k];
    });
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
  } catch (e) {
    // Storage unavailable — fail open (don't block legitimate users)
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
  // Reset if previous lockout has expired
  if (rl.lockedUntil && now >= rl.lockedUntil) {
    rl.attempts = 0;
    rl.lockedUntil = 0;
  }
  rl.attempts += 1;
  var lockout = rl.attempts >= MAX_ATTEMPTS ? now + LOCKOUT_DURATION : 0;
  setRateLimit(email, rl.attempts, lockout);
}

// ─── USER STORAGE HELPERS ───
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
  } catch (e) {
    // Storage full or unavailable
  }
}

function getSession() {
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

function setSession(user) {
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
  } catch (e) {
    // Storage unavailable
  }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_START_KEY);
  } catch (e) {
    // Ignore
  }
}

// ─── AUTH MODULE ───
window.AUTH = {

  /**
   * Register a new user (async — returns Promise)
   * @param {string} name - User's first name
   * @param {string} email - User's email
   * @param {string} password - User's password (min 6 chars)
   * @returns {Promise<{ok:boolean, user?:object, error?:string}>}
   */
  register: function(name, email, password) {
    var startTime = Date.now();
    // Sanitize inputs
    name = sanitize((name || '').trim());
    email = sanitize((email || '').trim().toLowerCase());

    // Validate
    if (!validateName(name)) {
      return Promise.resolve({ ok: false, error: 'Pr\u00e9nom requis (min 2 caract\u00e8res)' });
    }
    if (!validateEmail(email)) {
      return Promise.resolve({ ok: false, error: 'Email invalide' });
    }
    if (!validatePassword(password)) {
      return Promise.resolve({ ok: false, error: 'Mot de passe min 6 caract\u00e8res' });
    }

    // Check for duplicate email
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
      if (users[i].email === email) {
        return Promise.resolve({ ok: false, error: 'Cet email est d\u00e9j\u00e0 utilis\u00e9' });
      }
    }

    var promise = hashPasswordAsync(password).then(function(pwHash) {
      // Create user object
      var user = {
        id: 'u_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        name: name,
        email: email,
        pwHash: pwHash,
        createdAt: Date.now()
      };

      // Save
      var currentUsers = getUsers();
      // Double-check for race condition duplicates
      for (var j = 0; j < currentUsers.length; j++) {
        if (currentUsers[j].email === email) {
          return { ok: false, error: 'Cet email est d\u00e9j\u00e0 utilis\u00e9' };
        }
      }
      currentUsers.push(user);
      saveUsers(currentUsers);
      setSession(user);

      // Log registration
      BLACKBOX.log('register', { email: email });

      return { ok: true, user: { id: user.id, name: user.name, email: user.email } };
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
    email = sanitize((email || '').trim().toLowerCase());

    if (!validateEmail(email)) {
      return Promise.resolve({ ok: false, error: 'Email invalide' });
    }

    // Rate limiting — brute force protection
    var rl = checkRateLimit(email);
    if (rl.blocked) {
      var mins = Math.ceil(rl.remaining / 60);
      return Promise.resolve({ ok: false, error: 'Trop de tentatives. R\u00e9essayez dans ' + mins + ' minute' + (mins > 1 ? 's' : '') + '.' });
    }

    var users = getUsers();
    var user = null;
    for (var i = 0; i < users.length; i++) {
      if (users[i].email === email) {
        user = users[i];
        break;
      }
    }

    if (!user) {
      recordFailedAttempt(email);
      // Run a dummy hash to prevent timing-based user enumeration
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

      // Successful login — migrate legacy hash to PBKDF2 if needed
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
        }).catch(function() { /* migration failed silently */ });
      }

      clearRateLimit(email);
      setSession(user);
      BLACKBOX.log('login', { email: email });

      return { ok: true, user: { id: user.id, name: user.name, email: user.email } };
    });

    return withTimingDelay(loginPromise, startTime);
  },

  /**
   * Logout the current user
   */
  logout: function() {
    BLACKBOX.log('logout', { duration: BLACKBOX.getSessionMinutes() });
    clearSession();
  },

  /**
   * Check if a user is currently logged in
   * Validates session expiry (30 days), token rotation (24h), and device fingerprint
   * @returns {boolean}
   */
  isLoggedIn: function() {
    var s = getSession();
    if (!s) return false;
    var now = Date.now();
    // Session expiry: 30 days
    var start = parseInt(localStorage.getItem(SESSION_START_KEY) || '0');
    if (start && now - start > 30 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_START_KEY);
      return false;
    }
    // Fingerprint check — detect localStorage theft
    if (s.fingerprint) {
      var currentFP = buildFingerprint();
      if (currentFP !== s.fingerprint) {
        // Fingerprint mismatch: possible session theft — invalidate session
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_START_KEY);
        return false;
      }
    }
    // Session token rotation: regenerate token every 24h if session is active
    if (s.tokenIssuedAt && now - s.tokenIssuedAt > 24 * 60 * 60 * 1000) {
      try {
        var updated = JSON.parse(localStorage.getItem(SESSION_KEY));
        if (updated) {
          updated.token = generateSessionToken();
          updated.tokenIssuedAt = now;
          localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
        }
      } catch(e) { /* ignore */ }
    }
    return true;
  },

  /**
   * Get the current user's session data
   * @returns {{id:string, name:string, email:string}|null}
   */
  getUser: function() {
    return getSession();
  },

  /**
   * Update user profile data (name)
   * @param {string} newName
   * @returns {{ok:boolean, error?:string}}
   */
  updateProfile: function(newName) {
    var session = getSession();
    if (!session) return { ok: false, error: 'Non connect\u00e9' };

    newName = sanitize((newName || '').trim());
    if (!validateName(newName)) {
      return { ok: false, error: 'Pr\u00e9nom invalide (min 2 caract\u00e8res)' };
    }

    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
      if (users[i].id === session.id) {
        users[i].name = newName;
        saveUsers(users);
        session.name = newName;
        setSession(session);
        BLACKBOX.log('profile_update', { name: newName });
        return { ok: true };
      }
    }

    return { ok: false, error: 'Utilisateur introuvable' };
  },

  /**
   * Change user password (async — returns Promise)
   * @param {string} currentPassword
   * @param {string} newPassword
   * @returns {Promise<{ok:boolean, error?:string}>}
   */
  changePassword: function(currentPassword, newPassword) {
    var session = getSession();
    if (!session) return Promise.resolve({ ok: false, error: 'Non connect\u00e9' });

    if (!validatePassword(newPassword)) {
      return Promise.resolve({ ok: false, error: 'Nouveau mot de passe min 6 caract\u00e8res' });
    }

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
  },

  /**
   * Delete the current user account (async — returns Promise)
   * @param {string} password - Must confirm with password
   * @returns {Promise<{ok:boolean, error?:string}>}
   */
  deleteAccount: function(password) {
    var session = getSession();
    if (!session) return Promise.resolve({ ok: false, error: 'Non connect\u00e9' });

    var users = getUsers();
    var targetUser = null;
    for (var i = 0; i < users.length; i++) {
      if (users[i].id === session.id) { targetUser = users[i]; break; }
    }
    if (!targetUser) return Promise.resolve({ ok: false, error: 'Utilisateur introuvable' });

    return verifyPasswordAsync(password, targetUser.pwHash).then(function(valid) {
      if (!valid) return { ok: false, error: 'Mot de passe incorrect' };
      BLACKBOX.log('account_deleted', { email: targetUser.email });
      var freshUsers = getUsers();
      for (var j = 0; j < freshUsers.length; j++) {
        if (freshUsers[j].id === session.id) {
          freshUsers.splice(j, 1);
          saveUsers(freshUsers);
          clearSession();
          return { ok: true };
        }
      }
      return { ok: false, error: 'Utilisateur introuvable' };
    });
  }
};

// ─── BLACKBOX — Activity Logging ───
window.BLACKBOX = {

  /**
   * Log an activity event
   * @param {string} action - Action name (e.g., 'login', 'page_view', 'calculate')
   * @param {object} data - Additional data payload
   */
  log: function(action, data) {
    try {
      var user = getSession();
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

      // Keep last 10000 entries max to prevent storage overflow
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
   * @param {string} [userId] - Filter by user ID
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
   * @param {string} [userId] - Filter by user ID
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
    } catch (e) {
      // Ignore
    }
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

// Track page visibility changes for session time accuracy
document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    BLACKBOX.log('page_hidden', {});
  } else {
    BLACKBOX.log('page_visible', {});
  }
});

// Resume session tracking on page load
if (AUTH.isLoggedIn()) {
  if (!localStorage.getItem(SESSION_START_KEY)) {
    localStorage.setItem(SESSION_START_KEY, String(Date.now()));
  }
  BLACKBOX.log('session_resume', {});
}

// Track unload for session duration
window.addEventListener('beforeunload', function() {
  if (AUTH.isLoggedIn()) {
    BLACKBOX.log('page_unload', { sessionMinutes: BLACKBOX.getSessionMinutes() });
  }
});

})();
