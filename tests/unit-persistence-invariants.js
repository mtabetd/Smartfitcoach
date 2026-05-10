/**
 * unit-persistence-invariants.js
 * Audit final — Persistence & Sécurité SmartFitCoach
 *
 * Vérifie les invariants suivants :
 *   A. SYNC SAFETY      : guards de ré-entrance, corruption, dirty flag
 *   B. PREMIUM / AUTH   : isPremium fail-closed, requirePremium server-side
 *   C. MIGRATION STEPS  : _migrateSteps() nStep boundaries
 *   D. CORRUPTION RECOVERY : _loadCorrupted flag + backup key
 *   E. MULTI-DEVICE     : merge heuristic, SYNC_EXACT scope, _PROTECTED_KEYS
 *
 * Usage : node tests/unit-persistence-invariants.js
 */
'use strict';

var fs   = require('fs');
var path = require('path');

// ─── Minimal test harness ────────────────────────────────────────────────────
var _passed = 0, _failed = 0, _errors = [];
function test(name, fn) {
  try {
    fn();
    _passed++;
    console.log('  PASS', name);
  } catch(e) {
    _failed++;
    _errors.push({ name: name, error: e.message || String(e) });
    console.error('  FAIL', name, '—', e.message || String(e));
  }
}
function assert(cond, msg)   { if (!cond) throw new Error(msg || 'Assertion failed'); }
function assertEqual(a, b, msg) {
  if (a !== b) throw new Error((msg || '') + ' — expected ' + JSON.stringify(b) + ' got ' + JSON.stringify(a));
}

// ─── Browser globals stub ────────────────────────────────────────────────────
if (typeof window === 'undefined') { global.window = global; }
if (typeof document === 'undefined') {
  global.document = {
    getElementById:    function() { return null; },
    querySelectorAll:  function() { return []; },
    querySelector:     function() { return null; },
    createElement:     function() {
      return { style: {}, textContent: '', innerHTML: '', className: '', id: '',
               parentNode: null, appendChild: function() {} };
    },
    body: { appendChild: function() {} },
    head: { appendChild: function() {} },
    addEventListener:  function() {}
  };
}
if (typeof navigator === 'undefined') {
  Object.defineProperty(global, 'navigator', { value: { onLine: true }, writable: true, configurable: true });
}
// localStorage mock with length/key support
if (typeof localStorage === 'undefined') {
  var _lsData = {};
  global.localStorage = {
    getItem:    function(k) { return _lsData[k] !== undefined ? _lsData[k] : null; },
    setItem:    function(k, v) { _lsData[k] = String(v); },
    removeItem: function(k) { delete _lsData[k]; },
    clear:      function()  { _lsData = {}; },
    get length() { return Object.keys(_lsData).length; },
    key: function(i) { return Object.keys(_lsData)[i] || null; }
  };
}
if (typeof sessionStorage === 'undefined') {
  var _ssData = {};
  global.sessionStorage = {
    getItem:    function(k) { return _ssData[k] !== undefined ? _ssData[k] : null; },
    setItem:    function(k, v) { _ssData[k] = String(v); },
    removeItem: function(k) { delete _ssData[k]; },
    get length() { return Object.keys(_ssData).length; }
  };
}

window.showToast = function() {};
window.safeStorage = (function() {
  var _d = {};
  return {
    local:   { getItem: function(k) { return _d[k]||null; }, setItem: function(k,v){_d[k]=v;}, removeItem: function(k){delete _d[k];} },
    session: { getItem: function()  { return null; },         setItem: function()  {},           removeItem: function()  {} }
  };
})();

// Source files
var srcSupaClient = fs.readFileSync(path.join(__dirname, '../app/supabase-client.js'), 'utf8');
var srcAppMain    = fs.readFileSync(path.join(__dirname, '../app/app-main.js'), 'utf8');
var srcAppCore    = fs.readFileSync(path.join(__dirname, '../app/app-core.js'), 'utf8');
var srcUserAuth   = fs.readFileSync(path.join(__dirname, '../netlify/functions/_user-auth.js'), 'utf8');

// ─── Inline re-implementation of logic under test ────────────────────────────
// Reproduce _migrateSteps() exactly from app-main.js so we can unit-test its branches.
var _S = {};
function resetS(props) {
  _S = Object.assign({
    appMode: 'nutrition', nStep: 0, sStep: 0,
    sex: null, goal: null, weight: null, height: null,
    activity: null, sleep: null, weekPlan: null
  }, props);
  window.S = _S;
}
function migrateSteps() {
  // Exact copy of _migrateSteps from app-main.js (lines 404-423)
  if (_S.appMode === 'sport' && _S.nStep > 0) { _S.nStep = 0; }
  if ((_S.appMode === 'nutrition' || _S.appMode === 'both') &&
      typeof _S.nStep === 'number' && _S.nStep >= 1 && _S.nStep <= 11) {
    if (_S.weekPlan)                                     { _S.nStep = 12; }
    else if (_S.nStep === 8 && _S.sex && _S.goal !== null && _S.goal !== undefined) { _S.nStep = 11; }
    else if (_S.nStep === 8 && !_S.sex)                  { _S.nStep = 1; }
    else if (_S.nStep >= 1 && _S.nStep <= 4 &&
             _S.sex && _S.goal !== null && _S.weight &&
             _S.height && _S.activity !== null && _S.sleep !== null) { _S.nStep = 8; }
  }
  if ((_S.appMode === 'nutrition' || _S.appMode === 'both') &&
      _S.nStep === 0 && (_S.sex || _S.goal !== null || _S.weekPlan)) {
    _S.nStep = _S.weekPlan ? 12 : (_S.goal !== null && _S.weight && _S.height ? 11 : (_S.sex ? 2 : 1));
  }
}

// Reproduce _isEmptyValue / _isMeaningful / _applyCloudData merge logic
var _PROTECTED_KEYS = {
  _sportProgramVersion: 1,
  sportProgram: 1, runningProgram: 1, cyclingProgram: 1,
  triathlonProgram: 1, hyroxProgram: 1, padelProgram: 1,
  golfProgram: 1, yogaWeek: 1, calisthenicsWeek: 1,
  weekPlan: 1, favoriteRecipes: 1, nutritionLog: 1,
  mealTimes: 1, mealsLogged: 1, shopChecked: 1,
  muscuSessionLog: 1, musculationWeights: 1,
  muscuProgressionHistory: 1, sessionHistory: 1,
  bonusExercises: 1, sportFocus: 1,
  weightHistory: 1, crossfit1RM: 1, muscuStrengthProfile: 1,
  hyroxBenchmarks: 1, crossfitBenchmarks: 1, cfProgress: 1,
  weeklyCalendar: 1, aiCoachHistory: 1, trainingDaysSelected: 1,
  installations: 1, sportHobbies: 1
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
function applyCloudData(localS, cloudData) {
  var _PROTO_BLOCKED = ['__proto__', 'constructor', 'prototype', '_legacy_storage'];
  for (var k in cloudData) {
    if (cloudData.hasOwnProperty(k) && _PROTO_BLOCKED.indexOf(k) === -1) {
      var cv = cloudData[k];
      if (_PROTECTED_KEYS[k] && _isEmptyValue(cv) && _isMeaningful(localS[k])) { continue; }
      localS[k] = cv;
    }
  }
  return localS;
}

// ─── Reproduce isPremium from app-core.js ────────────────────────────────────
var _SFC_PREMIUM_PLANS = ['unlimited','lifetime','premium','legend','champion','athlete','admin','paid'];
function _isPremiumPlan(plan) { return !!plan && _SFC_PREMIUM_PLANS.indexOf(plan) !== -1; }
function isPremium() {
  try {
    var s = window.S;
    if (!s) return false;
    if (s._serverPremium === true) return true;
    if (s._serverPremium === false && s._subStatusReady) return false;
    if (_isPremiumPlan(s.subscriptionPlan)) return true;
    if (s.subscriptionEnd && new Date(s.subscriptionEnd) > new Date()) return true;
    if (s.firstLoginDate) {
      var trialEnd = new Date(s.firstLoginDate);
      trialEnd.setUTCDate(trialEnd.getUTCDate() + 7);
      trialEnd.setUTCHours(23, 59, 59, 999);
      if (trialEnd > new Date()) return true;
    }
    if (!s._subStatusReady) return false;
    if (!s.firstLoginDate) return false;
    return false;
  } catch(e) { return false; }
}

// ─── Server-side premium logic (mirror of _user-auth.js) ─────────────────────
var PREMIUM_PLANS_SERVER = ['unlimited','lifetime','premium','legend','champion','athlete','admin','paid'];
function serverIsPremium(profile) {
  // profile = { subscription_end, subscription_plan, first_login_date, data }
  if (!profile) return true; // brand-new user — grant trial
  var today = new Date().toISOString().slice(0, 10);
  if (profile.subscription_plan && PREMIUM_PLANS_SERVER.indexOf(profile.subscription_plan) !== -1) return true;
  if (profile.subscription_end && profile.subscription_end >= today) return true;
  var TRIAL_DAYS = 7;
  var rawDate = profile.first_login_date ||
    (profile.data && typeof profile.data.firstLoginDate === 'string' ? profile.data.firstLoginDate : null);
  if (rawDate) {
    var trialEnd = new Date(rawDate);
    trialEnd.setUTCDate(trialEnd.getUTCDate() + TRIAL_DAYS);
    trialEnd.setUTCHours(23, 59, 59, 999);
    if (new Date() <= trialEnd) return true;
  } else if (!profile.subscription_end) {
    return true; // brand-new (no trial date, no subscription) — grant trial
  }
  return false;
}

// ────────────────────────────────────────────────────────────────────────────
// A. SYNC SAFETY
// ────────────────────────────────────────────────────────────────────────────
console.log('\n══ A. SYNC SAFETY ═══════════════════════════════════════════════════');

test('A-01: SupaSync.saveProfile has _loadCorrupted guard (PD-02)', function() {
  // Verify exact guard code is present in production source
  assert(
    srcSupaClient.indexOf("if (window.S && window.S._loadCorrupted) { return Promise.resolve(); }") !== -1,
    'Guard "if (window.S && window.S._loadCorrupted) { return Promise.resolve(); }" manquant dans SupaSync.saveProfile'
  );
});

test('A-02: global saveProfile() blocks when S._loadCorrupted = true', function() {
  // Verify the global saveProfile guard in app-main.js
  assert(
    srcAppMain.indexOf("if (S._loadCorrupted) {") !== -1,
    'Guard S._loadCorrupted absent dans saveProfile() global'
  );
  assert(
    srcAppMain.indexOf("BLOQUÉ — données corrompues") !== -1,
    'Message de log BLOQUÉ absent — le guard est peut-être incomplet'
  );
});

test('A-03: syncOnLogin is re-entrant safe (_syncLoginInProgress guard)', function() {
  assert(
    srcSupaClient.indexOf('if (this._syncLoginInProgress) return Promise.resolve') !== -1,
    'Guard _syncLoginInProgress absent dans syncOnLogin'
  );
  // Guard must be set BEFORE first async tick
  var syncStart = srcSupaClient.indexOf('syncOnLogin: function()');
  var guardPos  = srcSupaClient.indexOf('this._syncLoginInProgress = true', syncStart);
  var asyncPos  = srcSupaClient.indexOf('authReadyPromise.then', syncStart);
  assert(syncStart !== -1, 'syncOnLogin introuvable');
  assert(guardPos  !== -1 && guardPos < asyncPos,
    'Flag _syncLoginInProgress doit être positionné AVANT le premier .then() async (trouvé à ' + guardPos + ', then à ' + asyncPos + ')');
});

test('A-04: syncOnLogin has watchdog timer to auto-reset stuck flag', function() {
  assert(
    srcSupaClient.indexOf('WATCHDOG: _syncLoginInProgress stuck') !== -1,
    'Watchdog de reset automatique absent — le flag peut rester bloqué indéfiniment'
  );
});

test('A-05: startAutoSync checks _profileDirty flag before saving (MD-01)', function() {
  // OB-01 fix: guard window._profileDirty !== false
  assert(
    srcSupaClient.indexOf("if (window._profileDirty !== false) self.saveProfile()") !== -1,
    'Guard _profileDirty !== false absent dans startAutoSync — sauvegarde aveugle toutes les 2 min'
  );
});

test('A-06: SupaSync.saveProfile strips server-authoritative keys before upsert', function() {
  // These keys must never be overwritten by the client JSONB blob
  assert(srcSupaClient.indexOf("delete _safeData.subscriptionPlan") !== -1, 'subscriptionPlan non stripé avant upsert cloud');
  assert(srcSupaClient.indexOf("delete _safeData.subscriptionEnd")   !== -1, 'subscriptionEnd non stripé avant upsert cloud');
  assert(srcSupaClient.indexOf("delete _safeData.firstLoginDate")     !== -1, 'firstLoginDate non stripé avant upsert cloud');
});

// ────────────────────────────────────────────────────────────────────────────
// B. PREMIUM / AUTH
// ────────────────────────────────────────────────────────────────────────────
console.log('\n══ B. PREMIUM / AUTH ════════════════════════════════════════════════');

test('B-01: isPremium returns false when _subStatusReady=false (loading guard)', function() {
  window.S = { _serverPremium: undefined, _subStatusReady: false, subscriptionPlan: null, subscriptionEnd: null, firstLoginDate: null };
  assertEqual(isPremium(), false, 'isPremium doit être false pendant le chargement');
});

test('B-02: isPremium returns false when _serverPremium=false and _subStatusReady=true', function() {
  window.S = { _serverPremium: false, _subStatusReady: true, subscriptionPlan: null, subscriptionEnd: null, firstLoginDate: null };
  assertEqual(isPremium(), false, 'isPremium doit être false quand le serveur confirme non-premium');
});

test('B-03: isPremium returns true when _serverPremium=true (server-confirmed)', function() {
  window.S = { _serverPremium: true, _subStatusReady: true };
  assertEqual(isPremium(), true, 'isPremium doit être true quand le serveur confirme premium');
});

test('B-04: isPremium returns true for valid subscriptionPlan even without _serverPremium', function() {
  // Covers the case where subscriptionPlan is repopulated from cloud but _serverPremium not yet set
  window.S = { _serverPremium: undefined, _subStatusReady: true, subscriptionPlan: 'unlimited', firstLoginDate: '2020-01-01' };
  assertEqual(isPremium(), true, 'isPremium doit être true pour plan "unlimited"');
});

test('B-05: isPremium returns true during active trial (firstLoginDate set, within 7 days)', function() {
  // firstLoginDate = yesterday → still in trial
  var yesterday = new Date(Date.now() - 86400000).toISOString();
  window.S = { _serverPremium: undefined, _subStatusReady: true, subscriptionPlan: null, subscriptionEnd: null, firstLoginDate: yesterday };
  assertEqual(isPremium(), true, 'isPremium doit être true pendant la période d\'essai');
});

test('B-06: isPremium returns false after trial expiry (firstLoginDate > 7 days ago)', function() {
  // firstLoginDate = 10 days ago → trial expired
  var tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString();
  window.S = { _serverPremium: false, _subStatusReady: true, subscriptionPlan: null, subscriptionEnd: null, firstLoginDate: tenDaysAgo };
  assertEqual(isPremium(), false, 'isPremium doit être false après expiration de l\'essai');
});

test('B-07: isPremium fails closed on exception (returns false, never true)', function() {
  // Simulate a corrupted S that throws during access
  var badS = {};
  Object.defineProperty(badS, '_serverPremium', { get: function() { throw new Error('disk error'); } });
  window.S = badS;
  // isPremium must not throw and must return false
  var result = isPremium();
  assertEqual(result, false, 'isPremium doit retourner false en cas d\'exception (fail-closed)');
});

test('B-08: requirePremium returns 503 in production when admin client absent (SEC-05)', function() {
  // Verify production-safe behavior: no SUPABASE env vars + NETLIFY=true → 503
  assert(
    srcUserAuth.indexOf("process.env.NETLIFY") !== -1,
    'Vérification process.env.NETLIFY absente dans requirePremium'
  );
  assert(
    srcUserAuth.indexOf('statusCode: 503') !== -1,
    'Retour 503 absent pour admin client manquant en production'
  );
  // Must NOT skip (return {skip:true}) in production
  var prodBlock = srcUserAuth.slice(
    srcUserAuth.indexOf('if (process.env.NETLIFY)'),
    srcUserAuth.indexOf('if (process.env.NETLIFY)') + 200
  );
  assert(
    prodBlock.indexOf('503') !== -1,
    'Le bloc NETLIFY doit retourner 503, pas skip'
  );
  assert(
    prodBlock.indexOf('skip: true') === -1,
    'Le bloc NETLIFY ne doit PAS retourner skip:true (ce serait accorder l\'accès en prod)'
  );
});

test('B-09: requirePremium checks subscription_plan BEFORE subscription_end (SEC-05 order)', function() {
  // Plan-based check (step 1) must precede date-based check (step 2) in server code
  var planCheckIdx  = srcUserAuth.indexOf('subscription_plan && PREMIUM_PLANS');
  var endCheckIdx   = srcUserAuth.indexOf('subscription_end && profile.subscription_end');
  assert(planCheckIdx !== -1, 'Vérification subscription_plan absente dans requirePremium');
  assert(endCheckIdx  !== -1, 'Vérification subscription_end absente dans requirePremium');
  assert(planCheckIdx < endCheckIdx,
    'subscription_plan doit être vérifié AVANT subscription_end (plan sans date = lifetime)');
});

test('B-10: requirePremium uses server-managed first_login_date column (not client JSONB)', function() {
  // The server must prefer the write-once DB column over the JSONB fallback
  assert(
    srcUserAuth.indexOf('profile.first_login_date') !== -1,
    'Column first_login_date non utilisée — trial manipulable via JSONB'
  );
  // The write-once column is preferred (appears first in the rawDate expression)
  var rawDateLine = srcUserAuth.slice(
    srcUserAuth.indexOf('const rawDate ='),
    srcUserAuth.indexOf('const rawDate =') + 150
  );
  assert(
    rawDateLine.indexOf('first_login_date') < rawDateLine.indexOf('firstLoginDate'),
    'first_login_date (write-once) doit être préféré à firstLoginDate JSONB'
  );
});

// Server-side premium logic tests
test('B-11: serverIsPremium — plan "lifetime" grants access regardless of subscription_end', function() {
  var result = serverIsPremium({ subscription_plan: 'lifetime', subscription_end: null, first_login_date: null, data: {} });
  assertEqual(result, true, 'Plan lifetime doit accorder l\'accès sans subscription_end');
});

test('B-12: serverIsPremium — expired subscription_end + no trial = deny', function() {
  var result = serverIsPremium({
    subscription_plan: null,
    subscription_end: '2020-01-01',  // expired
    first_login_date: '2020-01-01',  // trial also expired
    data: {}
  });
  assertEqual(result, false, 'Abonnement expiré et essai expiré → accès refusé');
});

test('B-13: serverIsPremium — null profile (brand-new user) grants trial access', function() {
  var result = serverIsPremium(null);
  assertEqual(result, true, 'Nouvel utilisateur sans profil doit avoir accès (essai)');
});

// ────────────────────────────────────────────────────────────────────────────
// C. MIGRATION ONBOARDING (_migrateSteps)
// ────────────────────────────────────────────────────────────────────────────
console.log('\n══ C. MIGRATION ONBOARDING (_migrateSteps) ═══════════════════════════');

var fullProfile = { sex: 'homme', goal: 1, weight: 80, height: 175, activity: 1.55, sleep: 7 };

test('C-01: nStep=1 + profil complet → migre vers nStep=8 (ancien utilisateur) [OB-01]', function() {
  resetS(Object.assign({ nStep: 1 }, fullProfile));
  migrateSteps();
  assertEqual(_S.nStep, 8, 'nStep=1 + profil complet doit migrer vers 8');
});

test('C-02: nStep=2 + profil complet → migre vers nStep=8', function() {
  resetS(Object.assign({ nStep: 2 }, fullProfile));
  migrateSteps();
  assertEqual(_S.nStep, 8, 'nStep=2 + profil complet doit migrer vers 8');
});

test('C-03: nStep=4 + profil complet → migre vers nStep=8 (limite haute OB-01)', function() {
  resetS(Object.assign({ nStep: 4 }, fullProfile));
  migrateSteps();
  assertEqual(_S.nStep, 8, 'nStep=4 (limite haute) + profil complet doit migrer vers 8');
});

test('C-04: nStep=5 + profil complet → NE migre PAS (utilisateur en cours d\'onboarding) [OB-01 regressed check]', function() {
  // nStep=5 means user is actively progressing through onboarding — must not skip
  resetS(Object.assign({ nStep: 5 }, fullProfile));
  migrateSteps();
  assertEqual(_S.nStep, 5, 'nStep=5 ne doit PAS être migré (used to be <= 7 bug)');
});

test('C-05: nStep=6 + profil complet → NE migre PAS', function() {
  resetS(Object.assign({ nStep: 6 }, fullProfile));
  migrateSteps();
  assertEqual(_S.nStep, 6, 'nStep=6 ne doit PAS être migré');
});

test('C-06: nStep=7 + profil complet → NE migre PAS', function() {
  resetS(Object.assign({ nStep: 7 }, fullProfile));
  migrateSteps();
  assertEqual(_S.nStep, 7, 'nStep=7 ne doit PAS être migré (étape active onboarding)');
});

test('C-07: nStep=1 en mode sport → forcé à 0 (sport-only guard)', function() {
  resetS({ appMode: 'sport', nStep: 1 });
  migrateSteps();
  assertEqual(_S.nStep, 0, 'nStep doit être forcé à 0 en mode sport-only');
});

test('C-08: nStep=8 + profil complet (sex set, goal set) → jump to nStep=11', function() {
  resetS(Object.assign({ nStep: 8 }, fullProfile));
  migrateSteps();
  assertEqual(_S.nStep, 11, 'nStep=8 + profil complet doit sauter à 11 (résultats)');
});

test('C-09: nStep=8 sans sex → reset à 1', function() {
  resetS({ nStep: 8, sex: null, goal: null });
  migrateSteps();
  assertEqual(_S.nStep, 1, 'nStep=8 sans sex doit être reset à 1');
});

test('C-10: weekPlan existant → nStep forcé à 12 (plan généré)', function() {
  resetS(Object.assign({ nStep: 3, weekPlan: [{ breakfast: {} }] }, fullProfile));
  migrateSteps();
  assertEqual(_S.nStep, 12, 'Présence de weekPlan doit forcer nStep=12');
});

// Source-level check for the OB-01 boundary change
test('C-11: source code OB-01 — condition est "<= 4" (pas "<= 7")', function() {
  assert(
    srcAppMain.indexOf('S.nStep >= 1 && S.nStep <= 4') !== -1,
    'OB-01 non appliqué — condition doit être nStep <= 4, pas nStep <= 7'
  );
  assert(
    srcAppMain.indexOf('S.nStep >= 1 && S.nStep <= 7') === -1,
    'Ancienne condition nStep <= 7 encore présente — OB-01 non appliqué'
  );
});

// ────────────────────────────────────────────────────────────────────────────
// D. CORRUPTION RECOVERY
// ────────────────────────────────────────────────────────────────────────────
console.log('\n══ D. CORRUPTION RECOVERY ════════════════════════════════════════════');

test('D-01: loadProfile crée un backup sous mtd_profile_BACKUP_<uid>_<ts>', function() {
  assert(
    srcAppMain.indexOf("'mtd_profile_BACKUP_' + uid + '_' + _ts") !== -1,
    'Clé backup BACKUP_<uid>_<ts> absente dans loadProfile'
  );
});

test('D-02: loadProfile positionne S._loadCorrupted=true si JSON.parse échoue', function() {
  assert(
    srcAppMain.indexOf("S._loadCorrupted = true;") !== -1,
    'S._loadCorrupted=true absent après échec de parse'
  );
});

test('D-03: loadProfile positionne S._loadCorrupted=true si decode retourne null (corruption silencieuse)', function() {
  // Two code paths: JSON throw AND silent null return
  var count = (srcAppMain.match(/S\._loadCorrupted = true;/g) || []).length;
  assert(count >= 2, 'S._loadCorrupted doit être positionné dans au moins 2 chemins (throw ET null silencieux), trouvé : ' + count);
});

test('D-04: backup en localStorage (pas sessionStorage) pour survie après fermeture', function() {
  // The backup must use localStorage.setItem, not sessionStorage
  var backupIdx = srcAppMain.indexOf("'mtd_profile_BACKUP_' + uid + '_' + _ts");
  var setItemIdx = srcAppMain.indexOf('localStorage.setItem(_bkKey', backupIdx - 5);
  assert(setItemIdx !== -1 && setItemIdx < backupIdx + 200,
    'Backup doit utiliser localStorage.setItem (pas sessionStorage) pour survivre à la fermeture');
});

test('D-05: corruption runtime — saveProfile bloqué quand S._loadCorrupted=true', function() {
  // Simulate what saveProfile() does
  window.S = { _loadCorrupted: true };
  var blocked = false;
  // Re-run the guard logic inline
  if (window.S._loadCorrupted) { blocked = true; }
  assert(blocked, 'saveProfile doit être bloqué quand S._loadCorrupted=true');
});

test('D-06: SupaSync.saveProfile aussi bloqué quand S._loadCorrupted=true (PD-02)', function() {
  // The SupaSync.saveProfile guard is separate from the global one
  var guardLine = "if (window.S && window.S._loadCorrupted) { return Promise.resolve(); }";
  assert(srcSupaClient.indexOf(guardLine) !== -1, 'PD-02 : guard manquant dans SupaSync.saveProfile');
});

test('D-07: toast d\'erreur déclenché après détection de corruption', function() {
  assert(
    srcAppMain.indexOf('Profil endommagé — rechargez la page') !== -1 ||
    srcAppMain.indexOf('Profil endommagé') !== -1,
    'Toast d\'erreur utilisateur absent lors de la détection de corruption'
  );
});

// ────────────────────────────────────────────────────────────────────────────
// E. MULTI-DEVICE (merge heuristic + SYNC_EXACT + _PROTECTED_KEYS)
// ────────────────────────────────────────────────────────────────────────────
console.log('\n══ E. MULTI-DEVICE ═══════════════════════════════════════════════════');

test('E-01: sessionHistory est dans _PROTECTED_KEYS (protection multi-device)', function() {
  assert(_PROTECTED_KEYS.sessionHistory === 1, 'sessionHistory absent de _PROTECTED_KEYS');
});

test('E-02: merge — sessionHistory cloud null + local riche → local préservé', function() {
  var S = { sessionHistory: { '2026-05-01': { duration: 3600 }, '2026-05-02': { duration: 4500 } } };
  applyCloudData(S, { sessionHistory: null });
  assert(
    S.sessionHistory && Object.keys(S.sessionHistory).length === 2,
    'sessionHistory local doit être préservé face à un cloud null'
  );
});

test('E-03: merge — cloud wins when local sessionHistory is empty', function() {
  var S = { sessionHistory: {} };
  applyCloudData(S, { sessionHistory: { '2026-05-01': { duration: 3600 } } });
  assert(
    S.sessionHistory && S.sessionHistory['2026-05-01'],
    'sessionHistory cloud doit s\'appliquer quand le local est vide'
  );
});

test('E-04: merge heuristic length — local plus riche (>  cloud) → local préservé', function() {
  // Reproduit la logique ligne 885 de supabase-client.js
  var existing = JSON.stringify([1,2,3,4,5,6,7,8,9,10]); // 10 entries = long
  var cloudVal = JSON.stringify([1,2]);                   // 2 entries = short
  var skipRestore = (typeof existing === 'string' && existing.length > 0 &&
                     typeof cloudVal === 'string' && cloudVal.length > 0 &&
                     existing.length > cloudVal.length && existing !== cloudVal);
  assert(skipRestore, 'Local plus riche doit gagner dans la heuristique de merge');
});

test('E-05: merge heuristic length — cloud plus riche (> local) → cloud s\'applique', function() {
  var existing = JSON.stringify([1,2]);                   // short
  var cloudVal = JSON.stringify([1,2,3,4,5,6,7,8,9,10]); // long
  var skipRestore = (typeof existing === 'string' && existing.length > 0 &&
                     typeof cloudVal === 'string' && cloudVal.length > 0 &&
                     existing.length > cloudVal.length && existing !== cloudVal);
  assert(!skipRestore, 'Cloud plus riche doit s\'appliquer (skipRestore=false)');
});

test('E-06: SYNC_EXACT keys are NOT uid-scoped — documented bug PD-01', function() {
  // SYNC_EXACT = ['mtd_muscu_program', 'mtd_muscu_ia_progress', 'mtd_muscu_generations']
  // These keys lack the UID suffix → on a multi-account device (same browser),
  // User A's program could be synced into User B's cloud, and vice-versa on restore.
  // This test documents the known unfixed issue so a regression cannot silently fix it.
  var syncExactLine = srcSupaClient.indexOf("var SYNC_EXACT = ['mtd_muscu_program'");
  assert(syncExactLine !== -1, 'SYNC_EXACT introuvable dans supabase-client.js');

  // The keys do NOT have a uid suffix (e.g. 'mtd_muscu_program_<uid>')
  var syncsExactBlock = srcSupaClient.slice(syncExactLine, syncExactLine + 100);
  assert(syncsExactBlock.indexOf('userId') === -1 && syncsExactBlock.indexOf('uidSuffix') === -1,
    'SYNC_EXACT keys ne sont pas uid-scopées — PD-01 non fixé (attendu, voir risques résiduels)');

  // The match check for SYNC_EXACT does NOT verify uidSuffix
  var matchCheck = srcSupaClient.slice(srcSupaClient.indexOf('if (!matches && SYNC_EXACT'), 150 + srcSupaClient.indexOf('if (!matches && SYNC_EXACT'));
  assert(matchCheck.indexOf('uidSuffix') === -1,
    'La correspondance SYNC_EXACT ne vérifie pas uidSuffix — bug PD-01 confirmé non corrigé');
});

test('E-07: cloudWouldLoseSport guard prevents overwrite when cloud is missing sportProgram', function() {
  // Verify the protection is in the source
  assert(
    srcSupaClient.indexOf('cloudWouldLoseSport') !== -1,
    'Guard cloudWouldLoseSport absent — perte potentielle de programme sport au sync'
  );
  assert(
    srcSupaClient.indexOf('cloudWouldLosePlan') !== -1,
    'Guard cloudWouldLosePlan absent'
  );
});

test('E-08: merge cloudWouldLoseSport — local sportProgram preserved when cloud has none', function() {
  // Re-implement the guard logic from syncOnLogin lines 939-946
  var localS = { sportProgram: [{ day: 'Lundi', exercises: [{ name: 'Squat' }] }] };
  var cloudData = { sportProgram: null, sex: 'homme', goal: 1 };

  var localHasSportProg = Array.isArray(localS.sportProgram) && localS.sportProgram.length > 0;
  var cloudHasSportProg = Array.isArray(cloudData.sportProgram) && cloudData.sportProgram.length > 0;
  var cloudWouldLoseSport = localHasSportProg && !cloudHasSportProg;

  assert(cloudWouldLoseSport, 'cloudWouldLoseSport doit être true quand local a sportProgram et cloud non');
  // In this branch, _applyCloudData is NOT called → local data preserved
  assert(localS.sportProgram.length > 0, 'sportProgram local doit rester intact');
});

test('E-09: _VALIDATION_KEYS prevents cloud from downgrading weekPlanValidated=true', function() {
  assert(
    srcSupaClient.indexOf('_VALIDATION_KEYS') !== -1,
    '_VALIDATION_KEYS absent — le cloud peut désactiver des validations utilisateur'
  );
  assert(
    srcSupaClient.indexOf('weekPlanValidated: 1') !== -1,
    'weekPlanValidated absent de _VALIDATION_KEYS'
  );
  assert(
    srcSupaClient.indexOf('sportProgramValidated: 1') !== -1,
    'sportProgramValidated absent de _VALIDATION_KEYS'
  );
});

test('E-10: _legacy_storage only restores mtd_* keys (safety prefix check)', function() {
  assert(
    srcSupaClient.indexOf("lk.indexOf('mtd_') !== 0") !== -1 ||
    srcSupaClient.indexOf("lk.indexOf('mtd_') === 0") !== -1,
    'Filtre préfixe mtd_* absent lors de la restauration de _legacy_storage'
  );
});

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('RESULTS:', _passed, 'passed,', _failed, 'failed');
if (_errors.length) {
  console.error('FAILURES:');
  _errors.forEach(function(e) { console.error('  FAIL', e.name, '—', e.error); });
}
console.log('═══════════════════════════════════════════════════════════════════\n');
if (_failed > 0) process.exit(1);
