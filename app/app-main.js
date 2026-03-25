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
  'muscuWeek','muscuCycle','sportSplashDone','nStep','sStep'
];
function saveProfile() {
  try {
    var user = AUTH.getUser();
    var uid = user ? user.id : 'anon';
    var data = {};
    PROFILE_KEYS.forEach(function(k) { data[k] = S[k]; });
    localStorage.setItem('mtd_profile_' + uid, JSON.stringify(data));
  } catch(e) {}
}
function loadProfile() {
  try {
    var user = AUTH.getUser();
    var uid = user ? user.id : 'anon';
    var raw = localStorage.getItem('mtd_profile_' + uid);
    if (!raw) return;
    var data = JSON.parse(raw);
    PROFILE_KEYS.forEach(function(k) { if (data[k] !== undefined) S[k] = data[k]; });
  } catch(e) {}
}

// ─── MAIN RENDER ───
function render() {
  if (window.destroyAllCharts) window.destroyAllCharts();
  if (AUTH.isLoggedIn()) saveProfile();
  var app = document.getElementById('app');
  app.innerHTML = '';

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
  var _isDark = document.body.classList.contains('dark-mode');
  ubRight.appendChild(h('button', {style:'font-size:16px;padding:2px 8px;background:none;border:1px solid var(--border);cursor:pointer', onclick: function(){ document.body.classList.toggle('dark-mode'); try{localStorage.setItem('mtd_dark_mode', document.body.classList.contains('dark-mode')?'true':'false');}catch(e){} render(); }}, _isDark ? '\u2600\uFE0F' : '\uD83C\uDF19'));
  ubRight.appendChild(h('button', {'class': 'user-logout', onclick: function(){ AUTH.logout(); S.view = 'auth'; render(); }}, 'D\u00e9connexion'));
  ub.appendChild(ubRight);
  wrap.appendChild(ub);

  // Main navigation (3 tabs: Dashboard, Nutrition, Sport)
  var nav = h('div', {'class': 'main-nav'});
  nav.appendChild(h('button', {'class': 'main-nav-tab' + (S.view === 'dashboard' ? ' active' : ''), onclick: function(){ S.view = 'dashboard'; if(window.BLACKBOX)window.BLACKBOX.log('nav_dashboard'); render(); }}, '◆ Accueil'));
  nav.appendChild(h('button', {'class': 'main-nav-tab' + (S.view === 'nutrition' ? ' active' : ''), onclick: function(){ S.view = 'nutrition'; if(window.BLACKBOX)window.BLACKBOX.log('nav_nutrition'); render(); }}, '◆ Nutrition'));
  nav.appendChild(h('button', {'class': 'main-nav-tab' + (S.view === 'sport' ? ' active' : ''), onclick: function(){ S.view = 'sport'; if(window.BLACKBOX)window.BLACKBOX.log('nav_sport'); render(); }}, '◆ Sport'));
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
      content.appendChild(h('div', {style: 'text-align:center;padding:40px'}, [
        h('h1', {html: 'Bienvenue<br><em>' + (user ? user.name : '') + '</em>'}),
        h('p', {'class': 'subtitle'}, 'Choisissez Nutrition ou Sport dans la navigation.')
      ]));
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
  f1.appendChild(h('label', {'class': 'field-label'}, 'Email'));
  var emailInput = h('input', {type: 'email', placeholder: 'votre@email.com', autocomplete: 'email'});
  f1.appendChild(emailInput);
  form.appendChild(f1);

  // Password
  var f2 = h('div', {'class': 'field'});
  f2.appendChild(h('label', {'class': 'field-label'}, 'Mot de passe'));
  var pwInput = h('input', {type: 'password', placeholder: '••••••', autocomplete: 'current-password'});
  f2.appendChild(pwInput);
  form.appendChild(f2);

  // Login button
  form.appendChild(h('button', {'class': 'btn-primary', onclick: function(){
    var email = emailInput.value.trim();
    var pw = pwInput.value;
    if (!email || !pw) { S.authError = 'Veuillez remplir tous les champs'; render(); return; }
    if (!window.canAttemptAuth(email)) { S.authError = 'Trop de tentatives. Réessayez dans 5 minutes.'; render(); return; }
    var result = AUTH.login(email, pw);
    if (result.ok) {
      S.authError = '';
      S.view = 'dashboard';
      if (window.GAMIFICATION) { GAMIFICATION.updateStreak(); GAMIFICATION.unlockBadge('first_login'); }
      render();
    } else {
      S.authError = result.error;
      render();
    }
  }}, 'Se connecter'));

  c.appendChild(form);

  // Switch to register
  var sw = h('div', {'class': 'auth-switch'});
  sw.appendChild(txt('Pas encore de compte ? '));
  sw.appendChild(h('a', {onclick: function(){ S.authError = ''; S.view = 'authRegister'; render(); }}, 'Créer un compte'));
  c.appendChild(sw);

  app.appendChild(c);
}

// ─── AUTH: REGISTER SCREEN ───
function renderRegister(app) {
  var c = h('div', {'class': 'auth-container'});
  c.appendChild(h('div', {'class': 'auth-logo'}, 'MTD'));
  c.appendChild(h('div', {'class': 'auth-sub'}, 'Créer votre compte'));
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

    var result = AUTH.register(name, email, pw);
    if (result.ok) {
      S.authError = '';
      S.view = 'dashboard';
      if (window.GAMIFICATION) { GAMIFICATION.updateStreak(); GAMIFICATION.unlockBadge('first_login'); }
      render();
    } else {
      S.authError = result.error;
      render();
    }
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

// ─── INIT ───
// Auto-login check
if (AUTH.isLoggedIn()) {
  S.view = 'dashboard';
  if (window.GAMIFICATION) GAMIFICATION.updateStreak();
  // Restore full profile from localStorage (E-01)
  loadProfile();
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

})();
