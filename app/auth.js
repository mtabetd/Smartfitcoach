/* ═══════════════════════════════════════════════════════════════
   AUTH.JS — Authentication & BlackBox Activity Tracking
   MTD Macro Calculator
   localStorage-based auth with hashed passwords and session management
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';

// ─── PASSWORD HASHING (FNV-1a based, 1000 rounds) ───
function hashPassword(password) {
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

function setSession(user) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email
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
   * Register a new user
   * @param {string} name - User's first name
   * @param {string} email - User's email
   * @param {string} password - User's password (min 6 chars)
   * @returns {{ok:boolean, user?:object, error?:string}}
   */
  register: function(name, email, password) {
    // Sanitize inputs
    name = sanitize((name || '').trim());
    email = sanitize((email || '').trim().toLowerCase());

    // Validate
    if (!validateName(name)) {
      return { ok: false, error: 'Pr\u00e9nom requis (min 2 caract\u00e8res)' };
    }
    if (!validateEmail(email)) {
      return { ok: false, error: 'Email invalide' };
    }
    if (!validatePassword(password)) {
      return { ok: false, error: 'Mot de passe min 6 caract\u00e8res' };
    }

    // Check for duplicate email
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
      if (users[i].email === email) {
        return { ok: false, error: 'Cet email est d\u00e9j\u00e0 utilis\u00e9' };
      }
    }

    // Create user object
    var user = {
      id: 'u_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      name: name,
      email: email,
      pwHash: hashPassword(password),
      createdAt: Date.now()
    };

    // Save
    users.push(user);
    saveUsers(users);
    setSession(user);

    // Log registration
    BLACKBOX.log('register', { email: email });

    return { ok: true, user: { id: user.id, name: user.name, email: user.email } };
  },

  /**
   * Login an existing user
   * @param {string} email
   * @param {string} password
   * @returns {{ok:boolean, user?:object, error?:string}}
   */
  login: function(email, password) {
    email = sanitize((email || '').trim().toLowerCase());

    if (!validateEmail(email)) {
      return { ok: false, error: 'Email invalide' };
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
      return { ok: false, error: 'Email ou mot de passe incorrect' };
    }

    if (user.pwHash !== hashPassword(password)) {
      BLACKBOX.log('login_failed', { email: email });
      return { ok: false, error: 'Email ou mot de passe incorrect' };
    }

    setSession(user);
    BLACKBOX.log('login', { email: email });

    return { ok: true, user: { id: user.id, name: user.name, email: user.email } };
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
   * @returns {boolean}
   */
  isLoggedIn: function() {
    var s = getSession();
    if (!s) return false;
    // Session expiry: 30 days
    var start = parseInt(localStorage.getItem(SESSION_START_KEY) || '0');
    if (start && Date.now() - start > 30 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_START_KEY);
      return false;
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
   * Change user password
   * @param {string} currentPassword
   * @param {string} newPassword
   * @returns {{ok:boolean, error?:string}}
   */
  changePassword: function(currentPassword, newPassword) {
    var session = getSession();
    if (!session) return { ok: false, error: 'Non connect\u00e9' };

    if (!validatePassword(newPassword)) {
      return { ok: false, error: 'Nouveau mot de passe min 6 caract\u00e8res' };
    }

    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
      if (users[i].id === session.id) {
        if (users[i].pwHash !== hashPassword(currentPassword)) {
          return { ok: false, error: 'Mot de passe actuel incorrect' };
        }
        users[i].pwHash = hashPassword(newPassword);
        saveUsers(users);
        BLACKBOX.log('password_change', {});
        return { ok: true };
      }
    }

    return { ok: false, error: 'Utilisateur introuvable' };
  },

  /**
   * Delete the current user account
   * @param {string} password - Must confirm with password
   * @returns {{ok:boolean, error?:string}}
   */
  deleteAccount: function(password) {
    var session = getSession();
    if (!session) return { ok: false, error: 'Non connect\u00e9' };

    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
      if (users[i].id === session.id) {
        if (users[i].pwHash !== hashPassword(password)) {
          return { ok: false, error: 'Mot de passe incorrect' };
        }
        BLACKBOX.log('account_deleted', { email: users[i].email });
        users.splice(i, 1);
        saveUsers(users);
        clearSession();
        return { ok: true };
      }
    }

    return { ok: false, error: 'Utilisateur introuvable' };
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
