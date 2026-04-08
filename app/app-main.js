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
 'prenom','nom','phone','sex','age','birthDate','weight','height','activity','train','sleep','medical','goal','targetWeight',
 'mealsPerDay','eatingLocation','mealPrepTime','snacking','alcoholFreq','alcoholTypes','hydration',
 'cookLevel','whey','allergies','intolerances','regime','halal','excluded','cuisines',
 'shopFreq','shopStores','shopBudget','shopPrefs',
 'bodyZones','strongZones','weakZones',
 'pregnant','pregnancyWeek','prePregnancyWeight','dueDate',
 'cycleLength','lastPeriodDate','cycleTracking',
 'creatine','creatineDose','supplements',
 'sportGoals','sportLevel','sportDays','trainingDaysSelected','sportSessionDuration','sportFocus',
 'sportType','crossfitLevel','crossfitCompGoal','crossfitOpenDate',
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
 'triathlonFTP','triathlonRaceDate',
 // Cycling
 'cyclingLevel','cyclingGoal','cyclingDays','cyclingType','cyclingFTP','cyclingSpeed','cyclingRelief',
 'cyclingWeek','selectedCyclingDay',
 // Calisthenics
 'calisthenicsLevel','calisthenicsGoal','calisthenicsdays','calisthPullups','calisthPushups',
 'calisthenicsEquipment','calisthDips','calisthCurrentWeek',
 'calisthenicsWeek','selectedCalisthDay',
 // Musculation
 'muscuWeek','muscuCycle','muscuProgramCount','sportSplashDone','nStep','sStep','selectedSportDay',
 'sportProgram',
 'bonusExercises','sessionHistory',
 'muscuSessionLog','muscuProgressionHistory','musculationWeights','sportEquipment','installations',
 // Nutrition plan
 'shopChecked','weekPlan','selectedDay','_weekPlanGeneratedAt','nutritionLog',
 // System
 'lang','weightUnit','heightUnit',
 'muscuMedical','crossfit1RM','muscuStrengthProfile','muscuProgramStart',
 'heartRateRest','yogaLevel','yogaGoal','yogaObjectif','yogaDuration','yogaStyle','yogaDays','yogaWeek','yogaDay',
 'crossfitBenchmarks',
 'weightHistory',
 'wantsDessert',
 'wheyFlavors','saladBuilder',
 'emailOptin',
 'profilePhoto','photoFront','photoBack',
 'todayWellness',
 'aiCoachHistory',
 'appMode',
 'stress',
 'cfDeloadRecommended',
 'sessionPostponed'
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

 // Validate profile data before saving
 if (window.validateProfile) {
   var _valErrors = window.validateProfile({ age: S.age, weight: S.weight, height: S.height });
   if (_valErrors.length > 0) {
     alert(_valErrors.join('\n'));
     return;
   }
 }

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
 } catch(e) { console.warn('Storage quota exceeded ou erreur localStorage:', e); }
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
 // Prototype pollution guard: reject any parsed object that carries dangerous keys
 if (Object.prototype.hasOwnProperty.call(data, '__proto__') ||
     Object.prototype.hasOwnProperty.call(data, 'constructor') ||
     Object.prototype.hasOwnProperty.call(data, 'prototype')) {
   console.warn('[loadProfile] Prototype pollution attempt detected — ignoring localStorage data');
   return;
 }
 PROFILE_KEYS.forEach(function(k) { if (data[k] !== undefined) S[k] = data[k]; });
 // Defensive rehydration: ensure object/array fields are never null after load
 var _objFields = ['sportFocus','bonusExercises','sessionHistory','muscuSessionLog',
 'muscuProgressionHistory','musculationWeights','muscuStrengthProfile','crossfit1RM',
 'hyroxBenchmarks','shopChecked','bodyZones','crossfitBenchmarks','muscuMedical'];
 _objFields.forEach(function(f) { if (!S[f] || typeof S[f] !== 'object' || Array.isArray(S[f])) S[f] = {}; });
 var _arrFields = ['sportGoals','medical','allergies','intolerances','cuisines',
 'shopStores','shopPrefs','strongZones','weakZones',
 'train','supplements','wheyFlavors','alcoholTypes',
 'calisthenicsEquipment','calisthenicsGoal','weightHistory','trainingDaysSelected'];
 _arrFields.forEach(function(f) { if (!Array.isArray(S[f])) S[f] = []; });
 // weekPlan is null or array — reject anything else
 if (S.weekPlan !== null && !Array.isArray(S.weekPlan)) S.weekPlan = null;
 // excluded is a string (comma-separated), not an array — guard separately
 if (typeof S.excluded !== 'string') S.excluded = '';
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

// Expose persistence functions globally so other modules can call them
window.saveProfile = saveProfile;
window.loadProfile = loadProfile;

// ─── MODULE CHOICE SCREEN ───
window.renderModuleChoice = function renderModuleChoice(content) {
 var c = h('div', {style: 'max-width:420px;margin:0 auto;padding:48px 20px 32px'});

 // Header — staggered entrance animation
 var eyebrowEl = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:16px;text-align:center;opacity:0;transform:translateY(8px);transition:opacity .4s ease,transform .4s ease'}, 'SMARTFITCOACH');
 var titleEl = h('div', {style: 'font-family:Georgia,serif;font-size:clamp(28px,7vw,38px);font-weight:normal;line-height:1.1;letter-spacing:-.02em;margin:0 0 14px;color:var(--black,#1A1A18);text-align:center;opacity:0;transform:translateY(8px);transition:opacity .4s ease .08s,transform .4s ease .08s'}, 'Votre corps.\u00a0Votre programme.\nRien d\u2019autre.');
 titleEl.style.whiteSpace = 'pre-line';
 var subtitleEl = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:14px;color:var(--grey,#6B6B65);line-height:1.6;letter-spacing:.01em;margin:0 auto 36px;max-width:300px;text-align:center;opacity:0;transform:translateY(6px);transition:opacity .35s ease .14s,transform .35s ease .14s'}, 'Un programme 100\u00a0% calibr\u00e9 sur vos objectifs, votre morphologie, votre rythme de vie.');
 c.appendChild(eyebrowEl);
 c.appendChild(titleEl);
 c.appendChild(subtitleEl);

 // SVG icons per card
 var _svgNutrition = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A1A18" stroke-width="1.5" stroke-linecap="round"><path d="M12 21C12 21 4 14 4 8.5C4 5.46 6.69 3 10 3C11.12 3 12 3.45 12 3.45C12 3.45 12.88 3 14 3C17.31 3 20 5.46 20 8.5C20 14 12 21 12 21Z"/><line x1="12" y1="8" x2="12" y2="14"/></svg>';
 var _svgSport = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A1A18" stroke-width="1.5" stroke-linecap="round"><line x1="6" y1="12" x2="18" y2="12"/><rect x="2" y="10" width="4" height="4" rx="1"/><rect x="18" y="10" width="4" height="4" rx="1"/></svg>';
 var _svgBoth = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A1A18" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>';

 // Cards data — nutrition first, sport second, both third (recommended)
 var cardsData = [
   {
     title: 'Nutrition',
     desc: 'Suivi alimentaire, objectifs caloriques et qualit\u00e9 nutritionnelle.',
     badge: null, svg: _svgNutrition, delay: '.2s',
     onclick: function() {
       S.appMode = 'nutrition'; S.view = 'nutrition'; S.nStep = 0;
       if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
       window.render();
     }
   },
   {
     title: 'Entra\u00eenement',
     desc: 'Programmes adapt\u00e9s, charge hebdomadaire et progression.',
     badge: null, svg: _svgSport, delay: '.26s',
     onclick: function() {
       S.appMode = 'sport'; S.view = 'sport'; S.sStep = 0;
       if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
       window.render();
     }
   },
   {
     title: 'Nutrition & Entra\u00eenement',
     desc: 'L\u2019approche compl\u00e8te pour des r\u00e9sultats durables.',
     badge: 'RECOMMAND\u00c9', svg: _svgBoth, delay: '.32s',
     onclick: function() {
       S.appMode = 'both'; S.view = 'nutrition'; S.nStep = 0;
       if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
       window.render();
     }
   }
 ];

 var cardsWrap = h('div', {style: 'display:flex;flex-direction:column;gap:10px;width:100%'});

 cardsData.forEach(function(card) {
   var el = h('div', {
     style: 'position:relative;display:flex;align-items:flex-start;gap:16px;padding:20px;cursor:pointer;background:var(--ivory2,#F5F4EF);border:1px solid var(--border,#E8E6DF);border-radius:2px;min-height:44px;user-select:none;-webkit-tap-highlight-color:transparent;opacity:0;transform:translateY(10px);',
     onclick: card.onclick
   });
   el.style.transition = 'border-color .18s ease,background-color .18s ease,opacity .35s ease ' + card.delay + ',transform .35s ease ' + card.delay;
   el.addEventListener('mouseenter', function() { el.style.borderColor = 'var(--black,#1A1A18)'; el.style.backgroundColor = 'var(--ivory,#FAF9F6)'; });
   el.addEventListener('mouseleave', function() { el.style.borderColor = 'var(--border,#E8E6DF)'; el.style.backgroundColor = 'var(--ivory2,#F5F4EF)'; });
   el.addEventListener('touchstart', function() { el.style.backgroundColor = '#F5F4EF'; }, {passive: true});

   // SVG icon
   var iconWrap = h('div', {style: 'flex-shrink:0;margin-top:2px'});
   iconWrap.innerHTML = card.svg;
   el.appendChild(iconWrap);

   // Text
   var left = h('div', {style: 'display:flex;flex-direction:column;gap:4px;flex:1'});
   left.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;color:var(--black,#1A1A18);letter-spacing:.01em;line-height:1.2'}, card.title));
   left.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey,#6B6B65);line-height:1.55;letter-spacing:.01em'}, card.desc));
   el.appendChild(left);

   // Badge RECOMMANDÉ — absolute top-right
   if (card.badge) {
     el.appendChild(h('div', {style: 'position:absolute;top:-1px;right:-1px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;font-weight:500;letter-spacing:.15em;text-transform:uppercase;color:#FAF9F6;background:var(--black,#1A1A18);padding:4px 8px;border-radius:0 2px 0 2px'}, card.badge));
   }

   cardsWrap.appendChild(el);
 });
 c.appendChild(cardsWrap);

 // Footer note
 c.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);text-align:center;margin-top:24px;letter-spacing:.04em;opacity:.7'}, 'Vos donn\u00e9es restent sur votre appareil.'));

 content.appendChild(c);

 // Trigger entrance animations after paint
 requestAnimationFrame(function() {
   requestAnimationFrame(function() {
     [eyebrowEl, titleEl, subtitleEl].forEach(function(el) {
       el.style.opacity = '1';
       el.style.transform = 'translateY(0)';
     });
     cardsWrap.querySelectorAll('[style*="opacity:0"]').forEach(function(el) {
       el.style.opacity = '1';
       el.style.transform = 'translateY(0)';
     });
   });
 });
};

// ─── PROFILE PAGE ───
function renderProfilePage(container) {
 var S = window.S;
 var user = window.AUTH ? window.AUTH.getUser() : null;
 var c = h('div', {style: 'max-width:480px;margin:0 auto;padding:24px 20px 48px'});

 // Back button
 var backBtn = h('button', {
   style: 'background:none;border:none;padding:0;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);cursor:pointer;margin-bottom:24px;display:flex;align-items:center;gap:6px;',
   onclick: function() { S.view = 'today'; if (window.render) window.render(); }
 }, '← Retour');
 c.appendChild(backBtn);

 // Title
 c.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:24px;font-weight:normal;margin-bottom:4px;'}, 'Mon profil'));
 c.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey);letter-spacing:1px;margin-bottom:28px;'}, user ? (user.email || '') : ''));

 // ─── Photo + nom ───
 var photoSection = h('div', {style: 'display:flex;align-items:center;gap:16px;margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid var(--border);'});
 var photoWrap = h('div', {style: 'width:64px;height:64px;border-radius:50%;overflow:hidden;background:var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px solid var(--border);'});
 if (S.profilePhoto) {
   photoWrap.appendChild(h('img', {src: S.profilePhoto, alt: 'Photo de profil', style: 'width:100%;height:100%;object-fit:cover;'}));
 } else {
   var initials = (function() {
     var _un = user ? (user.name || user.email || '') : (S.prenom || '');
     if (S.prenom && S.nom) return (S.prenom[0] + S.nom[0]).toUpperCase();
     if (!_un) return 'S';
     var parts = _un.trim().split(/\s+/);
     if (parts.length >= 2) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
     return _un[0].toUpperCase();
   })();
   photoWrap.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:22px;color:var(--grey);'}, initials));
 }
 // Photo upload input
 var photoInput = document.createElement('input');
 photoInput.type = 'file';
 photoInput.accept = 'image/*';
 photoInput.style.display = 'none';
 photoInput.addEventListener('change', function() {
   var file = photoInput.files[0];
   if (!file) return;
   var reader = new FileReader();
   reader.onload = function(e) {
     // Compresser via canvas (max 400px, qualité 0.75) pour éviter dépassement localStorage
     var img = new Image();
     img.onload = function() {
       var maxSize = 400;
       var w = img.width, _h = img.height;
       if (w > maxSize || _h > maxSize) {
         if (w > _h) { _h = Math.round(_h * maxSize / w); w = maxSize; }
         else { w = Math.round(w * maxSize / _h); _h = maxSize; }
       }
       var canvas = document.createElement('canvas');
       canvas.width = w; canvas.height = _h;
       canvas.getContext('2d').drawImage(img, 0, 0, w, _h);
       S.profilePhoto = canvas.toDataURL('image/jpeg', 0.75);
       if (window.saveProfile) { try { window.saveProfile(); } catch(ex) {} }
       if (window.render) window.render();
     };
     img.src = e.target.result;
   };
   reader.readAsDataURL(file);
 });
 photoWrap.appendChild(photoInput);
 photoWrap.addEventListener('click', function() { photoInput.click(); });
 photoSection.appendChild(photoWrap);
 var nameBlock = h('div', {style: 'flex:1;'});
 var displayName = [S.prenom, S.nom].filter(Boolean).join(' ') || (user && (user.name || user.email)) || 'Utilisateur';
 nameBlock.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;margin-bottom:4px;'}, displayName));
 nameBlock.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);letter-spacing:1px;cursor:pointer;text-transform:uppercase;'}, 'Changer la photo'));
 photoSection.appendChild(nameBlock);
 c.appendChild(photoSection);

 // ─── Infos clés ───
 var infoSection = h('div', {style: 'margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid var(--border);'});
 infoSection.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey);margin-bottom:12px;'}, 'INFORMATIONS'));
 var infoRows = [
   ['Âge', S.age ? S.age + ' ans' : '—'],
   ['Poids', S.weight ? S.weight + ' kg' : '—'],
   ['Taille', S.height ? S.height + ' cm' : '—'],
   ['Objectif', (function() {
     var goals = {0:'Perte de poids',1:'Maintien',2:'Prise de masse',3:'Rééquilibrage'};
     return S.goal !== null && S.goal !== undefined ? (goals[S.goal] || '—') : '—';
   })()]
 ];
 infoRows.forEach(function(row) {
   var r = h('div', {style: 'display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);'});
   r.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey);'}, row[0]));
   r.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--black);'}, row[1]));
   infoSection.appendChild(r);
 });
 c.appendChild(infoSection);

 // ─── Mode application ───
 var modeSection = h('div', {style: 'margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid var(--border);'});
 modeSection.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey);margin-bottom:4px;'}, 'MODE D\'UTILISATION'));
 modeSection.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:16px;line-height:1.5;'}, 'Choisissez les modules que vous souhaitez utiliser.'));
 var modes = [
   { value: 'nutrition', label: 'Nutrition uniquement', desc: 'Suivi alimentaire et objectifs caloriques.' },
   { value: 'sport', label: 'Sport uniquement', desc: 'Programmes d\'entraînement et progression.' },
   { value: 'both', label: 'Nutrition & Sport', desc: 'L\'approche complète. Recommandé.' }
 ];
 modes.forEach(function(m) {
   var isActive = S.appMode === m.value;
   var modeCard = h('div', {
     style: 'padding:14px 16px;border:1px solid ' + (isActive ? 'var(--black)' : 'var(--border)') + ';margin-bottom:8px;cursor:pointer;background:' + (isActive ? 'var(--ivory2)' : 'transparent') + ';transition:border-color .2s,background .2s;',
     onclick: function() {
       S.appMode = m.value;
       // Reset view to match new mode
       if (m.value === 'sport') { S.view = 'today'; }
       else if (m.value === 'nutrition') { S.view = 'today'; }
       else { S.view = 'today'; }
       if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
       if (window.render) window.render();
     }
   });
   var modeRow = h('div', {style: 'display:flex;align-items:center;gap:12px;'});
   var dot = h('div', {style: 'width:14px;height:14px;border-radius:50%;border:1px solid ' + (isActive ? 'var(--black)' : 'var(--grey3,#C8C8C0)') + ';background:' + (isActive ? 'var(--black)' : 'transparent') + ';flex-shrink:0;'});
   modeRow.appendChild(dot);
   var modeText = h('div', {});
   modeText.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;font-weight:500;color:var(--black);margin-bottom:2px;'}, m.label));
   modeText.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);'}, m.desc));
   modeRow.appendChild(modeText);
   modeCard.appendChild(modeRow);
   modeSection.appendChild(modeCard);
 });
 c.appendChild(modeSection);

 // ─── Modifier le profil ───
 var editBtn = h('button', {
   style: 'display:block;width:100%;padding:14px;border:1px solid var(--black);background:var(--black);color:var(--ivory,#F8F6EF);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;margin-bottom:12px;',
   onclick: function() {
     S.view = 'nutrition'; S.nStep = 1;
     if (window.render) window.render();
   }
 }, 'Modifier mon profil');
 c.appendChild(editBtn);

 // ─── Déconnexion ───
 var logoutBtn = h('button', {
   style: 'display:block;width:100%;padding:14px;border:1px solid var(--border);background:transparent;color:var(--grey);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;',
   onclick: function() {
     if (window.AUTH && window.AUTH.logout) { window.AUTH.logout(); }
     else { S.view = 'authLogin'; if (window.render) window.render(); }
   }
 }, 'Se déconnecter');
 c.appendChild(logoutBtn);

 container.appendChild(c);
}

// ─── MAIN RENDER ───
function render() {
 if (render._lock) return;
 render._lock = true;
 try {
 if (window.destroyAllCharts) window.destroyAllCharts();
 if (window.AUTH && window.AUTH.isLoggedIn()) saveProfile();
 var app = document.getElementById('app');
 if (!app) { console.error('[render] #app not found'); return; }

 // Scroll to top only when navigating to a different page/step
 var _didNavigate = (render._lastView !== S.view) ||
 (render._lastNStep !== S.nStep) ||
 (render._lastSStep !== S.sStep);
 render._lastView = S.view;
 render._lastNStep = S.nStep;
 render._lastSStep = S.sStep;

 app.innerHTML = '';
 try {

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

 // User bar — épuré : logo gauche | langue + avatar droite
 var user = AUTH.getUser();
 var ub = h('div', {'class': 'user-bar'});
 ub.appendChild(h('span', {'class': 'user-name'}, '◆ SMARTFITCOACH'));
 var ubRight = h('div', {style: 'display:flex;align-items:center;gap:16px'});
 // Streak indicator — affiché si streak >= 2
 (function() {
   try {
     var _sUser = AUTH.getUser();
     var _sUid = _sUser ? _sUser.id : 'anon';
     var _sRaw = localStorage.getItem('mtd_streak_' + _sUid);
     var _sVal = 0;
     if (_sRaw) { var _sData = JSON.parse(_sRaw); _sVal = (_sData && _sData.current) ? _sData.current : 0; }
     if (_sVal >= 2) {
       var _streakEl = h('div', {
         style: 'display:flex;align-items:center;gap:3px;min-height:44px;cursor:default;',
         title: _sVal + ' jour' + (_sVal > 1 ? 's' : '') + ' cons\u00e9cutif' + (_sVal > 1 ? 's' : '')
       });
       _streakEl.appendChild(h('span', {style: 'font-size:12px;line-height:1;'}, _sVal >= 7 ? '\uD83C\uDFC6' : '\uD83D\uDD25'));
       _streakEl.appendChild(h('span', {
         style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);letter-spacing:0.5px;'
       }, String(_sVal)));
       ubRight.appendChild(_streakEl);
     }
   } catch(e) {}
 })();
 // Language toggle FR·EN — touch target sur le wrapper, texte épuré
 (function() {
   var _curLang = (window.I18N ? window.I18N.current : (S.lang || 'fr'));
   var _langWrap = h('div', {
     style: 'display:flex;align-items:center;min-height:44px;cursor:pointer',
     onclick: function() {
       var _next = (window.I18N ? window.I18N.current : (S.lang || 'fr')) === 'fr' ? 'en' : 'fr';
       if (window.I18N && window.I18N.setLang) { window.I18N.setLang(_next); } else { S.lang = _next; render(); }
     }
   });
   _langWrap.appendChild(h('span', {
     style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;cursor:pointer;color:var(--grey);background:none;border:none;padding:4px 0'
   }, _curLang === 'fr' ? 'FR·EN' : 'EN·FR'));
   ubRight.appendChild(_langWrap);
 })();
 // Avatar (clickable → profil step 1)
 (function() {
   var _avatarBtn = h('button', {
     'class': 'user-bar-avatar-btn',
     onclick: function() { S.view = 'profil'; window.render(); },
     title: 'Mon profil'
   });
   if (S.profilePhoto) {
     _avatarBtn.appendChild(h('img', {
       src: S.profilePhoto,
       alt: 'Photo de profil',
       'class': 'user-bar-avatar-photo'
     }));
   } else {
     var _uInitials = (function() {
       var _un = user ? (user.name || user.email || '') : '';
       if (!_un) return 'S';
       var _parts = _un.trim().split(/\s+/);
       if (_parts.length >= 2) return (_parts[0][0] + _parts[_parts.length - 1][0]).toUpperCase();
       return _un[0].toUpperCase();
     })();
     _avatarBtn.appendChild(h('div', {'class': 'user-bar-avatar-initials'}, _uInitials));
   }
   ubRight.appendChild(_avatarBtn);
 })();
 ub.appendChild(ubRight);
 wrap.appendChild(ub);

 // Main navigation (tabs adaptés selon S.appMode)
 var nav = h('div', {'class': 'main-nav'});
 nav.appendChild(h('button', {'class': 'main-nav-tab' + (S.view === 'today' || S.view === 'dashboard' || !S.view ? ' active' : ''), onclick: function(){ S.view = 'today'; if(window.BLACKBOX)window.BLACKBOX.log('nav_today'); render(); }}, 'Aujourd\'hui'));
 if (S.appMode !== 'sport') {
   nav.appendChild(h('button', {'class': 'main-nav-tab' + (S.view === 'nutrition' ? ' active' : ''), onclick: function(){ S.view = 'nutrition'; if(window.BLACKBOX)window.BLACKBOX.log('nav_nutrition'); render(); }}, window.t('nav.nutrition')));
 }
 if (S.appMode !== 'nutrition') {
   nav.appendChild(h('button', {'class': 'main-nav-tab' + (S.view === 'sport' ? ' active' : ''), onclick: function(){ S.view = 'sport'; if(window.BLACKBOX)window.BLACKBOX.log('nav_sport'); render(); }}, window.t('nav.sport')));
 }
 wrap.appendChild(nav);

 var content = h('div', {'class': 'fade-in', style: 'margin-top:24px'});

 // Module choice — si l'utilisateur est connecté mais n'a pas encore choisi son mode
 // Exception : la page profil reste accessible même sans appMode (pour choisir le mode)
 var _authUser = window.AUTH ? window.AUTH.getUser() : null;
 if (_authUser && !S.appMode && S.nStep === 0 && S.sStep === 0 && S.view !== 'profil') {
   window.renderModuleChoice(content);
   wrap.appendChild(content);
   wrap.appendChild(h('div', {'class': 'footer'}, [h('a', {href: '#'}, 'Smart Fit Coach')]));
   app.appendChild(wrap);
   return;
 }

 if (S.view === 'profil') {
 renderProfilePage(content);
 } else if (S.view === 'sport' && window.SPORT) {
 SPORT.render(content);
 } else if (S.view === 'nutrition' && window.NUTRITION) {
 NUTRITION.render(content);
 } else {
 // Default + 'today' + 'dashboard' → vue Aujourd'hui
 S.view = 'today';
 if (window.TODAY) TODAY.render(content);
 }

 wrap.appendChild(content);

 // Footer
 wrap.appendChild(h('div', {'class': 'footer'}, [h('a', {href: '#'}, 'Smart Fit Coach')]));
 app.appendChild(wrap);

 // Auth banner (P1) — bannière sauvegarde cloud si pas de compte réel
 try { if (window.AuthBanner) window.AuthBanner.render(document.body); } catch(e) {}
 // Onboarding screen (P10) — écran de bienvenue personnalisé (1 seule fois)
 try { if (window.OnboardingComplete) window.OnboardingComplete.check(); } catch(e) {}

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
 // Translate DOM if EN
 if (window.I18N && window.I18N.current === 'en' && window.I18N.translateDOM) {
   try { window.I18N.translateDOM(); } catch(e) {}
 }
 } catch (_renderErr) { console.error('[render] crash:', _renderErr); try { app.innerHTML = ''; var _errDiv = document.createElement('div'); _errDiv.style.cssText = 'padding:40px 24px;text-align:center;font-family:"Helvetica Neue",Arial,sans-serif;'; _errDiv.innerHTML = '<div style="font-size:13px;color:#5A1010;margin-bottom:16px;">Une erreur est survenue. Vos donn\u00e9es sont sauvegard\u00e9es.</div><button onclick="window.location.reload()" style="padding:12px 24px;background:#0A0A09;color:#fff;border:none;font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;">Recharger</button>'; app.appendChild(_errDiv); } catch(e2) {} }
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

 var form = h('form', {'class': 'auth-form', onsubmit: function(e){ e.preventDefault(); }, autocomplete: 'on'});

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
 S.justLoggedIn = true;
 S.view = 'today';
 // Migrate anon profile data to this user's key (data entered before login)
 try {
 var _loginUser = AUTH.getUser();
 var _loginUid = _loginUser ? _loginUser.id : null;
 if (_loginUid && _loginUid !== 'anon') {
 var _anonRaw = localStorage.getItem('mtd_profile_anon');
 var _userRaw = localStorage.getItem('mtd_profile_' + _loginUid);
 if (_anonRaw && !_userRaw) {
 // User filled onboarding anonymously — migrate to their account key
 localStorage.setItem('mtd_profile_' + _loginUid, _anonRaw);
 localStorage.removeItem('mtd_profile_anon');
 }
 }
 } catch(e) {}
 // Restore profile from localStorage for this user
 loadProfile();
 // Fix nStep for returning users who completed onboarding
 if (S.nStep === 0 && (S.sex || S.goal !== null || S.weekPlan)) {
 S.nStep = S.weekPlan ? 9 : (S.goal !== null ? 8 : 1);
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

 // ── Country dial codes for phone selector ──────────────────────────
 var DIAL_CODES = [
   {code:'+33',flag:'🇫🇷',name:'France'},
   {code:'+32',flag:'🇧🇪',name:'Belgique'},
   {code:'+41',flag:'🇨🇭',name:'Suisse'},
   {code:'+1',flag:'🇨🇦',name:'Canada'},
   {code:'+1',flag:'🇺🇸',name:'États-Unis'},
   {code:'+44',flag:'🇬🇧',name:'Royaume-Uni'},
   {code:'+49',flag:'🇩🇪',name:'Allemagne'},
   {code:'+34',flag:'🇪🇸',name:'Espagne'},
   {code:'+39',flag:'🇮🇹',name:'Italie'},
   {code:'+351',flag:'🇵🇹',name:'Portugal'},
   {code:'+31',flag:'🇳🇱',name:'Pays-Bas'},
   {code:'+352',flag:'🇱🇺',name:'Luxembourg'},
   {code:'+212',flag:'🇲🇦',name:'Maroc'},
   {code:'+213',flag:'🇩🇿',name:'Algérie'},
   {code:'+216',flag:'🇹🇳',name:'Tunisie'},
   {code:'+221',flag:'🇸🇳',name:'Sénégal'},
   {code:'+225',flag:'🇨🇮',name:'Côte d\'Ivoire'},
   {code:'+237',flag:'🇨🇲',name:'Cameroun'},
   {code:'+243',flag:'🇨🇩',name:'RD Congo'},
   {code:'+261',flag:'🇲🇬',name:'Madagascar'},
   {code:'+230',flag:'🇲🇺',name:'Maurice'},
   {code:'+262',flag:'🇷🇪',name:'Réunion'},
   {code:'+590',flag:'🇬🇵',name:'Guadeloupe'},
   {code:'+596',flag:'🇲🇶',name:'Martinique'},
   {code:'+594',flag:'🇬🇫',name:'Guyane'},
   {code:'+238',flag:'🇨🇻',name:'Cap-Vert'},
   {code:'+7',flag:'🇷🇺',name:'Russie'},
   {code:'+81',flag:'🇯🇵',name:'Japon'},
   {code:'+82',flag:'🇰🇷',name:'Corée du Sud'},
   {code:'+86',flag:'🇨🇳',name:'Chine'},
   {code:'+91',flag:'🇮🇳',name:'Inde'},
   {code:'+55',flag:'🇧🇷',name:'Brésil'},
   {code:'+52',flag:'🇲🇽',name:'Mexique'},
   {code:'+54',flag:'🇦🇷',name:'Argentine'},
   {code:'+57',flag:'🇨🇴',name:'Colombie'},
   {code:'+58',flag:'🇻🇪',name:'Venezuela'},
   {code:'+20',flag:'🇪🇬',name:'Égypte'},
   {code:'+27',flag:'🇿🇦',name:'Afrique du Sud'},
   {code:'+234',flag:'🇳🇬',name:'Nigéria'},
   {code:'+254',flag:'🇰🇪',name:'Kenya'},
   {code:'+971',flag:'🇦🇪',name:'Émirats arabes unis'},
   {code:'+966',flag:'🇸🇦',name:'Arabie saoudite'},
   {code:'+972',flag:'🇮🇱',name:'Israël'},
   {code:'+90',flag:'🇹🇷',name:'Turquie'},
   {code:'+48',flag:'🇵🇱',name:'Pologne'},
   {code:'+46',flag:'🇸🇪',name:'Suède'},
   {code:'+47',flag:'🇳🇴',name:'Norvège'},
   {code:'+45',flag:'🇩🇰',name:'Danemark'},
   {code:'+358',flag:'🇫🇮',name:'Finlande'},
   {code:'+61',flag:'🇦🇺',name:'Australie'}
 ];
 var _selDialIdx = 0; // default: France +33

 var form = h('form', {'class': 'auth-form', onsubmit: function(e){ e.preventDefault(); }, autocomplete: 'on'});

 // ── Row: Prénom + Nom ─────────────────────────────────────────────
 var nameRow = h('div', {style: 'display:flex;gap:10px'});

 var f0 = h('div', {'class': 'field', style: 'flex:1'});
 f0.appendChild(h('label', {'class': 'field-label'}, window.t('auth.firstname') + ' ●'));
 var nameInput = h('input', {type: 'text', placeholder: 'Prénom', autocomplete: 'given-name'});
 f0.appendChild(nameInput);
 nameRow.appendChild(f0);

 var f0b = h('div', {'class': 'field', style: 'flex:1'});
 f0b.appendChild(h('label', {'class': 'field-label'}, 'Nom ●'));
 var nomInput = h('input', {type: 'text', placeholder: 'Nom de famille', autocomplete: 'family-name'});
 f0b.appendChild(nomInput);
 nameRow.appendChild(f0b);

 form.appendChild(nameRow);

 // ── Phone with country selector ───────────────────────────────────
 var fPhone = h('div', {'class': 'field'});
 fPhone.appendChild(h('label', {'class': 'field-label'}, 'Téléphone'));

 var phoneRow = h('div', {style: 'display:flex;gap:8px;align-items:stretch'});

 // Dial selector button
 var dialBtn = h('button', {
   type: 'button',
   style: 'display:flex;align-items:center;gap:6px;padding:0 12px;border:1px solid var(--border);border-radius:2px;background:var(--ivory,#FAF9F6);cursor:pointer;font-size:15px;white-space:nowrap;min-width:90px;height:44px;',
 });
 var dialFlagSpan = h('span', {style: 'font-size:20px'}, DIAL_CODES[_selDialIdx].flag);
 var dialCodeSpan = h('span', {style: 'font-size:13px;color:var(--grey);font-weight:600'}, DIAL_CODES[_selDialIdx].code);
 var dialArrow = h('span', {style: 'font-size:10px;color:var(--grey);margin-left:2px'}, '▾');
 dialBtn.appendChild(dialFlagSpan);
 dialBtn.appendChild(dialCodeSpan);
 dialBtn.appendChild(dialArrow);

 // Dropdown overlay
 var dialDropdown = h('div', {
   style: 'display:none;position:absolute;z-index:999;background:var(--ivory,#FAF9F6);border:1px solid var(--border);border-radius:2px;box-shadow:0 8px 32px rgba(0,0,0,0.18);max-height:260px;overflow-y:auto;min-width:220px;'
 });
 DIAL_CODES.forEach(function(dc, idx) {
   var opt = h('div', {
     style: 'display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;font-size:14px;' + (idx === _selDialIdx ? 'background:var(--accent-subtle,#f0f0e8);font-weight:700;' : ''),
     onclick: function() {
       _selDialIdx = idx;
       dialFlagSpan.textContent = dc.flag;
       dialCodeSpan.textContent = dc.code;
       dialDropdown.style.display = 'none';
       // update highlight
       Array.from(dialDropdown.children).forEach(function(ch, i) {
         ch.style.background = i === idx ? 'var(--accent-subtle,#f0f0e8)' : '';
         ch.style.fontWeight = i === idx ? '700' : '';
       });
     }
   });
   opt.appendChild(h('span', {style: 'font-size:18px'}, dc.flag));
   opt.appendChild(h('span', {style: 'color:var(--grey);font-size:12px;font-weight:600;min-width:36px'}, dc.code));
   opt.appendChild(h('span', {}, dc.name));
   dialDropdown.appendChild(opt);
 });

 var dialWrapper = h('div', {style: 'position:relative;flex-shrink:0'});
 dialWrapper.appendChild(dialBtn);
 dialWrapper.appendChild(dialDropdown);

 dialBtn.addEventListener('click', function(e) {
   e.stopPropagation();
   var isOpen = dialDropdown.style.display !== 'none';
   if (isOpen) {
     dialDropdown.style.display = 'none';
   } else {
     dialDropdown.style.display = 'block';
     // Close on next click anywhere outside — {once:true} so no leak
     setTimeout(function() {
       document.addEventListener('click', function _closeDialDrop() {
         dialDropdown.style.display = 'none';
         document.removeEventListener('click', _closeDialDrop);
       });
     }, 0);
   }
 });

 var phoneInput = h('input', {
   type: 'tel',
   placeholder: '6 12 34 56 78',
   autocomplete: 'tel-national',
   style: 'flex:1;height:44px;min-width:0'
 });

 phoneRow.appendChild(dialWrapper);
 phoneRow.appendChild(phoneInput);
 fPhone.appendChild(phoneRow);
 form.appendChild(fPhone);

 // ── Email ─────────────────────────────────────────────────────────
 var f1 = h('div', {'class': 'field'});
 f1.appendChild(h('label', {'class': 'field-label'}, window.t('auth.email') + ' ●'));
 var emailInput = h('input', {type: 'email', placeholder: 'votre@email.com', autocomplete: 'email'});
 f1.appendChild(emailInput);
 form.appendChild(f1);

 // ── Password ──────────────────────────────────────────────────────
 var f2 = h('div', {'class': 'field'});
 f2.appendChild(h('label', {'class': 'field-label'}, window.t('auth.password') + ' ●'));
 var pwInput = h('input', {type: 'password', placeholder: 'Min. 6 caractères', autocomplete: 'new-password'});
 f2.appendChild(pwInput);
 form.appendChild(f2);

 // ── Confirm password ──────────────────────────────────────────────
 var f3 = h('div', {'class': 'field'});
 f3.appendChild(h('label', {'class': 'field-label'}, window.t('auth.confirm_password') + ' ●'));
 var pw2Input = h('input', {type: 'password', placeholder: 'Retapez le mot de passe', autocomplete: 'new-password'});
 f3.appendChild(pw2Input);
 form.appendChild(f3);

 // ── Register button ───────────────────────────────────────────────
 var regBtn = h('button', {'class': 'btn-primary', onclick: function(){
 if (regBtn.disabled) return;
 var name = nameInput.value.trim();
 var nom  = nomInput.value.trim();
 var email = emailInput.value.trim();
 var pw = pwInput.value;
 var pw2 = pw2Input.value;
 var phoneRaw = phoneInput.value.trim();
 var phone = phoneRaw ? (DIAL_CODES[_selDialIdx].code + phoneRaw.replace(/\s/g,'')) : '';

 if (!name || !nom || !email || !pw || !pw2) { S.authError = 'Prénom, nom, email et mot de passe sont obligatoires'; render(); return; }
 if (pw !== pw2) { S.authError = window.t('auth.error_password_match'); render(); return; }
 if (pw.length < 6) { S.authError = window.t('auth.error_password_length'); render(); return; }

 regBtn.disabled = true;
 regBtn.textContent = 'Création...';
 AUTH.register(name, email, pw, { nom: nom, phone: phone }).then(function(result) {
 if (result.ok) {
 S.authError = '';
 if (name) { S.prenom = name; }
 if (nom) { S.nom = nom; }
 if (phone) { S.phone = phone; }
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

 var form = h('form', {'class': 'auth-form', onsubmit: function(e){ e.preventDefault(); }, autocomplete: 'on'});

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

 var form = h('form', {'class': 'auth-form', onsubmit: function(e){ e.preventDefault(); }, autocomplete: 'on'});

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

 var form = h('form', {'class': 'auth-form', onsubmit: function(e){ e.preventDefault(); }, autocomplete: 'on'});
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
 S.view = 'today';
 if (window.GAMIFICATION) GAMIFICATION.updateStreak();
 // Restore full profile from localStorage (E-01)
 loadProfile();
 // Si l'utilisateur existant a un profil mais nStep=0 (ex: profil corrompu ou rechargement)
 // → sauter le splash pour ne pas le forcer à refaire tout l'onboarding
 if (S.nStep === 0 && (S.sex || S.goal || S.weekPlan)) {
 S.nStep = S.weekPlan ? 9 : (S.goal ? 8 : 1);
 }
 // Retour utilisateur : préserver le step programme (ne pas réinitialiser l'onboarding sport).
 // Steps à PRÉSERVER : 4(muscu) 6(CF) 8(running) 10(hyrox) 12(padel) 14(golf) 15(prog dédié) 16(charges) 18(triathlon) 20(médical) 21(yoga) 23(cycling) 25(calisthenics)
 // Steps intermédiaires onboarding (1,2,3,5,7,9,11,13,17,19,22,24) → revenir à 0 (sélection sport)
 var _PROGRAM_STEPS_MAIN = [4, 6, 8, 10, 12, 14, 15, 16, 18, 20, 21, 23, 25];
 if (S.sStep > 0 && _PROGRAM_STEPS_MAIN.indexOf(S.sStep) === -1) {
   S.sStep = 0;
 }
 // ─── AUTO-REGENERATION PLAN NUTRITION (semaine expirée) ───
 // Si un plan existe, que l'utilisateur n'est PAS en train de le consulter (nStep ≠ 9),
 // et que la date de génération a plus de 7 jours → regénérer silencieusement.
 (function() {
   try {
     if (S.weekPlan && S.nStep !== 9 && S.goal !== null && window.generateWeek && window.computeNutritionState) {
       var needsRegen = false;
       if (!S._weekPlanGeneratedAt) {
         // Plan sans date de génération : considéré comme ancien → regénérer
         needsRegen = true;
       } else {
         var generatedAt = new Date(S._weekPlanGeneratedAt);
         var now = new Date();
         var diffMs = now - generatedAt;
         var diffDays = diffMs / (1000 * 60 * 60 * 24);
         // Regénérer si le plan a plus de 7 jours
         if (diffDays >= 7) {
           needsRegen = true;
         } else {
           // Regénérer aussi si on est lundi et le plan date d'avant ce lundi
           var dayOfWeek = now.getDay(); // 0=dim, 1=lun
           if (dayOfWeek === 1) {
             // Trouver le début de ce lundi (minuit)
             var thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
             if (generatedAt < thisMonday) {
               needsRegen = true;
             }
           }
         }
       }
       if (needsRegen) {
         window.computeNutritionState(false);
         var _wkAuto = window.generateWeek();
         if (Array.isArray(_wkAuto) && _wkAuto.length > 0) S.weekPlan = _wkAuto;
         S._weekPlanGeneratedAt = new Date().toISOString();
         if (window.saveProfile) { try { window.saveProfile(); } catch(e2) {} }
         if (window.SupaSync && S.weekPlan) {
           try {
             var _mon = new Date();
             _mon.setDate(_mon.getDate() - _mon.getDay() + 1);
             window.SupaSync.saveMealPlan(_mon.toISOString().slice(0, 10), S.weekPlan);
           } catch(e2) {}
         }
       }
     }
   } catch(e) {}
 })();
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

// ─── AUTOSAVE & BEFOREUNLOAD ───
// Save on tab/browser close to avoid losing last unsaved state
window.addEventListener('beforeunload', function() {
 try { if (window.AUTH && window.AUTH.isLoggedIn()) saveProfile(); } catch(e) {}
 try { if (AUTH.isLoggedIn() && window.SupaSync) SupaSync.saveProfile(); } catch(e) {}
});
// Periodic autosave every 30s as safety net (render() already saves on interaction)
setInterval(function() {
 try { if (window.AUTH && window.AUTH.isLoggedIn()) saveProfile(); } catch(e) {}
}, 30000);

})();
