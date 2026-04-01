// app-main.js — Smart Fit Coach: Router, Auth Screens, Init
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
 'sex','age','birthDate','weight','height','activity','train','sleep','medical','goal','targetWeight',
 'mealsPerDay','eatingLocation','mealPrepTime','snacking','alcoholFreq','alcoholTypes','hydration',
 'cookLevel','whey','allergies','intolerances','regime','halal','excluded','cuisines',
 'shopFreq','shopStores','shopBudget','shopPrefs',
 'bodyZones','strongZones','weakZones',
 'pregnant','pregnancyWeek','prePregnancyWeight','dueDate',
 'cycleLength','lastPeriodDate','cycleTracking',
 'creatine','creatineDose','supplements',
 'sportGoals','sportLevel','sportDays','sportSessionDuration','sportFocus',
 'sportType','crossfitLevel',
 'trainTime',
 // CrossFit progress (calendar, current day, weekly cycle)
 'cfProgress','cfCurrentDay','crossfitWeek','crossfitCycleWeek','selectedCrossfitDay',
 // Running
 'runningLevel','runningGoal','runningDays','runningPace','runningVO2max','runningWeek','selectedRunDay',
 // Hyrox
 'hyroxLevel','hyroxGoal','hyroxDays','hyroxBenchmarks','hyroxWeek','selectedHyroxDay',
 // Padel
 'padelLevel','padelGoal','padelDays','padelProfile','padelWeek','selectedPadelDay',
 // Golf
 'golfLevel','golfGoal','golfDays','golfHandicap','golfProfile','golfWeek','selectedGolfDay',
 // Triathlon
 'triathlonGoal','triathlonLevel','triathlonWeak',
 'triathlonSwimPace','triathlonBikePace','triathlonRunPace','triathlonWeek','selectedTriDay',
 // Cycling
 'cyclingLevel','cyclingGoal','cyclingDays','cyclingType','cyclingFTP','cyclingSpeed','cyclingRelief',
 'cyclingWeek','selectedCyclingDay',
 // Calisthenics
 'calisthenicsLevel','calisthenicsGoal','calisthenicsdays','calisthPullups','calisthPushups',
 'calisthenicsWeek','selectedCalisthDay',
 // Musculation
 'muscuWeek','muscuCycle','sportSplashDone','nStep','sStep',
 'bonusExercises','sessionHistory',
 'muscuSessionLog','muscuProgressionHistory','musculationWeights','sportEquipment',
 // Nutrition plan
 'shopChecked','weekPlan','selectedDay',
 // System
 'lang','weightUnit','heightUnit',
 'muscuMedical','crossfit1RM','muscuStrengthProfile','muscuProgramStart',
 'heartRateRest','yogaLevel','yogaGoal','yogaDays',
 'wantsDessert',
 'wheyFlavors','saladBuilder',
 'emailOptin',
 'profilePhoto'
];
/**
 * Slim a single meal object down to essential nutritional fields only.
 * Strips heavy fields (ingredient strings, step arrays, tags) to keep
 * localStorage usage well below the 5 MB browser quota.
 */
function slimMeal(meal) {
 if (!meal) return null;
 var slim = { _id: meal._id, n: meal.n, k: meal.k, p: meal.p, g: meal.g, l: meal.l, w: meal.w, lv: meal.lv };
 // Preserve ingredient data for custom recipes (SALAD_, sm_) that are not in RECIPES_DB
 // and cannot be re-fetched via RecipeEngine.findRecipe().
 var id = meal._id || '';
 var isCustom = id.indexOf('SALAD_') === 0 || id.indexOf('sm_') === 0;
 if (isCustom) {
 if (meal.i) slim.i = meal.i;
 if (meal._scaledIngredients) slim._scaledIngredients = meal._scaledIngredients;
 if (meal._scalingRatio !== undefined) slim._scalingRatio = meal._scalingRatio;
 if (meal.f) slim.f = meal.f;
 }
 return slim;
}

// Keys that affect the meal plan — changing any of these should invalidate weekPlan
// Includes dietary preferences (regime, halal, allergies, etc.) since filterRecipes() depends on them
var NUTRITION_PLAN_KEYS = [
 'goal', 'weight', 'activity', 'mealsPerDay', 'sex', 'age', 'height',
 'regime', 'halal', 'excluded', 'cookLevel', 'wantsDessert',
 'allergies', 'intolerances', 'cuisines', 'whey', 'sportDays', 'trainTime', 'medical'
];

function saveProfile() {
 try {
 var user = AUTH.getUser();
 var uid = user ? user.id : 'anon';

 // Check if nutrition-relevant values changed vs what is currently persisted.
 // If so, weekPlan is stale and must be invalidated before saving.
 (function() {
 try {
 var raw2 = localStorage.getItem('mtd_profile_' + uid);
 if (!raw2 || !S.weekPlan) return; // nothing to compare or no plan to invalidate
 var prev = null;
 if (window._storageDecode) { prev = window._storageDecode(raw2); }
 if (!prev) { try { prev = JSON.parse(raw2); } catch(e2) {} }
 if (!prev) return;
 var planImpacted = NUTRITION_PLAN_KEYS.some(function(k) {
 // For arrays/objects use JSON serialization; for primitives use strict equality
 var pv = prev[k], sv = S[k];
 if (typeof pv === 'object' || typeof sv === 'object') {
 return JSON.stringify(pv) !== JSON.stringify(sv);
 }
 return pv !== sv;
 });
 if (planImpacted) {
 S.weekPlan = null;
 }
 } catch(e2) {}
 })();

 var data = {};
 PROFILE_KEYS.forEach(function(k) { data[k] = S[k]; });
 // Slim weekPlan before serializing: strip ingredient/step/tag fields so
 // 7 days × 4 meals of full recipe objects don't blow up localStorage.
 if (Array.isArray(data.weekPlan)) {
 data.weekPlan = data.weekPlan.map(function(day) {
 if (!day) return day;
 return {
 breakfast: slimMeal(day.breakfast),
 lunch: slimMeal(day.lunch),
 snack: slimMeal(day.snack),
 dinner: slimMeal(day.dinner)
 };
 });
 }
 // Use XOR+base64 obfuscation to deter trivial localStorage inspection
 if (window._storageEncode) {
 var encoded = window._storageEncode(data);
 if (encoded) {
 localStorage.setItem('mtd_profile_' + uid, encoded);
 // Sync vers Supabase (debounced)
 if (window.SupaSync) SupaSync.scheduleSave();
 return;
 }
 }
 // Fallback: plain JSON (if encoding unavailable)
 localStorage.setItem('mtd_profile_' + uid, JSON.stringify(data));
 } catch(e) {}
 // Sync vers Supabase (debounced)
 if (window.SupaSync) SupaSync.scheduleSave();
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
 // Reset ephemeral UI state that should not persist across sessions
 S.shopListOpen = false;
 S.smoothieBarOpen = false;
 S._addMealModalSlot = null;
 S.modalRecipe = null;
 S.modalSmoothie = null;
 S._recipePicker = null;
 if (S.saladBar) S.saladBar.open = false;
 } catch(e) {}
}

// ─── MAIN RENDER ───
function render() {
 if (render._lock) return;
 render._lock = true;
 try {
 if (window.destroyAllCharts) window.destroyAllCharts();
 if (AUTH.isLoggedIn()) saveProfile();
 var app = document.getElementById('app');

 // Scroll to top only when navigating to a different page/step
 var _didNavigate = (render._lastView !== S.view) ||
 (render._lastNStep !== S.nStep) ||
 (render._lastSStep !== S.sStep);
 render._lastView = S.view;
 render._lastNStep = S.nStep;
 render._lastSStep = S.sStep;

 app.innerHTML = '';

 if (_didNavigate) {
 // Scroll immediately (before new content is painted)
 window.scrollTo({ top: 0, behavior: 'instant' });
 document.documentElement.scrollTop = 0;
 document.body.scrollTop = 0;
 var _appEl = document.getElementById('app');
 if (_appEl) _appEl.scrollTop = 0;
 }

 // Not logged in → auth screens
 if (S.view === 'authNewPassword') { renderNewPassword(app); return; }
 if (!AUTH.isLoggedIn()) {
 if (S.view === 'authRegister') renderRegister(app);
 else if (S.view === 'authVerify') renderVerifyEmail(app);
 else if (S.view === 'authForgot') renderForgotPassword(app);
 else renderLogin(app);
 return;
 }

 // Logged in → app
 var wrap = h('div', {'class': 'app'});

 // User bar
 var user = AUTH.getUser();
 var ub = h('div', {'class': 'user-bar'});
 ub.appendChild(h('span', {'class': 'user-name'}, '◆ ' + (user ? (user.name || user.email || 'Utilisateur') : 'Utilisateur')));
 var ubRight = h('div', {style: 'display:flex;align-items:center;gap:12px'});
 // Profile photo / initials avatar (persistent top-right, clickable → profil step 1)
 (function() {
   var _avatarBtn = h('button', {
     style: 'background:none;border:none;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;border-radius:50%;min-width:44px;min-height:44px',
     onclick: function() { S.view = 'nutrition'; S.nStep = 1; window.render(); },
     title: 'Voir le profil'
   });
   if (S.profilePhoto) {
     var _ubPhoto = h('img', {
       src: S.profilePhoto,
       style: 'width:36px;height:36px;border-radius:50%;object-fit:cover;border:1px solid var(--border,#D8D8D0);flex-shrink:0;display:block;transition:box-shadow 0.2s',
       onmouseover: function() { this.style.boxShadow = '0 0 0 2px rgba(10,10,9,0.15)'; },
       onmouseout: function() { this.style.boxShadow = 'none'; }
     });
     _avatarBtn.appendChild(_ubPhoto);
   } else {
     // Initials avatar fallback
     var _uInitials = (function() {
       var _un = user ? (user.name || user.email || '') : '';
       if (!_un) return 'S';
       var _parts = _un.trim().split(/\s+/);
       if (_parts.length >= 2) return (_parts[0][0] + _parts[_parts.length - 1][0]).toUpperCase();
       return _un[0].toUpperCase();
     })();
     var _ubAvatar = h('div', {
       style: 'width:36px;height:36px;border-radius:50%;background:var(--ivory,#FAF9F6);border:1px solid var(--border,#0A0A09);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;font-weight:500;color:var(--black,#0A0A09);letter-spacing:0.5px;transition:box-shadow 0.2s',
       onmouseover: function() { this.style.boxShadow = '0 0 0 2px rgba(10,10,9,0.15)'; },
       onmouseout: function() { this.style.boxShadow = 'none'; }
     }, _uInitials);
     _avatarBtn.appendChild(_ubAvatar);
   }
   ubRight.appendChild(_avatarBtn);
 })();
 // Session time
 ubRight.appendChild(h('span', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;color:var(--grey3)'}, (window.BLACKBOX ? window.BLACKBOX.getSessionMinutes() : 0) + ' min'));
 // Language toggle FR / EN
 var _curLang = (window.I18N ? window.I18N.current : (S.lang || 'fr'));
 var langBtn = h('button', {
 style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;padding:12px 16px;min-height:44px;box-sizing:border-box;background:none;border:1px solid var(--border);border-radius:2px;cursor:pointer;color:var(--grey)',
 onclick: function() {
 var next = (window.I18N ? window.I18N.current : (S.lang || 'fr')) === 'fr' ? 'en' : 'fr';
 if (window.I18N && window.I18N.setLang) { window.I18N.setLang(next); } else { S.lang = next; render(); }
 }
 }, _curLang === 'fr' ? 'EN' : 'FR');
 ubRight.appendChild(langBtn);
 // Day/night toggle
 var _isDark = document.body.classList.contains('dark-mode');
 ubRight.appendChild(h('button', {style:'font-size:16px;padding:12px;min-height:44px;min-width:44px;box-sizing:border-box;background:none;border:1px solid var(--border);border-radius:2px;cursor:pointer;display:flex;align-items:center;justify-content:center', onclick: function(){ document.body.classList.toggle('dark-mode'); try{localStorage.setItem('mtd_dark_mode', document.body.classList.contains('dark-mode')?'true':'false');}catch(e){} render(); }}, _isDark ? '\u2600\uFE0F' : '\uD83C\uDF19'));
 ubRight.appendChild(h('button', {'class': 'user-logout', onclick: function(){ AUTH.logout(); S.view = 'auth'; S.authError = ''; S._resetSent = false; S._resetEmail = ''; S._passwordUpdated = false; S.authVerifyEmail = ''; render(); }}, window.t('auth.logout')));
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
 wrap.appendChild(h('div', {'class': 'footer'}, [h('a', {href: '#'}, 'Smart Fit Coach')]));
 app.appendChild(wrap);

 // Post-render scroll: reset .app container and window after content is in DOM
 if (_didNavigate) {
 window.scrollTo({ top: 0, behavior: 'instant' });
 document.documentElement.scrollTop = 0;
 document.body.scrollTop = 0;
 if (app) app.scrollTop = 0;
 var _wrap = app.querySelector('.app');
 if (_wrap) _wrap.scrollTop = 0;
 requestAnimationFrame(function() {
 window.scrollTo({ top: 0, behavior: 'instant' });
 document.documentElement.scrollTop = 0;
 document.body.scrollTop = 0;
 if (app) app.scrollTop = 0;
 var _w2 = app.querySelector('.app');
 if (_w2) _w2.scrollTop = 0;
 });
 }
 } finally { render._lock = false; }
}

// ─── AUTH: LOGIN SCREEN ───
function renderLogin(app) {
 var c = h('div', {'class': 'auth-container'});
 c.appendChild(h('div', {'class': 'auth-logo'}, 'SMARTFITCOACH'));
 c.appendChild(h('div', {'class': 'auth-sub'}, 'Nutrition & Sport'));
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
 var loginBtn = h('button', {'class': 'btn-primary', onclick: function(){
 if (loginBtn.disabled) return;
 var email = emailInput.value.trim();
 var pw = pwInput.value;
 if (!email || !pw) { S.authError = 'Veuillez remplir tous les champs'; render(); return; }
 loginBtn.disabled = true;
 loginBtn.textContent = 'Connexion...';
 AUTH.login(email, pw).then(function(result) {
 if (result.ok) {
 S.authError = '';
 S.view = 'dashboard';
 // Restore profile from localStorage for this user
 loadProfile();
 // Fix nStep for returning users who completed onboarding
 if (S.nStep === 0 && (S.sex || S.goal || S.weekPlan)) {
 S.nStep = S.weekPlan ? 9 : (S.goal ? 8 : 1);
 }
 // Restore language preference
 if (window.I18N && S.lang) window.I18N.current = S.lang;
 // Restore unit preferences
 if (window.UNITS) {
 window.UNITS.weight = S.weightUnit || 'kg';
 window.UNITS.height = S.heightUnit || 'cm';
 }
 // Load weight history (stored separately)
 try {
 var user = AUTH.getUser();
 var userId = user ? user.id : 'anon';
 var savedWH = localStorage.getItem('mtd_weight_history_' + userId);
 if (savedWH) S.weightHistory = JSON.parse(savedWH);
 } catch(e) {}
 // Migrate performance data
 if (window.PERF_HISTORY) {
 try { PERF_HISTORY.migrateExistingData(); } catch(e) {}
 }
 // Sync from cloud (async — will re-render if cloud data was loaded)
 if (window.SupaSync) {
 SupaSync.syncOnLogin().then(function(syncResult) {
 if (syncResult === 'loaded_from_cloud') {
 if (S.nStep === 0 && (S.sex || S.goal || S.weekPlan)) {
 S.nStep = S.weekPlan ? 9 : (S.goal ? 8 : 1);
 }
 if (window.I18N && S.lang) window.I18N.current = S.lang;
 if (window.UNITS) {
 window.UNITS.weight = S.weightUnit || 'kg';
 window.UNITS.height = S.heightUnit || 'cm';
 }
 }
 });
 SupaSync.startAutoSync();
 }
 if (window.GAMIFICATION) { GAMIFICATION.updateStreak(); GAMIFICATION.unlockBadge('first_login'); }
 render();
 } else {
 S.authError = result.error;
 render();
 }
 }).catch(function() {
 if (S.view !== 'auth') return;
 S.authError = 'Erreur de connexion. Réessayez.';
 render();
 });
 }}, window.t('auth.login_btn'));
 form.appendChild(loginBtn);

 // Forgot password link
 var forgotLink = h('div', {style: 'text-align:center;margin-top:16px'});
 forgotLink.appendChild(h('a', {
 style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);cursor:pointer;text-decoration:underline',
 onclick: function(){ S.authError = ''; S.view = 'authForgot'; render(); }
 }, 'Mot de passe oubli\u00e9 ?'));
 form.appendChild(forgotLink);

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
 c.appendChild(h('div', {'class': 'auth-logo'}, 'SMARTFITCOACH'));
 c.appendChild(h('div', {'class': 'auth-sub'}, window.t('auth.register')));
 c.appendChild(h('div', {'class': 'auth-line'}));

 if (window.TIPS) TIPS.renderToggle(c);

 if (S.authError) {
 c.appendChild(h('div', {'class': 'auth-error'}, S.authError));
 }

 var form = h('div', {'class': 'auth-form'});

 // Name
 var f0 = h('div', {'class': 'field'});
 f0.appendChild(h('label', {'class': 'field-label'}, window.t('auth.firstname') + ' ●'));
 var nameInput = h('input', {type: 'text', placeholder: 'Votre prénom', autocomplete: 'given-name'});
 f0.appendChild(nameInput);
 form.appendChild(f0);

 // Email
 var f1 = h('div', {'class': 'field'});
 f1.appendChild(h('label', {'class': 'field-label'}, window.t('auth.email') + ' ●'));
 var emailInput = h('input', {type: 'email', placeholder: 'votre@email.com', autocomplete: 'email'});
 f1.appendChild(emailInput);
 form.appendChild(f1);

 // Password
 var f2 = h('div', {'class': 'field'});
 f2.appendChild(h('label', {'class': 'field-label'}, window.t('auth.password') + ' ●'));
 var pwInput = h('input', {type: 'password', placeholder: 'Min. 6 caractères', autocomplete: 'new-password'});
 f2.appendChild(pwInput);
 form.appendChild(f2);

 // Confirm password
 var f3 = h('div', {'class': 'field'});
 f3.appendChild(h('label', {'class': 'field-label'}, window.t('auth.confirm_password') + ' ●'));
 var pw2Input = h('input', {type: 'password', placeholder: 'Retapez le mot de passe', autocomplete: 'new-password'});
 f3.appendChild(pw2Input);
 form.appendChild(f3);

 // Register button
 var regBtn = h('button', {'class': 'btn-primary', onclick: function(){
 if (regBtn.disabled) return;
 var name = nameInput.value.trim();
 var email = emailInput.value.trim();
 var pw = pwInput.value;
 var pw2 = pw2Input.value;

 if (!name || !email || !pw || !pw2) { S.authError = 'Tous les champs sont obligatoires'; render(); return; }
 if (pw !== pw2) { S.authError = window.t('auth.error_password_match'); render(); return; }
 if (pw.length < 6) { S.authError = window.t('auth.error_password_length'); render(); return; }

 regBtn.disabled = true;
 regBtn.textContent = 'Création...';
 AUTH.register(name, email, pw).then(function(result) {
 if (result.ok) {
 S.authError = '';
 S.view = 'authVerify';
 S.authVerifyEmail = email;
 render();
 } else {
 S.authError = result.error;
 render();
 }
 }).catch(function() {
 S.authError = 'Erreur lors de la création du compte. Réessayez.';
 render();
 });
 }}, window.t('auth.register_btn'));
 form.appendChild(regBtn);

 c.appendChild(form);

 // Switch to login
 var sw = h('div', {'class': 'auth-switch'});
 sw.appendChild(txt(window.t('auth.has_account') + ' '));
 sw.appendChild(h('a', {onclick: function(){ S.authError = ''; S.view = 'auth'; render(); }}, window.t('auth.login')));
 c.appendChild(sw);

 app.appendChild(c);
}

// ─── AUTH: VERIFY EMAIL SCREEN ───
function renderVerifyEmail(app) {
 var c = h('div', {'class': 'auth-container'});
 c.appendChild(h('div', {'class': 'auth-logo'}, 'SMARTFITCOACH'));
 c.appendChild(h('div', {'class': 'auth-sub'}, 'V\u00e9rifie ton email'));
 c.appendChild(h('div', {'class': 'auth-line'}));

 var form = h('div', {'class': 'auth-form'});

 // Title
 form.appendChild(h('h2', {style: 'text-align:center;margin:0 0 8px 0;font-size:24px'}, 'V\u00e9rifie ton email'));

 // Subtitle
 form.appendChild(h('p', {style: 'text-align:center;margin:0 0 6px 0;color:var(--grey);font-size:13px'}, 'Un email de confirmation a \u00e9t\u00e9 envoy\u00e9 \u00e0 :'));

 // Email display
 form.appendChild(h('p', {style: 'text-align:center;margin:0 0 20px 0;font-weight:bold;font-size:16px'}, S.authVerifyEmail || ''));

 // Instruction
 form.appendChild(h('p', {style: 'text-align:center;margin:0 0 24px 0;color:var(--grey);font-size:13px;line-height:1.6'}, 'Clique sur le lien dans l\u2019email pour activer ton compte.'));

 // Status message container
 var statusMsg = h('div', {style: 'text-align:center;min-height:24px;margin-bottom:12px;font-size:13px'});
 form.appendChild(statusMsg);

 // Resend button
 form.appendChild(h('button', {
 'class': 'btn-primary',
 style: 'background:transparent;border:1px solid var(--border);color:var(--fg);margin-bottom:10px;width:100%',
 onclick: function() {
 var client = window.getSupabaseClient ? window.getSupabaseClient() : null;
 if (!client) {
 statusMsg.textContent = 'Erreur : client non disponible.';
 statusMsg.style.color = '#5A1010';
 return;
 }
 statusMsg.textContent = 'Envoi en cours...';
 statusMsg.style.color = 'var(--grey)';
 client.auth.resend({type: 'signup', email: S.authVerifyEmail}).then(function(res) {
 if (res.error) {
 statusMsg.textContent = res.error.message || 'Erreur lors du renvoi.';
 statusMsg.style.color = '#5A1010';
 } else {
 statusMsg.textContent = 'Email renvoy\u00e9 !';
 statusMsg.style.color = '#1A4A1A';
 }
 }).catch(function() {
 statusMsg.textContent = 'Erreur r\u00e9seau. R\u00e9essaye.';
 statusMsg.style.color = '#5A1010';
 });
 }
 }, 'Renvoyer l\u2019email'));

 // Confirm button
 form.appendChild(h('button', {
 'class': 'btn-primary',
 style: 'width:100%',
 onclick: function() {
 var client = window.getSupabaseClient ? window.getSupabaseClient() : null;
 if (!client) {
 statusMsg.textContent = 'Erreur : client non disponible.';
 statusMsg.style.color = '#5A1010';
 return;
 }
 statusMsg.textContent = 'V\u00e9rification...';
 statusMsg.style.color = 'var(--grey)';
 // Try getUser (server-side check) first, fallback to getSession
 var checkFn = client.auth.getUser ? client.auth.getUser() : client.auth.getSession();
 checkFn.then(function(res) {
 var user = res.data && (res.data.user || (res.data.session && res.data.session.user));
 if (user && user.email_confirmed_at) {
 S.authError = '';
 S.view = 'nutrition';
 S.nStep = 0;
 if (window.GAMIFICATION) { GAMIFICATION.unlockBadge('first_login'); }
 render();
 } else {
 statusMsg.textContent = 'Email pas encore confirm\u00e9. V\u00e9rifie ta bo\u00eete mail (et les spams).';
 statusMsg.style.color = '#5A1010';
 }
 }).catch(function() {
 statusMsg.textContent = 'Erreur de v\u00e9rification. R\u00e9essaye.';
 statusMsg.style.color = '#5A1010';
 });
 }
 }, 'J\u2019ai confirm\u00e9 mon email'));

 c.appendChild(form);

 // Back to login link
 var sw = h('div', {'class': 'auth-switch'});
 sw.appendChild(h('a', {onclick: function() { S.authError = ''; S.view = 'auth'; render(); }}, 'Retour \u00e0 la connexion'));
 c.appendChild(sw);

 // Spam hint
 c.appendChild(h('p', {style: 'text-align:center;margin-top:16px;font-size:11px;color:var(--grey3,#888)'}, 'Tu ne trouves pas l\u2019email ? V\u00e9rifie ton dossier spam.'));

 app.appendChild(c);
}

// ─── AUTH: FORGOT PASSWORD SCREEN ───
function renderForgotPassword(app) {
 var c = h('div', {'class': 'auth-container'});
 c.appendChild(h('div', {'class': 'auth-logo'}, 'SMARTFITCOACH'));
 c.appendChild(h('div', {'class': 'auth-sub'}, 'R\u00e9initialisation'));
 c.appendChild(h('div', {'class': 'auth-line'}));

 if (S.authError) {
 c.appendChild(h('div', {'class': 'auth-error'}, S.authError));
 }

 if (S._resetSent) {
 // Confirmation screen
 c.appendChild(h('div', {style: 'text-align:center;padding:24px 0'}, [
 h('div', {style: 'font-family:Georgia,serif;font-size:24px;margin-bottom:16px'}, 'Email envoy\u00e9'),
 h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey);line-height:1.7;margin-bottom:24px'},
 'Un lien de r\u00e9initialisation a \u00e9t\u00e9 envoy\u00e9 \u00e0 ' + (S._resetEmail || '') + '. V\u00e9rifiez votre bo\u00eete de r\u00e9ception et votre dossier spam.'),
 h('button', {'class': 'btn-secondary', onclick: function() {
 S._resetSent = false;
 S._resetEmail = '';
 S.authError = '';
 S.view = 'auth';
 render();
 }}, 'Retour \u00e0 la connexion')
 ]));
 app.appendChild(c);
 return;
 }

 var form = h('div', {'class': 'auth-form'});

 form.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey);line-height:1.7;margin-bottom:24px;text-align:center'},
 'Entrez votre adresse email. Vous recevrez un lien pour cr\u00e9er un nouveau mot de passe.'));

 // Email field
 var f1 = h('div', {'class': 'field'});
 f1.appendChild(h('label', {'class': 'field-label'}, 'Email'));
 var emailInput = h('input', {type: 'email', placeholder: 'votre@email.com', autocomplete: 'email'});
 f1.appendChild(emailInput);
 form.appendChild(f1);

 // Send button
 var sendBtn = h('button', {'class': 'btn-primary', onclick: function() {
 if (sendBtn.disabled) return;
 var email = emailInput.value.trim();
 if (!email) { S.authError = 'Veuillez entrer votre adresse email'; render(); return; }
 sendBtn.disabled = true;
 sendBtn.textContent = 'Envoi en cours...';
 AUTH.resetPassword(email).then(function(result) {
 if (result.ok) {
 S.authError = '';
 S._resetSent = true;
 S._resetEmail = email;
 render();
 } else {
 S.authError = result.error;
 render();
 }
 }).catch(function() {
 S.authError = 'Erreur r\u00e9seau. R\u00e9essayez.';
 render();
 });
 }}, 'Envoyer le lien');
 form.appendChild(sendBtn);

 c.appendChild(form);

 // Back to login
 var sw = h('div', {'class': 'auth-switch'});
 sw.appendChild(h('a', {onclick: function() { S.authError = ''; S.view = 'auth'; render(); }}, 'Retour \u00e0 la connexion'));
 c.appendChild(sw);

 app.appendChild(c);
}

// ─── AUTH: SET NEW PASSWORD (after reset link clicked) ───
function renderNewPassword(app) {
 var c = h('div', {'class': 'auth-container'});
 c.appendChild(h('div', {'class': 'auth-logo'}, 'SMARTFITCOACH'));
 c.appendChild(h('div', {'class': 'auth-sub'}, 'Nouveau mot de passe'));
 c.appendChild(h('div', {'class': 'auth-line'}));

 if (S.authError) {
 c.appendChild(h('div', {'class': 'auth-error'}, S.authError));
 }

 if (S._passwordUpdated) {
 c.appendChild(h('div', {style: 'text-align:center;padding:24px 0'}, [
 h('div', {style: 'font-family:Georgia,serif;font-size:24px;margin-bottom:16px'}, 'Mot de passe modifi\u00e9'),
 h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey);line-height:1.7;margin-bottom:24px'},
 'Votre mot de passe a \u00e9t\u00e9 mis \u00e0 jour. Vous pouvez maintenant vous connecter.'),
 h('button', {'class': 'btn-primary', onclick: function() {
 S._passwordUpdated = false;
 S.authError = '';
 S.view = 'auth';
 render();
 }}, 'Se connecter')
 ]));
 app.appendChild(c);
 return;
 }

 var form = h('div', {'class': 'auth-form'});
 form.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey);line-height:1.7;margin-bottom:24px;text-align:center'},
 'Choisissez un nouveau mot de passe (minimum 6 caract\u00e8res).'));

 var f1 = h('div', {'class': 'field'});
 f1.appendChild(h('label', {'class': 'field-label'}, 'Nouveau mot de passe'));
 var pw1 = h('input', {type: 'password', placeholder: '\u2022\u2022\u2022\u2022\u2022\u2022', autocomplete: 'new-password'});
 f1.appendChild(pw1);
 form.appendChild(f1);

 var f2 = h('div', {'class': 'field'});
 f2.appendChild(h('label', {'class': 'field-label'}, 'Confirmer'));
 var pw2 = h('input', {type: 'password', placeholder: '\u2022\u2022\u2022\u2022\u2022\u2022', autocomplete: 'new-password'});
 f2.appendChild(pw2);
 form.appendChild(f2);

 var saveBtn = h('button', {'class': 'btn-primary', onclick: function() {
 if (saveBtn.disabled) return;
 var p1 = pw1.value, p2 = pw2.value;
 if (!p1 || p1.length < 6) { S.authError = 'Minimum 6 caract\u00e8res'; render(); return; }
 if (p1 !== p2) { S.authError = 'Les mots de passe ne correspondent pas'; render(); return; }
 saveBtn.disabled = true;
 saveBtn.textContent = 'Mise \u00e0 jour...';
 var client = window.getSupabaseClient ? window.getSupabaseClient() : null;
 if (client && client.auth) {
 client.auth.updateUser({ password: p1 }).then(function(result) {
 if (result.error) {
 S.authError = result.error.message || 'Erreur lors de la mise \u00e0 jour';
 render();
 } else {
 S.authError = '';
 S._passwordUpdated = true;
 render();
 }
 }).catch(function() {
 S.authError = 'Erreur r\u00e9seau. R\u00e9essayez.';
 render();
 });
 } else {
 S.authError = 'Service indisponible';
 render();
 }
 }}, 'Enregistrer');
 form.appendChild(saveBtn);

 c.appendChild(form);
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
function _doAutoLogin() {
if (AUTH.isLoggedIn()) {
 S.view = 'dashboard';
 if (window.GAMIFICATION) GAMIFICATION.updateStreak();
 // Restore full profile from localStorage (E-01)
 loadProfile();
 // Si l'utilisateur existant a un profil mais nStep=0 (ex: profil corrompu ou rechargement)
 // → sauter le splash pour ne pas le forcer à refaire tout l'onboarding
 if (S.nStep === 0 && (S.sex || S.goal || S.weekPlan)) {
 S.nStep = S.weekPlan ? 9 : (S.goal ? 8 : 1);
 }
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
 // Demarrer la sync Supabase si disponible
 if (window.SupaSync) {
 SupaSync.syncOnLogin();
 SupaSync.startAutoSync();
 }
} else {
 S.view = 'auth';
}
render();
}

// Wait for Supabase session before first render
if (AUTH.ready) {
 AUTH.ready().then(_doAutoLogin).catch(_doAutoLogin);
} else {
 _doAutoLogin();
}

// SECURITY: Integrity check — verify critical functions were not tampered by extensions
if (window._verifyCriticalFunctions) {
 try { window._verifyCriticalFunctions(); } catch(e) {}
}

})();
