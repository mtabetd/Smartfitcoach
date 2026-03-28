// app-main.js — MTD: Router, Auth Screens, Init
(function(){
'use strict';
var S = window.S;
var h = window.h, txt = window.txt;

// ─── NAVIGATION CALLBACKS for dashboard ───
window.APP_NAVIGATE = function(view) {
  S.view = view;
  render();
};
window.APP_RENDER = function() {
  render();
};

// ─── PROFILE PERSISTENCE (E-01) ───
var PROFILE_KEYS = [
  'sex','age','weight','height','activity','train','sleep','medical','goal','targetWeight',
  'mealsPerDay','eatingLocation','mealPrepTime','snacking','alcoholFreq','alcoholTypes','hydration',
  'cookLevel','whey','allergies','intolerances','regime','excluded','cuisines',
  'shopFreq','shopStores','shopBudget','shopPrefs',
  'bodyZones','strongZones','weakZones',
  'pregnant','pregnancyWeek','prePregnancyWeight','dueDate',
  'cycleLength','lastPeriodDate','cycleTracking',
  'creatine','creatineDose','supplements',
  'sportGoals','sportLevel','sportDays','sportSessionDuration','sportFocus',
  'sportType','crossfitLevel',
  'runningLevel','runningGoal','runningDays','runningPace',
  'hyroxLevel','hyroxGoal','hyroxDays','hyroxBenchmarks',
  'padelLevel','padelGoal','padelDays',
  'golfLevel','golfGoal','golfDays','golfHandicap',
  'triathlonGoal','triathlonLevel','triathlonWeak',
  'triathlonSwimPace','triathlonBikePace','triathlonRunPace',
  'cyclingLevel','cyclingGoal','cyclingDays','cyclingType','cyclingFTP','cyclingSpeed','cyclingRelief',
  'calisthenicsLevel','calisthenicsGoal','calisthenicsdays','calisthPullups','calisthPushups',
  'muscuWeek','muscuCycle','sportSplashDone','nStep','sStep',
  'shopChecked','weekPlan','selectedDay',
  'lang','weightUnit','heightUnit',
  'muscuMedical','crossfit1RM','muscuStrengthProfile','muscuProgramStart',
  'heartRateRest','yogaLevel','yogaGoal','yogaDays'
];
/**
 * Slim a single meal object down to essential nutritional fields only.
 * Strips heavy fields (ingredient strings, step arrays, tags) to keep
 * localStorage usage well below the 5 MB browser quota.
 */
function slimMeal(meal) {
  if (!meal) return null;
  return { _id: meal._id, n: meal.n, k: meal.k, p: meal.p, g: meal.g, l: meal.l, w: meal.w, lv: meal.lv };
}

function saveProfile() {
  try {
    var user = AUTH.getUser();
    var uid = user ? user.id : 'anon';
    var data = {};
    PROFILE_KEYS.forEach(function(k) { data[k] = S[k]; });
    // Slim weekPlan before serializing: strip ingredient/step/tag fields so
    // 7 days × 4 meals of full recipe objects don't blow up localStorage.
    if (Array.isArray(data.weekPlan)) {
      data.weekPlan = data.weekPlan.map(function(day) {
        if (!day) return day;
        return {
          breakfast: slimMeal(day.breakfast),
          lunch:     slimMeal(day.lunch),
          snack:     slimMeal(day.snack),
          dinner:    slimMeal(day.dinner)
        };
      });
    }
    // Use XOR+base64 obfuscation to deter trivial localStorage inspection
    if (window._storageEncode) {
      var encoded = window._storageEncode(data);
      if (encoded) {
        localStorage.setItem('mtd_profile_' + uid, encoded);
        return;
      }
    }
    // Fallback: plain JSON (if encoding unavailable)
    localStorage.setItem('mtd_profile_' + uid, JSON.stringify(data));
  } catch(e) {}
}
function loadProfile() {
  try {
    var user = AUTH.getUser();
    var uid = user ? user.id : 'anon';
    var raw = localStorage.getItem('mtd_profile_' + uid);
    if (!raw) return;
    // Try obfuscated decode first, then fall back to plain JSON
    var data = null;
    if (window._storageDecode) {
      data = window._storageDecode(raw);
    }
    if (!data) {
      try { data = JSON.parse(raw); } catch(e2) { return; }
    }
    if (!data) return;
    PROFILE_KEYS.forEach(function(k) { if (data[k] !== undefined) S[k] = data[k]; });
  } catch(e) {}
}

// ─── MAIN RENDER ───
function render() {
  if (window.destroyAllCharts) window.destroyAllCharts();
  if (AUTH.isLoggedIn()) saveProfile();
  var app = document.getElementById('app');

  // Scroll to top only when navigating to a different page/step
  var _didNavigate = (render._lastView !== S.view) ||
                     (render._lastNStep !== S.nStep) ||
                     (render._lastSStep !== S.sStep);
  render._lastView  = S.view;
  render._lastNStep = S.nStep;
  render._lastSStep = S.sStep;

  app.innerHTML = '';

  if (_didNavigate) {
    window.scrollTo(0, 0);
    requestAnimationFrame(function() {
      var appWrap = document.querySelector('.app');
      if (appWrap) appWrap.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  }

  // Not logged in → auth screens
  if (!AUTH.isLoggedIn()) {
    if (S.view === 'authRegister') renderRegister(app);
    else renderLogin(app);
    return;
  }

  // Logged in → app
  var wrap = h('div', {'class': 'app'});

  // User bar
  var user = AUTH.getUser();
  var ub = h('div', {'class': 'user-bar'});
  ub.appendChild(h('span', {'class': 'user-name'}, '◆ ' + user.name));
  var ubRight = h('div', {style: 'display:flex;align-items:center;gap:12px'});
  // Session time
  ubRight.appendChild(h('span', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;color:var(--grey3)'}, (window.BLACKBOX ? window.BLACKBOX.getSessionMinutes() : 0) + ' min'));
  // Language toggle FR / EN
  var _curLang = (window.I18N ? window.I18N.current : (S.lang || 'fr'));
  var langBtn = h('button', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;padding:4px 10px;background:none;border:1px solid var(--border);cursor:pointer;color:var(--grey)',
    onclick: function() {
      var next = (window.I18N ? window.I18N.current : (S.lang || 'fr')) === 'fr' ? 'en' : 'fr';
      S.lang = next;
      if (window.I18N) { window.I18N.current = next; }
      try { localStorage.setItem('mtd_lang', next); } catch(e) {}
      render();
    }
  }, _curLang === 'fr' ? 'FR' : 'EN');
  ubRight.appendChild(langBtn);
  // Day/night toggle
  var _isDark = document.body.classList.contains('dark-mode');
  ubRight.appendChild(h('button', {style:'font-size:16px;padding:2px 8px;background:none;border:1px solid var(--border);cursor:pointer', onclick: function(){ document.body.classList.toggle('dark-mode'); try{localStorage.setItem('mtd_dark_mode', document.body.classList.contains('dark-mode')?'true':'false');}catch(e){} render(); }}, _isDark ? '\u2600\uFE0F' : '\uD83C\uDF19'));
  ubRight.appendChild(h('button', {'class': 'user-logout', onclick: function(){ AUTH.logout(); S.view = 'auth'; render(); }}, window.t('auth.logout')));
  ub.appendChild(ubRight);
  wrap.appendChild(ub);

  // Main navigation (3 tabs: Dashboard, Nutrition, Sport)
  var nav = h('div', {'class': 'main-nav'});
  nav.appendChild(h('button', {'class': 'main-nav-tab' + (S.view === 'dashboard' ? ' active' : ''), onclick: function(){ S.view = 'dashboard'; if(window.BLACKBOX)window.BLACKBOX.log('nav_dashboard'); render(); }}, '◆ ' + window.t('nav.dashboard')));
  nav.appendChild(h('button', {'class': 'main-nav-tab' + (S.view === 'nutrition' ? ' active' : ''), onclick: function(){ S.view = 'nutrition'; if(window.BLACKBOX)window.BLACKBOX.log('nav_nutrition'); render(); }}, '◆ ' + window.t('nav.nutrition')));
  nav.appendChild(h('button', {'class': 'main-nav-tab' + (S.view === 'sport' ? ' active' : ''), onclick: function(){ S.view = 'sport'; if(window.BLACKBOX)window.BLACKBOX.log('nav_sport'); render(); }}, '◆ ' + window.t('nav.sport')));
  wrap.appendChild(nav);

  var content = h('div', {'class': 'fade-in', style: 'margin-top:24px'});

  if (S.view === 'sport' && window.SPORT) {
    SPORT.render(content);
  } else if (S.view === 'nutrition' && window.NUTRITION) {
    NUTRITION.render(content);
  } else {
    // Default: dashboard
    S.view = 'dashboard';
    if (window.DASHBOARD) DASHBOARD.render(content);
    else {
      // Fallback if dashboard not loaded
      // XSS fix: build h1 with user.name via DOM, not via innerHTML
      var welcomeH1 = document.createElement('h1');
      welcomeH1.appendChild(document.createTextNode('Bienvenue'));
      welcomeH1.appendChild(document.createElement('br'));
      var nameEm = document.createElement('em');
      nameEm.textContent = user ? user.name : '';
      welcomeH1.appendChild(nameEm);
      var welcomeDiv = h('div', {style: 'text-align:center;padding:40px'}, [
        h('p', {'class': 'subtitle'}, 'Choisissez Nutrition ou Sport dans la navigation.')
      ]);
      welcomeDiv.insertBefore(welcomeH1, welcomeDiv.firstChild);
      content.appendChild(welcomeDiv);
    }
  }

  wrap.appendChild(content);

  // Footer
  wrap.appendChild(h('div', {'class': 'footer'}, [h('a', {href: '#'}, 'MTD Macro Calculator')]));
  app.appendChild(wrap);
}

// ─── AUTH: LOGIN SCREEN ───
function renderLogin(app) {
  var c = h('div', {'class': 'auth-container'});
  c.appendChild(h('div', {'class': 'auth-logo'}, 'MTD'));
  c.appendChild(h('div', {'class': 'auth-sub'}, 'Macro Calculator'));
  c.appendChild(h('div', {'class': 'auth-line'}));

  if (window.TIPS) TIPS.renderToggle(c);

  if (S.authError) {
    c.appendChild(h('div', {'class': 'auth-error'}, S.authError));
  }

  var form = h('div', {'class': 'auth-form'});

  // Email
  var f1 = h('div', {'class': 'field'});
  f1.appendChild(h('label', {'class': 'field-label'}, window.t('auth.email')));
  var emailInput = h('input', {type: 'email', placeholder: 'votre@email.com', autocomplete: 'email'});
  f1.appendChild(emailInput);
  form.appendChild(f1);

  // Password
  var f2 = h('div', {'class': 'field'});
  f2.appendChild(h('label', {'class': 'field-label'}, window.t('auth.password')));
  var pwInput = h('input', {type: 'password', placeholder: '••••••', autocomplete: 'current-password'});
  f2.appendChild(pwInput);
  form.appendChild(f2);

  // Login button
  form.appendChild(h('button', {'class': 'btn-primary', onclick: function(){
    var email = emailInput.value.trim();
    var pw = pwInput.value;
    if (!email || !pw) { S.authError = 'Veuillez remplir tous les champs'; render(); return; }
    if (!window.canAttemptAuth(email)) { S.authError = window.t('auth.rate_limit'); render(); return; }
    AUTH.login(email, pw).then(function(result) {
      if (result.ok) {
        S.authError = '';
        S.view = 'dashboard';
        if (window.GAMIFICATION) { GAMIFICATION.updateStreak(); GAMIFICATION.unlockBadge('first_login'); }
        render();
      } else {
        S.authError = result.error;
        render();
      }
    }).catch(function() {
      S.authError = 'Erreur de connexion. Réessayez.';
      render();
    });
  }}, window.t('auth.login_btn')));

  c.appendChild(form);

  // Switch to register
  var sw = h('div', {'class': 'auth-switch'});
  sw.appendChild(txt(window.t('auth.no_account') + ' '));
  sw.appendChild(h('a', {onclick: function(){ S.authError = ''; S.view = 'authRegister'; render(); }}, window.t('auth.register')));
  c.appendChild(sw);

  app.appendChild(c);
}

// ─── AUTH: REGISTER SCREEN ───
function renderRegister(app) {
  var c = h('div', {'class': 'auth-container'});
  c.appendChild(h('div', {'class': 'auth-logo'}, 'MTD'));
  c.appendChild(h('div', {'class': 'auth-sub'}, window.t('auth.register')));
  c.appendChild(h('div', {'class': 'auth-line'}));

  if (window.TIPS) TIPS.renderToggle(c);

  if (S.authError) {
    c.appendChild(h('div', {'class': 'auth-error'}, S.authError));
  }

  var form = h('div', {'class': 'auth-form'});

  // Name
  var f0 = h('div', {'class': 'field'});
  f0.appendChild(h('label', {'class': 'field-label'}, 'Prénom ●'));
  var nameInput = h('input', {type: 'text', placeholder: 'Votre prénom', autocomplete: 'given-name'});
  f0.appendChild(nameInput);
  form.appendChild(f0);

  // Email
  var f1 = h('div', {'class': 'field'});
  f1.appendChild(h('label', {'class': 'field-label'}, 'Email ●'));
  var emailInput = h('input', {type: 'email', placeholder: 'votre@email.com', autocomplete: 'email'});
  f1.appendChild(emailInput);
  form.appendChild(f1);

  // Password
  var f2 = h('div', {'class': 'field'});
  f2.appendChild(h('label', {'class': 'field-label'}, 'Mot de passe ●'));
  var pwInput = h('input', {type: 'password', placeholder: 'Min. 6 caractères', autocomplete: 'new-password'});
  f2.appendChild(pwInput);
  form.appendChild(f2);

  // Confirm password
  var f3 = h('div', {'class': 'field'});
  f3.appendChild(h('label', {'class': 'field-label'}, 'Confirmer le mot de passe ●'));
  var pw2Input = h('input', {type: 'password', placeholder: 'Retapez le mot de passe', autocomplete: 'new-password'});
  f3.appendChild(pw2Input);
  form.appendChild(f3);

  // Register button
  form.appendChild(h('button', {'class': 'btn-primary', onclick: function(){
    var name = nameInput.value.trim();
    var email = emailInput.value.trim();
    var pw = pwInput.value;
    var pw2 = pw2Input.value;

    if (!name || !email || !pw || !pw2) { S.authError = 'Tous les champs sont obligatoires'; render(); return; }
    if (pw !== pw2) { S.authError = 'Les mots de passe ne correspondent pas'; render(); return; }
    if (pw.length < 6) { S.authError = 'Le mot de passe doit faire au moins 6 caractères'; render(); return; }

    AUTH.register(name, email, pw).then(function(result) {
      if (result.ok) {
        S.authError = '';
        S.view = 'nutrition'; // Nouveau compte → onboarding nutrition obligatoire
        S.nStep = 0;
        if (window.GAMIFICATION) { GAMIFICATION.unlockBadge('first_login'); }
        render();
      } else {
        S.authError = result.error;
        render();
      }
    }).catch(function() {
      S.authError = 'Erreur lors de la création du compte. Réessayez.';
      render();
    });
  }}, 'Créer mon compte'));

  c.appendChild(form);

  // Switch to login
  var sw = h('div', {'class': 'auth-switch'});
  sw.appendChild(txt('Déjà un compte ? '));
  sw.appendChild(h('a', {onclick: function(){ S.authError = ''; S.view = 'auth'; render(); }}, 'Se connecter'));
  c.appendChild(sw);

  app.appendChild(c);
}

// ─── MAKE RENDER GLOBAL ───
window.render = render;

// ─── DARK MODE PREFERENCE ───
try { if (localStorage.getItem('mtd_dark_mode') === 'true') document.body.classList.add('dark-mode'); } catch(e) {}

// ─── DEV ONLY: ?reset=users handler (localhost only) ───
(function() {
  var isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (isLocal && location.search.indexOf('reset=users') !== -1) {
    ['mtd_users','mtd_session','mtd_session_start','mtd_login_rl'].forEach(function(k){ localStorage.removeItem(k); });
    Object.keys(localStorage).forEach(function(k){
      if (k.startsWith('mtd_profile_') || k.startsWith('mtd_weight_history_') || k.startsWith('mtd_blackbox')) {
        localStorage.removeItem(k);
      }
    });
    alert('Base utilisateurs effacée. Rechargement...');
    location.href = location.pathname;
  }
})();

// ─── DEV ONLY: one-time wipe of test data on localhost ───
if ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') && !localStorage.getItem('mtd_dev_wiped_v1')) {
  ['mtd_users','mtd_session','mtd_session_start','mtd_login_rl'].forEach(function(k){ localStorage.removeItem(k); });
  // Also remove all profile/history keys
  Object.keys(localStorage).forEach(function(k){
    if (k.startsWith('mtd_profile_') || k.startsWith('mtd_weight_history_') || k.startsWith('mtd_blackbox')) {
      localStorage.removeItem(k);
    }
  });
  localStorage.setItem('mtd_dev_wiped_v1', '1');
}

// ─── INIT ───
// Auto-login check
if (AUTH.isLoggedIn()) {
  S.view = 'dashboard';
  if (window.GAMIFICATION) GAMIFICATION.updateStreak();
  // Restore full profile from localStorage (E-01)
  loadProfile();
  // Restaurer la langue
  if (window.I18N && S.lang) {
    window.I18N.current = S.lang;
  }
  // Restaurer les préférences d'unités (kg/lbs, cm/ft)
  if (window.UNITS) {
    window.UNITS.weight = S.weightUnit || 'kg';
    window.UNITS.height = S.heightUnit || 'cm';
  }
  // Load weight history (kept separate for history management)
  try {
    var user = AUTH.getUser();
    var userId = user ? user.id : 'anon';
    var savedWeightHistory = localStorage.getItem('mtd_weight_history_' + userId);
    if (savedWeightHistory) S.weightHistory = JSON.parse(savedWeightHistory);
  } catch(e) {}
  // Migrate existing performance data into perf-history (no-op if already done)
  if (window.PERF_HISTORY) {
    try { PERF_HISTORY.migrateExistingData(); } catch(e) {}
  }
} else {
  S.view = 'auth';
}

// First render
render();

// SECURITY: Integrity check — verify critical functions were not tampered by extensions
if (window._verifyCriticalFunctions) {
  try { window._verifyCriticalFunctions(); } catch(e) {}
}

})();
