// app-nutrition.js — Smart Fit Coach: Nutrition Wizard (10 steps)
(function(){
'use strict';
var S = window.S;
if (!S) { console.error('[SFC] window.S not initialized'); return; }
if (!window.h) { console.error('[SFC] DOM helpers not loaded'); return; }
var h = window.h, txt = window.txt, svgRing = window.svgRing;

if (!window.t) window.t = function(k){ return k; };

// ─── DISPLAY ROUNDING ───
function roundDisplayQty(qty, unit) {
  if (!qty) return 0;
  if (unit === 'g') return Math.round(qty / 5) * 5 || 5;
  if (unit === 'ml') return Math.round(qty / 10) * 10 || 10;
  if (unit === 'pce') return Math.max(1, Math.round(qty));
  if (unit === 'cs' || unit === 'cc') return Math.max(1, Math.round(qty));
  if (unit === 'kg') return Math.round(qty * 10) / 10;
  if (unit === 'L' || unit === 'l') return Math.round(qty * 10) / 10;
  return Math.round(qty);
}

// ─── LOCAL REFERENCES ───
var ACTIVITIES = window.ACTIVITIES || [];
var GOALS = window.GOALS || [];
var TRAINS = window.TRAINS || [];
var SLEEPS = window.SLEEPS || [];
var MEDICAL = window.MEDICAL || [];
var MEDICAL_ADVICE = window.MEDICAL_ADVICE || {};
var COOK_LEVELS = window.COOK_LEVELS || [];
var ALLERGIES = window.ALLERGIES || [];
var INTOLERANCES = window.INTOLERANCES || [];
var REGIMES = window.REGIMES || [];
var CUISINES = window.CUISINES || [];
var CUISINE_FLAGS = window.CUISINE_FLAGS || {};
var SHOPPING = window.SHOPPING || [];
var STAPLES = window.STAPLES || [];
var DAY_NAMES = window.DAY_NAMES || ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
var MEAL_SPLIT = window.MEAL_SPLIT || {};
var RATIOS = window.RATIOS || {};

var ALCOHOL_DB = window.ALCOHOL_DB || [];
var ALCOHOL_FREQS = window.ALCOHOL_FREQS || [];
var FOOD_HABITS_MEALS = window.FOOD_HABITS_MEALS;
var EATING_LOCATIONS = window.EATING_LOCATIONS;
var BODY_ZONES = window.BODY_ZONES;
var SUPPLEMENTS_DB = window.SUPPLEMENTS_DB;
var getSupplementRecommendations = window.getSupplementRecommendations;

var calcBMR = window.calcBMR || function(){return 0;};
var calcTDEE = window.calcTDEE || function(){return 0;};
var calcTarget = window.calcTarget || function(){return 0;};
var calcMacros = window.calcMacros || function(){return{g:0,p:0,l:0};};
var calcBMI = window.calcBMI || function(){return null;};
var bmiInfo = window.bmiInfo || function(){return{label:'',color:'#999'};};
var calcWeightProjection = window.calcWeightProjection || function(){return[];};
var alcoholWeeklyKcal = window.alcoholWeeklyKcal || function(){return 0;};

var filterRecipes = window.filterRecipes || function(p){return p||[];};
var generateWeek = window.generateWeek || function(){return[];};
var swapMeal = window.swapMeal || function(){};
var getPool = window.getPool;
var pickRecipe = window.pickRecipe;

// ─── HELPERS ───
function bb(action, data) {
  if (window.BLACKBOX && window.BLACKBOX.log) {
    window.BLACKBOX.log(action, data || {});
  }
}

function authUser() {
  if (window.AUTH && window.AUTH.getUser) return window.AUTH.getUser();
  return null;
}

function reqDot() {
  return h('span', {'class': 'required-dot'}, '*');
}

function backArrowHtml() {
  return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

// ─── NEW STEP ROUTING TABLE ───
// nStep 0  = Splash
// nStep 1  = N3: Prénom + Sexe                            → renderStep1
// nStep 2  = N4: Date de naissance + N4b Cycle/Grossesse  → renderStep2 / renderStep2b
// nStep 3  = N5: Poids + Taille (BMR live)                → renderStep3
// nStep 4  = N1+N2: Objectif + Poids cible                → renderStep6
// nStep 5  = N6+N7: Activité + Sommeil                    → renderActiviteSommeil
// nStep 6  = Body Scan optionnel (silhouette selector)    → renderBodyScan
// nStep 7  = Provisional Preview                          → renderProvisionalPreview
// nStep 8  = Médical — PRESERVED (diabetes, HTA, TCA, IRC)→ renderStep4
// nStep 9  = Habitudes alimentaires + Suppléments/Alcool  → renderStep5
// nStep 10 = Préférences (régime, allergies, cuisine, repas/j) → renderStep7
// nStep 11 = Résultats / Macros                           → renderStep8
// nStep 12 = Planning semaine                             → renderStep9

function goStep(n) {
  if (typeof n !== 'number' || n < 0 || n > 12) { console.warn('[goStep] valeur invalide:', n); return; }
  // Auto-skip identity/body steps when data already exists (cross-module symbiosis)
  // New flow: 1=N3 2=N4 3=N5 4=N1+N2(objectif) 5=N6+N7(activité+sommeil)
  //           6=BodyScan 7=Preview 8=Medical 9=Habitudes 10=Préférences 11=Résultats 12=Planning
  if (n === 1) {
    var _step1ok = !!S.sex; // prénom optionnel
    var _step2ok = !!(S.birthDate || (S.age !== null && S.age !== undefined));
    var _step3ok = !!(S.weight && S.height);
    var _step4ok = S.goal !== null && S.goal !== undefined;
    var _step5ok = true; // target weight is optional for maintain goal
    if (S.goal !== null && S.goal !== undefined && GOALS[S.goal]) {
      var _gk = GOALS[S.goal].key;
      if (_gk === 'cut' || _gk === 'shred' || _gk === 'bulk' || _gk === 'lean_bulk') {
        _step5ok = !!(S.targetWeight);
      }
    }
    var _step6ok = S.activity !== null && S.activity !== undefined;
    var _step7ok = S.sleep !== null && S.sleep !== undefined;
    // All body+goal+activity+sleep data complete → skip to medical (nStep 8), allow confirmation
    if (_step1ok && _step2ok && _step3ok && _step4ok && _step5ok && _step6ok && _step7ok) { n = S.bodyScanDone ? 8 : 6; }
    else if (_step1ok && _step2ok && _step3ok && _step4ok && _step5ok) { n = 5; } // targetWeight ok, manque activité/sommeil
    else if (_step1ok && _step2ok && _step3ok && _step4ok) { n = 4; } // targetWeight manquant → retour objectif
    else if (_step1ok && _step2ok && _step3ok) { n = 4; } // missing objectif
    else if (_step1ok && _step2ok) { n = 3; } // missing poids/taille
    else if (_step1ok) { n = 2; } // missing date naissance
  }
  S.nStep = n;
  bb('nutrition_step', {step: n});
  window.render();
  var app = document.getElementById('app');
  if (app) app.scrollTop = 0;
}

function renderProgressBar(p, current, total) {
  var bar = h('div', {style: 'display:flex;gap:3px;margin-bottom:20px;padding:0 4px'});
  for (var i = 1; i <= total; i++) {
    bar.appendChild(h('div', {style: 'flex:1;height:3px;border-radius:2px;background:' + (i <= current ? '#0A0A09' : '#D8D8D0') + ';transition:background .3s'}));
  }
  p.appendChild(bar);
}

// ─── INTERSTITIEL: programme existant ───
function renderNutritionChoice(app) {
  var prenom = S.prenom || S.nom || '';
  var wrap = h('div', {style: 'display:flex;flex-direction:column;align-items:center;justify-content:center;padding:72px 28px 56px;text-align:center;min-height:65vh'});

  wrap.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:10px;letter-spacing:7px;text-transform:uppercase;font-weight:300;margin-bottom:8px;color:var(--grey)'},'SMARTFITCOACH'));
  wrap.appendChild(h('div', {style: 'width:36px;height:1px;background:var(--black);margin:0 auto 28px'}));
  wrap.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:22px;font-weight:300;font-style:italic;line-height:1.45;margin-bottom:16px'},
    prenom ? 'Votre programme de la semaine\nest prêt, ' + prenom + '.' : 'Votre programme de la semaine\nest déjà établi.'
  ));

  // Show kcal/day and objective
  var _goals = window.GOALS || [];
  var _goalObj = (S.goal !== null && S.goal !== undefined && _goals[S.goal]) ? _goals[S.goal] : null;
  var _kcalDay = 0;
  if (Array.isArray(S.weekPlan) && S.weekPlan.length > 0) {
    var _todayIdx = (new Date().getDay() + 6) % 7;
    var _todayData = S.weekPlan[_todayIdx];
    if (_todayData) {
      ['breakfast','lunch','snack','dinner'].forEach(function(slot) {
        var m = _todayData[slot];
        if (m && m.k) _kcalDay += (m.k || 0);
      });
    }
  }
  if (_kcalDay > 0 || _goalObj) {
    var _badge = h('div', {style: 'display:inline-flex;align-items:center;gap:12px;padding:10px 20px;border:1px solid var(--border,#E8E6DF);margin:0 auto 28px;'});
    if (_kcalDay > 0) {
      var _kcalSpan = h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;font-weight:500;color:var(--black,#0A0A09);letter-spacing:0.5px;'});
      _kcalSpan.textContent = Math.round(_kcalDay) + '\u00a0kcal/j';
      _badge.appendChild(_kcalSpan);
    }
    if (_kcalDay > 0 && _goalObj) {
      _badge.appendChild(h('span', {style: 'color:var(--border,#E8E6DF);'}, '·'));
    }
    if (_goalObj) {
      var _goalSpan = h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);letter-spacing:0.5px;'});
      _goalSpan.textContent = _goalObj.name;
      _badge.appendChild(_goalSpan);
    }
    wrap.appendChild(_badge);
  }

  wrap.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;letter-spacing:0.5px;line-height:1.7;color:#555;max-width:300px;margin:0 auto 40px'},
    'Souhaitez-vous consulter votre programme en cours,\nou en établir un nouveau pour la semaine à venir\u00a0?'
  ));

  var btnConsult = h('button', {
    style: 'display:block;width:100%;max-width:300px;padding:16px 24px;background:var(--black,#0A0A09);color:#fff;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;border:none;cursor:pointer;margin:0 auto 14px',
    onclick: function() { goStep(12); }
  }, 'Consulter mon programme');

  var btnNew = h('button', {
    style: 'display:block;width:100%;max-width:300px;padding:15px 24px;background:transparent;color:var(--black,#0A0A09);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;border:1px solid var(--black,#0A0A09);cursor:pointer;margin:0 auto',
    onclick: function() {
      S.weekPlan = null;
      S._nm = null;
      S._weekPlanGeneratedAt = null;
      S._planHash = '';
      S.mealsLogged = {};
      // Bypass goStep(1) auto-skip — force step 1 (sex selection) so returning users can change sex
      S.nStep = 1;
      if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
      window.render();
    }
  }, 'Établir un nouveau programme');

  wrap.appendChild(btnConsult);
  wrap.appendChild(btnNew);
  app.appendChild(wrap);
}

// ─── STEP 0: SPLASH ───
function renderSplash(app) {
  // Use class-based selector (NOT id="splash") to avoid triggering the
  // global #splash { position:fixed; z-index:9999 } CSS rule which would
  // overlay the entire viewport including the navigation bar.
  var sp = h('div', {'class': 'nutrition-intro', style: 'display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 24px 40px;text-align:center;min-height:60vh'});
  sp.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--grey);opacity:0;animation:splashFadeUp .5s ease .1s forwards;margin-bottom:10px'}, 'SMARTFITCOACH · NUTRITION'));
  sp.appendChild(h('div', {style: 'width:36px;height:1px;background:var(--black);margin:0 auto 24px;opacity:0;animation:splashFadeUp .5s ease .25s forwards'}));

  // Strong headline
  var headlineEl = h('div', {style: 'font-family:Georgia,serif;font-size:clamp(28px,8vw,40px);font-weight:normal;line-height:1.1;letter-spacing:-.02em;color:var(--black);opacity:0;animation:splashFadeUp .6s ease .35s forwards;margin-bottom:16px;max-width:340px'});
  headlineEl.innerHTML = 'Mangez mieux.<br><em>Progressez plus.</em>';
  sp.appendChild(headlineEl);

  sp.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:14px;color:var(--grey);line-height:1.65;max-width:290px;opacity:0;animation:splashFadeUp .6s ease .5s forwards;margin-bottom:36px'}, 'Votre plan nutritionnel sur mesure \u2014 calibr\u00e9 sur votre corps, vos objectifs et votre quotidien.'));

  // 3 benefit pills
  var pillsRow = h('div', {style: 'display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:36px;opacity:0;animation:splashFadeUp .6s ease .65s forwards'});
  ['Calories adapt\u00e9es', 'Recettes personnalis\u00e9es', 'Objectif atteignable'].forEach(function(label) {
    var pill = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:.04em;padding:6px 12px;border:1px solid var(--border,#D8D8D0);color:var(--grey,#6B6B65);border-radius:20px'}, label);
    pillsRow.appendChild(pill);
  });
  sp.appendChild(pillsRow);

  var ctaBtn = h('button', {style: 'display:block;width:100%;max-width:320px;background:var(--black,#1A1A18);color:var(--ivory,#FAF9F6);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;min-height:56px;padding:0 24px;border:none;cursor:pointer;opacity:0;animation:splashFadeUp .6s ease .8s forwards;border-radius:2px', onclick: function() { goStep(1); }}, 'Je commence \u2192');
  sp.appendChild(ctaBtn);

  sp.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-top:16px;opacity:0;animation:splashFadeUp .5s ease 1s forwards'}, '2 minutes suffisent \u00b7 Gratuit \u00b7 Vos donn\u00e9es restent sur votre appareil'));
  // Bouton retour — évite que l'utilisateur soit piégé sur ce splash
  sp.appendChild(h('button', {style: 'display:block;margin:20px auto 0;background:none;border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:1px;color:var(--grey);cursor:pointer;padding:8px 16px;min-height:44px;opacity:0;animation:splashFadeUp .5s ease 1.1s forwards', onclick: function() { S.view = 'today'; if (window.render) window.render(); }}, '\u2190 Retour'));
  app.appendChild(sp);
}

// ─── STEP 1 (N3): PRÉNOM + SEXE ───
function renderStep1(p) {
  renderProgressBar(p, 1, 12);
  p.appendChild(h('div', {'class': 'eyebrow', style: 'font-size:9px;letter-spacing:6px;color:var(--grey,#6B6B65)'}, window.t('onb.step') + ' I \u00b7 Identit\u00e9'));
  p.appendChild(h('h1', {html: 'Bienvenue.<br><em>Parlons de vous.</em>', style: 'font-size:28px;line-height:1.2;margin-bottom:12px'}));
  p.appendChild(h('p', {'class': 'subtitle'}, 'Ces informations calibrent vos besoins caloriques avec pr\u00e9cision.'));
  if (window.TIPS) TIPS.renderTip(p, 'identity');

  // Prénom (optionnel)
  (function() {
    var _prenomWrap = h('div', {style: 'margin-bottom:20px'});
    _prenomWrap.appendChild(h('div', {'class': 'section-label'}, 'Votre pr\u00e9nom (optionnel)'));
    var _prenomInput = h('input', {
      type: 'text',
      value: S.prenom || '',
      placeholder: 'Sophie',
      style: 'width:100%;height:48px;border:1px solid var(--border,#E8E6DF);background:var(--ivory,#FAF9F6);font-family:Georgia,serif;font-size:16px;color:var(--black,#1A1A18);padding:0 16px;box-sizing:border-box;border-radius:2px;outline:none;-webkit-appearance:none;',
      oninput: function(e) { S.prenom = e.target.value.trim(); if (window._prenomSaveTimer) clearTimeout(window._prenomSaveTimer); window._prenomSaveTimer = setTimeout(function() { if (window.saveProfile) { try { window.saveProfile(); } catch(e2) {} } }, 500); }
    });
    _prenomInput.addEventListener('focus', function() { setTimeout(function() { _prenomInput.scrollIntoView({behavior:'smooth', block:'center'}); }, 300); });
    _prenomWrap.appendChild(_prenomInput);
    _prenomWrap.appendChild(h('div', {'class': 'num-hint'}, 'Utilis\u00e9 pour personnaliser votre programme'));
    p.appendChild(_prenomWrap);
  })();

  // Sex (MANDATORY)
  var sexLabel = h('div', {'class': 'section-label'});
  sexLabel.appendChild(txt(window.t('onb.s1.sex')));
  sexLabel.appendChild(reqDot());
  p.appendChild(sexLabel);
  var g = h('div', {'class': 'card-grid-2'});
  [{name: window.t('onb.s1.male'), val: 'homme'}, {name: window.t('onb.s1.female'), val: 'femme'}].forEach(function(o) {
    g.appendChild(h('div', {'class': 'sel-card' + (S.sex === o.val ? ' on' : ''), onclick: function() {
      var _prevSex = S.sex;
      S.sex = o.val;
      // Nettoyer les données féminines si passage femme → homme (évite données fantômes persistées)
      if (_prevSex === 'femme' && o.val === 'homme') {
        S.cycleTracking = false;
        S.pregnant = false;
        S.lastPeriodDate = null;
        S.pregnancyWeek = null;
        S.prePregnancyWeight = null;
        S.dueDate = null;
        window._s2page = 0; // Forcer page date naissance, pas la page cycle/grossesse
      }
      if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
      window.render();
    }}, [
      h('div', {'class': 'card-name'}, o.name)
    ]));
  });
  p.appendChild(g);
  p.appendChild(h('div', {style: 'height:16px'}));

  // ── N3: Next → étape 2 (date de naissance) ──
  p.appendChild(h('button', {'class': 'btn-primary', disabled: !S.sex, onclick: function() {
    if (S.sex) {
      bb('nutrition_identity_name_sex', {sex: S.sex});
      goStep(2);
    }
  }}, window.t('onb.next')));
  // Logout link
  p.appendChild(h('button', {
    style: 'display:block;margin:16px auto 0;background:none;border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:1px;color:var(--grey);cursor:pointer;padding:8px;min-height:44px;text-decoration:underline;text-underline-offset:3px;',
    onclick: function() {
      if (window.AUTH) { AUTH.logout(); }
      window.S.view = 'auth';
      window.S.authError = '';
      window.S._resetSent = false;
      window.S._resetEmail = '';
      window.S._passwordUpdated = false;
      window.S.authVerifyEmail = '';
      window.render();
    }
  }, window.t ? window.t('auth.logout') : 'Se d\u00e9connecter'));
}

// ─── STEP 2 (N4): DATE DE NAISSANCE + N4b CYCLE/GROSSESSE (femmes) ───
// sub-page: window._s2page = 0 → date de naissance, 1 → cycle/grossesse (femmes only)
function renderStep2(p) {
  if (typeof window._s2page === 'undefined') window._s2page = 0;
  // N4b: cycle/grossesse — femmes seulement après avoir saisi la date
  if (window._s2page === 1 && S.sex === 'femme') {
    renderStep2b(p);
    return;
  }
  renderProgressBar(p, 2, 12);
  p.appendChild(h('div', {'class': 'eyebrow', style: 'font-size:9px;letter-spacing:6px;color:var(--grey,#6B6B65)'}, window.t('onb.step') + ' II \u00b7 Naissance'));
  p.appendChild(h('h1', {html: 'Votre<br><em>date de naissance</em>', style: 'font-size:28px;line-height:1.2;margin-bottom:12px'}));
  p.appendChild(h('p', {'class': 'subtitle'}, 'Pour calculer votre \u00e2ge exact et adapter vos besoins tout au long de votre vie.'));

  // Date de naissance (MANDATORY)
  var dobLabel = h('div', {'class': 'section-label'});
  dobLabel.appendChild(txt('Date de naissance'));
  dobLabel.appendChild(reqDot());
  p.appendChild(dobLabel);

  var _bd = S.birthDate ? new Date(S.birthDate) : null;
  var _bdValid = _bd && !isNaN(_bd.getTime());
  var _curDay = _bdValid ? _bd.getDate() : 0;
  var _curMonth = _bdValid ? (_bd.getMonth() + 1) : 0;
  var _curYear = _bdValid ? _bd.getFullYear() : 0;

  var _dobWrap = h('div', {style: 'display:flex;gap:8px;align-items:center'});

  var _daySelect = h('select', {'class': 'num-input', style: 'flex:1;padding:10px 6px;font-size:14px;text-align:center;appearance:auto;-webkit-appearance:auto'});
  _daySelect.appendChild(h('option', {value: '0', selected: !_curDay}, 'Jour'));
  for (var _d = 1; _d <= 31; _d++) {
    var _dOpt = h('option', {value: String(_d)}, String(_d));
    if (_d === _curDay) _dOpt.selected = true;
    _daySelect.appendChild(_dOpt);
  }

  var _mNames = ['Janvier','F\u00e9vrier','Mars','Avril','Mai','Juin','Juillet','Ao\u00fbt','Septembre','Octobre','Novembre','D\u00e9cembre'];
  var _monthSelect = h('select', {'class': 'num-input', style: 'flex:1.5;padding:10px 6px;font-size:14px;text-align:center;appearance:auto;-webkit-appearance:auto'});
  _monthSelect.appendChild(h('option', {value: '0', selected: !_curMonth}, 'Mois'));
  for (var _m = 0; _m < 12; _m++) {
    var _mOpt = h('option', {value: String(_m + 1)}, _mNames[_m]);
    if ((_m + 1) === _curMonth) _mOpt.selected = true;
    _monthSelect.appendChild(_mOpt);
  }

  var _thisYear = new Date().getFullYear();
  var _yearSelect = h('select', {'class': 'num-input', style: 'flex:1.2;padding:10px 6px;font-size:14px;text-align:center;appearance:auto;-webkit-appearance:auto'});
  _yearSelect.appendChild(h('option', {value: '0', selected: !_curYear}, 'Ann\u00e9e'));
  for (var _y = _thisYear - 14; _y >= _thisYear - 80; _y--) {
    var _yOpt = h('option', {value: String(_y)}, String(_y));
    if (_y === _curYear) _yOpt.selected = true;
    _yearSelect.appendChild(_yOpt);
  }

  function _updateBirthDate2() {
    var dy = parseInt(_daySelect.value) || 0;
    var mo = parseInt(_monthSelect.value) || 0;
    var yr = parseInt(_yearSelect.value) || 0;
    if (dy && mo && yr) {
      var maxDay = new Date(yr, mo, 0).getDate();
      if (dy > maxDay) dy = maxDay;
      var pad = function(n) { return n < 10 ? '0' + n : String(n); };
      S.birthDate = yr + '-' + pad(mo) + '-' + pad(dy);
      S.age = getAge();
      window.render();
    }
  }
  _daySelect.onchange = _updateBirthDate2;
  _monthSelect.onchange = _updateBirthDate2;
  _yearSelect.onchange = _updateBirthDate2;

  _dobWrap.appendChild(_daySelect);
  _dobWrap.appendChild(_monthSelect);
  _dobWrap.appendChild(_yearSelect);
  p.appendChild(_dobWrap);

  var _computedAge2 = S.birthDate ? getAge() : (S.age || null);
  if (_computedAge2) {
    p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey);margin-top:6px'}, 'Vous avez ' + _computedAge2 + ' ans'));
  } else {
    p.appendChild(h('div', {'class': 'num-hint'}, 'Entre 14 et 80 ans'));
  }

  if (_computedAge2 && _computedAge2 < 16) {
    p.appendChild(h('div', {style: 'background:rgba(180,60,0,0.1);border:1px solid #8A2A0A;border-radius:2px;padding:10px 12px;font-size:11px;color:#8A2A0A;margin-top:8px;line-height:1.5'},
      'Les programmes sport sont adapt\u00e9s aux +16 ans. Pour les moins de 16 ans, consultez un m\u00e9decin ou un entra\u00eenement sp\u00e9cialis\u00e9 jeunesse avant de commencer.'));
  } else if (_computedAge2 && _computedAge2 < 18) {
    p.appendChild(h('div', {style: 'background:rgba(180,120,0,0.1);border:1px solid #6A4A1A;border-radius:2px;padding:10px 12px;font-size:11px;color:#6A4A1A;margin-top:8px;line-height:1.5'},
      'Pour les moins de 18 ans, ce programme doit \u00eatre suivi avec l\'accompagnement d\'un professionnel de sant\u00e9.'));
  }

  if (!S.birthDate && S.age) {
    p.appendChild(h('div', {style: 'background:var(--ivory3,#EEEDE8);border:1px solid var(--border,#D8D8D0);border-radius:2px;padding:8px 12px;font-size:11px;color:var(--grey,#6B6B65);margin-top:8px;line-height:1.5'},
      'Renseignez votre date de naissance pour un suivi plus pr\u00e9cis.'));
  }

  var _dobValid2 = !!(S.birthDate || S.age);
  p.appendChild(h('div', {style: 'height:16px'}));
  p.appendChild(h('button', {'class': 'btn-primary', disabled: !_dobValid2, onclick: function() {
    if (!_dobValid2) return;
    bb('nutrition_birthdate', {age: getAge(), birthDate: S.birthDate});
    // Femmes → étape cycle/grossesse (N4b)
    if (S.sex === 'femme') {
      window._s2page = 1;
      window.render();
    } else {
      window._s2page = 0;
      goStep(3);
    }
  }}, window.t('onb.next')));
  p.appendChild(h('button', {'class': 'btn-back', 'aria-label': 'Retour', onclick: function() { window._s2page = 0; S.nStep = 1; window.render(); }, html: backArrowHtml() + window.t('onb.back')}));
}

// ─── STEP 2b (N4b): CYCLE MENSTRUEL + GROSSESSE (femmes seulement) ───
function renderStep2b(p) {
  renderProgressBar(p, 2, 12);
  p.appendChild(h('div', {'class': 'eyebrow', style: 'font-size:9px;letter-spacing:6px;color:var(--grey,#6B6B65)'}, window.t('onb.step') + ' IIb \u00b7 Sant\u00e9 f\u00e9minine'));
  p.appendChild(h('h1', {html: 'Cycle &<br><em>grossesse</em>', style: 'font-size:28px;line-height:1.2;margin-bottom:12px'}));
  p.appendChild(h('p', {'class': 'subtitle'}, 'Ces informations adaptent vos recommandations nutritionnelles et sportives. Optionnel.'));

  // ─── CYCLE MENSTRUEL ───
  var cycleDivider = h('div', {'class': 'divider', style: 'margin:20px 0 12px'});
    cycleDivider.appendChild(h('div', {'class': 'divider-line'}));
    cycleDivider.appendChild(h('div', {'class': 'divider-text'}, 'Suivi du cycle menstruel (optionnel)'));
    cycleDivider.appendChild(h('div', {'class': 'divider-line'}));
    p.appendChild(cycleDivider);

    // Toggle cycle tracking
    var cycleToggle = h('div', {'class': 'sel-card' + (S.cycleTracking ? ' on' : ''), style: 'margin-bottom:12px;text-align:center;cursor:pointer', onclick: function() {
      S.cycleTracking = !S.cycleTracking;
      window.render();
    }});
    cycleToggle.appendChild(h('div', {'class': 'card-name'}, 'Activer le suivi du cycle'));
    cycleToggle.appendChild(h('div', {'class': 'card-sub'}, S.cycleTracking ? 'Suivi activ\u00e9 \u2014 vos recommandations seront adapt\u00e9es' : 'Adaptez nutrition et sport \u00e0 votre cycle'));
    p.appendChild(cycleToggle);

    if (S.cycleTracking) {
      // Date des derni\u00e8res r\u00e8gles
      p.appendChild(h('div', {'class': 'section-label'}, 'Date des derni\u00e8res r\u00e8gles'));
      var dateWrap = h('div', {'class': 'num-input-wrap'});
      dateWrap.appendChild(h('input', {'class': 'num-input', type: 'date', value: S.lastPeriodDate || '', style: 'font-size:16px;padding:10px;text-align:center', oninput: function(e) {
        S.lastPeriodDate = e.target.value || null;
        window.render();
      }}));
      p.appendChild(dateWrap);

      // Dur\u00e9e du cycle
      p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:12px'}, 'Dur\u00e9e du cycle'));
      var clWrap = h('div', {'class': 'num-input-wrap'});
      clWrap.appendChild(h('input', {'class': 'num-input', type: 'number', min: '21', max: '35', step: '1', value: String(S.cycleLength || 28), inputmode: 'numeric', oninput: function(e) {
        var v = parseInt(e.target.value);
        if (!isNaN(v) && v >= 21 && v <= 35) S.cycleLength = v;
      }, onblur: function(e) {
        var v = parseInt(e.target.value);
        if (isNaN(v) || v < 21) e.target.value = S.cycleLength = 21;
        else if (v > 35) e.target.value = S.cycleLength = 35;
        window.render();
      }}));
      clWrap.appendChild(h('span', {'class': 'num-unit'}, 'jours'));
      p.appendChild(clWrap);
      p.appendChild(h('div', {'class': 'num-hint'}, 'Dur\u00e9e moyenne : 28 jours'));

      // Show current phase if date is filled
      if (S.lastPeriodDate) {
        var cycleInfo = window.getCurrentCyclePhase ? window.getCurrentCyclePhase() : null;
        if (cycleInfo) {
          var phaseColors = {menstruation: '#5A1010', follicular: '#6A4A1A', ovulation: '#1A4A1A', luteal: '#6A4A1A'};
          var phaseColor = phaseColors[cycleInfo.phase.id] || '#6A4A1A';
          var phaseCard = h('div', {style: 'border-left:3px solid ' + phaseColor + ';padding:12px 16px;background:var(--ivory2);margin:12px 0'});
          phaseCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;margin-bottom:4px'}, cycleInfo.phase.icon + ' ' + cycleInfo.phase.name));
          phaseCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:6px'}, 'Jour ' + cycleInfo.dayInCycle + ' de votre cycle'));
          phaseCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic'}, cycleInfo.phase.desc));

          // Progress bar showing position in cycle
          var barWrap = h('div', {style: 'margin-top:10px;height:8px;background:var(--border);border-radius:2px;overflow:hidden;display:flex'});
          var CYCLE_PHASES = window.CYCLE_PHASES || [];
          var barColors = {menstruation: '#5A1010', follicular: '#6A4A1A', ovulation: '#1A4A1A', luteal: '#6A4A1A'};
          for (var ci = 0; ci < CYCLE_PHASES.length; ci++) {
            var cp = CYCLE_PHASES[ci];
            var segStart = Math.round(cp.days[0] * (S.cycleLength || 28) / 28);
            var segEnd = Math.round(cp.days[1] * (S.cycleLength || 28) / 28);
            var segWidth = ((segEnd - segStart + 1) / (S.cycleLength || 28) * 100);
            var segColor = barColors[cp.id] || '#ccc';
            var isCurrentSeg = cycleInfo.phase.id === cp.id;
            barWrap.appendChild(h('div', {style: 'width:' + segWidth + '%;background:' + segColor + ';opacity:' + (isCurrentSeg ? '1' : '0.3') + ';height:100%'}));
          }
          phaseCard.appendChild(barWrap);

          // Position marker
          var markerPct = ((cycleInfo.dayInCycle - 1) / (S.cycleLength || 28) * 100);
          var markerWrap = h('div', {style: 'position:relative;height:10px;margin-top:2px'});
          markerWrap.appendChild(h('div', {style: 'position:absolute;left:' + markerPct + '%;transform:translateX(-50%);font-size:9px;color:var(--noir)'}, '\u25B2'));
          phaseCard.appendChild(markerWrap);

          p.appendChild(phaseCard);
        }
      }
    }
    // ─── GROSSESSE ───
    var pregDivider = h('div', {'class': 'divider', style: 'margin:20px 0 12px'});
    pregDivider.appendChild(h('div', {'class': 'divider-line'}));
    pregDivider.appendChild(h('div', {'class': 'divider-text'}, 'Grossesse'));
    pregDivider.appendChild(h('div', {'class': 'divider-line'}));
    p.appendChild(pregDivider);

    var pregToggle = h('div', {'class': 'sel-card' + (S.pregnant ? ' on' : ''), style: 'margin-bottom:12px;text-align:center;cursor:pointer;border-left:3px solid #E8A87C', onclick: function() {
      S.pregnant = !S.pregnant;
      if (S.pregnant) {
        S.cycleTracking = false;
      } else {
        // Nettoyer les données grossesse pour éviter données fantômes en localStorage
        S.pregnancyWeek = null;
        S.prePregnancyWeight = null;
        S.dueDate = null;
      }
      if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
      window.render();
    }});
    pregToggle.appendChild(h('div', {'class': 'card-name'}, '\u00cates-vous enceinte ?'));
    pregToggle.appendChild(h('div', {'class': 'card-sub'}, S.pregnant ? 'Oui \u2014 Nutrition et sport adapt\u00e9s \u00e0 votre grossesse' : 'Non'));
    p.appendChild(pregToggle);

    if (S.pregnant) {
      // Semaine de grossesse
      p.appendChild(h('div', {'class': 'section-label'}, 'Semaine de grossesse'));
      var pwWrap = h('div', {'class': 'num-input-wrap'});
      pwWrap.appendChild(h('input', {'class': 'num-input', type: 'number', min: '1', max: '42', step: '1', value: S.pregnancyWeek ? String(S.pregnancyWeek) : '', inputmode: 'numeric', placeholder: '12', oninput: function(e) {
        var v = parseInt(e.target.value);
        if (!isNaN(v) && v >= 1 && v <= 42) S.pregnancyWeek = v;
        else if (e.target.value === '') S.pregnancyWeek = null;
      }, onblur: function(e) {
        var v = parseInt(e.target.value);
        if (e.target.value !== '' && (isNaN(v) || v < 1)) { e.target.value = ''; S.pregnancyWeek = null; }
        else if (v > 42) { e.target.value = S.pregnancyWeek = 42; }
        window.render();
      }}));
      pwWrap.appendChild(h('span', {'class': 'num-unit'}, 'SA'));
      p.appendChild(pwWrap);
      p.appendChild(h('div', {'class': 'num-hint'}, 'Semaine d\'am\u00e9norrh\u00e9e (SA)'));

      // Date du terme
      p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:12px'}, 'Date du terme pr\u00e9vue'));
      var ddWrap = h('div', {'class': 'num-input-wrap'});
      ddWrap.appendChild(h('input', {'class': 'num-input', type: 'date', value: S.dueDate || '', style: 'font-size:16px;padding:10px;text-align:center', oninput: function(e) {
        S.dueDate = e.target.value || null;
      }}));
      p.appendChild(ddWrap);

      // Poids avant grossesse
      p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:12px'}, 'Poids avant grossesse'));
      var ppwWrap = h('div', {'class': 'num-input-wrap'});
      ppwWrap.appendChild(h('input', {'class': 'num-input', type: 'number', min: '35', max: '160', step: '0.5', value: S.prePregnancyWeight ? String(S.prePregnancyWeight) : '', inputmode: 'decimal', placeholder: String(S.weight), oninput: function(e) {
        var v = parseFloat(e.target.value);
        if (!isNaN(v) && v >= 35 && v <= 160) S.prePregnancyWeight = v;
        else if (e.target.value === '') S.prePregnancyWeight = null;
      }, onblur: function(e) {
        var v = parseFloat(e.target.value);
        if (e.target.value !== '' && (isNaN(v) || v < 35)) { e.target.value = ''; S.prePregnancyWeight = null; }
        else if (v > 160) { e.target.value = S.prePregnancyWeight = 160; }
        window.render();
      }}));
      ppwWrap.appendChild(h('span', {'class': 'num-unit'}, 'kg'));
      p.appendChild(ppwWrap);
      p.appendChild(h('div', {'class': 'num-hint'}, 'Pour calculer la prise de poids recommand\u00e9e'));

      // Trimester info card
      if (S.pregnancyWeek) {
        var triInfo = window.getPregnancyTrimester ? window.getPregnancyTrimester() : null;
        if (triInfo) {
          var triColors = {trimester1: '#E8A87C', trimester2: '#C38D6B', trimester3: '#D4A5A5'};
          var triColor = triColors[triInfo.trimester.id] || '#E8A87C';
          var triCard = h('div', {style: 'border-left:3px solid ' + triColor + ';padding:14px 16px;background:var(--ivory2);margin:12px 0'});
          triCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;margin-bottom:4px'}, triInfo.trimester.icon + ' ' + triInfo.trimester.name + ' \u2014 Semaine ' + triInfo.week + '/40'));

          // Progress bar
          var progWrap = h('div', {style: 'height:8px;background:var(--border);border-radius:2px;overflow:hidden;margin:8px 0'});
          var t1Pct = 13 / 40 * 100;
          var t2Pct = 14 / 40 * 100;
          var t3Pct = 100 - t1Pct - t2Pct;
          var progInner = h('div', {style: 'display:flex;height:100%'});
          progInner.appendChild(h('div', {style: 'width:' + t1Pct + '%;background:#E8A87C;opacity:' + (triInfo.trimesterNumber === 1 ? '1' : '0.3')}));
          progInner.appendChild(h('div', {style: 'width:' + t2Pct + '%;background:#C38D6B;opacity:' + (triInfo.trimesterNumber === 2 ? '1' : '0.3')}));
          progInner.appendChild(h('div', {style: 'width:' + t3Pct + '%;background:#D4A5A5;opacity:' + (triInfo.trimesterNumber === 3 ? '1' : '0.3')}));
          progWrap.appendChild(progInner);
          triCard.appendChild(progWrap);

          var markerPctPreg = triInfo.progress;
          var markerWPreg = h('div', {style: 'position:relative;height:10px;margin-top:2px'});
          markerWPreg.appendChild(h('div', {style: 'position:absolute;left:' + markerPctPreg + '%;transform:translateX(-50%);font-size:9px;color:var(--noir)'}, '\u25B2'));
          triCard.appendChild(markerWPreg);

          triCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;margin-top:6px'}, triInfo.trimester.desc));
          triCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-top:4px'}, triInfo.weeksLeft + ' semaines avant le terme'));
          p.appendChild(triCard);

          // Weight guidance
          var wgPreg = window.getPregnancyWeightGuideline ? window.getPregnancyWeightGuideline() : null;
          if (wgPreg) {
            var wgCard = h('div', {style: 'border-left:3px solid ' + triColor + ';padding:14px 16px;background:var(--ivory2);margin-bottom:12px'});
            wgCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px;margin-bottom:8px'}, 'Prise de poids recommand\u00e9e (IOM 2009)'));
            var preBmi = (S.prePregnancyWeight && S.height && S.height >= 100) ? S.prePregnancyWeight / Math.pow(S.height / 100, 2) : (calcBMI ? (calcBMI() || 0) : 0);
            wgCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:4px'}, 'IMC pr\u00e9-grossesse : ' + (preBmi || 0).toFixed(1) + ' (' + wgPreg.category + ')'));
            wgCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:4px'}, 'Gain total recommand\u00e9 : ' + wgPreg.totalGainMin + ' \u2014 ' + wgPreg.totalGainMax + ' kg'));
            wgCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:4px'}, '\u00c0 la semaine ' + S.pregnancyWeek + ' : +' + wgPreg.currentExpectedGainMin + ' \u00e0 +' + wgPreg.currentExpectedGainMax + ' kg attendus'));
            if (wgPreg.expectedWeightMin !== null && wgPreg.expectedWeightMax !== null) { wgCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey)'}, 'Poids attendu : ' + wgPreg.expectedWeightMin + ' kg \u2014 ' + wgPreg.expectedWeightMax + ' kg')); }

            if (S.weight && S.prePregnancyWeight) {
              var actualGain = S.weight - S.prePregnancyWeight;
              var withinRange = actualGain >= wgPreg.currentExpectedGainMin && actualGain <= wgPreg.currentExpectedGainMax;
              var belowRange = actualGain < wgPreg.currentExpectedGainMin;
              var statusColor = withinRange ? '#1A4A1A' : (belowRange ? '#1A3A6A' : '#6A4A1A');
              var statusText = withinRange ? 'Dans la fourchette recommand\u00e9e' : (belowRange ? 'En dessous de la fourchette' : 'Au-dessus de la fourchette');
              wgCard.appendChild(h('div', {style: 'margin-top:8px;padding:6px 10px;background:rgba(0,0,0,0.03);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:' + statusColor}, 'Prise actuelle : +' + actualGain.toFixed(1) + ' kg \u2014 ' + statusText));
            }
            p.appendChild(wgCard);
          }
        }
      }
    }

    p.appendChild(h('div', {style: 'height:8px'}));

  // ── N4b: Next → étape 3 (poids+taille) ──
  p.appendChild(h('div', {style: 'height:16px'}));
  p.appendChild(h('button', {'class': 'btn-primary', onclick: function() {
    window._s2page = 0;
    goStep(3);
  }}, window.t('onb.next')));
  p.appendChild(h('button', {'class': 'btn-back', 'aria-label': 'Retour', onclick: function() { window._s2page = 0; goStep(2); }, html: backArrowHtml() + window.t('onb.back')}));
}


// ─── STEP 3 (N5): POIDS + TAILLE + ESTIMATION BMR ───
function renderStep3(p) {
  renderProgressBar(p, 3, 12);
  p.appendChild(h('div', {'class': 'eyebrow', style: 'font-size:9px;letter-spacing:6px;color:var(--grey,#6B6B65)'}, window.t('onb.step') + ' III \u00b7 Corps'));
  p.appendChild(h('h1', {html: 'Votre<br><em>morphologie</em>', style: 'font-size:28px;line-height:1.2;margin-bottom:12px'}));
  p.appendChild(h('p', {'class': 'subtitle'}, 'Poids et taille pour calculer votre m\u00e9tabolisme de base en temps r\u00e9el.'));
  if (window.TIPS) TIPS.renderTip(p, 'morphology');

  // Weight (MANDATORY)
  var wLabel = h('div', {'class': 'section-label'});
  wLabel.appendChild(txt(window.t('onb.s2.weight')));
  wLabel.appendChild(reqDot());
  p.appendChild(wLabel);
  // Toggle unité poids
  var weightUnitDiv = h('div', {style: 'display:flex;gap:8px;margin-bottom:8px'});
  ['kg', 'lbs'].forEach(function(u) {
    var isActive = window.UNITS ? window.UNITS.weight === u : u === 'kg';
    var btn = h('button', {
      style: 'padding:6px 16px;border-radius:2px;font-size:13px;border:1px solid var(--border,#D8D8D0);cursor:pointer;' +
        'background:' + (isActive ? 'var(--black,#0A0A09)' : 'transparent') + ';' +
        'color:' + (isActive ? 'var(--ivory,#FAF9F6)' : 'var(--text,#0A0A09)'),
      onclick: function(e) {
        e.preventDefault();
        if (window.UNITS) window.UNITS.setWeightUnit(u);
      }
    }, u);
    weightUnitDiv.appendChild(btn);
  });
  p.appendChild(weightUnitDiv);
  var wRange = window.UNITS ? window.UNITS.weightRange() : {min: 30, max: 300, step: 0.1};
  var wVal = window.UNITS ? (window.UNITS.displayWeightVal(S.weight) || '') : (S.weight || '');
  var ww = h('div', {'class': 'num-input-wrap'});
  ww.appendChild(h('input', {'class': 'num-input', type: 'number', min: String(wRange.min), max: String(wRange.max), step: String(wRange.step), value: String(wVal), inputmode: 'decimal', placeholder: window.UNITS && window.UNITS.weight === 'lbs' ? '165' : '75', oninput: function(e) {
    var v = parseFloat(e.target.value);
    if (!isNaN(v)) S.weight = window.UNITS ? window.UNITS.toKg(v) : v;
  }, onblur: function(e) {
    var v = parseFloat(e.target.value);
    if (isNaN(v) || v < wRange.min) { e.target.value = wRange.min; S.weight = window.UNITS ? window.UNITS.toKg(wRange.min) : wRange.min; }
    else if (v > wRange.max) { e.target.value = wRange.max; S.weight = window.UNITS ? window.UNITS.toKg(wRange.max) : wRange.max; }
    window.render();
  }}));
  ww.appendChild(h('span', {'class': 'num-unit'}, window.UNITS ? window.UNITS.weightLabel() : 'kg'));
  p.appendChild(ww);
  p.appendChild(h('div', {'class': 'num-hint'}, window.UNITS && window.UNITS.weight === 'lbs' ? 'Entre 66 et 660 lbs' : 'Entre 30 et 300 kg'));
  if (S.weight !== null && S.weight !== undefined && S.weight <= 0) {
    p.appendChild(h('div', {'class': 'field-error', style: 'margin-top:4px'}, 'Le poids doit être supérieur à 0.'));
  }
  p.appendChild(h('div', {style: 'height:16px'}));

  // Height (MANDATORY)
  var hLabel = h('div', {'class': 'section-label'});
  hLabel.appendChild(txt(window.t('onb.s2.height')));
  hLabel.appendChild(reqDot());
  p.appendChild(hLabel);
  // Toggle unité taille
  var heightUnitDiv = h('div', {style: 'display:flex;gap:8px;margin-bottom:8px'});
  ['cm', 'ft'].forEach(function(u) {
    var isActiveH = window.UNITS ? window.UNITS.height === u : u === 'cm';
    var btnH = h('button', {
      style: 'padding:6px 16px;border-radius:2px;font-size:13px;border:1px solid var(--border,#D8D8D0);cursor:pointer;' +
        'background:' + (isActiveH ? 'var(--black,#0A0A09)' : 'transparent') + ';' +
        'color:' + (isActiveH ? 'var(--ivory,#FAF9F6)' : 'var(--text,#0A0A09)'),
      onclick: function(e) {
        e.preventDefault();
        if (window.UNITS) window.UNITS.setHeightUnit(u);
      }
    }, u === 'ft' ? 'ft\u00b7in' : 'cm');
    heightUnitDiv.appendChild(btnH);
  });
  p.appendChild(heightUnitDiv);
  var hRange = window.UNITS ? window.UNITS.heightRange() : {min: 120, max: 250, step: 1};
  var hVal = window.UNITS ? (window.UNITS.displayHeightVal(S.height) || '') : (S.height || '');
  var hw = h('div', {'class': 'num-input-wrap'});
  hw.appendChild(h('input', {'class': 'num-input', type: 'number', min: String(hRange.min), max: String(hRange.max), step: String(hRange.step), value: String(hVal), inputmode: window.UNITS && window.UNITS.height === 'ft' ? 'decimal' : 'numeric', placeholder: window.UNITS && window.UNITS.height === 'ft' ? 'pouces (ex: 70.9)' : '175', oninput: function(e) {
    var v = parseFloat(e.target.value);
    if (!isNaN(v)) S.height = window.UNITS ? window.UNITS.toCm(v) : v;
  }, onblur: function(e) {
    var v = parseFloat(e.target.value);
    if (isNaN(v) || v < hRange.min) { e.target.value = hRange.min; S.height = window.UNITS ? window.UNITS.toCm(hRange.min) : hRange.min; }
    else if (v > hRange.max) { e.target.value = hRange.max; S.height = window.UNITS ? window.UNITS.toCm(hRange.max) : hRange.max; }
    window.render();
  }}));
  hw.appendChild(h('span', {'class': 'num-unit'}, window.UNITS ? window.UNITS.heightLabel() : 'cm'));
  p.appendChild(hw);
  p.appendChild(h('div', {'class': 'num-hint'}, window.UNITS && window.UNITS.height === 'ft' ? 'En pouces d\u00e9cimaux (ex: 70.9 = 5\'11")' : 'Entre 120 et 250 cm'));
  if (S.height !== null && S.height !== undefined && S.height > 0 && S.height < 100) {
    p.appendChild(h('div', {'class': 'field-error', style: 'margin-top:4px'}, 'La taille semble incorrecte (minimum 100 cm).'));
  }

  // BMI
  var bmi = calcBMI();
  if (bmi !== null) {
    var info = bmiInfo(bmi);
    var badge = h('div', {'class': 'imc-widget', style: 'color:' + info.color + ';border-color:' + info.color + ';background:' + info.color + '12'}, [
      h('div', {'class': 'imc-value'}, bmi.toFixed(1)),
      h('div', {'class': 'imc-label'}, window.t('onb.s2.bmi')),
      h('div', {'class': 'imc-category'}, info.label)
    ]);
    p.appendChild(badge);
  }

  // ─── Estimation BMR live (calcul au fur et à mesure de la saisie) ───
  if (S.weight && S.height && S.sex) {
    var _bmrLive = typeof calcBMR === 'function' ? calcBMR() : 0;
    if (_bmrLive > 0) {
      var _bmrCard = h('div', {style: 'margin-top:16px;padding:14px 16px;background:var(--ivory2,#F5F4EF);border:1px solid var(--border,#E8E6DF);border-radius:2px'});
      _bmrCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:6px'}, 'M\u00c9TABOLISME DE BASE'));
      var _bmrRow = h('div', {style: 'display:flex;align-items:baseline;gap:8px'});
      _bmrRow.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:28px;color:var(--black,#0A0A09)'}, String(Math.round(_bmrLive))));
      _bmrRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65)'}, 'kcal/jour au repos'));
      _bmrCard.appendChild(_bmrRow);
      _bmrCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin-top:4px;font-style:italic'}, 'Ce chiffre augmente avec votre niveau d\u2019activit\u00e9 (vous le d\u00e9finirez \u00e0 l\u2019\u00e9tape suivante).'));
      p.appendChild(_bmrCard);
    }
  }

  // ─── Note : waist + photos déférés ───
  p.appendChild(h('div', {style: 'margin-top:16px;padding:10px 14px;background:var(--ivory3,#EEEDE8);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);line-height:1.5'},'Tour de taille, photos de progression \u2014 vous pourrez affiner votre profil une fois votre programme g\u00e9n\u00e9r\u00e9.'));

  // ─── Tour de taille (optionnel — gardé mais discret) ───
  p.appendChild(h('div', {style: 'height:20px'}));
  var _waistLabelWrap = h('div', {'class': 'section-label', style: 'display:flex;align-items:center;gap:8px;'});
  _waistLabelWrap.appendChild(txt('Tour de taille'));
  _waistLabelWrap.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--grey);border:1px solid var(--border);padding:2px 6px;'}, 'Optionnel'));
  p.appendChild(_waistLabelWrap);
  p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:8px;line-height:1.5;'}, 'Permet un suivi de composition corporelle plus pr\u00e9cis que l\u2019IMC seul'));
  var _waistWrap = h('div', {'class': 'num-input-wrap'});
  _waistWrap.appendChild(h('input', {'class': 'num-input', type: 'number', min: '50', max: '200', step: '1', value: S.waist ? String(S.waist) : '', inputmode: 'numeric', placeholder: 'ex: 85', oninput: function(e) {
    var v = parseFloat(e.target.value);
    S.waist = (!isNaN(v) && v >= 50 && v <= 200) ? v : null;
    // Pas de render() ici — évite de détruire l'input pendant la saisie
  }, onblur: function(e) {
    var v = parseFloat(e.target.value);
    if (e.target.value !== '' && (isNaN(v) || v < 50 || v > 200)) { e.target.value = ''; S.waist = null; }
    window.render();
  }}));
  _waistWrap.appendChild(h('span', {'class': 'num-unit'}, 'cm'));
  p.appendChild(_waistWrap);
  // WHtR indicator
  if (S.waist && S.height && S.height > 0) {
    var _whtr = S.waist / S.height;
    if (_whtr > 0.5) {
      p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange,#6A4A1A);background:var(--orangebg,rgba(106,74,26,.06));border:1px solid var(--orange,#6A4A1A);padding:8px 12px;margin-top:6px;line-height:1.5;border-radius:2px;'}, '\u26a0 Risque cardiom\u00e9tabolique accru (tour de taille > 50% de la taille)'));
    }
  }

  // ─── Photos de progression déférées au post-plan (non affichées ici) ───
  // Photo upload section removed from onboarding — available in post-plan settings
  if (false) { // photos déférées au post-plan
  p.appendChild(h('div', {style: 'height:24px'}));
  p.appendChild(h('div', {'class': 'section-label'}, 'Photo de progression (optionnel)'));
  var photoGrid = h('div', {'class': 'photo-grid'});

  // Photo de face
  var frontInput = h('input', {type: 'file', accept: 'image/*', style: 'display:none', onchange: function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      S.photoFront = ev.target.result;
      bb('photo_upload', {type: 'front'});
      if (window.GAMIFICATION && window.GAMIFICATION.unlockBadge) window.GAMIFICATION.unlockBadge('first_photo');
      if (S.photoFront && S.photoBack && window.GAMIFICATION && window.GAMIFICATION.unlockBadge) window.GAMIFICATION.unlockBadge('both_photos');
      window.render();
    };
    reader.readAsDataURL(file);
  }});
  var frontZone = h('div', {'class': 'photo-upload', onclick: function() { frontInput.click(); }});
  if (S.photoFront) {
    frontZone.appendChild(h('img', {src: S.photoFront, alt: 'Photo de face'}));
    frontZone.appendChild(h('div', {'class': 'photo-label'}, 'FACE'));
  } else {
    (function() {
      var _svgNS = 'http://www.w3.org/2000/svg';
      var _ico = document.createElementNS(_svgNS, 'svg');
      _ico.setAttribute('width', '20'); _ico.setAttribute('height', '20');
      _ico.setAttribute('viewBox', '0 0 20 20'); _ico.setAttribute('fill', 'none');
      _ico.setAttribute('class', 'photo-icon-svg');
      var _rect = document.createElementNS(_svgNS, 'rect');
      _rect.setAttribute('x', '1'); _rect.setAttribute('y', '4');
      _rect.setAttribute('width', '18'); _rect.setAttribute('height', '13');
      _rect.setAttribute('rx', '1'); _rect.setAttribute('stroke', 'currentColor'); _rect.setAttribute('stroke-width', '1');
      _ico.appendChild(_rect);
      var _circ = document.createElementNS(_svgNS, 'circle');
      _circ.setAttribute('cx', '10'); _circ.setAttribute('cy', '10.5');
      _circ.setAttribute('r', '3'); _circ.setAttribute('stroke', 'currentColor'); _circ.setAttribute('stroke-width', '1');
      _ico.appendChild(_circ);
      var _line = document.createElementNS(_svgNS, 'path');
      _line.setAttribute('d', 'M6 4l1.5-2h5L14 4');
      _line.setAttribute('stroke', 'currentColor'); _line.setAttribute('stroke-width', '1');
      _ico.appendChild(_line);
      frontZone.appendChild(_ico);
    })();
    frontZone.appendChild(h('div', {'class': 'photo-label'}, 'FACE'));
  }
  frontZone.appendChild(frontInput);
  photoGrid.appendChild(frontZone);

  // Photo de dos
  var backInput = h('input', {type: 'file', accept: 'image/*', style: 'display:none', onchange: function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      S.photoBack = ev.target.result;
      bb('photo_upload', {type: 'back'});
      if (window.GAMIFICATION && window.GAMIFICATION.unlockBadge) window.GAMIFICATION.unlockBadge('first_photo');
      if (S.photoFront && S.photoBack && window.GAMIFICATION && window.GAMIFICATION.unlockBadge) window.GAMIFICATION.unlockBadge('both_photos');
      window.render();
    };
    reader.readAsDataURL(file);
  }});
  var backZone = h('div', {'class': 'photo-upload', onclick: function() { backInput.click(); }});
  if (S.photoBack) {
    backZone.appendChild(h('img', {src: S.photoBack, alt: 'Photo de dos'}));
    backZone.appendChild(h('div', {'class': 'photo-label'}, 'DOS'));
  } else {
    (function() {
      var _svgNS = 'http://www.w3.org/2000/svg';
      var _ico = document.createElementNS(_svgNS, 'svg');
      _ico.setAttribute('width', '20'); _ico.setAttribute('height', '20');
      _ico.setAttribute('viewBox', '0 0 20 20'); _ico.setAttribute('fill', 'none');
      _ico.setAttribute('class', 'photo-icon-svg');
      var _rect = document.createElementNS(_svgNS, 'rect');
      _rect.setAttribute('x', '1'); _rect.setAttribute('y', '4');
      _rect.setAttribute('width', '18'); _rect.setAttribute('height', '13');
      _rect.setAttribute('rx', '1'); _rect.setAttribute('stroke', 'currentColor'); _rect.setAttribute('stroke-width', '1');
      _ico.appendChild(_rect);
      var _circ = document.createElementNS(_svgNS, 'circle');
      _circ.setAttribute('cx', '10'); _circ.setAttribute('cy', '10.5');
      _circ.setAttribute('r', '3'); _circ.setAttribute('stroke', 'currentColor'); _circ.setAttribute('stroke-width', '1');
      _ico.appendChild(_circ);
      var _line = document.createElementNS(_svgNS, 'path');
      _line.setAttribute('d', 'M6 4l1.5-2h5L14 4');
      _line.setAttribute('stroke', 'currentColor'); _line.setAttribute('stroke-width', '1');
      _ico.appendChild(_line);
      backZone.appendChild(_ico);
    })();
    backZone.appendChild(h('div', {'class': 'photo-label'}, 'DOS'));
  }
  backZone.appendChild(backInput);
  photoGrid.appendChild(backZone);
  p.appendChild(photoGrid);

  // Body zones (show only if photos uploaded)
  if (S.photoFront || S.photoBack) {
    p.appendChild(h('div', {style: 'height:16px'}));
    p.appendChild(h('div', {'class': 'section-label'}, 'Zones corporelles'));
    if (!S.bodyZones) S.bodyZones = {};
    var bzWrap = h('div', {'class': 'chip-wrap'});
    if (BODY_ZONES && BODY_ZONES.length) {
      BODY_ZONES.forEach(function(zone) {
        var state = S.bodyZones[zone] || 'neutral';
        var cls = 'muscle-tag';
        if (state === 'strong') cls += ' strong';
        else if (state === 'weak') cls += ' weak';
        bzWrap.appendChild(h('span', {'class': cls, onclick: function() {
          if (!S.bodyZones[zone] || S.bodyZones[zone] === 'neutral') S.bodyZones[zone] = 'strong';
          else if (S.bodyZones[zone] === 'strong') S.bodyZones[zone] = 'weak';
          else S.bodyZones[zone] = 'neutral';
          window.render();
        }}, zone));
      });
    }
    p.appendChild(bzWrap);
    p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:var(--grey3);margin-top:6px'}, 'Cliquez : vert = point fort, rouge = \u00e0 renforcer, neutre = r\u00e9initialiser'));
  }
  } // end if(false) photos block

  p.appendChild(h('div', {style: 'height:24px'}));
  var _step2ok = !!(S.weight && S.height);
  p.appendChild(h('button', {'class': 'btn-primary', disabled: !_step2ok, onclick: function() { if (S.weight && S.height) goStep(4); }}, window.t('onb.next')));
  p.appendChild(h('button', {'class': 'btn-back', 'aria-label': 'Retour', onclick: function() {
    // Femmes : revenir à N4b (cycle/grossesse), pas à N4a (date de naissance)
    window._s2page = (S.sex === 'femme') ? 1 : 0;
    goStep(2);
  }, html: backArrowHtml() + window.t('onb.back')}));
}

// ─── STEP 5 (N6+N7): ACTIVITE + SOMMEIL ───
function renderActiviteSommeil(p) {
  if (!Array.isArray(S.train)) S.train = [];
  renderProgressBar(p, 5, 12);
  p.appendChild(h('div', {'class': 'eyebrow', style: 'font-size:9px;letter-spacing:6px;color:var(--grey,#6B6B65)'}, window.t('onb.step') + ' V \u00b7 Activit\u00e9 & Sommeil'));
  p.appendChild(h('h1', {html: 'Votre<br><em>activit\u00e9</em>', style: 'font-size:28px;line-height:1.2;margin-bottom:12px'}));
  p.appendChild(h('p', {'class': 'subtitle'}, 'D\u00e9crivez votre rythme pour adapter votre programme.'));
  if (window.TIPS) TIPS.renderTip(p, 'activity');

  // Frequency sport (MANDATORY)
  var actLabel = h('div', {'class': 'section-label'});
  actLabel.appendChild(txt('Fr\u00e9quence sport'));
  actLabel.appendChild(reqDot());
  p.appendChild(actLabel);
  var list = h('div', {'class': 'level-list'});
  ACTIVITIES.forEach(function(a, i) {
    list.appendChild(h('div', {'class': 'level-item' + (S.activity === i ? ' on' : ''), onclick: function() { S.activity = i; window.render(); }}, [
      h('div', {}, [h('div', {'class': 'level-name'}, a.name), h('div', {'class': 'level-desc'}, a.desc)]),
      h('span', {'class': 'level-badge'}, '\u00d7' + a.factor)
    ]));
  });
  p.appendChild(list);

  // Training type (MANDATORY)
  var trainLabel = h('div', {'class': 'section-label'});
  trainLabel.appendChild(txt('Type d\'entra\u00eenement'));
  trainLabel.appendChild(reqDot());
  p.appendChild(trainLabel);
  var cw = h('div', {'class': 'chip-wrap'});
  TRAINS.forEach(function(t, i) {
    cw.appendChild(h('span', {'class': 'chip' + (S.train.indexOf(i) !== -1 ? ' on' : ''), onclick: function() { var idx = S.train.indexOf(i); if (idx === -1) S.train.push(i); else S.train.splice(idx, 1); window.render(); }}, t.name));
  });
  p.appendChild(cw);
  p.appendChild(h('div', {style: 'height:16px'}));

  // Sleep (MANDATORY)
  var sleepLabel = h('div', {'class': 'section-label'});
  sleepLabel.appendChild(txt(window.t('onb.s3.sleep')));
  sleepLabel.appendChild(reqDot());
  p.appendChild(sleepLabel);
  var sw = h('div', {'class': 'chip-wrap'});
  SLEEPS.forEach(function(s, i) {
    sw.appendChild(h('span', {'class': 'chip' + (S.sleep === i ? ' on' : ''), onclick: function() { S.sleep = i; window.render(); }}, s));
  });
  p.appendChild(sw);

  // ─── JOURS D'ENTRAÎNEMENT ───
  p.appendChild(h('div', {style: 'height:20px'}));
  p.appendChild(h('div', {'class': 'section-label'}, 'Vos jours d\u2019entra\u00eenement (optionnel)'));
  p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:10px;line-height:1.5;'}, 'Pr\u00e9cisez quels jours vous vous entra\u00eenez pour adapter vos macros (jours\u00a0entra\u00eenement vs repos).'));
  if (!Array.isArray(S.trainingDaysSelected)) S.trainingDaysSelected = [];
  var _dayLabels3 = ['L', 'Ma', 'Me', 'J', 'V', 'S', 'D'];
  var _dayBtns3 = h('div', {style: 'display:flex;gap:6px;justify-content:center;flex-wrap:nowrap;margin:0 0 8px'});
  var _sportDayCount3 = S.sportDays || 3;
  _dayLabels3.forEach(function(label, idx) {
    var _sel3 = S.trainingDaysSelected.indexOf(idx) !== -1;
    var _over3 = _sel3 && S.trainingDaysSelected.length > _sportDayCount3;
    var _btnStyle3 = 'width:44px;height:44px;border-radius:3px;font-family:Georgia,serif;font-size:13px;font-weight:600;cursor:pointer;flex-shrink:0;transition:background .15s,color .15s,border-color .15s;';
    if (_over3) _btnStyle3 += 'background:#5A1010;color:#FAF9F6;border:1.5px solid #5A1010;';
    else if (_sel3) _btnStyle3 += 'background:#1A1A18;color:#FAF9F6;border:1.5px solid #1A1A18;';
    else _btnStyle3 += 'background:transparent;color:#1A1A18;border:1.5px solid #E8E6DF;';
    _dayBtns3.appendChild(h('button', {
      type: 'button', style: _btnStyle3,
      onclick: function() {
        if (!Array.isArray(S.trainingDaysSelected)) S.trainingDaysSelected = [];
        var _pos3 = S.trainingDaysSelected.indexOf(idx);
        if (_pos3 !== -1) { S.trainingDaysSelected.splice(_pos3, 1); }
        else { S.trainingDaysSelected.push(idx); S.trainingDaysSelected.sort(function(a, b) { return a - b; }); }
        if (S.trainingDaysSelected.length > 0) S.sportDays = S.trainingDaysSelected.length;
        // Invalidate plan since training days changed
        S.weekPlan = null;
        if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
        window.render();
      }
    }, label));
  });
  p.appendChild(_dayBtns3);
  var _selCount3 = S.trainingDaysSelected.length;
  var _hint3 = _selCount3 === 0
    ? 'Optionnel \u2014 laissez vide pour r\u00e9partition automatique'
    : _selCount3 + '\u00a0jour' + (_selCount3 > 1 ? 's' : '') + ' s\u00e9lectionn\u00e9' + (_selCount3 > 1 ? 's' : '');
  p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);text-align:center;margin-bottom:4px;'}, _hint3));

  // ─── HEURE D'ENTRAÎNEMENT (mode 'both' uniquement — l'utilisateur s'entraîne activement, le timing affecte la répartition des macros) ───
  if (S.appMode === 'both') {
    p.appendChild(h('div', {style: 'height:20px'}));
    p.appendChild(h('div', {'class': 'section-label'}, '\u23F0 Heure d\u2019entra\u00eenement habituelle'));
    p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin:-4px 0 10px;line-height:1.5;'}, 'Permet d\u2019adapter la r\u00e9partition des repas (glucides + prot\u00e9ines au bon moment).\u00a0Optionnel.'));
    var _ttOpts = [
      {id: 'morning', label: '\uD83C\uDF05 Matin', desc: 'Avant 12h — petit-d\u00e9j post-s\u00e9ance'},
      {id: 'noon',    label: '\u2600\uFE0F Midi',  desc: '12h–15h — d\u00e9jeuner post-s\u00e9ance'},
      {id: 'evening', label: '\uD83C\uDF19 Soir',  desc: 'Apr\u00e8s 17h — d\u00eener post-s\u00e9ance'}
    ];
    var _ttGrid = h('div', {'class': 'level-list'});
    _ttOpts.forEach(function(opt) {
      _ttGrid.appendChild(h('div', {'class': 'level-item' + (S.trainTime === opt.id ? ' on' : ''), onclick: function() {
        S.trainTime = (S.trainTime === opt.id) ? null : opt.id; // toggle
        if (S.weekPlan) { S.weekPlan = null; }
        window.render();
      }}, [h('div', {}, [h('div', {'class': 'level-name'}, opt.label), h('div', {'class': 'level-desc'}, opt.desc)])]));
    });
    p.appendChild(_ttGrid);
    p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-top:4px;'}, 'Laissez vide si variable — le plan utilisera une r\u00e9partition standard.'));
  }

  p.appendChild(h('div', {style: 'height:24px'}));
  var ok = S.activity !== null && Array.isArray(S.train) && S.train.length > 0 && S.sleep !== null;
  p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function() { if (ok) goStep(6); }}, window.t('onb.next')));
  p.appendChild(h('button', {'class': 'btn-back', 'aria-label': 'Retour', onclick: function() { goStep(4); }, html: backArrowHtml() + window.t('onb.back')}));
}

// ─── STEP 8 (MEDICAL): SANTE — CONDITIONS MÉDICALES ───
// PRESERVED: medical questionnaire is scientifically required for accurate nutrition recommendations.
// Position in new flow: after provisional preview (nStep 7), before habitudes (nStep 9).
// Conditions like diabetes, hypertension, TCA, IRC directly affect calorie targets and macro splits.
function renderStep4(p) {
  if (!Array.isArray(S.medical)) S.medical = [];
  renderProgressBar(p, 8, 12);
  // Banner contextuel pour les utilisateurs sport → nutrition
  if (window.S && window.S._switchedFromSport) {
    var _contextBanner = document.createElement('div');
    _contextBanner.style.cssText = 'margin-bottom:16px;padding:12px 14px;background:rgba(26,74,26,0.06);border:1px solid rgba(26,74,26,0.15);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--green,#1A4A1A);line-height:1.5;';
    _contextBanner.textContent = 'Votre profil (sexe, poids, activité) a été importé depuis votre parcours sport. Complétez simplement vos préférences nutritionnelles ci-dessous.';
    window.S._switchedFromSport = false; // Afficher une seule fois
    p.appendChild(_contextBanner);
  }
  // Carte résumé profil repris (affiché quand les étapes 1-3 ont été sautées)
  (function() {
    var _s1ok = S.sex && (S.birthDate || S.age) && S.prenom !== undefined;
    var _s2ok = S.weight && S.height;
    var _s3ok = S.activity !== null && S.activity !== undefined && Array.isArray(S.train) && S.train.length > 0 && S.sleep !== null && S.sleep !== undefined;
    if (_s1ok && _s2ok && _s3ok) {
      var _ageSummary = typeof getAge === 'function' ? getAge() : (S.age || '');
      var _weightSummary = window.UNITS ? window.UNITS.displayWeight(S.weight) : (S.weight + ' kg');
      var _heightSummary = window.UNITS ? window.UNITS.displayHeight(S.height) : (S.height + ' cm');
      var _actSummary = (window.ACTIVITIES && window.ACTIVITIES[S.activity]) ? window.ACTIVITIES[S.activity].name : '';
      var _parts = [];
      if (S.prenom) _parts.push(S.prenom);
      if (_ageSummary) _parts.push(_ageSummary + ' ans');
      if (_weightSummary) _parts.push(_weightSummary);
      if (_heightSummary) _parts.push(_heightSummary);
      if (_actSummary) _parts.push(_actSummary);
      var _summaryCard = h('div', {style: 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border:1px solid #D8D8D0;background:var(--ivory2,#F4F4F0);border-radius:2px;margin-bottom:16px;'});
      var _summaryText = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);line-height:1.5;'});
      _summaryText.appendChild(h('div', {style: 'font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:3px'}, 'Profil repris'));
      _summaryText.appendChild(document.createTextNode(_parts.join(' \u00b7 ')));
      _summaryCard.appendChild(_summaryText);
      _summaryCard.appendChild(h('a', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);text-decoration:underline;cursor:pointer;white-space:nowrap;margin-left:12px;', onclick: function(e) { e.preventDefault(); S.nStep = 1; window.render(); }}, 'Modifier'));
      p.appendChild(_summaryCard);
    }
  })();
  p.appendChild(h('div', {'class': 'eyebrow', style: 'font-size:9px;letter-spacing:6px;color:var(--grey,#6B6B65)'}, window.t('onb.step') + ' VIII'));
  p.appendChild(h('h1', {html: 'Votre<br><em>sant\u00e9</em>', style: 'font-size:28px;line-height:1.2;margin-bottom:12px'}));
  p.appendChild(h('p', {'class': 'subtitle'}, 'Vos conditions de sant\u00e9 pour des recommandations s\u00fbres.'));
  if (window.TIPS) TIPS.renderTip(p, 'health');

  var none = S.medical.length === 0;
  var nb = h('div', {'class': 'sel-card' + (none ? ' on' : ''), style: 'margin-bottom:16px;text-align:center', onclick: function() { S.medical = []; if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} } window.render(); }});
  nb.appendChild(h('div', {'class': 'card-name'}, window.t('onb.s4.none')));
  nb.appendChild(h('div', {'class': 'card-sub'}, 'Je suis en bonne sant\u00e9'));
  p.appendChild(nb);

  var dvd = h('div', {'class': 'divider'});
  dvd.appendChild(h('div', {'class': 'divider-line'}));
  dvd.appendChild(h('div', {'class': 'divider-text'}, 'ou s\u00e9lectionnez'));
  dvd.appendChild(h('div', {'class': 'divider-line'}));
  p.appendChild(dvd);

  MEDICAL.forEach(function(cat) {
    p.appendChild(h('div', {'class': 'section-label'}, cat.cat));
    var catList = h('div', {'class': 'level-list'});
    cat.items.forEach(function(item) {
      var on = S.medical.indexOf(item.id) !== -1;
      catList.appendChild(h('div', {'class': 'level-item' + (on ? ' on' : ''), onclick: function() {
        if (on) {
          S.medical = S.medical.filter(function(x) { return x !== item.id; });
          // Sync: désactiver grossesse médicale → désactiver S.pregnant (double chemin)
          if (item.id === 'grossesse') S.pregnant = false;
        } else {
          S.medical.push(item.id);
          // Sync: activer grossesse médicale → activer S.pregnant pour déclencher les protections
          if (item.id === 'grossesse') { S.pregnant = true; S.cycleTracking = false; }
        }
        if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
        window.render();
      }}, [
        h('div', {}, [h('div', {'class': 'level-name'}, item.icon + ' ' + item.name), h('div', {'class': 'level-desc'}, item.desc)]),
        h('span', {'class': 'level-badge'}, on ? '\u2713' : '+')
      ]));
    });
    p.appendChild(catList);
  });

  if (S.medical.length > 0) {
    p.appendChild(h('div', {style: 'height:12px'}));
    var sel = h('div', {style: 'border-left:2px solid var(--orange);padding:12px 16px;background:var(--orangebg);margin-bottom:16px'});
    sel.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--orange);margin-bottom:8px'}, S.medical.length + ' condition' + (S.medical.length > 1 ? 's' : '') + ' s\u00e9lectionn\u00e9e' + (S.medical.length > 1 ? 's' : '')));
    S.medical.forEach(function(id) {
      var adv = MEDICAL_ADVICE[id];
      if (adv) sel.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:4px;padding-left:8px;border-left:1px solid var(--border)'}, adv.warn));
    });
    p.appendChild(sel);
  }

  p.appendChild(h('div', {style: 'height:8px'}));
  var warn = h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;color:var(--grey3);text-align:center;margin-bottom:16px'});
  warn.textContent = '\u26a0 Ces informations ne remplacent pas un avis m\u00e9dical. Consultez votre m\u00e9decin.';
  p.appendChild(warn);

  p.appendChild(h('button', {'class': 'btn-primary', onclick: function() { window._s5page = 0; goStep(9); }}, window.t('onb.next')));
  p.appendChild(h('button', {'class': 'btn-back', 'aria-label': 'Retour', onclick: function() { goStep(7); }, html: backArrowHtml() + window.t('onb.back')}));
}

// ─── STEP 9 (HABITUDES): HABITUDES ALIMENTAIRES (9a) + SUPPLÉMENTATION & ALCOOL (9b) ───
function renderStep5(p) {
  if (!Array.isArray(S.allergies)) S.allergies = [];
  if (!Array.isArray(S.intolerances)) S.intolerances = [];
  if (!Array.isArray(S.supplements)) S.supplements = [];
  // Sub-page: 0 = habitudes, 1 = supplémentation + alcool
  if (typeof window._s5page === 'undefined') window._s5page = 0;
  var _page = window._s5page;
  var _prenomS5 = S.prenom || '';
  renderProgressBar(p, 9, 12);

  if (_page === 0) {
    // ── 5a: Habitudes ──
    p.appendChild(h('div', {'class': 'eyebrow', style: 'font-size:9px;letter-spacing:6px;color:var(--grey,#6B6B65)'}, window.t('onb.step') + ' IX · a \u00b7 Habitudes'));
    p.appendChild(h('h1', {html: (_prenomS5 ? _prenomS5 + ', quelles sont<br>' : 'Quelles sont<br>') + '<em>vos habitudes alimentaires\u00a0?</em>', style: 'font-size:28px;line-height:1.2;margin-bottom:12px'}));
    p.appendChild(h('p', {'class': 'subtitle'}, 'Vos habitudes au quotidien pour un plan r\u00e9aliste et tenable.'));
    if (window.TIPS) TIPS.renderTip(p, 'habits');

  // Nombre de repas par jour (MANDATORY)
  var mealsLabel = h('div', {'class': 'section-label'});
  mealsLabel.appendChild(txt('Nombre de repas par jour'));
  mealsLabel.appendChild(reqDot());
  p.appendChild(mealsLabel);
  var mg = h('div', {'class': 'card-grid-4'});
  if (FOOD_HABITS_MEALS && FOOD_HABITS_MEALS.length) {
    FOOD_HABITS_MEALS.forEach(function(item) {
      mg.appendChild(h('div', {'class': 'sel-card' + (S.mealsPerDay === item.val ? ' on' : ''), onclick: function() { S.mealsPerDay = item.val; window.render(); }}, [
        h('div', {'class': 'card-name'}, item.name),
        item.desc ? h('div', {'class': 'card-sub'}, item.desc) : null
      ].filter(Boolean)));
    });
  }
  p.appendChild(mg);

  // Lieu principal des repas (MANDATORY)
  var locLabel = h('div', {'class': 'section-label'});
  locLabel.appendChild(txt('Lieu principal des repas'));
  locLabel.appendChild(reqDot());
  p.appendChild(locLabel);
  var lg = h('div', {'class': 'card-grid-3'});
  if (EATING_LOCATIONS && EATING_LOCATIONS.length) {
    EATING_LOCATIONS.forEach(function(item) {
      lg.appendChild(h('div', {'class': 'sel-card' + (S.eatingLocation === item.id ? ' on' : ''), onclick: function() { S.eatingLocation = item.id; window.render(); }}, [
        h('div', {'class': 'card-name'}, item.name),
        item.desc ? h('div', {'class': 'card-sub'}, item.desc) : null
      ].filter(Boolean)));
    });
  }
  p.appendChild(lg);

  // Temps de preparation (MANDATORY)
  var prepLabel = h('div', {'class': 'section-label'});
  prepLabel.appendChild(txt('Temps de pr\u00e9paration'));
  prepLabel.appendChild(reqDot());
  p.appendChild(prepLabel);
  var prepOpts = ['Rapide (5-10min)', 'Moyen (15-25min)', '\u00c9labor\u00e9 (30min+)'];
  var prepWrap = h('div', {'class': 'chip-wrap'});
  prepOpts.forEach(function(opt) {
    prepWrap.appendChild(h('span', {'class': 'chip' + (S.mealPrepTime === opt ? ' on' : ''), onclick: function() { S.mealPrepTime = opt; window.render(); }}, opt));
  });
  p.appendChild(prepWrap);
  p.appendChild(h('div', {style: 'height:8px'}));

  // Grignotage
  p.appendChild(h('div', {'class': 'section-label'}, 'Grignotage'));
  var snackOpts = ['Jamais', 'Parfois', 'Souvent'];
  var snackWrap = h('div', {'class': 'chip-wrap'});
  snackOpts.forEach(function(opt) {
    snackWrap.appendChild(h('span', {'class': 'chip' + (S.snacking === opt ? ' on' : ''), onclick: function() { S.snacking = opt; window.render(); }}, opt));
  });
  p.appendChild(snackWrap);
  p.appendChild(h('div', {style: 'height:8px'}));

  // Desserts healthy
  p.appendChild(h('div', {'class': 'section-label'}, '🍮 Desserts healthy dans mon plan'));
  var dessertWrap = h('div', {'class': 'chip-wrap'});
  var dessertSub = h('div', {style: 'font-size:11px;color:var(--grey);margin-bottom:6px;font-family:"Helvetica Neue",Arial,sans-serif'}, '2-3 fois par semaine en collation' + ((S.mealsPerDay||3) < 4 ? ' (nécessite 4 repas/jour)' : ''));
  p.appendChild(dessertSub);
  var dessertDisabled = (S.mealsPerDay || 3) < 4;
  if (dessertDisabled && S.wantsDessert) { S.wantsDessert = false; }
  ['Non merci', 'Oui, avec plaisir !'].forEach(function(opt) {
    var isOn = opt.startsWith('Oui') ? S.wantsDessert : !S.wantsDessert;
    var chipStyle = dessertDisabled ? 'opacity:0.4;pointer-events:none;cursor:not-allowed' : '';
    dessertWrap.appendChild(h('span', {'class': 'chip' + (isOn ? ' on' : ''), style: chipStyle, onclick: function() {
      if (dessertDisabled) return;
      S.wantsDessert = opt.startsWith('Oui');
      window.render();
    }}, opt));
  });
  p.appendChild(dessertWrap);
  p.appendChild(h('div', {style: 'height:8px'}));

  // Hydratation quotidienne
  p.appendChild(h('div', {'class': 'section-label'}, 'Hydratation quotidienne'));
  var hydOpts = ['< 1L/jour', '1-2L/jour', '2L+/jour'];
  var hydWrap = h('div', {'class': 'chip-wrap'});
  hydOpts.forEach(function(opt) {
    hydWrap.appendChild(h('span', {'class': 'chip' + (S.hydration === opt ? ' on' : ''), onclick: function() { S.hydration = opt; window.render(); }}, opt));
  });
  p.appendChild(hydWrap);

  // ── Page 0 buttons: continue to page 5b, back to step 4 ──
  var _canContinue5a = S.mealsPerDay != null && S.eatingLocation != null && S.mealPrepTime != null;
  p.appendChild(h('div', {style: 'height:24px'}));
  p.appendChild(h('button', {'class': 'btn-primary', disabled: !_canContinue5a, onclick: function() {
    if (_canContinue5a) { window._s5page = 1; window.render(); }
  }}, 'Continuer \u2192 Suppl\u00e9ments & Alcool'));
  p.appendChild(h('button', {'class': 'btn-back', 'aria-label': 'Retour', onclick: function() { window._s5page = 0; goStep(8); }, html: backArrowHtml() + window.t('onb.back')}));

  } else {
    // ── 5b: Supplémentation + Alcool ──
    p.appendChild(h('div', {'class': 'eyebrow', style: 'font-size:9px;letter-spacing:6px;color:var(--grey,#6B6B65)'}, window.t('onb.step') + ' IX · b \u00b7 Suppl\u00e9ments'));
    p.appendChild(h('h1', {html: 'Suppl\u00e9mentation<br><em>& consommation d\u2019alcool</em>', style: 'font-size:28px;line-height:1.2;margin-bottom:12px'}));
    p.appendChild(h('p', {'class': 'subtitle'}, 'Ces informations ajustent votre bilan calorique total.'));

  // Divider: Supplémentation
  var suppDiv = h('div', {'class': 'divider', style: 'margin:0 0 18px'});
  suppDiv.appendChild(h('div', {'class': 'divider-line'}));
  suppDiv.appendChild(h('div', {'class': 'divider-text'}, 'Suppl\u00e9mentation'));
  suppDiv.appendChild(h('div', {'class': 'divider-line'}));
  p.appendChild(suppDiv);

  // Créatine question
  p.appendChild(h('div', {'class': 'section-label'}, 'Prenez-vous de la cr\u00e9atine ?'));
  var creatGrid = h('div', {'class': 'card-grid-2'});
  [{name: 'Oui', val: true}, {name: 'Non', val: false}].forEach(function(o) {
    creatGrid.appendChild(h('div', {'class': 'sel-card' + (S.creatine === o.val ? ' on' : ''), onclick: function() { S.creatine = o.val; if (!o.val) S.creatineDose = 0; window.render(); }}, [
      h('div', {'class': 'card-name'}, o.name)
    ]));
  });
  p.appendChild(creatGrid);

  if (S.creatine) {
    // Calculate recommended dose
    var creatineSupp = null;
    if (SUPPLEMENTS_DB) {
      for (var ci = 0; ci < SUPPLEMENTS_DB.length; ci++) {
        if (SUPPLEMENTS_DB[ci].id === 'creatine') { creatineSupp = SUPPLEMENTS_DB[ci]; break; }
      }
    }
    var recDose = creatineSupp ? creatineSupp.dosageCalc(S) : null;

    p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:12px'}, 'Dose quotidienne'));
    var cdWrap = h('div', {'class': 'num-input-wrap'});
    cdWrap.appendChild(h('input', {'class': 'num-input', type: 'number', min: '1', max: '10', step: '0.5', value: S.creatineDose ? String(S.creatineDose) : '', inputmode: 'decimal', placeholder: recDose ? String(recDose.dose) : '5', oninput: function(e) {
      var v = parseFloat(e.target.value);
      if (!isNaN(v) && v >= 1 && v <= 10) S.creatineDose = v;
    }, onblur: function(e) {
      var v = parseFloat(e.target.value);
      if (e.target.value !== '' && (isNaN(v) || v < 1)) { e.target.value = S.creatineDose = 1; }
      else if (v > 10) { e.target.value = S.creatineDose = 10; }
      window.render();
    }}));
    cdWrap.appendChild(h('span', {'class': 'num-unit'}, 'g/jour'));
    p.appendChild(cdWrap);
    if (recDose) {
      p.appendChild(h('div', {'class': 'num-hint'}, 'Dose recommand\u00e9e : ' + recDose.dose + 'g/jour (bas\u00e9 sur votre poids de ' + S.weight + 'kg)'));
    }
  }

  // Other supplements
  if (window.TIPS) TIPS.renderTip(p, 'supplements');
  p.appendChild(h('div', {'class': 'section-label', style: 'margin-top:16px'}, 'Autres compl\u00e9ments (optionnel)'));
  var suppChipWrap = h('div', {'class': 'chip-wrap'});
  var suppChipList = [
    {id: 'vitamine_d', name: 'Vitamine D'},
    {id: 'magnesium', name: 'Magn\u00e9sium'},
    {id: 'zinc', name: 'Zinc'},
    {id: 'omega3', name: 'Om\u00e9ga-3'},
    {id: 'whey', name: 'Whey'},
    {id: 'fer', name: 'Fer'},
    {id: 'vitamine_c', name: 'Vitamine C'},
    {id: 'cafeine', name: 'Caf\u00e9ine'},
    {id: 'bcaa', name: 'BCAA'}
  ];
  suppChipList.forEach(function(item) {
    // Pregnancy: hide caffeine
    if (S.pregnant && S.sex === 'femme' && item.id === 'cafeine') return;
    var isOn = S.supplements.indexOf(item.id) !== -1;
    suppChipWrap.appendChild(h('span', {'class': 'chip' + (isOn ? ' on' : ''), onclick: function() {
      var idx = S.supplements.indexOf(item.id);
      if (idx === -1) S.supplements.push(item.id);
      else S.supplements.splice(idx, 1);
      window.render();
    }}, item.name));
  });
  p.appendChild(suppChipWrap);
  if (S.pregnant && S.sex === 'femme') {
    p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#6A4A1A;margin-top:6px'}, '\u26A0 Caf\u00e9ine : max 200 mg/jour pendant la grossesse (environ 1 tasse de caf\u00e9)'));
  }

  // Divider: Consommation d'alcool
  if (S.pregnant && S.sex === 'femme') {
    // Pregnancy: no alcohol
    var alcPregDiv = h('div', {'class': 'divider', style: 'margin:28px 0 18px'});
    alcPregDiv.appendChild(h('div', {'class': 'divider-line'}));
    alcPregDiv.appendChild(h('div', {'class': 'divider-text'}, 'Consommation d\u2019alcool'));
    alcPregDiv.appendChild(h('div', {'class': 'divider-line'}));
    p.appendChild(alcPregDiv);
    var alcPregWarn = h('div', {style: 'border-left:3px solid #5A1010;padding:14px 16px;background:rgba(192,57,43,0.06);margin-bottom:16px'});
    alcPregWarn.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px;color:#5A1010;margin-bottom:4px'}, '\u26D4 Z\u00e9ro alcool pendant la grossesse'));
    alcPregWarn.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#5A1010'}, 'Aucune quantit\u00e9 d\'alcool n\'est consid\u00e9r\u00e9e comme s\u00fbre pendant la grossesse. L\'alcool traverse le placenta et peut affecter le d\u00e9veloppement du b\u00e9b\u00e9.'));
    p.appendChild(alcPregWarn);
    S.alcoholFreq = 'never';
    S.alcoholTypes = [];
  } else {
  var alcDiv = h('div', {'class': 'divider', style: 'margin:28px 0 18px'});
  alcDiv.appendChild(h('div', {'class': 'divider-line'}));
  alcDiv.appendChild(h('div', {'class': 'divider-text'}, 'Consommation d\u2019alcool'));
  alcDiv.appendChild(h('div', {'class': 'divider-line'}));
  p.appendChild(alcDiv);
  if (window.TIPS) TIPS.renderTip(p, 'alcohol');

  // Frequence alcool (MANDATORY)
  var freqLabel = h('div', {'class': 'section-label'});
  freqLabel.appendChild(txt('Fr\u00e9quence'));
  freqLabel.appendChild(reqDot());
  p.appendChild(freqLabel);
  var fg = h('div', {'class': 'card-grid-4'});
  if (ALCOHOL_FREQS && ALCOHOL_FREQS.length) {
    ALCOHOL_FREQS.forEach(function(item) {
      fg.appendChild(h('div', {'class': 'sel-card' + (S.alcoholFreq === item.id ? ' on' : ''), onclick: function() { S.alcoholFreq = item.id; window.render(); }}, [
        h('div', {'class': 'card-name', style: 'font-size:13px'}, item.name),
        item.desc ? h('div', {'class': 'card-sub'}, item.desc) : null
      ].filter(Boolean)));
    });
  }
  p.appendChild(fg);

  // Alcohol detail (if NOT 'never')
  if (S.alcoholFreq && S.alcoholFreq !== 'never') {
    p.appendChild(h('div', {'class': 'section-label'}, 'D\u00e9tail de consommation'));
    if (!S.alcoholTypes) S.alcoholTypes = [];

    if (ALCOHOL_DB && ALCOHOL_DB.length) {
      ALCOHOL_DB.forEach(function(drink) {
        var existing = null;
        for (var i = 0; i < S.alcoholTypes.length; i++) {
          if (S.alcoholTypes[i].type === drink.name) { existing = S.alcoholTypes[i]; break; }
        }
        var freq = existing ? existing.freq : 0;

        var item = h('div', {'class': 'alcohol-item'});
        var nameDiv = h('div', {style: 'display:flex;align-items:center;gap:8px'});
        nameDiv.appendChild(h('span', {'class': 'alcohol-name'}, drink.name));
        nameDiv.appendChild(h('span', {'class': 'alcohol-kcal'}, drink.kcal + ' kcal'));
        item.appendChild(nameDiv);

        var freqDiv = h('div', {'class': 'alcohol-freq'});
        for (var b = 0; b <= 7; b++) {
          (function(bv) {
            freqDiv.appendChild(h('span', {
              'class': 'chip' + (freq === bv ? ' on' : ''),
              style: 'padding:4px 8px;font-size:11px;min-width:24px;text-align:center',
              onclick: function() {
                var found = false;
                for (var j = 0; j < S.alcoholTypes.length; j++) {
                  if (S.alcoholTypes[j].type === drink.name) {
                    S.alcoholTypes[j].freq = bv;
                    found = true;
                    break;
                  }
                }
                if (!found) S.alcoholTypes.push({type: drink.name, freq: bv});
                window.render();
              }
            }, String(bv)));
          })(b);
        }
        freqDiv.appendChild(h('span', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey);margin-left:4px'}, '/sem'));
        item.appendChild(freqDiv);
        p.appendChild(item);
      });
    }

    // Total weekly kcal
    var totalAlcKcal = 0;
    if (alcoholWeeklyKcal) {
      totalAlcKcal = alcoholWeeklyKcal();
    } else if (S.alcoholTypes && ALCOHOL_DB) {
      S.alcoholTypes.forEach(function(at) {
        for (var i = 0; i < ALCOHOL_DB.length; i++) {
          if (ALCOHOL_DB[i].name === at.type) {
            totalAlcKcal += ALCOHOL_DB[i].kcal * at.freq;
            break;
          }
        }
      });
    }
    p.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:13px;text-align:center;padding:12px;margin-top:8px;border:1px solid var(--border);background:var(--ivory2)'}, 'Total : ' + totalAlcKcal + ' kcal/semaine d\u2019alcool'));

    if (totalAlcKcal > 500) {
      var alcWarn = h('div', {style: 'border-left:2px solid var(--orange);padding:12px 16px;background:var(--orangebg);margin-top:8px'});
      alcWarn.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange)'}, '\u26a0 Consommation \u00e9lev\u00e9e : ' + totalAlcKcal + ' kcal/semaine repr\u00e9sente environ ' + Math.round(totalAlcKcal / 7) + ' kcal/jour suppl\u00e9mentaires. Cela peut freiner vos objectifs.'));
      p.appendChild(alcWarn);
    }
  }
  } // end else (non-pregnant alcohol section)

  p.appendChild(h('div', {style: 'height:24px'}));
  var canContinue5b = S.alcoholFreq != null;
  // Helper text quand fréquence non sélectionnée (évite impasse silencieuse)
  if (!canContinue5b) {
    p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);text-align:center;margin-bottom:8px'}, '← Sélectionnez votre fréquence de consommation ci-dessus pour continuer'));
  }
  p.appendChild(h('button', {'class': 'btn-primary', disabled: !canContinue5b, onclick: function() {
    if (canContinue5b) {
      bb('nutrition_habits', {meals: S.mealsPerDay, location: S.eatingLocation, prepTime: S.mealPrepTime, alcoholFreq: S.alcoholFreq});
      if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
      window._s5page = 0;
      goStep(10);
    }
  }}, window.t('onb.next')));
  p.appendChild(h('button', {'class': 'btn-back', 'aria-label': 'Retour', onclick: function() { window._s5page = 0; window.render(); }, html: backArrowHtml() + window.t('onb.back')}));
  } // end _page === 1
}

// ─── STEP 4 (N1+N2): OBJECTIF + POIDS CIBLE ───
function renderStep6(p) {
  if (!Array.isArray(S.supplements)) S.supplements = [];
  if (!Array.isArray(S.wheyFlavors)) S.wheyFlavors = [];
  if (!Array.isArray(S.cuisines)) S.cuisines = [];
  if (!Array.isArray(S.shopStores)) S.shopStores = [];
  if (!Array.isArray(S.shopPrefs)) S.shopPrefs = [];
  renderProgressBar(p, 4, 12);
  p.appendChild(h('div', {'class': 'eyebrow', style: 'font-size:9px;letter-spacing:6px;color:var(--grey,#6B6B65)'}, window.t('onb.step') + ' IV \u00b7 Objectif'));
  p.appendChild(h('h1', {html: 'Votre<br><em>objectif</em>', style: 'font-size:28px;line-height:1.2;margin-bottom:12px'}));
  if (window.TIPS) TIPS.renderTip(p, 'goal');

  // Pregnancy: override goal
  if (S.pregnant && S.sex === 'femme') {
    p.appendChild(h('p', {'class': 'subtitle'}, 'Nutrition adapt\u00e9e \u00e0 chaque trimestre de votre grossesse.'));

    // Auto-select maintain uniquement si objectif actuel est coupe/sèche (incompatible)
    // Ne pas écraser bulk/recompo à chaque render — préserver le choix si compatible
    if (S.goal === null || !GOALS[S.goal] || GOALS[S.goal].key === 'cut' || GOALS[S.goal].key === 'shred') {
      S.goal = 2; // index of "Maintien" in GOALS (0=bulk, 1=lean_bulk, 2=maintain)
    }

    var pregObjCard = h('div', {style: 'border-left:3px solid #E8A87C;padding:16px;background:var(--ivory2);margin-bottom:16px'});
    pregObjCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;margin-bottom:8px'}, '\uD83E\uDD30 ' + window.t('onb.s6.maintain') + ' + besoins grossesse'));
    pregObjCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:4px'}, 'La perte de poids est d\u00e9conseill\u00e9e pendant la grossesse.'));

    var triPreg = window.getPregnancyTrimester ? window.getPregnancyTrimester() : null;
    if (triPreg) {
      var extraCal = triPreg.trimester.calorieExtra;
      var tdeeBase = Math.round(calcTDEE());
      var totalPreg = tdeeBase + extraCal;
      pregObjCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey);margin-top:8px'}, 'Besoins de base : ' + tdeeBase + ' kcal + ' + extraCal + ' kcal (trimestre ' + triPreg.trimesterNumber + ') = ' + totalPreg + ' kcal/jour'));
    }
    p.appendChild(pregObjCard);

    // Pregnancy weight curve
    if (S.pregnancyWeek) {
      var wgObj = window.getPregnancyWeightGuideline ? window.getPregnancyWeightGuideline() : null;
      if (wgObj) {
        var curveCard = h('div', {style: 'border:1px solid var(--border);padding:16px;background:var(--ivory2);margin-bottom:16px'});
        curveCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px;margin-bottom:10px'}, 'Courbe de poids grossesse'));
        var curveCanvas = h('canvas', {width: '600', height: '220', style: 'width:100%;height:220px'});
        curveCard.appendChild(curveCanvas);
        p.appendChild(curveCard);

        setTimeout(function() {
          if (typeof Chart === 'undefined' || !curveCanvas.getContext) return;
          var baseW = parseFloat(S.prePregnancyWeight || S.weight);
          if (isNaN(baseW) || baseW <= 0 || !wgObj || !wgObj.weeklyGainRange) return;
          var labels = [];
          var minData = [];
          var maxData = [];
          for (var w = 0; w <= 40; w++) {
            labels.push('S' + w);
            var t1g = Math.min(w, 13) / 13 * 2.0;
            var t2t3w = Math.max(0, w - 13);
            minData.push(Math.round((baseW + t1g + t2t3w * wgObj.weeklyGainRange[0]) * 10) / 10);
            maxData.push(Math.round((baseW + t1g + t2t3w * wgObj.weeklyGainRange[1]) * 10) / 10);
          }
          var datasets = [
            { label: 'Min recommand\u00e9', data: minData, borderColor: '#1A4A1A', borderWidth: 1, pointRadius: 0, fill: false },
            { label: 'Max recommand\u00e9', data: maxData, borderColor: '#1A4A1A', borderWidth: 1, pointRadius: 0, fill: '-1', backgroundColor: 'rgba(39,174,96,0.12)' }
          ];
          if (S.weight) {
            var pointData = new Array(41).fill(null);
            var cw = S.pregnancyWeek || 0;
            if (cw >= 0 && cw <= 40) pointData[cw] = S.weight;
            datasets.push({ label: 'Poids actuel', data: pointData, borderColor: '#E8A87C', pointRadius: 6, pointBackgroundColor: '#E8A87C', showLine: false });
          }
          try { window.createChart(curveCanvas, {
            type: 'line', data: { labels: labels, datasets: datasets },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { font: { family: 'Helvetica Neue', size: 9 } } } }, scales: { x: { grid: { color: '#E5E4DE' }, ticks: { font: { family: 'Helvetica Neue', size: 9 }, color: '#9A9A90', maxTicksLimit: 10 } }, y: { grid: { color: '#E5E4DE' }, ticks: { font: { family: 'Georgia', size: 11 }, color: '#0A0A09' } } } }
          }); } catch(e){}
        }, 150);
      }
    }

    p.appendChild(h('div', {style: 'height:16px'}));
    p.appendChild(h('button', {'class': 'btn-primary', onclick: function() {
      bb('nutrition_goal', {goal: 'maintain_pregnancy', target: calcTarget()});
      goStep(5);
    }}, window.t('onb.next')));
    p.appendChild(h('button', {'class': 'btn-back', 'aria-label': 'Retour', onclick: function() { goStep(3); }, html: backArrowHtml() + window.t('onb.back')}));
    return;
  }

  p.appendChild(h('p', {'class': 'subtitle'}, 'Choisissez l\u2019objectif qui guide votre programme.'));

  // ─── RED-S warning banner ───
  // Show BEFORE goal chips if conditions match
  (function() {
    var _goalKey = (S.goal !== null && S.goal !== undefined && GOALS[S.goal]) ? GOALS[S.goal].key : null;
    var _isCutOrShred = _goalKey === 'cut' || _goalKey === 'shred';
    var _isFemme = S.sex === 'femme';
    var _lowSleep = S.sleep !== null && S.sleep !== undefined && S.sleep <= 1; // index 0 = <6h, 1 = 6-7h
    var _highActivity = S.activity !== null && S.activity !== undefined && S.activity >= 2;
    // Try window.detectREDS first (covers both sexes, uses EA threshold)
    var _redsResult = null;
    if (_isCutOrShred && window.detectREDS) {
      try { _redsResult = window.detectREDS(); } catch(e) {}
    }
    // Show banner if detectREDS triggered OR if simple heuristic matches
    var _showReds = _redsResult || (_isCutOrShred && _isFemme && _lowSleep && _highActivity);
    if (_showReds) {
      var _redsMsg = (_redsResult && _redsResult.message)
        ? _redsResult.message
        : '\u26a0 Risque RED-S d\u00e9tect\u00e9 \u2014 La combinaison activit\u00e9 \u00e9lev\u00e9e + sommeil insuffisant + objectif s\u00e8che peut mener au syndrome de d\u00e9ficit \u00e9nerg\u00e9tique relatif (RED-S). Consultez un professionnel de sant\u00e9 avant de d\u00e9marrer cet objectif.';
      var _redsBanner = h('div', {style: 'background:var(--orangebg,rgba(106,74,26,.06));border:1px solid var(--orange,#6A4A1A);padding:12px 14px;margin-bottom:16px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange,#6A4A1A);line-height:1.6;border-radius:2px;'}, _redsMsg);
      p.appendChild(_redsBanner);
    }
  })();

  // Goal selection (MANDATORY)
  var goalLabel = h('div', {'class': 'section-label'});
  goalLabel.appendChild(txt('Objectif principal'));
  goalLabel.appendChild(reqDot());
  p.appendChild(goalLabel);
  // === GROSSESSE / ALLAITEMENT : bloquer sèche/coupe, auto-reset si incompatible, afficher bannière ===
  var _isAllait = Array.isArray(S.medical) && S.medical.indexOf('allaitement') !== -1;
  var _isPreg = !!S.pregnant;
  if (_isPreg || _isAllait) {
    // Forcer maintien si objectif actuel est coupe ou sèche (OMS 2016, ACOG 2020 — restriction calorique contre-indiquée)
    if (S.goal !== null && GOALS[S.goal] && (GOALS[S.goal].key === 'cut' || GOALS[S.goal].key === 'shred')) {
      S.goal = 2; // index 2 = maintien
    }
    if (_isPreg) {
      var _pregGoalBanner = h('div', {style: 'background:rgba(232,168,124,0.10);border:2px solid #E8A87C;padding:14px 16px;margin-bottom:14px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:#6A4A1A;line-height:1.7;border-radius:2px;'});
      _pregGoalBanner.appendChild(h('div', {style: 'font-size:13px;font-weight:600;letter-spacing:0.03em;margin-bottom:5px;'}, 'Grossesse \u2014 objectifs restreints'));
      _pregGoalBanner.appendChild(h('div', {}, 'La s\u00e8che et la perte de poids sont contre-indiqu\u00e9es pendant la grossesse\u00a0(OMS\u00a02016, ACOG\u00a02020). Votre plan nutritionnel est automatiquement adapt\u00e9 \u00e0 vos besoins.'));
      p.appendChild(_pregGoalBanner);
    }
    if (_isAllait) {
      var _allaitGoalBanner = h('div', {style: 'background:rgba(232,168,124,0.10);border:2px solid #E8A87C;padding:14px 16px;margin-bottom:14px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:#6A4A1A;line-height:1.7;border-radius:2px;'});
      _allaitGoalBanner.appendChild(h('div', {style: 'font-size:13px;font-weight:600;letter-spacing:0.03em;margin-bottom:5px;'}, 'Allaitement \u2014 objectifs restreints'));
      _allaitGoalBanner.appendChild(h('div', {}, 'La s\u00e8che et la perte de poids sont contre-indiqu\u00e9es pendant l\u2019allaitement\u00a0(ACOG\u00a02022). Un surplus de +500\u00a0kcal/j est n\u00e9cessaire pour maintenir la production lactiqu\u00e9e et prot\u00e9ger votre sant\u00e9.'));
      p.appendChild(_allaitGoalBanner);
    }
  }
  // === ADOLESCENT (13–17 ans) : caps sur déficit/surplus, informer l'utilisateur ===
  var _userAgeGoal = typeof window.getAge === 'function' ? window.getAge() : null;
  if (_userAgeGoal !== null && _userAgeGoal >= 13 && _userAgeGoal < 18) {
    var _teenGoalBanner = h('div', {style: 'background:rgba(106,74,26,0.06);border:1px solid var(--orange,#6A4A1A);padding:14px 16px;margin-bottom:14px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--orange,#6A4A1A);line-height:1.7;border-radius:2px;'});
    _teenGoalBanner.appendChild(h('div', {style: 'font-size:13px;font-weight:600;letter-spacing:0.03em;margin-bottom:5px;'}, 'Objectifs adapt\u00e9s pour les 13\u201317 ans'));
    _teenGoalBanner.appendChild(h('div', {}, 'D\u00e9ficit max -300\u00a0kcal/j, surplus max +300\u00a0kcal/j (ACSM\u00a02007, IOC\u00a02018) pour pr\u00e9server la croissance et le pic de masse osseuse. Votre plan est automatiquement encadr\u00e9.'));
    p.appendChild(_teenGoalBanner);
  }
  var gg = h('div', {'class': 'card-grid-2'});
  GOALS.forEach(function(gl, i) {
    var _pregBlock = (_isPreg || _isAllait) && (gl.key === 'cut' || gl.key === 'shred');
    gg.appendChild(h('div', {
      'class': 'sel-card' + (S.goal === i ? ' on' : '') + (_pregBlock ? ' disabled' : ''),
      style: _pregBlock ? 'opacity:0.35;cursor:not-allowed;pointer-events:none;' : '',
      onclick: _pregBlock ? null : function() {
        S.goal = i;
        // ── SYNC SPORT GOALS ─────────────────────────────────────────────────
        // If sport goals already selected, replace the "primary" one to stay coherent
        if (S.sportGoals && S.sportGoals.length > 0 && window.NUTRITION_TO_SPORT_GOAL) {
          var newSportId = window.NUTRITION_TO_SPORT_GOAL[gl.key];
          if (newSportId) {
            // ÉLEVÉ-1: retirer TOUS les goals pilotés par nutrition (primaires + secondaires fonctionnels)
            var primaryIds = ['muscle', 'weightloss', 'shred', 'general', 'endurance', 'flexibility'];
            var secondaryKept = S.sportGoals.filter(function(x) { return primaryIds.indexOf(x) === -1; });
            S.sportGoals = [newSportId].concat(secondaryKept).slice(0, 3);
          }
        }
        // ─────────────────────────────────────────────────────────────────────
        window.render();
      }
    }, [
      h('div', {'class': 'card-name'}, _pregBlock ? gl.name + ' \u2014 non disponible' : gl.name),
      h('div', {'class': 'card-sub'}, _pregBlock ? 'Contre-indiqu\u00e9 pendant la grossesse' : gl.desc)
    ]));
  });
  p.appendChild(gg);

  if (S.goal !== null) {
    var tgt = calcTarget();
    var bn = h('div', {'class': 'big-number'});
    bn.appendChild(h('div', {'class': 'bn-val'}, String(tgt)));
    bn.appendChild(h('div', {'class': 'bn-label'}, window.t('onb.s8.target')));
    p.appendChild(bn);

    // Target weight
    var goalObj8 = (S.goal !== null && GOALS[S.goal]) ? GOALS[S.goal] : null;
    var goalKey = goalObj8 ? goalObj8.key : 'maintain';
    var needsTarget = goalKey === 'cut' || goalKey === 'shred' || goalKey === 'bulk' || goalKey === 'lean_bulk';
    var twLabel = h('div', {'class': 'section-label'});
    twLabel.appendChild(txt('Poids objectif'));
    if (needsTarget) twLabel.appendChild(reqDot());
    p.appendChild(twLabel);

    var twWrap = h('div', {'class': 'num-input-wrap'});
    twWrap.appendChild(h('input', {'class': 'num-input', type: 'number', min: '40', max: '160', step: '0.5', value: S.targetWeight ? String(S.targetWeight) : '', inputmode: 'decimal', placeholder: '', oninput: function(e) {
      var v = parseFloat(e.target.value);
      if (!isNaN(v) && v >= 40 && v <= 160) S.targetWeight = v;
      else if (e.target.value === '') S.targetWeight = null;
    }, onblur: function(e) {
      var v = parseFloat(e.target.value);
      if (e.target.value !== '' && (isNaN(v) || v < 40)) { e.target.value = ''; S.targetWeight = null; }
      else if (v > 160) { e.target.value = S.targetWeight = 160; }
      window.render();
    }}));
    twWrap.appendChild(h('span', {'class': 'num-unit'}, 'kg'));
    p.appendChild(twWrap);

    // Projection summary (text only, no chart)
    if (S.targetWeight && calcWeightProjection) {
      var proj = calcWeightProjection();
      if (proj && proj.weeks) {
        p.appendChild(h('div', {style: 'height:16px'}));
        var projBox = h('div', {style: 'text-align:center;padding:16px;border:1px solid var(--border);background:var(--ivory2)'});
        projBox.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:8px'}, 'Projection'));
        projBox.appendChild(h('div', {style: 'font-family:Georgia;font-size:24px;font-style:italic'}, '~' + proj.weeks + ' semaines'));
        projBox.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);margin-top:4px'},
          proj.months + ' mois \u2014 ' + proj.targetDate.toLocaleDateString('fr-FR', {day:'numeric',month:'long',year:'numeric'})));
        projBox.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey3,#9A9A90);margin-top:4px'},
          (proj.weeklyChange > 0 ? '+' : '') + (proj.weeklyChange || 0).toFixed(2) + ' kg/semaine'));
        p.appendChild(projBox);
      }
    }
  }

  p.appendChild(h('div', {style: 'height:16px'}));
  var goalOk = S.goal !== null;
  var _tcaConflict = false;
  if (goalOk && S.goal !== null && GOALS[S.goal]) {
    var gk = GOALS[S.goal].key;
    if ((gk === 'cut' || gk === 'shred' || gk === 'bulk' || gk === 'lean_bulk') && !S.targetWeight) goalOk = false;
    // TCA : seuls maintien (2) et recomposition (5) sont compatibles — calcTarget() force le maintien pour TOUS les autres
    // Helms 2014 / ANAD / IOC 2018 : restriction ET surplus intentionnel contre-indiqués en contexte TCA
    if ((gk === 'cut' || gk === 'shred' || gk === 'bulk' || gk === 'lean_bulk') && S.medical && S.medical.indexOf('tca') !== -1) {
      goalOk = false;
      _tcaConflict = true;
    }
  }
  if (_tcaConflict) {
    p.appendChild(h('div', {style: 'background:var(--redbg,rgba(90,16,16,.06));border:1px solid var(--red,#5A1010);padding:10px 14px;border-radius:2px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--red,#5A1010);line-height:1.6'}, 'Historique de TCA d\u00e9tect\u00e9 \u2014 seuls le Maintien et la Recomposition sont compatibles. Les objectifs de s\u00e8che, coupe, prise de masse sont m\u00e9dicalement contre-indiqu\u00e9s (ANAD, IOC\u00a02018).'));
  }
  p.appendChild(h('button', {'class': 'btn-primary', disabled: !goalOk, onclick: function() {
    if (goalOk) {
      bb('nutrition_goal', {goal: (GOALS[S.goal]||{}).key, target: calcTarget(), targetWeight: S.targetWeight});
      goStep(5);
    }
  }}, window.t('onb.next')));
  p.appendChild(h('button', {'class': 'btn-back', 'aria-label': 'Retour', onclick: function() { goStep(3); }, html: backArrowHtml() + window.t('onb.back')}));
}

// ─── STEP 10 (PRÉFÉRENCES): RÉGIME + ALLERGIES + NIVEAU CUISINE + REPAS/J ───
function renderStep7(p) {
  renderProgressBar(p, 10, 12);
  p.appendChild(h('div', {'class': 'eyebrow', style: 'font-size:9px;letter-spacing:6px;color:var(--grey,#6B6B65)'}, window.t('onb.step') + ' VII'));
  p.appendChild(h('h1', {html: 'Vos<br><em>pr\u00e9f\u00e9rences</em>', style: 'font-size:28px;line-height:1.2;margin-bottom:12px'}));
  p.appendChild(h('p', {'class': 'subtitle'}, 'Allergies et pr\u00e9f\u00e9rences pour des recettes \u00e0 votre image.'));
  if (window.TIPS) TIPS.renderTip(p, 'preferences');

  // Cook level
  p.appendChild(h('div', {'class': 'section-label'}, 'Niveau cuisine'));
  var cl = h('div', {'class': 'card-grid-4'});
  COOK_LEVELS.forEach(function(c) {
    cl.appendChild(h('div', {'class': 'sel-card' + (S.cookLevel === c.val ? ' on' : ''), onclick: function() { S.cookLevel = c.val; window.render(); }}, [
      h('div', {'class': 'card-name'}, c.name),
      h('div', {'class': 'card-sub'}, c.desc)
    ]));
  });
  p.appendChild(cl);

  // Whey
  p.appendChild(h('div', {'class': 'section-label'}, window.t('onb.s5.whey')));
  var wg = h('div', {'class': 'card-grid-2'});
  [{name: 'Oui', val: true}, {name: 'Non', val: false}].forEach(function(o) {
    wg.appendChild(h('div', {'class': 'sel-card' + (S.whey === o.val ? ' on' : ''), onclick: function() { S.whey = o.val; window.render(); }}, [
      h('div', {'class': 'card-name'}, o.name)
    ]));
  });
  p.appendChild(wg);

  // Whey flavor selector (visible only if S.whey === true)
  if (S.whey === true) {
    var wheyFlavors = [
      {id: 'chocolate',  label: 'Chocolat',         icon: '\uD83C\uDF6B'},
      {id: 'vanilla',    label: 'Vanille',           icon: '\uD83C\uDF66'},
      {id: 'strawberry', label: 'Fraise',            icon: '\uD83C\uDF53'},
      {id: 'peanut',     label: 'Cacahu\u00e8te',   icon: '\uD83E\uDD5C'},
      {id: 'coffee',     label: 'Caf\u00e9',        icon: '\u2615'},
      {id: 'blueberry',  label: 'Myrtille',         icon: '\uD83E\uDED7'},
      {id: 'coconut',    label: 'Noix de Coco',     icon: '\uD83E\uDD65'},
      {id: 'lemon',      label: 'Citron',           icon: '\uD83C\uDF4B'},
      {id: 'banana',     label: 'Banane',           icon: '\uD83C\uDF4C'},
      {id: 'hazelnut',   label: 'Noisette',         icon: '\uD83C\uDF30'},
      {id: 'pistachio',       label: 'Pistache',          icon: '\uD83FAB'},
      {id: 'matcha',          label: 'Matcha',            icon: '\uD83C\uDF75'},
      {id: 'raspberry',       label: 'Framboise',         icon: '\uD83C\uDF53'},
      {id: 'caramel_sale',    label: 'Caramel Sal\u00e9', icon: '\uD83E\uDDC2'},
      {id: 'cookies_cream',   label: 'Cookies & Cream',   icon: '\uD83C\uDF6A'},
      {id: 'tiramisu',        label: 'Tiramisu',          icon: '\uD83C\uDF70'},
      {id: 'orange',          label: 'Orange',            icon: '\uD83C\uDF4A'},
      {id: 'birthday_cake',   label: 'Birthday Cake',     icon: '\uD83C\uDF82'},
      {id: 'cinnamon',        label: 'Cannelle',          icon: '\uD83E\uDEB5'},
      {id: 'cheesecake_citron', label: 'Cheesecake Citron', icon: '\uD83C\uDF4B'},
      {id: 'toffee',          label: 'Toffee Choco',      icon: '\uD83C\uDF6C'},
      {id: 'white_chocolate', label: 'Chocolat Blanc',    icon: '\uD83E\uDD5B'},
      {id: 'pina_colada',     label: 'Pi\u00f1a Colada',  icon: '\uD83C\uDF34'},
      {id: 'vanilla_cinnamon',label: 'Vanille Cannelle',  icon: '\uD83C\uDF00'},
      {id: 'speculoos',       label: 'Sp\u00e9culoos',    icon: '\uD83C\uDF6A'},
      {id: 'cappuccino',      label: 'Cappuccino',        icon: '\u2615'},
      {id: 'gingerbread',     label: "Pain d'\u00c9pices", icon: '\uD83C\uDF2B'},
      {id: 'unflavored',      label: 'Nature/Unflavored',  icon: '\uD83E\uDED9'}
    ];
    var wheyLabel = h('div', {'class': 'section-label', style: 'margin-top:12px'});
    wheyLabel.appendChild(document.createTextNode('Parfums que vous poss\u00e9dez'));
    p.appendChild(wheyLabel);
    p.appendChild(h('div', {style:'font-size:13px;color:var(--fg2,#888);margin-bottom:8px;line-height:1.4'}, 'S\u00e9lectionnez les parfums de whey que vous avez chez vous. Seules les recettes compatibles vous seront propos\u00e9es.'));
    var flavorGrid = h('div', {'class': 'chip-wrap', style: 'gap:8px;margin-top:4px'});
    wheyFlavors.forEach(function(f) {
      var selected = S.wheyFlavors.indexOf(f.id) !== -1;
      var btn = h('span', {
        'class': 'chip' + (selected ? ' on' : ''),
        onclick: (function(fid) {
          return function() {
            var idx = S.wheyFlavors.indexOf(fid);
            if (idx !== -1) { S.wheyFlavors.splice(idx, 1); }
            else { S.wheyFlavors.push(fid); }
            window.render();
          };
        })(f.id)
      }, f.label);
      flavorGrid.appendChild(btn);
    });
    p.appendChild(flavorGrid);
  }

  // Cross-reference whey with supplement selection
  if (S.whey === true && S.supplements.indexOf('whey') !== -1) {
    var wheyTip = h('div', {'class': 'whey-tip', style: 'margin-top:8px;margin-bottom:8px'});
    wheyTip.appendChild(h('strong', {}, 'Whey prot\u00e9ine \u2014 '));
    var wheySupp = null;
    if (SUPPLEMENTS_DB) {
      for (var wi = 0; wi < SUPPLEMENTS_DB.length; wi++) {
        if (SUPPLEMENTS_DB[wi].id === 'whey') { wheySupp = SUPPLEMENTS_DB[wi]; break; }
      }
    }
    if (wheySupp) {
      var wheyDosage = wheySupp.dosageCalc(S);
      wheyTip.appendChild(h('span', {}, 'Dose recommand\u00e9e : ' + wheyDosage.dose + 'g/prise. ' + wheyDosage.timing));
    } else {
      wheyTip.appendChild(h('span', {}, 'S\u00e9lectionn\u00e9 dans vos compl\u00e9ments'));
    }
    p.appendChild(wheyTip);
  }

  // Allergies
  p.appendChild(h('div', {'class': 'section-label'}, window.t('onb.s5.allergies')));
  var allergyWrap = h('div', {'class': 'chip-wrap'});
  ALLERGIES.forEach(function(a) {
    var on = S.allergies.indexOf(a) !== -1;
    allergyWrap.appendChild(h('span', {'class': 'chip' + (on ? ' on' : ''), onclick: function() {
      if (a === 'Aucune') { S.allergies = on ? [] : ['Aucune']; }
      else { S.allergies = S.allergies.filter(function(x) { return x !== 'Aucune'; }); if (on) S.allergies = S.allergies.filter(function(x) { return x !== a; }); else S.allergies.push(a); }
      window.render();
    }}, a));
  });
  p.appendChild(allergyWrap);
  p.appendChild(h('div', {style: 'height:8px'}));

  // Intolerances
  p.appendChild(h('div', {'class': 'section-label'}, window.t('onb.s5.intolerances')));
  var intolWrap = h('div', {'class': 'chip-wrap'});
  INTOLERANCES.forEach(function(t) {
    var on = S.intolerances.indexOf(t) !== -1;
    intolWrap.appendChild(h('span', {'class': 'chip' + (on ? ' on' : ''), onclick: function() {
      if (t === 'Aucune') { S.intolerances = on ? [] : ['Aucune']; }
      else { S.intolerances = S.intolerances.filter(function(x) { return x !== 'Aucune'; }); if (on) S.intolerances = S.intolerances.filter(function(x) { return x !== t; }); else S.intolerances.push(t); }
      window.render();
    }}, t));
  });
  p.appendChild(intolWrap);
  p.appendChild(h('div', {style: 'height:8px'}));

  // Regime
  p.appendChild(h('div', {'class': 'section-label'}, window.t('onb.s5.diet')));
  var rg = h('div', {'class': 'card-grid-4'});
  REGIMES.forEach(function(r, i) {
    rg.appendChild(h('div', {'class': 'sel-card' + (S.regime === i ? ' on' : ''), onclick: function() { S.regime = i; window.render(); }}, [
      h('div', {'class': 'card-name', style: 'font-size:13px'}, r.name)
    ]));
  });
  p.appendChild(rg);

  // Halal option
  var halalRow = h('div', {style: 'display:flex;align-items:center;gap:10px;margin:8px 0;cursor:pointer', onclick: function() { S.halal = !S.halal; window.render(); }});
  var halalBox = h('div', {style: 'width:18px;height:18px;border-radius:2px;border:1px solid var(--black,#0A0A09);display:flex;align-items:center;justify-content:center;background:' + (S.halal ? 'var(--black,#0A0A09)' : 'transparent') + ';flex-shrink:0'}, S.halal ? h('span', {style: 'color:var(--ivory,#FAF9F6);font-size:10px;font-family:"Helvetica Neue",Arial,sans-serif'}, '\u2713') : null);
  halalRow.appendChild(halalBox);
  halalRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--black,#0A0A09)'}, 'Halal \u2014 exclure porc & alcool'));
  p.appendChild(halalRow);

  // Salade builder toggle
  var saladRow = h('div', {style: 'display:flex;align-items:center;gap:10px;margin:8px 0;cursor:pointer', onclick: function() { S.saladBuilder = !S.saladBuilder; window.render(); }});
  var saladBox = h('div', {style: 'width:18px;height:18px;border-radius:2px;border:1px solid var(--black,#0A0A09);display:flex;align-items:center;justify-content:center;background:' + (S.saladBuilder ? 'var(--black,#0A0A09)' : 'transparent') + ';flex-shrink:0'}, S.saladBuilder ? h('span', {style: 'color:var(--ivory,#FAF9F6);font-size:10px;font-family:"Helvetica Neue",Arial,sans-serif'}, '\u2713') : null);
  saladRow.appendChild(saladBox);
  saladRow.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--black,#0A0A09)'}, 'Salades \u00e0 composer'));
  p.appendChild(saladRow);
  if (S.saladBuilder) {
    p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#9A9A90);margin:4px 0 8px 30px;line-height:1.5'}, 'Vous pourrez composer vos salades directement dans votre plan de repas.'));
  }

  // Excluded
  p.appendChild(h('div', {'class': 'section-label'}, 'Aliments exclus'));
  var fi = h('div', {'class': 'field'});
  fi.appendChild(h('input', {type: 'text', placeholder: 'Ex: avocat, bœuf, saumon...', value: S.excluded, oninput: function(e) { S.excluded = e.target.value; if (window.saveProfile) try { window.saveProfile(); } catch(e2) {} }}));
  p.appendChild(fi);

  // Cuisines
  p.appendChild(h('div', {'class': 'section-label'}, 'Cuisines pr\u00e9f\u00e9r\u00e9es'));
  var cg = h('div', {'class': 'check-grid'});
  CUISINES.forEach(function(cu, i) {
    var on = S.cuisines.indexOf(i) !== -1;
    cg.appendChild(h('div', {'class': 'check-item' + (on ? ' on' : ''), onclick: function() {
      if (i === 0) { S.cuisines = on ? [] : [0]; }
      else { S.cuisines = S.cuisines.filter(function(x) { return x !== 0; }); if (on) S.cuisines = S.cuisines.filter(function(x) { return x !== i; }); else S.cuisines.push(i); }
      window.render();
    }}, [
      h('div', {'class': 'check-box'}, '\u2713'),
      h('div', {}, [h('div', {'class': 'check-label'}, cu.f + ' ' + cu.name)])
    ]));
  });
  p.appendChild(cg);

  // Shopping habits
  var shopDvd = h('div', {'class': 'divider', style: 'margin:28px 0 18px'});
  shopDvd.appendChild(h('div', {'class': 'divider-line'}));
  shopDvd.appendChild(h('div', {'class': 'divider-text'}, 'Habitudes de courses'));
  shopDvd.appendChild(h('div', {'class': 'divider-line'}));
  p.appendChild(shopDvd);

  // Frequency
  p.appendChild(h('div', {'class': 'section-label'}, 'Fr\u00e9quence de courses'));
  var sfg = h('div', {'class': 'card-grid-2'});
  (SHOPPING[0]?SHOPPING[0].items:[]).forEach(function(it) {
    sfg.appendChild(h('div', {'class': 'sel-card' + (S.shopFreq === it.id ? ' on' : ''), onclick: function() { S.shopFreq = it.id; window.render(); }}, [
      h('div', {'class': 'card-name', style: 'font-size:13px'}, it.name),
      h('div', {'class': 'card-sub'}, it.desc)
    ]));
  });
  p.appendChild(sfg);

  // Stores
  p.appendChild(h('div', {'class': 'section-label'}, 'O\u00f9 faites-vous vos courses ?'));
  var sg = h('div', {'class': 'chip-wrap'});
  (SHOPPING[1]?SHOPPING[1].items:[]).forEach(function(it) {
    var on = S.shopStores.indexOf(it.id) !== -1;
    sg.appendChild(h('span', {'class': 'chip' + (on ? ' on' : ''), onclick: function() {
      if (on) S.shopStores = S.shopStores.filter(function(x) { return x !== it.id; });
      else S.shopStores.push(it.id);
      window.render();
    }}, it.name));
  });
  p.appendChild(sg);
  p.appendChild(h('div', {style: 'height:8px'}));

  // Budget
  p.appendChild(h('div', {'class': 'section-label'}, 'Budget alimentaire'));
  var bg = h('div', {'class': 'card-grid-3'});
  (SHOPPING[2]?SHOPPING[2].items:[]).forEach(function(it) {
    bg.appendChild(h('div', {'class': 'sel-card' + (S.shopBudget === it.id ? ' on' : ''), onclick: function() { S.shopBudget = it.id; window.render(); }}, [
      h('div', {'class': 'card-name', style: 'font-size:13px'}, it.name),
      h('div', {'class': 'card-sub'}, it.desc)
    ]));
  });
  p.appendChild(bg);

  // Preferences
  p.appendChild(h('div', {'class': 'section-label'}, 'Pr\u00e9f\u00e9rences produits'));
  var pg = h('div', {'class': 'chip-wrap'});
  (SHOPPING[3]?SHOPPING[3].items:[]).forEach(function(it) {
    var on = S.shopPrefs.indexOf(it.id) !== -1;
    pg.appendChild(h('span', {'class': 'chip' + (on ? ' on' : ''), onclick: function() {
      if (on) S.shopPrefs = S.shopPrefs.filter(function(x) { return x !== it.id; });
      else S.shopPrefs.push(it.id);
      window.render();
    }}, it.name));
  });
  p.appendChild(pg);

  p.appendChild(h('div', {style: 'height:24px'}));
  var ok = S.whey !== null && S.whey !== undefined;
  var _genBtn = h('button', {'class': 'btn-primary', disabled: !ok, onclick: function() {
    if (!ok) return;
    // Feedback visuel immédiat — désactiver le bouton et afficher "Génération..."
    _genBtn.disabled = true;
    _genBtn.textContent = 'Génération en cours...';
    // Laisser le navigateur repeindre avant d'appeler generateWeek() (synchrone)
    if (window._nutritionGenerating) return;
    window._nutritionGenerating = true;
    setTimeout(function() {
      try {
        // Synchroniser _nm avant generateWeek() pour que les recettes R-format soient correctement scalées
        if (window.computeNutritionState) { window.computeNutritionState(false); }
        var _wk1 = generateWeek();
        if (Array.isArray(_wk1) && _wk1.length > 0) {
          S.weekPlan = _wk1;
          // Figer le hash au moment de la génération — évite la régénération silencieuse dans renderStep9
          var _h1 = window.getPlanHash ? window.getPlanHash() : '';
          if (_h1) S._planHash = _h1;
        } else {
          // generateWeek() a retourné un plan vide — informer l'utilisateur sans naviguer
          console.warn('[nutrition] generateWeek() returned empty plan');
          _genBtn.disabled = false;
          _genBtn.textContent = window.t('onb.finish');
          var _errDiv = document.getElementById('_gen_error');
          if (!_errDiv) {
            _errDiv = document.createElement('div');
            _errDiv.id = '_gen_error';
            _errDiv.style.cssText = 'color:#8B2020;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;margin-top:8px;text-align:center';
            _genBtn.parentNode && _genBtn.parentNode.insertBefore(_errDiv, _genBtn.nextSibling);
          }
          _errDiv.textContent = 'Impossible de générer le plan. Vérifiez vos préférences et réessayez.';
          window._nutritionGenerating = false;
          return;
        }
        S._weekPlanGeneratedAt = new Date().toISOString();
        if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
        // Sync plan nutrition vers Supabase (try/catch : une erreur réseau ne bloque pas la navigation)
        if (window.SupaSync && S.weekPlan) {
          try {
            var _monday = new Date();
            _monday.setDate(_monday.getDate() - _monday.getDay() + 1);
            SupaSync.saveMealPlan(_monday.toISOString().slice(0, 10), S.weekPlan);
          } catch(e) { console.warn('[nutrition] saveMealPlan error (non-bloquant):', e); }
        }
        bb('nutrition_preferences', {cookLevel: S.cookLevel, whey: S.whey, regime: S.regime});
        if (window.GAMIFICATION && window.GAMIFICATION.unlockBadge) window.GAMIFICATION.unlockBadge('first_plan');
        goStep(11);
      } catch(e) {
        console.error('[nutrition] generateWeek exception:', e);
        _genBtn.disabled = false;
        _genBtn.textContent = window.t('onb.finish');
      } finally {
        window._nutritionGenerating = false;
      }
    }, 50);
  }}, window.t('onb.finish'));
  p.appendChild(_genBtn);
  p.appendChild(h('button', {'class': 'btn-back', 'aria-label': 'Retour', onclick: function() { window._s5page = 0; goStep(9); }, html: backArrowHtml() + window.t('onb.back')}));
}

// ─── STEP 11 (RÉSULTATS / MACROS) ───
function renderStep8(p) {
  // CRITIQUE-3: garde S.goal null — ne peut pas calculer les macros sans objectif
  if (S.goal === null || S.goal === undefined) { goStep(4); return; }
  // CRITIQUE-4: garde sex/weight/height manquants — évite 1500 kcal fantôme
  if (!S.sex || !S.weight || !S.height) { goStep(1); return; }
  // CRITIQUE-5: garde S.activity null — calcTDEE retourne 0 sans niveau d'activité
  if (S.activity === null || S.activity === undefined) { goStep(5); return; }
  var tdee = Math.round(calcTDEE()), tgt = calcTarget(), m = calcMacros(), bmi = calcBMI();
    // Synchronise NutritionMaster (source de vérité pour RecipeEngine + Sport)
    if (window.computeNutritionState) { window.computeNutritionState(false); }
  var _hydInfo = window.calcHydration ? window.calcHydration() : null; // ÉLEVÉ-3: hydration fine
  var water = _hydInfo ? _hydInfo.liters.toFixed(1) : (S.weight * 0.033).toFixed(1);
  var ppk = (S.weight > 0 ? (m.p / S.weight) : 0).toFixed(1);
  // Enregistrer les macros journalières dans l'historique (une entrée par jour)
  if (window.PERF_HISTORY && m && tgt > 0) {
    try { PERF_HISTORY.recordNutrition(tgt, m.p, m.g, m.l); } catch(e) {}
  }

  // Header
  renderProgressBar(p, 11, 12);
  var rh = h('div', {'class': 'result-header'});
  rh.appendChild(h('div', {'class': 'result-eyebrow'}, 'R\u00e9sultats personnalis\u00e9s'));
  var _uName = (window.AUTH && AUTH.getUser()) ? AUTH.getUser().name : '';
  // XSS fix: build title via DOM instead of innerHTML with user data
  (function() {
    var titleDiv = document.createElement('div');
    titleDiv.className = 'result-title';
    if (_uName) {
      titleDiv.appendChild(document.createTextNode(_uName + ','));
      titleDiv.appendChild(document.createElement('br'));
    }
    titleDiv.appendChild(document.createTextNode('Vos '));
    var em = document.createElement('em');
    em.textContent = 'macros';
    titleDiv.appendChild(em);
    rh.appendChild(titleDiv);
  })();
  rh.appendChild(h('div', {'class': 'result-rule'}));
  var _ageDisplay = (typeof getAge === 'function' ? getAge() : (S.age || '?'));
  var _profItems = [S.sex==='homme'?'Homme':'Femme', _ageDisplay+' ans', (window.UNITS ? window.UNITS.displayWeight(S.weight) : S.weight+'kg'), (window.UNITS ? window.UNITS.displayHeight(S.height) : (S.height/100).toFixed(2)+'m')];
  if(S.activity!==null&&S.activity!==undefined&&ACTIVITIES[S.activity])_profItems.push(ACTIVITIES[S.activity].name);
  if(S.goal!==null&&S.goal!==undefined&&GOALS[S.goal])_profItems.push(GOALS[S.goal].name);
  rh.appendChild(h('div', {style:'text-align:center;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);letter-spacing:1px;margin:8px 0'}, _profItems.join(' \u00B7 ')));
  // g/kg ratios intentionally hidden — grammes totaux affichés dans les rings (plus clair pour les non-experts)
  p.appendChild(rh);
  // ─── KATCH-MCARDLE BADGE: affiché si composition corporelle estimée via body scan ───
  if (S._bodyFatEstimate !== null && S._bodyFatEstimate !== undefined && S._bodyFatEstimate >= 4) {
    var _lbmVal = Math.round(S.weight * (1 - S._bodyFatEstimate / 100));
    var _kmBadge = h('div', {style: 'display:flex;align-items:center;gap:8px;padding:8px 14px;border:1px solid var(--green,#1A4A1A);background:var(--greenbg,rgba(26,74,26,.06));margin-bottom:12px;border-radius:2px'});
    _kmBadge.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--green,#1A4A1A);white-space:nowrap'}, 'Katch-McArdle'));
    var _kmText = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);line-height:1.4'});
    _kmText.textContent = 'Calcul affin\u00e9 par composition corporelle \u2014 ' + S._bodyFatEstimate + '% MG \u00b7 ' + _lbmVal + '\u00a0kg de masse maigre';
    _kmBadge.appendChild(_kmText);
    p.appendChild(_kmBadge);
  }
  if (window.TIPS) {
    TIPS.renderTip(p, 'results');
    if (S.pregnant && S.sex === 'femme') TIPS.renderTip(p, 'pregnancy');
    if (S.sex === 'femme' && S.cycleTracking) TIPS.renderTip(p, 'cycle');
  }

  // ─── ALERTES MÉDICALES ET SÉCURITÉ ───
  // Conflits médicaux (grossesse+DG+vegan, TCA+cut, IRC+muscle, cardiopathie+intensité)
  if (window.detectMedicalConflicts) {
    var conflicts = window.detectMedicalConflicts() || [];
    conflicts.forEach(function(c) {
      var bg = c.level === 'CRITIQUE' ? 'var(--redbg,rgba(90,16,16,.06))' : c.level === 'ÉLEVÉ' ? 'var(--orangebg,rgba(106,74,26,.06))' : 'var(--greenbg,rgba(26,74,26,.06))';
      var border = c.level === 'CRITIQUE' ? 'var(--red,#5A1010)' : c.level === 'ÉLEVÉ' ? 'var(--orange,#6A4A1A)' : 'var(--green,#1A4A1A)';
      p.appendChild(h('div', {style: 'background:' + bg + ';border:1px solid ' + border + ';padding:10px 14px;margin-bottom:10px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);line-height:1.5'}, c.message));
    });
  }

  // Big numbers
  var sr = h('div', {style: 'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px'});
  var c1 = h('div', {'class': 'big-number', style: 'margin-bottom:0'});
  c1.appendChild(h('div', {'class': 'bn-val'}, String(tdee)));
  c1.appendChild(h('div', {'class': 'bn-label'}, window.t('onb.s8.tdee')));
  c1.appendChild(h('div', {style: 'font-size:11px;color:var(--grey);font-style:italic;margin-top:2px'}, 'Calories d\u00e9pens\u00e9es en une journ\u00e9e normale'));
  sr.appendChild(c1);
  var c2 = h('div', {'class': 'big-number', style: 'margin-bottom:0'});
  c2.appendChild(h('div', {'class': 'bn-val'}, String(tgt)));
  c2.appendChild(h('div', {'class': 'bn-label'}, (S.goal!==null&&GOALS[S.goal])?GOALS[S.goal].name:''));
  sr.appendChild(c2);
  p.appendChild(sr);

    // Bandeau validation NutritionMaster (XSS-safe DOM construction)
    if (window.S._nm && window.S._nm.errors && window.S._nm.errors.length === 0) {
      var nmDiv = document.createElement('div');
      nmDiv.style.cssText = 'margin:8px 0;padding:8px 12px;background:var(--greenbg,rgba(26,74,26,.06));border-left:3px solid var(--green,#1A4A1A);font-size:13px;color:var(--text-secondary,#6B6B65)';
      nmDiv.textContent = '\u2713 Calculs valid\u00e9s par NutritionMaster \u2014 P\u00d74 + G\u00d74 + L\u00d79 = ' + (window.S._nm.caloriesCheck !== undefined ? Number(window.S._nm.caloriesCheck) : '?') + ' kcal';
      p.appendChild(nmDiv);
    }

  // ─── COHÉRENCE SPORT × NUTRITION — séances réalisées 7 derniers jours ───
  // Permet de vérifier que le facteur d'activité sélectionné est cohérent avec la réalité
  if (S.sessionHistory && Object.keys(S.sessionHistory).length > 0) {
    var nowN = Date.now(), weekAgoN = nowN - 7 * 24 * 60 * 60 * 1000;
    var weekSess = [];
    Object.keys(S.sessionHistory).forEach(function(k) {
      var se = S.sessionHistory[k];
      if (se && se.date && new Date(se.date).getTime() >= weekAgoN) weekSess.push(se);
    });
    if (weekSess.length > 0) {
      var totalWkKcal = weekSess.reduce(function(acc, se) { return acc + (se.kcalTotal || 0); }, 0);
      var avgPerSess = Math.round(totalWkKcal / weekSess.length);
      // Cohérence : comparer la dépense séances vs la part "entraînement" dans le TDEE
      // Part entraînement TDEE ≈ (effectiveFactor - 1.2) × BMR (sédentaire = base)
      var bmrVal = typeof calcBMR === 'function' ? calcBMR() : 0;
      var tdeeTrainPart = bmrVal > 0 ? Math.round((tdee / bmrVal - 1.2) * bmrVal * 7) : 0;
      var coherenceOk = tdeeTrainPart > 0 && Math.abs(totalWkKcal - tdeeTrainPart) / tdeeTrainPart < 0.35;
      var cohColor = coherenceOk ? '#1A4A1A' : '#6A4A1A';
      var cohBg = coherenceOk ? 'var(--greenbg,rgba(26,74,26,.06))' : 'var(--orangebg,rgba(106,74,26,.06))';
      var cohBorder = coherenceOk ? 'var(--green,#1A4A1A)' : 'var(--orange,#6A4A1A)';
      var sessBox = h('div', {style: 'background:' + cohBg + ';border:1px solid ' + cohBorder + ';padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px'});
      var sessTitle = h('div', {style: 'display:flex;justify-content:space-between;margin-bottom:4px'});
      sessTitle.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:' + cohBorder}, 'S\u00e9ances musculation — 7 jours'));
      sessTitle.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;color:' + cohBorder}, totalWkKcal + '\u00a0kcal'));
      sessBox.appendChild(sessTitle);
      sessBox.appendChild(h('div', {style: 'color:var(--grey)'}, weekSess.length + '\u00a0s\u00e9ance' + (weekSess.length > 1 ? 's' : '') + ' valid\u00e9e' + (weekSess.length > 1 ? 's' : '') + ' \u2014 moy. ' + avgPerSess + '\u00a0kcal/s\u00e9ance'));
      sessBox.appendChild(h('div', {style: 'color:var(--grey);margin-top:4px;font-style:italic;font-size:9px'}, coherenceOk ? '\u2713 Coh\u00e9rent avec votre facteur d\'activit\u00e9 TDEE' : '\u26a0 D\u00e9calage vs facteur d\'activit\u00e9 s\u00e9lectionn\u00e9 \u2014 pensez \u00e0 mettre \u00e0 jour votre niveau d\'activit\u00e9 dans votre profil'));
      p.appendChild(sessBox);
    }
  }

  // SVG Rings
  var tot = m.g + m.p + m.l;
  var rr = h('div', {'class': 'rings-row'});
  rr.appendChild(svgRing(90, 5, tot > 0 ? m.g / tot * 100 : 0, 'var(--blue,#1A3A6A)', window.t('onb.s8.carbs'), m.g));
  rr.appendChild(svgRing(90, 5, tot > 0 ? m.p / tot * 100 : 0, 'var(--green,#1A4A1A)', window.t('onb.s8.proteins'), m.p));
  rr.appendChild(svgRing(90, 5, tot > 0 ? m.l / tot * 100 : 0, 'var(--orange,#6A4A1A)', window.t('onb.s8.fats'), m.l));
  p.appendChild(rr);
  p.appendChild(h('div', {style: 'font-size:11px;color:var(--grey);font-style:italic;margin-top:2px;text-align:center'}, 'Glucides \u00b7 Prot\u00e9ines \u00b7 Lipides \u2014 les 3 piliers de votre alimentation'));

  // g/kg ratio for power users — shown in small grey below the gram total
  var _protRatio = (S.weight && S._nm) ? (((S._nm.proteinGrams || S._nm.p || 0)) / S.weight).toFixed(1) : null;
  if (_protRatio) {
    p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);text-align:center;margin-top:2px'}, _protRatio + ' g/kg · méthode ISSN 2017'));
  }

  p.appendChild(h('div', {'class': 'section-label'}, 'R\u00e9partition par repas (' + (S.mealsPerDay||3) + ' repas/j)'));
  var ms = h('div', {'class': 'meal-split'});
  var _globalSplit = window.getMealSplit ? window.getMealSplit() : null;
  var _splitList = _globalSplit ? [
    {n: window.t('onb.s9.breakfast'), pct: Math.round((_globalSplit.pctBreak||0.25)*100)},
    {n: window.t('onb.s9.lunch'), pct: Math.round((_globalSplit.pctLunch||0.40)*100)},
    {n: window.t('onb.s9.snack'), pct: Math.round((_globalSplit.pctSnack||0.05)*100)},
    {n: window.t('onb.s9.dinner'), pct: Math.round((_globalSplit.pctDinner||0.30)*100)}
  ].filter(function(m){return m.pct>0;}) : [{n:window.t('onb.s9.breakfast'),pct:25},{n:window.t('onb.s9.lunch'),pct:40},{n:window.t('onb.s9.snack'),pct:5},{n:window.t('onb.s9.dinner'),pct:30}];
  _splitList.forEach(function(meal) {
    var kcal = Math.round(tgt * meal.pct / 100);
    var bar = h('div', {'class': 'meal-bar'});
    bar.appendChild(h('div', {'class': 'bar-name'}, meal.n));
    var track = h('div', {'class': 'bar-track'});
    var fill = h('div', {'class': 'bar-fill', style: 'width:0%'});
    track.appendChild(fill);
    bar.appendChild(track);
    bar.appendChild(h('div', {'class': 'bar-val'}, meal.pct + '% \u00b7 ' + kcal + ' kcal'));
    ms.appendChild(bar);
    setTimeout(function() { fill.style.width = (meal.pct * 2) + '%'; }, 50);
  });
  p.appendChild(ms);

  // Stats
  var stats = h('div', {'class': 'stats-row'});
  stats.appendChild(h('div', {'class': 'stat-cell'}, [h('div', {'class': 'stat-val'}, water), h('div', {'class': 'stat-label'}, 'L eau/jour')]));
  stats.appendChild(h('div', {'class': 'stat-cell'}, [h('div', {'class': 'stat-val'}, String(m.p)), h('div', {'class': 'stat-label'}, 'g prot\u00e9ines/j')]));
  if (bmi !== null) {
    var bi = bmiInfo(bmi);
    var imcClass = bmi < 18.5 ? 'stat-warn' : bmi < 25 ? 'stat-good' : bmi < 30 ? 'stat-warn' : 'stat-alert';
    stats.appendChild(h('div', {'class': 'stat-cell ' + imcClass}, [h('div', {'class': 'stat-val', style: 'color:' + bi.color}, bmi.toFixed(1)), h('div', {'class': 'stat-label'}, window.t('onb.s2.bmi'))]));
  }
  p.appendChild(stats);

  // Protein food equivalents hint — concrete daily anchors
  if (m.p > 0) {
    // 1 escalope de poulet grillé (160g) ≈ 50g protein
    // 1 boîte de thon en conserve (185g net) ≈ 44g protein
    var _chickenN = Math.ceil(m.p / 50);
    var _tunaN = Math.ceil(m.p / 44);
    var _eqParts = [];
    if (_chickenN > 0) _eqParts.push(_chickenN + ' escalope' + (_chickenN > 1 ? 's' : '') + ' de poulet');
    if (_tunaN > 0) _eqParts.push(_tunaN + ' bo\u00eete' + (_tunaN > 1 ? 's' : '') + ' de thon');
    if (_eqParts.length > 0) {
      p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;margin:-4px 0 16px;text-align:center;'},
        '\u2248 ' + _eqParts.join(' \u00b7 ')));
    }
  }

  // ─── OBÉSITÉ : avertissement auto si IMC >= 30 et 'obesity' absent de S.medical ───
  // HAS 2022 : IMC >= 30 = obésité grade 1+ → prise en charge spécifique recommandée
  // Afficher un conseil d'activation du profil médical 'obesity' pour optimiser les macros
  if (bmi !== null && bmi >= 30 && (!S.medical || S.medical.indexOf('obesity') === -1)) {
    var obesityTip = h('div', {style: 'border-left:3px solid #7A3010;background:rgba(122,48,16,0.06);padding:12px 16px;margin:12px 0'});
    obesityTip.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#7A3010;margin-bottom:6px'}, '\u26A0 IMC ' + bmi.toFixed(1) + ' \u2014 Ob\u00e9sit\u00e9 grade 1 (HAS 2022)'));
    obesityTip.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--fg2,#555);margin-bottom:4px'}, 'Votre calcul est ajust\u00e9 avec le poids id\u00e9al corrig\u00e9 (ASPEN 2016) pour \u00e9viter une surestimation des besoins prot\u00e9iques. D\u00e9ficit plafonn\u00e9 \u00e0 \u2212500\u00a0kcal/j pour pr\u00e9server la masse maigre (Helms 2014).'));
    obesityTip.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#7A3010;margin-top:4px'}, 'Conseil\u00a0: activez la condition \u00ab\u00a0Ob\u00e9sit\u00e9 (IMC\u00a0>\u00a030)\u00a0\u00bb dans vos conditions m\u00e9dicales (Contr\u00f4les sant\u00e9) pour des recommandations nutritionnelles sp\u00e9cifiques.'));
    p.appendChild(obesityTip);
  }

  // Medical warnings
  if (!Array.isArray(S.medical)) S.medical = [];
  if (S.medical.length > 0) {
    var mw = h('div', {style: 'border-left:2px solid var(--orange);padding:12px 16px;background:var(--orangebg);margin:16px 0'});
    mw.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--orange);margin-bottom:8px'}, 'Recommandations m\u00e9dicales'));
    S.medical.forEach(function(id) {
      var adv = MEDICAL_ADVICE[id];
      if (adv) mw.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:4px;padding-left:8px;border-left:1px solid var(--border)'}, adv.warn));
    });
    p.appendChild(mw);
  }

  // ─── GROSSESSE — Résultats ───
  if (S.pregnant && S.sex === 'femme') {
    var triRes = window.getPregnancyTrimester ? window.getPregnancyTrimester() : null;
    if (triRes) {
      var triResColors = {trimester1: '#E8A87C', trimester2: '#C38D6B', trimester3: '#D4A5A5'};
      var triResColor = triResColors[triRes.trimester.id] || '#E8A87C';

      // Main pregnancy card
      var pregResCard = h('div', {style: 'border-left:3px solid ' + triResColor + ';padding:16px;background:var(--ivory2);margin:16px 0'});
      pregResCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;margin-bottom:4px'}, triRes.trimester.icon + ' Grossesse \u2014 ' + triRes.trimester.name + ' (Semaine ' + triRes.week + '/40)'));

      // Progress bar
      var pregProgW = h('div', {style: 'height:8px;background:var(--border);border-radius:2px;overflow:hidden;margin:8px 0;display:flex'});
      pregProgW.appendChild(h('div', {style: 'width:' + (13/40*100) + '%;background:#E8A87C;opacity:' + (triRes.trimesterNumber === 1 ? '1' : '0.3')}));
      pregProgW.appendChild(h('div', {style: 'width:' + (14/40*100) + '%;background:#C38D6B;opacity:' + (triRes.trimesterNumber === 2 ? '1' : '0.3')}));
      pregProgW.appendChild(h('div', {style: 'width:' + ((100-13/40*100-14/40*100)) + '%;background:#D4A5A5;opacity:' + (triRes.trimesterNumber === 3 ? '1' : '0.3')}));
      pregResCard.appendChild(pregProgW);

      // Calorie info
      var tdeeRes = Math.round(calcTDEE());
      var extraRes = triRes.trimester.calorieExtra;
      pregResCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey);margin:8px 0'}, 'TDEE ' + tdeeRes + ' kcal + ' + extraRes + ' kcal grossesse = ' + (tdeeRes + extraRes) + ' kcal/jour'));

      // Nutrition tips
      var pregNutList = h('div', {style: 'border-left:2px solid #1A4A1A;padding:8px 12px;margin:10px 0'});
      pregNutList.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#1A4A1A;margin-bottom:6px'}, 'Recommandations nutritionnelles'));
      (triRes.trimester.nutritionTips || []).forEach(function(tip) {
        pregNutList.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:3px;padding-left:8px'}, '\u2022 ' + tip));
      });
      pregResCard.appendChild(pregNutList);

      // Essential supplements for pregnancy
      var pregSuppList = h('div', {style: 'border-left:2px solid #E8A87C;padding:8px 12px;margin:10px 0'});
      pregSuppList.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#E8A87C;margin-bottom:6px'}, 'Suppl\u00e9ments essentiels grossesse'));
      var pregSupps = [
        'Acide folique : 400-800 \u00b5g/jour',
        'Fer : 27 mg/jour',
        'Calcium : 1000 mg/jour',
        'Vitamine D : 600-1000 UI/jour',
        'DHA : 200-300 mg/jour',
        'Iode : 220 \u00b5g/jour'
      ];
      pregSupps.forEach(function(s) {
        pregSuppList.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:3px;padding-left:8px'}, '\u25C6 ' + s));
      });
      pregResCard.appendChild(pregSuppList);

      p.appendChild(pregResCard);

      // Pregnancy weight tracking
      p.appendChild(h('div', {'class': 'section-label'}, 'Suivi de poids grossesse'));
      var pregWg = window.getPregnancyWeightGuideline ? window.getPregnancyWeightGuideline() : null;
      if (pregWg) {
        var pregWeightCanvas = h('canvas', {width: '600', height: '220', style: 'width:100%;height:220px'});
        var pregChartWrap = h('div', {'class': 'chart-container'});
        pregChartWrap.appendChild(h('div', {'class': 'chart-title'}, 'Courbe de poids \u2014 Grossesse'));
        pregChartWrap.appendChild(pregWeightCanvas);
        p.appendChild(pregChartWrap);

        setTimeout(function() {
          if (typeof Chart === 'undefined' || !pregWeightCanvas.getContext) return;
          var pregBaseW = parseFloat(S.prePregnancyWeight || S.weight);
          if (isNaN(pregBaseW) || pregBaseW <= 0) return;
          var pregLabels = [];
          var pregMinD = [];
          var pregMaxD = [];
          for (var pw = 0; pw <= 40; pw++) {
            pregLabels.push(pw % 4 === 0 ? 'S' + pw : '');
            var pt1g = Math.min(pw, 13) / 13 * 2.0;
            var pt2t3w = Math.max(0, pw - 13);
            pregMinD.push(Math.round((pregBaseW + pt1g + pt2t3w * pregWg.weeklyGainRange[0]) * 10) / 10);
            pregMaxD.push(Math.round((pregBaseW + pt1g + pt2t3w * pregWg.weeklyGainRange[1]) * 10) / 10);
          }
          var pregDatasets = [
            { label: 'Min recommand\u00e9', data: pregMinD, borderColor: '#1A4A1A', borderWidth: 1, pointRadius: 0, fill: false },
            { label: 'Max recommand\u00e9', data: pregMaxD, borderColor: '#1A4A1A', borderWidth: 1, pointRadius: 0, fill: '-1', backgroundColor: 'rgba(39,174,96,0.12)' }
          ];
          // Plot weight history points
          if (S.weightHistory && S.weightHistory.length > 0) {
            var histPts = new Array(41).fill(null);
            S.weightHistory.forEach(function(entry) {
              // Estimate week from dates if dueDate available
              var cWeek = S.pregnancyWeek || 0;
              histPts[Math.min(cWeek, 40)] = entry.weight;
            });
            pregDatasets.push({ label: 'Poids mesur\u00e9', data: histPts, borderColor: '#E8A87C', pointRadius: 5, pointBackgroundColor: '#E8A87C', showLine: false });
          } else if (S.weight) {
            var ptData = new Array(41).fill(null);
            var cw2 = S.pregnancyWeek || 0;
            if (cw2 >= 0 && cw2 <= 40) ptData[cw2] = S.weight;
            pregDatasets.push({ label: 'Poids actuel', data: ptData, borderColor: '#E8A87C', pointRadius: 6, pointBackgroundColor: '#E8A87C', showLine: false });
          }
          try { window.createChart(pregWeightCanvas, {
            type: 'line', data: { labels: pregLabels, datasets: pregDatasets },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { font: { family: 'Helvetica Neue', size: 9 } } } }, scales: { x: { grid: { color: '#E5E4DE' }, ticks: { font: { family: 'Helvetica Neue', size: 9 }, color: '#9A9A90', maxTicksLimit: 12 } }, y: { grid: { color: '#E5E4DE' }, ticks: { font: { family: 'Georgia', size: 11 }, color: '#0A0A09' } } } }
          }); } catch(e){}
        }, 150);

        // Weight outside range warning
        if (S.weight && S.prePregnancyWeight && pregWg) {
          var aGain = S.weight - S.prePregnancyWeight;
          if (aGain < pregWg.currentExpectedGainMin || aGain > pregWg.currentExpectedGainMax) {
            var aboveBelow = aGain > pregWg.currentExpectedGainMax ? 'au-dessus' : 'en dessous';
            var pregWeightWarn = h('div', {style: 'border-left:3px solid #6A4A1A;padding:12px 16px;background:var(--orangebg);margin:12px 0'});
            pregWeightWarn.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#6A4A1A'}, '\u26A0 Votre poids est ' + aboveBelow + ' de la fourchette recommand\u00e9e. Consultez votre m\u00e9decin.'));
            p.appendChild(pregWeightWarn);
          }
        }
      }

      // Medical disclaimer
      var pregDisclaimer = h('div', {style: 'border-left:3px solid #5A1010;padding:12px 16px;background:rgba(192,57,43,0.06);margin:12px 0'});
      pregDisclaimer.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#5A1010'}, '\u26A0 Ce suivi ne remplace pas votre suivi m\u00e9dical. Consultez votre sage-femme ou gyn\u00e9cologue.'));
      p.appendChild(pregDisclaimer);
    }
  }

  // Cycle menstruel — Phase actuelle
  if (S.sex === 'femme' && S.cycleTracking) {
    var cycleInfo = window.getCurrentCyclePhase ? window.getCurrentCyclePhase() : null;
    if (cycleInfo) {
      var phaseColors = {menstruation: '#5A1010', follicular: '#6A4A1A', ovulation: '#1A4A1A', luteal: '#6A4A1A'};
      var phaseColor = phaseColors[cycleInfo.phase.id] || '#6A4A1A';
  
      p.appendChild(h('div', {'class': 'section-label'}, 'Cycle menstruel \u2014 Phase actuelle'));
      var cycCard = h('div', {style: 'border-left:3px solid ' + phaseColor + ';padding:16px;background:var(--ivory2);margin-bottom:16px'});
  
      cycCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;margin-bottom:4px'}, cycleInfo.phase.icon + ' ' + cycleInfo.phase.name));
      cycCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey);margin-bottom:8px'}, 'Jour ' + cycleInfo.dayInCycle + '/' + S.cycleLength + ' du cycle'));
      cycCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;margin-bottom:12px'}, cycleInfo.phase.desc));
  
      // Nutrition tips
      var tipsList = h('div', {style: 'border-left:2px solid #1A4A1A;padding:8px 12px;margin-bottom:10px'});
      tipsList.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#1A4A1A;margin-bottom:6px'}, 'Conseils nutrition'));
      (cycleInfo.phase.nutritionTips || []).forEach(function(tip) {
        tipsList.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:3px;padding-left:8px'}, '\u2022 ' + tip));
      });
      cycCard.appendChild(tipsList);
  
      // Calorie adjustment note
      if (cycleInfo.phase.calorieAdjust !== 0) {
        var adjPct = Math.round(cycleInfo.phase.calorieAdjust * 100);
        var baseCal = Math.round(calcTDEE() * ((S.goal !== null && GOALS[S.goal]) ? GOALS[S.goal].mult : 1));
        var adjCal = tgt;
        var adjNote = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:' + phaseColor + ';margin-top:8px;padding:6px 10px;background:rgba(0,0,0,0.03);border-radius:2px'});
        adjNote.textContent = 'Calories adapt\u00e9es : ' + baseCal + ' kcal (base) + ' + adjPct + '% = ' + adjCal + ' kcal';
        cycCard.appendChild(adjNote);
      }
  
      p.appendChild(cycCard);
    }
  }

  // Weight tracking (text only, no chart)

  // Weight input
  var weightInputWrap = h('div', {style: 'display:flex;gap:8px;align-items:center;margin:12px 0'});
  var weightIn = h('input', {'class': 'num-input', type: 'number', min: '40', max: '160', step: '0.1', placeholder: String(S.weight), style: 'font-size:18px;padding:10px;flex:1', inputmode: 'decimal'});
  weightInputWrap.appendChild(weightIn);
  weightInputWrap.appendChild(h('span', {'class': 'num-unit'}, 'kg'));
  weightInputWrap.appendChild(h('button', {'class': 'btn-primary', style: 'width:auto;padding:10px 20px;margin-top:0', onclick: function() {
    var v = parseFloat(weightIn.value);
    if (isNaN(v) || v < 30 || v > 200) return;
    if (!Array.isArray(S.weightHistory)) S.weightHistory = [];
    var today = new Date().toISOString().split('T')[0];
    S.weightHistory.push({date: today, weight: v});
    // Cap to 52 entries (1 year of weekly weigh-ins) to limit localStorage size
    if (S.weightHistory && S.weightHistory.length > 52) S.weightHistory = S.weightHistory.slice(-52);
    S.weight = v;
    // Persist to localStorage
    try {
      var uid = (window.AUTH && window.AUTH.getUser()) ? window.AUTH.getUser().id : 'anon';
      localStorage.setItem('mtd_weight_history_' + uid, JSON.stringify(S.weightHistory));
    } catch(e) {}
    // Sync poids vers Supabase
    if (window.SupaSync) { try { SupaSync.saveWeight(today, v); } catch(e) { console.warn('[nutrition] saveWeight error:', e); } }
    bb('weight_logged', {weight: v});
    if (window.GAMIFICATION && window.GAMIFICATION.unlockBadge) {
      window.GAMIFICATION.unlockBadge('first_weigh');
      if (S.weightHistory.length >= 10) window.GAMIFICATION.unlockBadge('weight_10');
      if (S.targetWeight && v <= S.targetWeight && GOALS[S.goal] && (GOALS[S.goal].key === 'cut' || GOALS[S.goal].key === 'shred')) window.GAMIFICATION.unlockBadge('weight_goal');
      if (S.weightHistory.length >= 2 && S.weightHistory[0]) {
        var first = S.weightHistory[0].weight;
        if (first != null && first - v >= 1) window.GAMIFICATION.unlockBadge('first_kg_lost');
        if (first != null && first - v >= 5) window.GAMIFICATION.unlockBadge('five_kg');
      }
    }
    if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
    window.render();
  }}, 'Enregistrer'));
  p.appendChild(weightInputWrap);

  // Alcohol impact
  if (S.alcoholFreq && S.alcoholFreq !== 'never') {
    var totalAlcKcal = 0;
    if (alcoholWeeklyKcal) {
      totalAlcKcal = alcoholWeeklyKcal();
    } else if (S.alcoholTypes && ALCOHOL_DB) {
      S.alcoholTypes.forEach(function(at) {
        for (var i = 0; i < ALCOHOL_DB.length; i++) {
          if (ALCOHOL_DB[i].name === at.type) {
            totalAlcKcal += ALCOHOL_DB[i].kcal * at.freq;
            break;
          }
        }
      });
    }
    if (totalAlcKcal > 0) {
      var alcInfo = h('div', {style: 'border-left:2px solid var(--orange);padding:12px 16px;background:var(--orangebg);margin:12px 0'});
      alcInfo.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange)'}, 'Alcool : +' + totalAlcKcal + ' kcal/semaine soit +' + Math.round(totalAlcKcal / 7) + ' kcal/jour en moyenne'));
      p.appendChild(alcInfo);
    }
  }

  // Supplémentation recommandée
  if (window.TIPS) TIPS.renderTip(p, 'supplements');
  if (getSupplementRecommendations) {
    var suppRecs = getSupplementRecommendations() || [];
    if (suppRecs.length > 0) {
      if (!Array.isArray(S.supplements)) S.supplements = [];
      p.appendChild(h('div', {'class': 'section-label'}, 'Suppl\u00e9mentation recommand\u00e9e'));

      // If user takes creatine, show special card first
      if (S.creatine) {
        var creatRec = null;
        for (var cri = 0; cri < suppRecs.length; cri++) {
          if (suppRecs[cri].id === 'creatine') { creatRec = suppRecs[cri]; break; }
        }
        if (creatRec) {
          var creatCard = h('div', {style: 'border-left:3px solid #1A4A1A;padding:14px 16px;background:var(--greenbg);margin-bottom:12px'});
          creatCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;margin-bottom:4px'}, creatRec.icon + ' Cr\u00e9atine \u2014 Votre dose : ' + (S.creatineDose || '?') + 'g/jour'));
          if (S.creatineDose && creatRec.dosage && S.creatineDose !== creatRec.dosage.dose) {
            creatCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange);margin-bottom:4px'}, '\u26A0 Dose recommand\u00e9e : ' + creatRec.dosage.dose + 'g/jour (bas\u00e9 sur votre poids)'));
          }
          creatCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey)'}, creatRec.dosage.timing));
          p.appendChild(creatCard);
        }
      }

      // Show all relevant supplement recommendations
      suppRecs.forEach(function(rec) {
        if (S.creatine && rec.id === 'creatine') return; // already shown above
        var recCard = h('div', {style: 'border:1px solid var(--border);padding:14px 16px;background:var(--ivory2);margin-bottom:8px'});
        recCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px;margin-bottom:2px'}, rec.icon + ' ' + rec.name));
        recCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:6px;font-style:italic'}, rec.desc));
        recCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:2px'}, '\u25C6 Dosage : ' + rec.dosage.dose + ' ' + rec.dosage.unit));
        recCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:2px'}, '\u25C6 Timing : ' + rec.dosage.timing));
        if (rec.dosage.note) {
          recCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:var(--grey3,#9A9A90);margin-top:4px;font-style:italic'}, rec.dosage.note));
        }
        recCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:var(--grey3,#9A9A90);margin-top:4px'}, 'Source : ' + rec.evidence));

        // Highlight if user selected this supplement
        if (S.supplements.indexOf(rec.id) !== -1) {
          recCard.style.borderLeft = '3px solid #1A4A1A';
          recCard.style.background = 'var(--greenbg)';
        }
        p.appendChild(recCard);
      });

      // Medical disclaimer
      var disclaimerBox = h('div', {style: 'border-left:2px solid var(--orange);padding:12px 16px;background:var(--orangebg);margin:12px 0'});
      disclaimerBox.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--orange)'}, '\u26A0 Ces recommandations sont bas\u00e9es sur des \u00e9tudes scientifiques reconnues (ISSN, NIH, EFSA). Consultez votre m\u00e9decin avant toute suppl\u00e9mentation.'));
      p.appendChild(disclaimerBox);
    }
  }

  // Food habits tip
  if (S.eatingLocation === 'office') {
    var officeTip = h('div', {'class': 'whey-tip', style: 'border-left-color:var(--blue);background:var(--bluebg);margin-top:12px'});
    officeTip.appendChild(h('strong', {}, 'Astuce bureau \u2014 '));
    officeTip.appendChild(h('span', {}, 'Privil\u00e9giez les meal preps transportables : wraps, salades en bocal, buddha bowls'));
    p.appendChild(officeTip);
  }

  // Gamification widgets
  if (window.GAMIFICATION) {
    if (window.GAMIFICATION.renderStreakWidget) {
      window.GAMIFICATION.renderStreakWidget(p);
    }
    if (window.GAMIFICATION.renderDailyQuoteWidget) {
      window.GAMIFICATION.renderDailyQuoteWidget(p);
    }
  }

  p.appendChild(h('button', {'class': 'btn-primary', onclick: function() {
    // Badge profil complet : déclenché quand l'utilisateur voit ses résultats et passe au planning
    if (window.GAMIFICATION && window.GAMIFICATION.unlockBadge) window.GAMIFICATION.unlockBadge('profile_complete');
    // I-04: générer weekPlan si absent (ex: rechargement page, navigation directe vers step 11)
    if (!S.weekPlan || S.weekPlan.length < 7) {
      if (window.computeNutritionState) window.computeNutritionState(false);
      var _wkPre = generateWeek();
      if (Array.isArray(_wkPre) && _wkPre.length > 0) {
        S.weekPlan = _wkPre; S._weekPlanGeneratedAt = new Date().toISOString();
        var _hPre = window.getPlanHash ? window.getPlanHash() : '';
        if (_hPre) S._planHash = _hPre;
        if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
      }
    }
    S._showCompletionFirst = true;
    goStep(12);
  }}, 'Voir mon planning semaine'));
  p.appendChild(h('button', {'class': 'btn-back', onclick: function() { goStep(10); }, html: backArrowHtml() + 'Modifier mes pr\u00e9f\u00e9rences'}));

  // CTA sport — affiché en mode "les deux" quand le programme sportif n'est pas encore configuré
  if (S.appMode === 'both' && !S.sportType) {
    p.appendChild(h('div', {style: 'height:1px;background:var(--border,#E8E6DF);margin:24px 0 20px'}));
    p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:8px;text-align:center'}, '\u00c9TAPE SUIVANTE'));
    p.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:14px;font-style:italic;color:var(--black,#1A1A18);line-height:1.55;margin-bottom:16px;text-align:center'}, 'Votre socle nutritionnel est en place. Complétez l\u2019alliance gagnante avec une programmation sportive sur-mesure.'));
    p.appendChild(h('button', {style: 'display:block;width:100%;background:var(--black,#1A1A18);color:var(--ivory,#FAF9F6);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;min-height:52px;padding:0 24px;border:none;cursor:pointer;border-radius:2px', onclick: function() { S.view = 'sport'; window.render(); }}, 'CONFIGURER MON PROGRAMME SPORTIF'));
  }
}

// ─── WEIGHT CHART HELPER ───
function renderWeightChart(p) {
  if (!S.weightHistory || S.weightHistory.length < 2) {
    p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);text-align:center;padding:20px;border:1px solid var(--border);background:var(--ivory2);margin-bottom:12px'}, 'Enregistrez au moins 2 pes\u00e9es pour voir votre courbe'));
    return;
  }
  var chartContainer = h('div', {'class': 'chart-container'});
  chartContainer.appendChild(h('div', {'class': 'chart-title'}, '\u00c9volution du poids'));
  var canvas = h('canvas', {width: '600', height: '250', style: 'width:100%;height:250px;max-width:100%'});
  canvas.className = 'weight-chart';
  chartContainer.appendChild(canvas);
  p.appendChild(chartContainer);

  setTimeout(function() {
    if (typeof Chart === 'undefined') return;
    if (!canvas || !canvas.getContext) return;
    var labels = [];
    var data = [];
    (S.weightHistory || []).forEach(function(entry) {
      if (!entry) return;
      var w = parseFloat(entry.weight);
      if (isNaN(w) || w <= 0) return;
      labels.push(entry.date ? entry.date.substring(5) : '?');
      data.push(w);
    });
    if (data.length < 2) return;
    try { window.createChart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Poids (kg)',
          data: data,
          borderColor: '#0A0A09',
          backgroundColor: 'rgba(10,10,9,0.05)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: '#0A0A09',
          borderWidth: 1.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {display: false}
        },
        scales: {
          x: {
            grid: {display: false},
            ticks: {font: {size: 9, family: 'Helvetica Neue'}, color: '#6B6B65'}
          },
          y: {
            grid: {color: 'rgba(216,216,208,0.5)'},
            ticks: {font: {size: 10, family: 'Georgia'}, color: '#6B6B65'}
          }
        }
      }
    }); } catch(e){}
  }, 100);
}

// ─── NUTRITION COMPLETION SCREEN ───
function renderNutritionCompletion(p) {
  renderProgressBar(p, 12, 12);

  // Eyebrow label
  p.appendChild(h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--grey,#6B6B65);text-align:center;margin-bottom:20px'
  }, '\u25c6 PROGRAMME NUTRITIONNEL'));

  // Thin divider
  p.appendChild(h('div', {style: 'height:1px;background:var(--border,#E8E6DF);margin-bottom:28px'}));

  // Main headline
  var headline = h('div', {style: 'font-family:Georgia,serif;font-size:28px;font-style:italic;line-height:1.25;color:var(--black,#1A1A18);text-align:center;margin-bottom:8px'});
  headline.textContent = 'Votre nutrition';
  p.appendChild(headline);
  var headline2 = h('div', {style: 'font-family:Georgia,serif;font-size:28px;font-style:italic;line-height:1.25;color:var(--black,#1A1A18);text-align:center;margin-bottom:32px'});
  headline2.textContent = 'est pr\u00eate.';
  p.appendChild(headline2);

  // Macro summary stats
  (function() {
    var bmr = Math.round(typeof calcBMR === 'function' ? calcBMR() : 0);
    var tdee = Math.round(typeof calcTDEE === 'function' ? calcTDEE() : 0);
    var tgt = Math.round(typeof calcTarget === 'function' ? calcTarget() : 0);
    if (bmr > 0 || tdee > 0 || tgt > 0) {
      var statsRow = h('div', {
        style: 'display:flex;justify-content:center;flex-wrap:wrap;gap:0;margin-bottom:32px'
      });
      var statItems = [
        {label: 'MB', value: bmr + '\u00a0kcal/j'},
        {label: 'TDEE', value: tdee + '\u00a0kcal/j'},
        {label: 'Cible', value: tgt + '\u00a0kcal/j'}
      ];
      statItems.forEach(function(item, idx) {
        var cell = h('div', {style: 'display:flex;align-items:center;gap:6px'});
        var labelEl = h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65)'});
        labelEl.textContent = item.label;
        var valEl = h('span', {style: 'font-family:Georgia,serif;font-size:13px;font-style:italic;color:var(--black,#1A1A18)'});
        valEl.textContent = item.value;
        cell.appendChild(labelEl);
        cell.appendChild(valEl);
        statsRow.appendChild(cell);
        if (idx < statItems.length - 1) {
          var sep = h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);padding:0 10px'});
          sep.textContent = '\u00b7';
          statsRow.appendChild(sep);
        }
      });
      p.appendChild(statsRow);
    }
  })();

  // Thick divider
  p.appendChild(h('div', {style: 'height:1px;background:var(--border,#E8E6DF);margin-bottom:28px'}));

  // CTA block
  if (S.appMode === 'both' && !S.sportType) {
    // Sport CTA as primary action
    var ctaLabel = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:12px;text-align:center'});
    ctaLabel.textContent = '\u00c9TAPE SUIVANTE';
    p.appendChild(ctaLabel);

    var ctaText = h('div', {style: 'font-family:Georgia,serif;font-size:15px;font-style:italic;color:var(--black,#1A1A18);line-height:1.6;margin-bottom:24px;text-align:center;max-width:340px;margin-left:auto;margin-right:auto'});
    ctaText.textContent = 'Votre programme nutritionnel est en place. Il est temps de construire votre programmation sportive \u2014 l\u2019alliance parfaite pour atteindre vos objectifs.';
    p.appendChild(ctaText);

    // Primary: sport CTA
    p.appendChild(h('button', {
      style: 'display:block;width:100%;background:var(--black,#1A1A18);color:var(--ivory,#FAF9F6);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;min-height:52px;padding:0 24px;border:none;cursor:pointer;border-radius:2px;margin-bottom:16px',
      onclick: function() {
        S._showCompletionFirst = false;
        S.view = 'sport';
        window.render();
      }
    }, 'CONFIGURER MA PROGRAMMATION SPORTIVE \u2192'));

    // Secondary: see the plan
    var planLink = h('div', {
      style: 'text-align:center;margin-bottom:8px'
    });
    var planBtn = h('button', {
      style: 'background:none;border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);cursor:pointer;text-decoration:underline;text-underline-offset:3px;padding:8px 0',
      onclick: function() {
        S._showCompletionFirst = false;
        window.render();
      }
    });
    planBtn.textContent = 'Voir mon plan nutrition \u2192';
    planLink.appendChild(planBtn);
    p.appendChild(planLink);
  } else {
    // Nutrition-only mode: plan is primary
    p.appendChild(h('button', {
      style: 'display:block;width:100%;background:var(--black,#1A1A18);color:var(--ivory,#FAF9F6);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;min-height:52px;padding:0 24px;border:none;cursor:pointer;border-radius:2px;margin-bottom:16px',
      onclick: function() {
        S._showCompletionFirst = false;
        window.render();
      }
    }, 'VOIR MON PLAN NUTRITION \u2192'));

    // Secondary: back to macros
    var macrosLink = h('div', {style: 'text-align:center;margin-bottom:8px'});
    var macrosBtn = h('button', {
      style: 'background:none;border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);cursor:pointer;text-decoration:underline;text-underline-offset:3px;padding:8px 0',
      onclick: function() { S._showCompletionFirst = false; goStep(11); }
    });
    macrosBtn.textContent = 'Acc\u00e9der \u00e0 mes macros';
    macrosLink.appendChild(macrosBtn);
    p.appendChild(macrosLink);
  }

  // Back button
  p.appendChild(h('button', {
    'class': 'btn-back',
    onclick: function() { S._showCompletionFirst = false; goStep(11); },
    html: backArrowHtml() + 'Retour aux r\u00e9sultats'
  }));
}

// ─── STEP 9: PLANNING ───
function renderStep9(p) {
  // Show completion screen on first visit from results
  if (S._showCompletionFirst) {
    renderNutritionCompletion(p);
    return;
  }
  renderProgressBar(p, 12, 12);
  p.appendChild(h('div', {'class': 'eyebrow', style: 'font-size:9px;letter-spacing:6px;color:var(--grey,#6B6B65)'}, 'Planning'));
  p.appendChild(h('h1', {html: 'Votre<br><em>semaine</em>', style: 'font-size:28px;line-height:1.2;margin-bottom:12px'}));
  p.appendChild(h('p', {'class': 'subtitle'}, '7 jours \u00b7 ' + (S.mealsPerDay || 3) + ' repas/jour \u00b7 527 recettes'));
  if (window.TIPS) TIPS.renderTip(p, 'planning');

  // Recompute _nm adapté au type de jour sélectionné (carb cycling +20% si entraînement)
  if (window.computeNutritionState && window.getDayType) {
    var _dayInfoForNm = window.getDayType(S.selectedDay || 0);
    window.computeNutritionState(_dayInfoForNm ? _dayInfoForNm.isTraining : false);
  } else if (!S._nm && window.computeNutritionState) {
    window.computeNutritionState(false);
  }
  // Régénérer le plan si paramètres nutritionnels critiques ont changé (hash) ou si absent/incomplet
  var _planHashNow = window.getPlanHash ? window.getPlanHash() : '';
  if (!S.weekPlan || S.weekPlan.length < 7) {
    // Pas de plan du tout — générer
    try {
      if (_planHashNow) { S._planHash = _planHashNow; }
      var _wk9 = generateWeek();
      if (Array.isArray(_wk9) && _wk9.length === 7) { S.weekPlan = _wk9; if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} } }
    } catch(e) { console.error('[renderStep9] generateWeek failed', e); }
  } else if (_planHashNow && !S._planHash) {
    // Plan existant mais hash absent (migration pré-fix) — figer le hash SANS régénérer
    // Évite que les utilisateurs anciens perdent leur plan à chaque visite
    S._planHash = _planHashNow;
  } else if (_planHashNow && S._planHash !== _planHashNow) {
    // Vrai changement de paramètres nutritionnels — régénérer
    try {
      S._planHash = _planHashNow;
      var _wk9r = generateWeek();
      if (Array.isArray(_wk9r) && _wk9r.length === 7) { S.weekPlan = _wk9r; if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} } }
    } catch(e) { console.error('[renderStep9] generateWeek failed', e); }
  }
  // Guard: si weekPlan est toujours null/vide après génération, afficher un message d'erreur
  if (!S.weekPlan || !S.weekPlan.length) {
    p.appendChild(h('div', {style: 'padding:20px;text-align:center;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey,#6B6B65)'}, 'Quelques informations manquent pour générer votre plan. Complétez les étapes précédentes.'));
    p.appendChild(h('button', {'class': 'btn-secondary', onclick: function() { goStep(11); }}, '\u2190 Retour aux résultats'));
    return;
  }
  // Défaut : afficher AUJOURD'HUI (même jour que le dashboard) plutôt que toujours Lundi
  var _todayPlanIdx = (new Date().getDay() + 6) % 7; // 0=Lun … 6=Dim, cohérent avec today-dashboard.js
  if (typeof S.selectedDay !== 'number' || S.selectedDay < 0 || S.selectedDay > 6) S.selectedDay = _todayPlanIdx;

  // Day tabs
  var tabs = h('div', {'class': 'day-tabs'});
  DAY_NAMES.forEach(function(d, i) {
    tabs.appendChild(h('button', {'class': 'day-tab' + (S.selectedDay === i ? ' active' : ''), onclick: function() { S.selectedDay = i; window.render(); }}, 'J' + (i + 1) + ' ' + d));
  });
  p.appendChild(tabs);

  // Day type indicator (training vs rest)
  var _selDayInfo = window.getDayType ? window.getDayType(S.selectedDay) : null;
  if (_selDayInfo) {
    var _dayAdapt = window.getAdaptedMealSplit ? window.getAdaptedMealSplit(S.selectedDay) : null;
    if (_selDayInfo.isTraining) {
      var _tNote = (_dayAdapt && _dayAdapt.trainTimingNote) ? ' \u2014 ' + _dayAdapt.trainTimingNote : '';
      p.appendChild(h('div', {'class': 'day-training-indicator'}, '\uD83C\uDFCB\uFE0F Jour d\u2019entra\u00eenement' + _tNote));
    } else {
      p.appendChild(h('div', {'class': 'day-rest-indicator'}, '\uD83D\uDE34 Jour de repos \u2014 calories adapt\u00e9es (\u221210%)'));
    }
  }

  // ── Pre-compute daily totals for macro progress display ──────────────────
  var _preDay = (S.weekPlan && S.weekPlan[S.selectedDay]) || {};
  var _preTotal = 0, _preTotalP = 0, _preTotalG = 0, _preTotalL = 0;
  ['breakfast','lunch','snack','dinner'].forEach(function(slot) {
    var r = _preDay[slot];
    if (r) {
      _preTotal += (r.k || r.kcal || 0);
      _preTotalP += (r.p || 0);
      _preTotalG += (r.g || 0);
      _preTotalL += (r.l || 0);
    }
  });
  if (S._foodLog && Array.isArray(S._foodLog[S.selectedDay])) {
    S._foodLog[S.selectedDay].forEach(function(item) {
      if (!item) return;
      _preTotal += (item.kcal || 0);
      _preTotalP += (item.p || 0);
      _preTotalG += (item.g || 0);
      _preTotalL += (item.l || 0);
    });
  }
  // Cible calorique adaptée au type de jour (repos = calMultiplier 0.90, entraînement = 1.0)
  var _tgt = calcTarget();
  if (_dayAdapt && _dayAdapt.calMultiplier) { _tgt = Math.round(_tgt * _dayAdapt.calMultiplier); }
  var _nm = S._nm || {};

  // ── Daily macro progress bars ─────────────────────────────────────────────
  (function() {
    var tgtP = (_nm.proteinGrams || _nm.p || 0), tgtG = (_nm.carbsGrams || _nm.g || 0), tgtL = (_nm.fatGrams || _nm.l || 0);
    var kcalPct = _tgt > 0 ? Math.min(100, Math.round(_preTotal / _tgt * 100)) : 0;
    var pPct = tgtP > 0 ? Math.min(100, Math.round(_preTotalP / tgtP * 100)) : 0;
    var gPct = tgtG > 0 ? Math.min(100, Math.round(_preTotalG / tgtG * 100)) : 0;
    var lPct = tgtL > 0 ? Math.min(100, Math.round(_preTotalL / tgtL * 100)) : 0;
    function barColor(pct) { return pct >= 90 ? '#1A4A1A' : pct >= 60 ? '#A06010' : '#8B2020'; }
    var progressCard = h('div', {style: 'border:1px solid var(--border,#D8D8D0);border-radius:2px;padding:14px 16px;margin-bottom:16px;background:var(--ivory2,#F4F4F0)'});
    var progressTitle = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:10px;display:flex;justify-content:space-between;align-items:center'});
    progressTitle.appendChild(document.createTextNode('MACROS DU JOUR'));
    progressTitle.appendChild(h('span', {style: 'font-family:Georgia,serif;font-size:12px;color:' + barColor(kcalPct)}, _preTotal + ' / ' + _tgt + ' kcal'));
    progressCard.appendChild(progressTitle);
    [
      {label: 'P', cur: _preTotalP, tgt: tgtP, pct: pPct},
      {label: 'G', cur: _preTotalG, tgt: tgtG, pct: gPct},
      {label: 'L', cur: _preTotalL, tgt: tgtL, pct: lPct}
    ].forEach(function(macro) {
      var row = h('div', {style: 'margin-bottom:6px'});
      var rowTop = h('div', {style: 'display:flex;justify-content:space-between;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);margin-bottom:3px'});
      rowTop.appendChild(h('span', {}, macro.label));
      rowTop.appendChild(h('span', {style: 'color:' + barColor(macro.pct)}, macro.cur + 'g / ' + macro.tgt + 'g \u00b7 ' + macro.pct + '%'));
      row.appendChild(rowTop);
      var track = h('div', {style: 'height:4px;background:var(--border,#D8D8D0);border-radius:2px;overflow:hidden'});
      var fill = h('div', {style: 'height:100%;width:' + macro.pct + '%;background:' + barColor(macro.pct) + ';border-radius:2px;transition:width 0.3s'});
      track.appendChild(fill);
      row.appendChild(track);
      progressCard.appendChild(row);
    });
    // ── Restant kcal ──
    var _remaining = Math.round((_tgt || 0) - (_preTotal || 0));
    var _remainEl = h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;margin-top:6px;text-align:right;color:' + (_remaining >= 0 ? 'var(--grey)' : '#5A1010') + ';'
    }, _remaining >= 0 ? _remaining + ' kcal restantes' : Math.abs(_remaining) + ' kcal au-dessus');
    progressCard.appendChild(_remainEl);
    // ── Célébration macro : message si objectif atteint à 90%+ sur calories ET macros ──
    var _allMacrosOk = pPct >= 85 && gPct >= 85 && lPct >= 85;
    if (kcalPct >= 100 && _allMacrosOk) {
      var _macroCelCard = document.createElement('div');
      _macroCelCard.style.cssText = 'margin-top:10px;padding:10px 12px;background:rgba(26,74,26,0.07);border-left:3px solid #1A4A1A;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#1A4A1A;letter-spacing:0.3px;line-height:1.6;';
      _macroCelCard.textContent = 'Parfait \u2014 objectifs nutritionnels atteints aujourd\u2019hui.';
      progressCard.appendChild(_macroCelCard);
    } else if (kcalPct >= 90) {
      var _macroNearCard = document.createElement('div');
      _macroNearCard.style.cssText = 'margin-top:10px;padding:10px 12px;background:rgba(26,74,26,0.05);border-left:3px solid #5A8A5A;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#1A4A1A;letter-spacing:0.3px;line-height:1.6;';
      _macroNearCard.textContent = 'Objectif presque atteint\u00a0! Plus que quelques grammes.';
      progressCard.appendChild(_macroNearCard);
    }
    p.appendChild(progressCard);
  })();

  // Quick action buttons — Salad bar & Smoothie bar
  var quickActions = h('div', {style: 'display:flex;gap:8px;margin:12px 0 4px'});
  quickActions.appendChild(h('button', {
    style: 'flex:1;padding:12px 8px;min-height:44px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:1px solid var(--black,#0A0A09);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px',
    onclick: function() { if (!window.S.saladBar) window.S.saladBar = { open: false, base: null, proteins: [], veggies: [], fats: [], sauce: null, mealTarget: 'lunch' }; window.S.saladBar.open = true; if(window.render) window.render(); }
  }, 'Salade'));
  if (S.whey === true || S.whey === 1) {
    quickActions.appendChild(h('button', {
      style: 'flex:1;padding:12px 8px;min-height:44px;background:transparent;color:var(--black,#0A0A09);border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px',
      onclick: function() { window.S.smoothieBarOpen = true; if(window.render) window.render(); }
    }, 'Smoothie'));
  }
  p.appendChild(quickActions);

  // ── Food search / manual entry UI ─────────────────────────────────────────
  if (S._foodSearchSlot) {
    var foodCard = h('div', {style: 'border:1px solid var(--border,#D8D8D0);padding:16px;margin-bottom:16px;border-radius:2px'});
    foodCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:12px'}, '\u270F\uFE0F AJOUTER UN ALIMENT'));
    var toggleRow = h('div', {style: 'display:flex;gap:8px;margin-bottom:12px'});
    var searchTabBtn = h('button', {
      style: 'flex:1;padding:8px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;border-radius:2px;cursor:pointer;' + (!S._foodManualEntry ? 'background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:1px solid var(--black,#0A0A09)' : 'background:transparent;color:var(--black,#0A0A09);border:1px solid var(--border,#D8D8D0)'),
      onclick: function() { S._foodManualEntry = false; window.render(); }
    }, 'Recherche');
    var manualTabBtn = h('button', {
      style: 'flex:1;padding:8px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;border-radius:2px;cursor:pointer;' + (S._foodManualEntry ? 'background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:1px solid var(--black,#0A0A09)' : 'background:transparent;color:var(--black,#0A0A09);border:1px solid var(--border,#D8D8D0)'),
      onclick: function() { S._foodManualEntry = true; window.render(); }
    }, 'Manuel');
    toggleRow.appendChild(searchTabBtn);
    toggleRow.appendChild(manualTabBtn);
    foodCard.appendChild(toggleRow);

    if (!S._foodManualEntry) {
      // OpenFoodFacts search
      var searchInput = h('input', {
        type: 'search',
        placeholder: 'Rechercher un aliment\u2026',
        autocomplete: 'off',
        'aria-label': 'Rechercher un aliment',
        value: S._foodSearchQuery || '',
        style: 'width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:16px;background:var(--ivory,#FAF9F6);margin-bottom:8px'
      });
      searchInput.oninput = function(e) {
        var _val = e.target.value;
        if (window._foodSearchTimer) clearTimeout(window._foodSearchTimer);
        window._foodSearchTimer = setTimeout(function() {
          S._foodSearchQuery = _val;
          if (window.render) window.render();
        }, 300);
      };
      foodCard.appendChild(searchInput);
      var searchGoBtn = h('button', {
        style: 'width:100%;padding:10px;min-height:48px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;margin-bottom:10px',
        disabled: S._foodSearchResults === 'loading',
        'aria-label': 'Lancer la recherche',
        onclick: function() {
          var q = S._foodSearchQuery;
          if (!q || q.trim().length < 2) return;
          S._foodSearchResults = 'loading';
          window.render();
          var _offCtrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
          var _offTimer = _offCtrl ? setTimeout(function() { _offCtrl.abort(); }, 10000) : null;
          window.fetch('https://world.openfoodfacts.org/cgi/search.pl?search_terms=' + encodeURIComponent(q) + '&search_simple=1&action=process&json=1&page_size=5&fields=product_name,nutriments', {
            signal: _offCtrl ? _offCtrl.signal : undefined
          })
          .then(function(r3) {
            if (_offTimer) clearTimeout(_offTimer);
            return r3.json();
          })
          .then(function(data) {
            S._foodSearchResults = (data.products || []).filter(function(pr) { return pr.product_name; }).map(function(pr) {
              var n2 = pr.nutriments || {};
              return {
                name: pr.product_name,
                kcal: Math.round(n2['energy-kcal_100g'] || 0),
                p: Math.round(n2['proteins_100g'] || 0),
                g: Math.round(n2['carbohydrates_100g'] || 0),
                l: Math.round(n2['fat_100g'] || 0)
              };
            });
            window.render();
          })
          .catch(function(err) {
            if (_offTimer) clearTimeout(_offTimer);
            S._foodSearchResults = [];
            window.render();
          });
        }
      }, 'Rechercher');
      foodCard.appendChild(searchGoBtn);
      if (S._foodSearchResults === 'loading') {
        var searchLoadDiv = h('div', {style: 'text-align:center;padding:12px;font-size:12px;color:var(--grey,#6B6B65);font-family:"Helvetica Neue",Arial,sans-serif', role: 'status', 'aria-live': 'polite'});
        var searchSpinner = document.createElement('span');
        searchSpinner.className = 'loading-spinner';
        searchSpinner.setAttribute('aria-hidden', 'true');
        searchLoadDiv.appendChild(searchSpinner);
        searchLoadDiv.appendChild(document.createTextNode('Recherche en cours\u2026'));
        foodCard.appendChild(searchLoadDiv);
      } else if (Array.isArray(S._foodSearchResults)) {
        if (S._foodSearchResults.length === 0) {
          foodCard.appendChild(h('div', {style: 'font-size:12px;color:var(--grey,#6B6B65);font-family:"Helvetica Neue",Arial,sans-serif;margin-bottom:8px'}, 'Aucun résultat. Essayez en manuel.'));
        } else {
          var resultsList = h('div', {style: 'margin-bottom:8px'});
          S._foodSearchResults.forEach(function(item) {
            (function(food) {
              var row2 = h('div', {
                style: 'padding:10px 12px;border:1px solid var(--border,#D8D8D0);border-radius:2px;margin-bottom:6px;cursor:pointer;background:var(--ivory,#FAF9F6)',
                onclick: function() {
                  var slotKey3 = S._foodSearchSlot;
                  if (!S.weekPlan) return;
                  if (!S.weekPlan[S.selectedDay]) S.weekPlan[S.selectedDay] = {};
                  S.weekPlan[S.selectedDay][slotKey3] = { n: food.name, k: food.kcal, kcal: food.kcal, p: food.p, g: food.g, l: food.l, f: '\uD83C\uDF7D\uFE0F', emoji: '\uD83C\uDF7D\uFE0F', custom: true };
                  S._foodSearchSlot = null; S._foodSearchQuery = ''; S._foodSearchResults = null; S._foodManualEntry = false;
                  try { if (window.saveProfile) window.saveProfile(); } catch(e) { console.warn('[nutrition] saveProfile error:', e); }
                  window.render();
                }
              });
              row2.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--black,#0A0A09);margin-bottom:3px'}, food.name));
              var infoRow = h('div', {style: 'font-size:10px;color:var(--grey,#6B6B65);font-family:"Helvetica Neue",Arial,sans-serif'});
              infoRow.appendChild(document.createTextNode(food.kcal + ' kcal/100g \u00b7 P ' + food.p + 'g \u00b7 G ' + food.g + 'g \u00b7 L ' + food.l + 'g'));
              row2.appendChild(infoRow);
              resultsList.appendChild(row2);
            })(item);
          });
          foodCard.appendChild(resultsList);
        }
      }
    } else {
      // Manual entry form
      if (!S._foodManualData) S._foodManualData = { name: '', kcal: '', p: '', g: '', l: '' };
      var fields = [
        {key: 'name', label: 'Nom', type: 'text', placeholder: 'Ex: Poulet grillé'},
        {key: 'kcal', label: 'Kcal', type: 'number', placeholder: '0'},
        {key: 'p', label: 'Protéines (g)', type: 'number', placeholder: '0'},
        {key: 'g', label: 'Glucides (g)', type: 'number', placeholder: '0'},
        {key: 'l', label: 'Lipides (g)', type: 'number', placeholder: '0'}
      ];
      fields.forEach(function(field) {
        var lbl = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);margin-bottom:3px;letter-spacing:1px;text-transform:uppercase'}, field.label);
        var inp = h('input', {
          type: field.type,
          inputmode: field.type === 'number' ? 'decimal' : 'text',
          autocomplete: 'off',
          'aria-label': field.label,
          placeholder: field.placeholder,
          value: S._foodManualData[field.key] || '',
          style: 'width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:16px;background:var(--ivory,#FAF9F6);margin-bottom:8px'
        });
        (function(fk) {
          inp.oninput = function(e) { if (!S._foodManualData) S._foodManualData = {}; S._foodManualData[fk] = e.target.value; };
        })(field.key);
        foodCard.appendChild(lbl);
        foodCard.appendChild(inp);
      });
      var confirmManualBtn = h('button', {
        style: 'width:100%;padding:14px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;margin-bottom:8px',
        onclick: function() {
          var fd = S._foodManualData || {};
          if (!fd.name || fd.name.trim().length === 0) return;
          var slotKey4 = S._foodSearchSlot;
          if (!S.weekPlan) return;
          if (!S.weekPlan[S.selectedDay]) S.weekPlan[S.selectedDay] = {};
          S.weekPlan[S.selectedDay][slotKey4] = {
            n: fd.name.trim(), k: parseFloat(fd.kcal) || 0, kcal: parseFloat(fd.kcal) || 0,
            p: parseFloat(fd.p) || 0, g: parseFloat(fd.g) || 0, l: parseFloat(fd.l) || 0,
            f: '\uD83C\uDF7D\uFE0F', emoji: '\uD83C\uDF7D\uFE0F', custom: true
          };
          S._foodSearchSlot = null; S._foodSearchQuery = ''; S._foodSearchResults = null; S._foodManualEntry = false; S._foodManualData = null;
          try { if (window.saveProfile) window.saveProfile(); } catch(e) { console.warn('[nutrition] saveProfile error:', e); }
          window.render();
        }
      }, 'Confirmer');
      foodCard.appendChild(confirmManualBtn);
    }
    var cancelFoodBtn = h('button', {
      style: 'width:100%;padding:10px;background:transparent;border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);cursor:pointer',
      onclick: function() { S._foodSearchSlot = null; S._foodSearchQuery = ''; S._foodSearchResults = null; S._foodManualEntry = false; S._foodManualData = null; window.render(); }
    }, 'Annuler');
    foodCard.appendChild(cancelFoodBtn);
    p.appendChild(foodCard);
  }

  // Day meals
  var day = S.weekPlan[S.selectedDay] || {}, tgtCal = calcTarget(), dayTotal = 0, dayTotalP = 0, dayTotalG = 0, dayTotalL = 0;
  var slots = [
    {key: 'breakfast', label: window.t('onb.s9.breakfast')},
    {key: 'lunch', label: window.t('onb.s9.lunch')},
    {key: 'snack', label: window.t('onb.s9.snack')},
    {key: 'dinner', label: window.t('onb.s9.dinner')}
  ];
  slots.forEach(function(sl) {
    var r = day[sl.key];
    // Slot vide — afficher un placeholder cliquable pour ajouter un repas
    if (!r) {
      (function(slotKey, slotLabel) {
        var emptyCard = h('div', {
          style: 'border:1.5px dashed var(--border,#E5E4DE);border-radius:2px;padding:16px;margin-bottom:16px;text-align:center;cursor:pointer;color:var(--grey,#888)',
          onclick: function() { S._addMealModalSlot = slotKey; window.render(); }
        });
        emptyCard.appendChild(h('div', {style: 'font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;color:var(--grey,#888)'}, slotLabel));
        emptyCard.appendChild(h('div', {style: 'font-size:24px;margin-bottom:4px'}, '+'));
        emptyCard.appendChild(h('div', {style: 'font-size:13px'}, 'Ajouter un repas'));
        p.appendChild(emptyCard);

        if (S._addMealModalSlot === slotKey) {
          var overlay = h('div', {
            style: 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(10,10,9,0.45);z-index:9000;display:flex;align-items:flex-end;justify-content:center',
            onclick: function(e) {
              if (e.target === overlay) { S._addMealModalSlot = null; window.render(); }
            }
          });
          var sheet = h('div', {
            style: 'background:var(--card,#FFFFFF);border-radius:2px 2px 0 0;padding:24px 20px 32px;width:100%;max-width:480px;box-shadow:0 1px 3px rgba(0,0,0,0.08);max-height:80vh;overflow-y:auto;'
          });
          sheet.appendChild(h('div', {
            style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:5px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:16px;text-align:center'
          }, 'Ajouter \u00e0 ' + slotLabel));
          var choiceRow = h('div', {style: 'display:flex;gap:12px'});
          choiceRow.appendChild(h('button', {
            style: 'flex:1;padding:14px 8px;background:var(--ivory2,#F4F4F0);border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--black,#0A0A09);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px',
            onclick: function(e) {
              e.stopPropagation();
              S._addMealModalSlot = null;
              S._recipePicker = { slotKey: slotKey, query: '' };
              window.render();
            }
          }, 'Recette'));
          choiceRow.appendChild(h('button', {
            style: 'flex:1;padding:14px 8px;background:var(--ivory2,#F4F4F0);border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--black,#0A0A09);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px',
            onclick: function(e) {
              e.stopPropagation();
              S._addMealModalSlot = null;
              window.render();
              if (window.openSaladComposer) window.openSaladComposer(slotKey);
            }
          }, 'Salade'));
          var alimentBtn = h('button', {
            style: 'flex:1;padding:14px 8px;background:var(--ivory2,#F4F4F0);border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--black,#0A0A09);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px',
            onclick: function(e) {
              e.stopPropagation();
              S._addMealModalSlot = null;
              S._foodSearchSlot = slotKey;
              S._foodSearchQuery = '';
              S._foodSearchResults = null;
              S._foodManualEntry = false;
              window.render();
            }
          }, '\u270F\uFE0F Aliment');
          choiceRow.appendChild(alimentBtn);
          sheet.appendChild(choiceRow);
          overlay.appendChild(sheet);
          var root = document.getElementById('app') || p;
          root.appendChild(overlay);
        }
      })(sl.key, sl.label);
      return;
    }
    dayTotal += r.k || 0;
    dayTotalP += r.p || 0;
    dayTotalG += r.g || 0;
    dayTotalL += r.l || 0;
    var card = h('div', {'class': 'meal-card', onclick: function(e) {
      if (e.target.closest && e.target.closest('.swap-btn')) return;
      // Smoothies : slimMeal() a supprimé ingredients — on récupère les données complètes
      if (r._id && r._id.indexOf('sm_') === 0 && window.WHEY_SMOOTHIES) {
        var _fullSm = null;
        for (var _si = 0; _si < window.WHEY_SMOOTHIES.length; _si++) {
          if (window.WHEY_SMOOTHIES[_si].id === r._id) { _fullSm = window.WHEY_SMOOTHIES[_si]; break; }
        }
        if (_fullSm) {
          S.modalRecipe = { _id: r._id, n: _fullSm.name || r.n, k: r.k, p: r.p, g: r.g, l: r.l,
            f: _fullSm.emoji || '🥤', ingredients: _fullSm.ingredients || [], steps: _fullSm.steps || [],
            _smoothie: true };
        } else { S.modalRecipe = r; }
      } else { S.modalRecipe = r; }
      bb('recipe_view', {recipe: r.n});
      if (window.GAMIFICATION) {
        var rc = window.GAMIFICATION.incrementCounter('recipes_viewed');
        if (rc >= 10) window.GAMIFICATION.unlockBadge('recipes_10');
        if (rc >= 50) window.GAMIFICATION.unlockBadge('recipes_50');
      }
      window.render();
    }});
    // Badge nutrient-timing : pré-séance / post-séance / récupération selon jour
    var timingBadge = null;
    var _dayInfo = window.getDayType ? window.getDayType(S.selectedDay) : null;
    if (_dayInfo && _dayInfo.isTraining) {
      var slotIdx = {breakfast: 0, lunch: 1, snack: 2, dinner: 3}[sl.key];
      if (slotIdx !== undefined && _dayInfo.preSlot === slotIdx) {
        timingBadge = h('span', {'class': 'meal-badge badge-pre'}, '\u26A1 Pr\u00e9-s\u00e9ance');
      } else if (slotIdx !== undefined && _dayInfo.postSlot === slotIdx) {
        timingBadge = h('span', {'class': 'meal-badge badge-post'}, '\uD83D\uDCAA Post-s\u00e9ance');
      }
    } else if (_dayInfo && !_dayInfo.isTraining && sl.key === 'dinner') {
      timingBadge = h('span', {'class': 'meal-badge badge-rest'}, '\uD83D\uDE34 R\u00e9cup\u00e9ration');
    }
    var mealTypeEl = h('div', {'class': 'meal-type'});
    mealTypeEl.appendChild(document.createTextNode(sl.label));
    if (timingBadge) mealTypeEl.appendChild(timingBadge);
    card.appendChild(mealTypeEl);
    card.appendChild(h('div', {'class': 'meal-name'}, [h('span', {'class': 'meal-flag'}, r.f || ''), txt(r.n || 'Repas')]));
    card.appendChild(h('div', {'class': 'meal-kcal'}, (r.k || 0) + ' kcal'));
    var mc = h('div', {'class': 'meal-macros'});
    mc.appendChild(h('span', {}, 'G ' + (r.g || 0) + 'g'));
    mc.appendChild(h('span', {}, 'P ' + (r.p || 0) + 'g'));
    mc.appendChild(h('span', {}, 'L ' + (r.l || 0) + 'g'));
    card.appendChild(mc);
    var lv = r.lv || 0;
    var stars = '';
    for (var s = 0; s < lv; s++) stars += '\u2605';
    for (var s2 = lv; s2 < 4; s2++) stars += '\u2606';
    card.appendChild(h('div', {'class': 'meal-level'}, stars));
    card.appendChild(h('div', {'class': 'swap-btn', onclick: function(e) {
      e.stopPropagation();
      if (S.modalRecipe) return; // guard: no swap while recipe modal is open
      swapMeal(S.selectedDay, sl.key);
      bb('meal_swap', {day: S.selectedDay, slot: sl.key});
      if (window.GAMIFICATION) {
        var sc = window.GAMIFICATION.incrementCounter('swaps');
        if (sc >= 20) window.GAMIFICATION.unlockBadge('swap_master');
      }
    }}, '\u21bb'));
    // Nutritional synergy tips
    if (window.getNutritionalTips) {
      var _nTips = getNutritionalTips(r);
      for (var _ti = 0; _ti < _nTips.length; _ti++) {
        card.appendChild(h('div', {style: 'font-size:10px;color:var(--grey);font-style:italic;border-left:2px solid #E8A87C;padding:3px 0 3px 8px;margin-top:4px;line-height:1.4'}, _nTips[_ti]));
      }
    }
    p.appendChild(card);

    // Bouton "Remplacer ce repas" avec mini-modal (slot déjà occupé)
    (function(slotKey, slotLabel) {
      var addBtn = h('button', {
        style: 'width:100%;padding:8px 12px;margin-bottom:8px;background:transparent;border:1.5px dashed var(--border,#E5E4DE);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--blue,#1A3C5E);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px',
        onclick: function(e) {
          e.stopPropagation();
          S._addMealModalSlot = slotKey;
          window.render();
        }
      }, '\u21ba Remplacer ce repas');
      p.appendChild(addBtn);

      if (S._addMealModalSlot === slotKey) {
        var overlay = h('div', {
          style: 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(10,10,9,0.45);z-index:9000;display:flex;align-items:flex-end;justify-content:center',
          onclick: function(e) {
            if (e.target === overlay) { S._addMealModalSlot = null; window.render(); }
          }
        });
        var sheet = h('div', {
          style: 'background:var(--ivory,#FAF9F6);border-radius:2px 2px 0 0;padding:24px 20px 32px;width:100%;max-width:480px;border-top:1px solid var(--border,#D8D8D0);max-height:80vh;overflow-y:auto;'
        });
        sheet.appendChild(h('div', {
          style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:5px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:16px;text-align:center'
        }, 'Remplacer \u2014 ' + slotLabel));
        var choiceRow = h('div', {style: 'display:flex;gap:12px'});
        var btnRecipe = h('button', {
          style: 'flex:1;padding:14px 8px;background:var(--ivory2,#F4F4F0);border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--black,#0A0A09);cursor:pointer',
          onclick: function(e) {
            e.stopPropagation();
            S._addMealModalSlot = null;
            S._recipePicker = { slotKey: slotKey, query: '' };
            window.render();
          }
        }, 'Recette');
        var btnSalad = h('button', {
          style: 'flex:1;padding:14px 8px;background:var(--ivory2,#F4F4F0);border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--black,#0A0A09);cursor:pointer',
          onclick: function(e) {
            e.stopPropagation();
            S._addMealModalSlot = null;
            window.render();
            if (window.openSaladComposer) window.openSaladComposer(slotKey);
          }
        }, 'Salade');
        var btnAliment = h('button', {
          style: 'flex:1;padding:14px 8px;background:var(--ivory2,#F4F4F0);border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--black,#0A0A09);cursor:pointer',
          onclick: function(e) {
            e.stopPropagation();
            S._addMealModalSlot = null;
            S._foodSearchSlot = slotKey;
            S._foodSearchQuery = '';
            S._foodSearchResults = null;
            S._foodManualEntry = false;
            window.render();
          }
        }, '\u270F\uFE0F Aliment');
        choiceRow.appendChild(btnRecipe);
        choiceRow.appendChild(btnSalad);
        choiceRow.appendChild(btnAliment);
        sheet.appendChild(choiceRow);
        overlay.appendChild(sheet);
        var root = document.getElementById('app') || p;
        root.appendChild(overlay);
      }
    })(sl.key, sl.label);
  });

  // Day total
  var diff = dayTotal - tgtCal, diffPct = tgtCal > 0 ? Math.abs(diff / tgtCal * 100) : 0, isOk = diffPct < 5;
  var total = h('div', {'class': 'day-total'});
  total.appendChild(h('div', {'class': 'dt-label'}, window.t('onb.s9.total')));
  var vd = h('div', {style: 'display:flex;align-items:center;gap:12px'});
  vd.appendChild(h('span', {'class': 'dt-val'}, dayTotal + ' kcal'));

  // Add macro breakdown
  var macroInfo = h('div', {style: 'display:flex;gap:12px;font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey)'});
  macroInfo.appendChild(h('span', {}, 'G ' + dayTotalG + 'g'));
  macroInfo.appendChild(h('span', {}, 'P ' + dayTotalP + 'g'));
  macroInfo.appendChild(h('span', {}, 'L ' + dayTotalL + 'g'));
  vd.appendChild(macroInfo);

  vd.appendChild(h('span', {'class': 'dt-diff', style: 'color:' + (isOk ? '#1A4A1A' : '#6A4A1A')}, (diff >= 0 ? '+' : '') + diff + ' kcal ' + (isOk ? '\u2713' : '\u26a0')));
  total.appendChild(vd);
  p.appendChild(total);

  // Target macros comparison
  var targetMacros = calcMacros();
  var macroComparison = h('div', {style: 'display:flex;justify-content:space-between;padding:8px 16px;font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:var(--grey);border:1px solid var(--border);border-top:none;background:var(--ivory2)'});
  macroComparison.appendChild(h('span', {}, 'Objectif : G ' + targetMacros.g + 'g \u00b7 P ' + targetMacros.p + 'g \u00b7 L ' + targetMacros.l + 'g'));
  var totalMacroKcal = dayTotalP * 4 + dayTotalG * 4 + dayTotalL * 9;
  macroComparison.appendChild(h('span', {}, 'V\u00e9rif : ' + totalMacroKcal + ' kcal'));
  p.appendChild(macroComparison);

  // ─── INTÉGRATION SPORT → NUTRITION : dépense calorique séance d'aujourd'hui ───
  // Si une séance a été validée aujourd'hui, affiche les calories brûlées et le bilan net
  (function() {
    if (!S.sessionHistory) return;
    var today = new Date().toISOString().slice(0, 10);
    // Chercher la séance d'aujourd'hui (clé format 'dayIndex_YYYY-MM-DD' ou 'YYYY-MM-DD')
    var todaySess = null;
    Object.keys(S.sessionHistory).forEach(function(k) {
      var se = S.sessionHistory[k];
      if (se && se.date && se.date.slice(0, 10) === today) todaySess = se;
    });
    if (!todaySess || !todaySess.kcalTotal) return;
    var burned = todaySess.kcalTotal;
    var netTarget = tgtCal + burned; // calories nettes à consommer = objectif + brûlées
    var netDiv = h('div', {style: 'background:var(--greenbg,rgba(26,74,26,.06));border:1px solid var(--green,#1A4A1A);border-radius:2px;padding:10px 14px;margin:8px 0;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--green,#1A4A1A)'});
    var netRow = h('div', {style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:4px'});
    netRow.appendChild(h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase'}, 'S\u00e9ance valid\u00e9e — d\u00e9pense'));
    netRow.appendChild(h('span', {style: 'font-family:Georgia,serif;font-size:13px'}, '+' + burned + ' kcal'));
    netDiv.appendChild(netRow);
    var netRow2 = h('div', {style: 'display:flex;justify-content:space-between;align-items:center'});
    netRow2.appendChild(h('span', {style: 'color:var(--green,#1A4A1A)'}, 'Objectif ajust\u00e9 (net)'));
    netRow2.appendChild(h('span', {style: 'font-family:Georgia,serif;font-size:13px;color:var(--green,#1A4A1A)'}, netTarget + ' kcal'));
    netDiv.appendChild(netRow2);
    if (todaySess.kcalEpoc) {
      var epocNote = h('div', {style: 'color:#5A8A5A;font-size:9px;margin-top:3px'}, 'dont +' + todaySess.kcalEpoc + ' kcal EPOC (afterburn) inclus');
      netDiv.appendChild(epocNote);
    }
    p.appendChild(netDiv);
  })();

  // Whey tip
  if (S.whey) {
    var tip = h('div', {'class': 'whey-tip'});
    tip.appendChild(h('strong', {}, 'Conseil Whey \u2014 '));
    tip.appendChild(h('span', {}, 'Prenez votre whey dans les 30 min apr\u00e8s l\'entra\u00eenement pour optimiser la synth\u00e8se prot\u00e9ique.'));
    p.appendChild(tip);
  }

  // Budget réel du plan semaine
  if (window.RecipeEngine && window.RecipeEngine.calcWeekPlanBudget && S.weekPlan) {
    var budget = window.RecipeEngine.calcWeekPlanBudget(S.weekPlan);
    var budgetBlock = h('div', { style: 'margin:16px 0;padding:14px 16px;background:var(--card);border-radius:2px;box-shadow:0 1px 3px rgba(0,0,0,0.08)' });
    budgetBlock.appendChild(h('div', { style: 'font-weight:700;font-size:13px;margin-bottom:10px;color:var(--text)' }, '💰 Budget courses estimé'));
    if (budget.totalMAD > 0) {
      var budgetGrid = h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:8px' });
      budgetGrid.appendChild(h('div', { style: 'background:var(--bg);border-radius:2px;padding:10px;text-align:center' },
        h('div', { style: 'font-size:11px;color:var(--text-secondary);margin-bottom:4px' }, 'Budget / jour'),
        h('div', { style: 'font-size:18px;font-weight:700;color:var(--accent)' }, budget.avgDailyMAD + ' ' + 'DH')
      ));
      budgetGrid.appendChild(h('div', { style: 'background:var(--bg);border-radius:2px;padding:10px;text-align:center' },
        h('div', { style: 'font-size:11px;color:var(--text-secondary);margin-bottom:4px' }, 'Budget / semaine'),
        h('div', { style: 'font-size:18px;font-weight:700;color:var(--accent)' }, budget.weeklyMAD + ' ' + 'DH')
      ));
      budgetBlock.appendChild(budgetGrid);
      // Comparaison avec le budget alimentaire de l'utilisateur
      if (S.shopBudget && budget.avgDailyMAD > 0) {
        var budgetDayLimits = {budget_low: 45, budget_mid: 90, budget_high: 180};
        var dayLimit = budgetDayLimits[S.shopBudget];
        if (dayLimit) {
          var overBudget = budget.avgDailyMAD > dayLimit;
          var budgetStatus = overBudget
            ? '\u26a0\ufe0f Au-dessus de votre fourchette (' + dayLimit + ' DH/j)'
            : '\u2713 Dans votre fourchette budget';
          budgetBlock.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:' + (overBudget ? 'var(--red,#5A1010)' : 'var(--green,#1A4A1A)') + ';margin-top:8px;text-align:center' }, budgetStatus));
        }
      }
      if (budget.coveragePct < 100) {
        budgetBlock.appendChild(h('div', { style: 'font-size:11px;color:var(--text-secondary);margin-top:8px' },
          '* Estimation basée sur ' + budget.coveragePct + '% des repas (recettes avec prix disponibles)'
        ));
      }
    } else {
      budgetBlock.appendChild(h('div', { style: 'font-size:13px;color:var(--text-secondary);text-align:center;padding:8px 0' },
        'Prix non disponibles pour ce plan — généralement disponibles dès la semaine suivante'
      ));
    }
    // Insère après le plan semaine
    p.appendChild(budgetBlock);
  }

  // Bouton liste de courses améliorée — affiche le nombre d'articles en temps réel
  var _shopList = ((window.RecipeEngine && S.weekPlan) ? window.RecipeEngine.generateShoppingList(S.weekPlan, {shopFreq: S.shopFreq}) : []) || [];
  var _shopTotal = _shopList.reduce(function(n, cat) { return n + (cat && cat.items ? cat.items.length : 0); }, 0);
  var _shopLabel = window.t('shop.title') + (_shopTotal > 0 ? ' — ' + _shopTotal + ' articles' : '');
  var btnShop = h('button', {
    'class': 'btn-secondary',
    style: 'margin:8px 0',
    onclick: function() { window.S.shopListOpen = true; if(window.render) window.render(); }
  }, _shopLabel);
  p.appendChild(btnShop);

  // Export PDF
  p.appendChild(h('button', {'class': 'btn-primary', style: 'margin-top:16px;background:var(--black2)', onclick: function() { window.exportDayPDF(S.selectedDay); }}, '\u21e9 Exporter le jour en PDF'));
  p.appendChild(h('div', {style: 'height:8px'}));
  p.appendChild(h('button', {'class': 'regen-btn', onclick: function() {
    // CRITIQUE-G1: anti race-condition (même pattern que génération initiale)
    if (window._nutritionGenerating) return;
    window._nutritionGenerating = true;
    try {
      if (window.computeNutritionState) window.computeNutritionState(false);
      // C-02: vider le plan existant avant regen — évite que l'échec reste invisible
      S.weekPlan = null;
      var _wkR = generateWeek();
      if (Array.isArray(_wkR) && _wkR.length > 0) {
        S.weekPlan = _wkR;
        S._weekPlanGeneratedAt = new Date().toISOString();
        // Figer le hash pour éviter une régénération silencieuse au prochain renderStep9
        var _hR = window.getPlanHash ? window.getPlanHash() : '';
        if (_hR) S._planHash = _hR;
        if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
        // Sync plan nutrition vers Supabase
        if (window.SupaSync) {
          try {
            var _monday = new Date();
            _monday.setDate(_monday.getDate() - _monday.getDay() + 1);
            SupaSync.saveMealPlan(_monday.toISOString().slice(0, 10), S.weekPlan);
          } catch(e) { console.warn('[nutrition] regen saveMealPlan error:', e); }
        }
        bb('week_regenerated', {});
      } else {
        // IMPORTANT-G2: feedback si pool vide
        console.warn('[nutrition] regen: generateWeek() a retourné un plan vide');
        alert('Impossible de générer un nouveau plan. Vérifiez vos préférences alimentaires.');
      }
      window.render();
    } finally {
      window._nutritionGenerating = false;
    }
  }}, '\u21bb ' + window.t('onb.s9.generate')));
  p.appendChild(h('div', {style: 'height:12px'}));
  p.appendChild(h('button', {'class': 'btn-secondary', onclick: function() { goStep(11); }}, '\u2190 Retour aux r\u00e9sultats'));

  // ─── BOUTON "MODIFIER MES PRÉFÉRENCES" ───
  // Permet à l'utilisateur de refaire le questionnaire s'il le souhaite explicitement.
  p.appendChild(h('div', {style: 'height:12px'}));
  var btnReset = h('button', {
    'class': 'btn-secondary',
    style: 'width:100%;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);border-color:var(--border,#D8D8D0)',
    onclick: function() {
      if (!confirm('Refaire le questionnaire nutrition ? Votre plan actuel sera supprimé.')) return;
      S.weekPlan = null;
      S._nm = null;
      S._weekPlanGeneratedAt = null;
      S._planHash = '';
      S.mealsLogged = {};
      // Bypass goStep(1) auto-skip — force step 1 so users can change sex and all preferences
      S.nStep = 1;
      if (window.saveProfile) saveProfile();
      window.render();
    }
  }, '\u2699 Modifier mes pr\u00e9f\u00e9rences nutritionnelles');
  p.appendChild(btnReset);

  // ─── CTA TRANSITION → SPORT (mode "les deux" uniquement) ───
  if (S.appMode === 'both' && (!S.sportProgram || S.sportProgram.length === 0)) {
    var transCard = h('div', {style: 'border:1px solid #1A4A1A;background:rgba(26,74,26,0.04);padding:20px 16px;margin-top:20px;border-radius:2px'});
    transCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#1A4A1A;margin-bottom:8px'}, 'ÉTAPE 2 / 2'));
    transCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;font-style:italic;margin-bottom:8px;color:var(--black,#1A1A18)'}, 'Votre nutrition est prête.'));
    transCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);line-height:1.6;margin-bottom:16px'}, 'Configurez maintenant votre programme sportif pour que vos macros s\'adaptent automatiquement à chaque séance.'));
    var sportCTA = h('button', {
      style: 'width:100%;padding:16px;background:#1A4A1A;color:#FAF9F6;border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;cursor:pointer',
      onclick: function() {
        window.S.view = 'sport';
        window.S.sStep = 0;
        window.S.sportType = null; // permettre le re-choix de sport
        if (window.saveProfile) window.saveProfile();
        if (window.render) window.render();
      }
    }, 'Configurer mon programme sportif →');
    transCard.appendChild(sportCTA);
    p.appendChild(transCard);
  }

  p.appendChild(h('div', {style: 'height:24px'}));
}

// ─── MODAL ───
function renderModal(app) {
  // Attach to #app root (not the fade-in container) — position:fixed breaks when parent has CSS transform
  var root = document.getElementById('app') || app;
  var ov = h('div', {'class': 'modal-overlay' + (S.modalRecipe ? ' open' : ''), role: 'dialog', 'aria-modal': 'true', onclick: function(e) {
    if (e.target === ov) { S.modalRecipe = null; window.render(); }
  }});
  var sheet = h('div', {'class': 'modal-sheet'});
  if (S.modalRecipe) {
    var r = S.modalRecipe;
    var hdr = h('div', {'class': 'modal-header'});
    // Bug 2: r.f or r.n may be undefined on legacy recipes
    var recipeEmoji = r.f || r.emoji || '';
    var recipeName = r.n || r.name || 'Recette';
    hdr.appendChild(h('div', {'class': 'modal-title'}, recipeEmoji + (recipeEmoji ? ' ' : '') + recipeName));
    hdr.appendChild(h('button', {'class': 'modal-close', onclick: function() { S.modalRecipe = null; window.render(); }}, '\u2715'));
    sheet.appendChild(hdr);
    var body = h('div', {'class': 'modal-body'});
    var pills = h('div', {'class': 'macro-pills'});
    // Bug 3: r.k/r.p/r.g/r.l may be undefined — fallback to baseNutrition or 0
    var kcal = r.k || (r.baseNutrition && r.baseNutrition.calories) || 0;
    var prot = r.p || (r.baseNutrition && r.baseNutrition.proteinGrams) || 0;
    var carbs = r.g || (r.baseNutrition && r.baseNutrition.carbsGrams) || 0;
    var fats  = r.l || (r.baseNutrition && r.baseNutrition.fatGrams) || 0;
    pills.appendChild(h('div', {'class': 'macro-pill'}, [h('div', {'class': 'mp-val'}, String(kcal)), h('div', {'class': 'mp-label'}, 'Calories')]));
    pills.appendChild(h('div', {'class': 'macro-pill'}, [h('div', {'class': 'mp-val'}, prot + 'g'), h('div', {'class': 'mp-label'}, window.t('onb.s8.proteins'))]));
    pills.appendChild(h('div', {'class': 'macro-pill'}, [h('div', {'class': 'mp-val'}, carbs + 'g'), h('div', {'class': 'mp-label'}, window.t('onb.s8.carbs'))]));
    pills.appendChild(h('div', {'class': 'macro-pill'}, [h('div', {'class': 'mp-val'}, fats + 'g'), h('div', {'class': 'mp-label'}, window.t('onb.s8.fats'))]));
    body.appendChild(pills);
    body.appendChild(h('div', {'class': 'section-label'}, 'Ingr\u00e9dients'));
    var ingredList = h('ul', {'class': 'ingredient-list'});
    // Helper: display one ingredient {name, qty, unit} as a readable line
    function fmtIng(ing) {
      var qty = ing.qty ? roundDisplayQty(ing.qty, ing.unit) : '';
      var unit = ing.unit && ing.unit !== 'pce' ? ing.unit + '\u00a0' : (ing.unit === 'pce' ? ' pce\u00a0' : ' ');
      return (qty + unit + (ing.name || '')).trim();
    }
    if (r._scaledIngredients && r._scaledIngredients.length > 0) {
      r._scaledIngredients.forEach(function(ing) { ingredList.appendChild(h('li', {}, fmtIng(ing))); });
    } else if (r.ingredients && Array.isArray(r.ingredients) && r.ingredients.length > 0) {
      r.ingredients.forEach(function(ing) { ingredList.appendChild(h('li', {}, fmtIng(ing))); });
    } else if (r.i) {
      r.i.split(',').forEach(function(ing) { if (ing.trim()) ingredList.appendChild(h('li', {}, ing.trim())); });
    } else if (r._id && window.RecipeEngine && window.RecipeEngine.findRecipe) {
      // Fallback direct RECIPES_DB lookup — always works even for old/cached weekPlans
      var fullR = window.RecipeEngine.findRecipe(r._id);
      // findRecipe() retourne un format normalisé où ingredients est une string (schéma unifié)
      if (fullR && Array.isArray(fullR.ingredients) && fullR.ingredients.length > 0) {
        fullR.ingredients.forEach(function(ing) { ingredList.appendChild(h('li', {}, fmtIng(ing))); });
      } else if (fullR && typeof fullR.ingredients === 'string' && fullR.ingredients.length > 0) {
        fullR.ingredients.split(',').forEach(function(ing) { if (ing.trim()) ingredList.appendChild(h('li', {}, ing.trim())); });
      } else {
        ingredList.appendChild(h('li', {style: 'color:var(--grey);font-style:italic'}, 'Ingr\u00e9dients non disponibles.'));
      }
    } else {
      ingredList.appendChild(h('li', {style: 'color:var(--grey);font-style:italic'}, 'Ingr\u00e9dients non disponibles.'));
    }
    body.appendChild(ingredList);
    body.appendChild(h('div', {'class': 'section-label'}, 'Pr\u00e9paration'));
    var sl = h('ol', {'class': 'step-list'});
    var steps = Array.isArray(r.st) && r.st.length > 0 ? r.st
              : Array.isArray(r.steps) && r.steps.length > 0 ? r.steps
              : [];
    // Fallback : lookup direct dans RECIPES_DB si steps vides (cache stale ou plan ancien)
    if (steps.length === 0 && r._id && window.RecipeEngine && window.RecipeEngine.findRecipe) {
      var _fullR = window.RecipeEngine.findRecipe(r._id);
      if (_fullR && Array.isArray(_fullR.steps) && _fullR.steps.length > 0) steps = _fullR.steps;
    }
    if (steps.length === 0) {
      sl.appendChild(h('li', {style: 'color:var(--grey);font-style:italic'}, 'Pr\u00e9paration non disponible pour ce repas.'));
    } else {
      steps.forEach(function(s) { sl.appendChild(h('li', {}, s || '')); });
    }
    body.appendChild(sl);
    // Vérification cohérence macros : P×4 + G×4 + L×9 ≈ kcal affiché
    var chk = (prot || 0) * 4 + (carbs || 0) * 4 + (fats || 0) * 9;
    if (!isNaN(chk) && chk > 0) {
    var diffPctChk = kcal > 0 ? Math.abs((chk - kcal) / kcal * 100) : 0;
    var chkColor = diffPctChk <= 5 ? 'var(--green,#1A4A1A)' : 'var(--orange,#6A4A1A)';
    body.appendChild(h('div', {'class': 'macro-check', style: 'color:' + chkColor}, '\u2139\ufe0f \u00c9quivalent calorique macros : ' + chk + ' kcal' + (diffPctChk > 5 ? ' (\u00e9cart ' + Math.round(diffPctChk) + '% vs ' + kcal + ' kcal affich\u00e9)' : ' \u2713')));
    }
    var expBtn = h('button', {'class': 'btn-primary', style: 'margin-top:12px;font-size:9px', onclick: function(e) { e.stopPropagation(); window.exportRecipePDF(r); }}, '\u21e9 Exporter cette recette en PDF');
    body.appendChild(expBtn);
    sheet.appendChild(body);
  }
  ov.appendChild(sheet);
  root.appendChild(ov);
  // Bug 6: reset scroll to top on each modal open
  requestAnimationFrame(function() {
    if (sheet) sheet.scrollTop = 0;
  });
}

// ─── PDF EXPORT ───
function exportDayPDF(dayIdx) {
  if (!window.jspdf || !window.jspdf.jsPDF) { alert('PDF non disponible (biblioth\u00e8que non charg\u00e9e)'); return; }
  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF({unit: 'mm', format: 'a4'});
  var W = 210, M = 20, CW = W - 2 * M, y = 0;
  var ivory = [250, 250, 247], black = [10, 10, 9], grey = [107, 107, 101], border = [216, 216, 208];

  // Header bg
  doc.setFillColor(black[0], black[1], black[2]);
  doc.rect(0, 0, W, 38, 'F');
  doc.setTextColor(ivory[0], ivory[1], ivory[2]);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  doc.text('SMART FIT COACH', M, 14);
  // CRITIQUE-1: garde validité dayIdx avant tout accès à DAY_NAMES/weekPlan
  if (typeof dayIdx !== 'number' || dayIdx < 0 || dayIdx > 6 || !S.weekPlan || !S.weekPlan[dayIdx]) {
    alert('Aucun plan disponible pour ce jour.'); return;
  }
  doc.setFontSize(16); doc.setFont('times', 'italic');
  doc.text((DAY_NAMES[dayIdx] || 'Jour') + ' \u2014 Plan du jour', M, 26);
  doc.setFontSize(7); doc.setFont('helvetica', 'normal');
  var tgt = calcTarget(), mc = calcMacros();
  doc.text(tgt + ' kcal  |  G ' + mc.g + 'g  |  P ' + mc.p + 'g  |  L ' + mc.l + 'g', M, 33);
  y = 46;

  // Meals (guard already done above)
  var dayPlan = S.weekPlan[dayIdx];
  var slots = [{key: 'breakfast', label: 'PETIT-D\u00c9JEUNER'}, {key: 'lunch', label: 'D\u00c9JEUNER'}, {key: 'snack', label: 'COLLATION'}, {key: 'dinner', label: 'D\u00ceNER'}];
  var dayTotal = 0;
  slots.forEach(function(sl) {
    var r = dayPlan[sl.key]; if (!r) return; dayTotal += r.k || 0;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFillColor(ivory[0], ivory[1], ivory[2]);
    doc.setDrawColor(border[0], border[1], border[2]);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(grey[0], grey[1], grey[2]);
    doc.text(sl.label, M, y); y += 5;
    doc.setFont('times', 'normal'); doc.setFontSize(13); doc.setTextColor(black[0], black[1], black[2]);
    var rNameLines = doc.splitTextToSize(r.n || 'Repas', CW);
    doc.text(rNameLines, M, y); y += rNameLines.length * 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(grey[0], grey[1], grey[2]);
    doc.text((r.k || 0) + ' kcal  \u00b7  G ' + (r.g || 0) + 'g  \u00b7  P ' + (r.p || 0) + 'g  \u00b7  L ' + (r.l || 0) + 'g', M, y); y += 6;
    doc.setFontSize(7); doc.setTextColor(grey[0], grey[1], grey[2]);
    doc.text('INGR\u00c9DIENTS', M, y); y += 4;
    doc.setFontSize(8); doc.setTextColor(black[0], black[1], black[2]);
    var ingListPDF = r._scaledIngredients && r._scaledIngredients.length > 0
      ? r._scaledIngredients.map(function(ing) { return roundDisplayQty(ing.qty, ing.unit) + (ing.unit === 'pce' ? ' pce ' : ing.unit === 'ml' ? 'ml ' : 'g ') + ing.name; })
      : (r.i ? r.i.split(',').map(function(s) { return s.trim(); }) : []);
    ingListPDF.forEach(function(ing) {
      if (y > 275) { doc.addPage(); y = 20; }
      var ingLines = doc.splitTextToSize('\u2022  ' + (ing || ''), CW - 4);
      doc.text(ingLines, M + 2, y); y += ingLines.length * 4;
    });
    y += 2;
    doc.setFontSize(7); doc.setTextColor(grey[0], grey[1], grey[2]);
    doc.text('PR\u00c9PARATION', M, y); y += 4;
    doc.setFontSize(8); doc.setTextColor(black[0], black[1], black[2]);
    (r.st || []).forEach(function(step, si) {
      if (y > 275) { doc.addPage(); y = 20; }
      var lines = doc.splitTextToSize((si + 1) + '. ' + step, CW - 6);
      lines.forEach(function(line) { doc.text(line, M + 2, y); y += 4; });
    });
    y += 4;
    doc.setDrawColor(border[0], border[1], border[2]);
    doc.line(M, y, W - M, y); y += 6;
  });

  // Total
  if (y > 265) { doc.addPage(); y = 20; }
  doc.setFillColor(244, 244, 240);
  doc.rect(M, y - 2, CW, 10, 'F');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(grey[0], grey[1], grey[2]);
  doc.text('TOTAL DU JOUR', M + 4, y + 4);
  doc.setFont('times', 'normal'); doc.setFontSize(12); doc.setTextColor(black[0], black[1], black[2]);
  doc.text(dayTotal + ' kcal', W - M - 4, y + 4, {align: 'right'}); y += 14;

  // Medical warnings
  if (Array.isArray(S.medical) && S.medical.length > 0) {
    doc.setFontSize(7); doc.setTextColor(106, 74, 26);
    doc.text('RECOMMANDATIONS M\u00c9DICALES', M, y); y += 4;
    doc.setFontSize(7); doc.setTextColor(grey[0], grey[1], grey[2]);
    S.medical.forEach(function(id) {
      var adv = MEDICAL_ADVICE[id];
      if (adv) { if (y > 275) { doc.addPage(); y = 20; } doc.text('\u2022 ' + adv.warn, M + 2, y); y += 4; }
    }); y += 4;
  }

  // Footer
  var pages = doc.internal.getNumberOfPages();
  for (var i = 1; i <= pages; i++) {
    doc.setPage(i); doc.setFontSize(6); doc.setTextColor(grey[0], grey[1], grey[2]);
    doc.text('Smart Fit Coach \u2014 g\u00e9n\u00e9r\u00e9 le ' + new Date().toLocaleDateString('fr-FR'), M, 290);
    doc.text('Page ' + i + '/' + pages, W - M, 290, {align: 'right'});
  }
  var safeDayName = (DAY_NAMES[dayIdx] || 'jour').toLowerCase()
    .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e')
    .replace(/[îï]/g, 'i').replace(/[ôõö]/g, 'o')
    .replace(/[ùûü]/g, 'u').replace(/ç/g, 'c').replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  doc.save('plan-' + (safeDayName || 'jour') + '.pdf');
}
window.exportDayPDF = exportDayPDF;

function exportRecipePDF(r) {
  if (!window.jspdf || !window.jspdf.jsPDF) { alert('PDF non disponible (biblioth\u00e8que non charg\u00e9e)'); return; }
  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF({unit: 'mm', format: 'a4'});
  var W = 210, M = 20, CW = W - 2 * M, y = 0;
  var ivory = [250, 250, 247], black = [10, 10, 9], grey = [107, 107, 101], border = [216, 216, 208];

  // Header
  doc.setFillColor(black[0], black[1], black[2]);
  doc.rect(0, 0, W, 34, 'F');
  doc.setTextColor(ivory[0], ivory[1], ivory[2]);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  doc.text('SMART FIT COACH', M, 12);
  doc.setFont('times', 'italic'); doc.setFontSize(18);
  var recTitleLines = doc.splitTextToSize(r.n || 'Recette', W - 2 * M);
  doc.text(recTitleLines, M, 25);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text((r.k || 0) + ' kcal  |  G ' + (r.g || 0) + 'g  |  P ' + (r.p || 0) + 'g  |  L ' + (r.l || 0) + 'g', M, 31);
  y = 44;

  // Macro boxes
  var macros = [{l: 'CALORIES', v: String(r.k || 0)}, {l: 'PROT\u00c9INES', v: (r.p || 0) + 'g'}, {l: 'GLUCIDES', v: (r.g || 0) + 'g'}, {l: 'LIPIDES', v: (r.l || 0) + 'g'}];
  var bw = CW / 4 - 2;
  macros.forEach(function(mc2, i) {
    var x = M + i * (bw + 2.6);
    doc.setFillColor(244, 244, 240); doc.setDrawColor(border[0], border[1], border[2]);
    doc.rect(x, y, bw, 14, 'FD');
    doc.setFont('times', 'normal'); doc.setFontSize(14); doc.setTextColor(black[0], black[1], black[2]);
    doc.text(mc2.v, x + bw / 2, y + 7, {align: 'center'});
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(grey[0], grey[1], grey[2]);
    doc.text(mc2.l, x + bw / 2, y + 12, {align: 'center'});
  }); y += 22;

  // Ingredients
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(grey[0], grey[1], grey[2]);
  doc.text('INGR\u00c9DIENTS', M, y);
  doc.setDrawColor(border[0], border[1], border[2]); doc.line(M, y + 1.5, W - M, y + 1.5); y += 6;
  doc.setFontSize(9); doc.setTextColor(black[0], black[1], black[2]);
  var recipeIngPDF = r._scaledIngredients && r._scaledIngredients.length > 0
    ? r._scaledIngredients.map(function(ing) { return roundDisplayQty(ing.qty, ing.unit) + (ing.unit === 'pce' ? ' pce ' : ing.unit === 'ml' ? 'ml ' : 'g ') + ing.name; })
    : (r.i ? r.i.split(',').map(function(s) { return s.trim(); }) : []);
  recipeIngPDF.forEach(function(ing) {
    if (y > 275) { doc.addPage(); y = 20; }
    var ingLines = doc.splitTextToSize('\u2022  ' + (ing || ''), CW - 4);
    doc.text(ingLines, M + 2, y); y += ingLines.length * 5;
  }); y += 4;

  // Steps
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(grey[0], grey[1], grey[2]);
  doc.text('PR\u00c9PARATION', M, y);
  doc.setDrawColor(border[0], border[1], border[2]); doc.line(M, y + 1.5, W - M, y + 1.5); y += 6;
  doc.setFontSize(9); doc.setTextColor(black[0], black[1], black[2]);
  (r.st || []).forEach(function(step, si) {
    if (y > 275) { doc.addPage(); y = 20; }
    var lines = doc.splitTextToSize((si + 1) + '. ' + step, CW - 8);
    lines.forEach(function(line) { doc.text(line, M + 2, y); y += 5; });
    y += 2;
  });

  // Footer
  doc.setFontSize(6); doc.setTextColor(grey[0], grey[1], grey[2]);
  doc.text('Smart Fit Coach', M, 290);
  var safeName = (r.n || 'recette').toLowerCase()
    .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e')
    .replace(/[îï]/g, 'i').replace(/[ôõö]/g, 'o')
    .replace(/[ùûü]/g, 'u').replace(/ç/g, 'c').replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  doc.save((safeName || 'recette') + '.pdf');
}
window.exportRecipePDF = exportRecipePDF;

// ─── SHOPPING LIST HELPERS ───
function cleanShopChecked(list) {
  if (!window.S || !window.S.shopChecked) return;
  var validNames = {};
  list.forEach(function(cat) {
    cat.items.forEach(function(item) { validNames[item.name] = true; });
  });
  Object.keys(window.S.shopChecked).forEach(function(k) {
    if (!validNames[k]) delete window.S.shopChecked[k];
  });
}

// ─── L'ATELIER BOWL ───
var SALAD_DB = {
  bases: [
    // Classiques
    { name: 'Riz brun', qty: 100, unit: 'g', k: 111, p: 2.6, g: 23, l: 0.9 },
    { name: 'Quinoa', qty: 100, unit: 'g', k: 120, p: 4.4, g: 21, l: 1.9 },
    { name: 'P\u00e2tes compl\u00e8tes', qty: 100, unit: 'g', k: 157, p: 5.8, g: 30, l: 1.0 },
    { name: 'Couscous', qty: 100, unit: 'g', k: 112, p: 3.8, g: 23, l: 0.2 },
    { name: 'Lentilles', qty: 100, unit: 'g', k: 116, p: 9.0, g: 20, l: 0.4 },
    { name: 'Pois chiches', qty: 100, unit: 'g', k: 164, p: 8.9, g: 27, l: 2.6 },
    { name: 'Patate douce r\u00f4tie', qty: 100, unit: 'g', k: 90, p: 1.8, g: 21, l: 0.1 },
    { name: 'Boulgour', qty: 100, unit: 'g', k: 83, p: 3.1, g: 18, l: 0.2 },
    // Marocains & méditerranéens
    { name: 'Riz blanc', qty: 100, unit: 'g', k: 130, p: 2.7, g: 28, l: 0.3 },
    { name: 'Semoule cuite', qty: 100, unit: 'g', k: 112, p: 3.8, g: 23, l: 0.2 },
    { name: 'Pain marocain (khobz)', qty: 50, unit: 'g', k: 130, p: 4.2, g: 26, l: 1.1 },
    { name: 'Haricots rouges', qty: 100, unit: 'g', k: 127, p: 8.7, g: 22, l: 0.5 },
    { name: 'Haricots blancs', qty: 100, unit: 'g', k: 116, p: 8.0, g: 20, l: 0.4 },
    { name: 'F\u00e8ves cuites', qty: 100, unit: 'g', k: 88, p: 7.6, g: 14, l: 0.6 },
    { name: 'Bl\u00e9 complet cuit', qty: 100, unit: 'g', k: 124, p: 5.0, g: 26, l: 1.0 },
    { name: 'Pomme de terre vapeur', qty: 100, unit: 'g', k: 77, p: 2.0, g: 17, l: 0.1 },
    { name: 'Orge perl\u00e9 cuit', qty: 100, unit: 'g', k: 123, p: 2.3, g: 28, l: 0.4 },
    // Prestige
    { name: 'Riz noir V\u00e9n\u00e9r\u00e9', qty: 100, unit: 'g', k: 130, p: 3.5, g: 26, l: 1.2, premium: true },
    { name: 'Freekeh', qty: 100, unit: 'g', k: 112, p: 5.0, g: 22, l: 0.8, premium: true },
    { name: 'Sarrasin grill\u00e9', qty: 100, unit: 'g', k: 108, p: 4.0, g: 22, l: 1.1, premium: true },
    { name: 'Orzo gratin\u00e9', qty: 100, unit: 'g', k: 150, p: 5.2, g: 29, l: 1.0, premium: true },
    { name: 'Msemen', qty: 50, unit: 'g', k: 160, p: 4.5, g: 28, l: 3.5, premium: true },
    { name: 'M\u00e2che', qty: 60, unit: 'g', k: 13, p: 1.8, g: 1.2, l: 0.4, premium: true }
  ],
  proteins: [
    // Classiques
    { name: 'Poulet grill\u00e9', qty: 100, unit: 'g', k: 165, p: 31, g: 0, l: 3.6 },
    { name: 'Thon en bo\u00eete', qty: 100, unit: 'g', k: 132, p: 28, g: 0, l: 1.5 },
    { name: 'Saumon', qty: 100, unit: 'g', k: 208, p: 20, g: 0, l: 13 },
    { name: 'Crevettes', qty: 100, unit: 'g', k: 85, p: 18, g: 0, l: 0.9 },
    { name: '\u0152uf mollet', qty: 60, unit: 'g', k: 91, p: 7.5, g: 0.4, l: 6.3 },
    { name: 'Tofu ferme', qty: 100, unit: 'g', k: 76, p: 8.0, g: 1.9, l: 4.2 },
    { name: 'B\u0153uf hach\u00e9 5%', qty: 100, unit: 'g', k: 137, p: 22, g: 0, l: 5.0 },
    { name: 'Feta AOP', qty: 50, unit: 'g', k: 133, p: 7.2, g: 1.1, l: 10.7 },
    { name: 'Mozzarella di bufala', qty: 60, unit: 'g', k: 140, p: 9.5, g: 1.2, l: 11 },
    { name: 'Saumon fum\u00e9', qty: 60, unit: 'g', k: 104, p: 11, g: 0, l: 6.5 },
    // Marocains & méditerranéens
    { name: 'Sardines \u00e0 l\u2019huile \u00e9goutt\u00e9es', qty: 80, unit: 'g', k: 157, p: 17, g: 0, l: 10 },
    { name: 'Kefta grill\u00e9e', qty: 100, unit: 'g', k: 218, p: 17, g: 2, l: 15 },
    { name: 'Merguez (tranche)', qty: 60, unit: 'g', k: 175, p: 9, g: 1, l: 15 },
    { name: 'Anchois (bo\u00eete)', qty: 30, unit: 'g', k: 59, p: 8.2, g: 0, l: 2.8 },
    { name: 'Blanc d\u2019\u0153uf cuit', qty: 50, unit: 'g', k: 26, p: 5.5, g: 0.4, l: 0.1 },
    { name: 'Jben (fromage frais marocain)', qty: 50, unit: 'g', k: 85, p: 5.5, g: 2, l: 6.5 },
    { name: 'Merlan frit', qty: 80, unit: 'g', k: 112, p: 18, g: 3, l: 3.5 },
    // Prestige
    { name: 'Burrata', qty: 80, unit: 'g', k: 196, p: 9.6, g: 1.6, l: 16.8, premium: true },
    { name: 'Gravlax maison', qty: 60, unit: 'g', k: 120, p: 12, g: 0.5, l: 7.8, premium: true },
    { name: 'Crevettes tigre', qty: 100, unit: 'g', k: 99, p: 21, g: 0, l: 1.1, premium: true },
    { name: 'Poulpe grill\u00e9', qty: 80, unit: 'g', k: 65, p: 13, g: 1.5, l: 0.8, premium: true },
    { name: 'Steak de thon snack\u00e9', qty: 100, unit: 'g', k: 144, p: 30, g: 0, l: 2.0, premium: true },
    { name: 'Edamame', qty: 80, unit: 'g', k: 110, p: 10, g: 8, l: 4.7, premium: true },
    { name: 'Tofu soyeux', qty: 100, unit: 'g', k: 55, p: 6.0, g: 2.0, l: 2.7, premium: true },
    { name: 'Thon rouge frais', qty: 100, unit: 'g', k: 144, p: 30, g: 0, l: 2.0, premium: true },
    { name: 'Crevettes royales', qty: 100, unit: 'g', k: 90, p: 19, g: 0, l: 1.2, premium: true },
    { name: 'Dorade grill\u00e9e', qty: 100, unit: 'g', k: 121, p: 22, g: 0, l: 3.5, premium: true },
    { name: 'Poulpe marocain', qty: 80, unit: 'g', k: 61, p: 13, g: 1.5, l: 0.7, premium: true },
    { name: 'Fromage smen', qty: 20, unit: 'g', k: 148, p: 0.5, g: 0, l: 16, premium: true }
  ],
  veggies: [
    // Classiques
    { name: 'Tomates cerises', qty: 100, unit: 'g', k: 18, p: 0.9, g: 3.9, l: 0.2 },
    { name: 'Concombre', qty: 100, unit: 'g', k: 15, p: 0.7, g: 3.6, l: 0.1 },
    { name: '\u00c9pinards baby', qty: 80, unit: 'g', k: 18, p: 2.3, g: 2.9, l: 0.3 },
    { name: 'Roquette', qty: 50, unit: 'g', k: 13, p: 1.3, g: 2.0, l: 0.4 },
    { name: 'Carottes r\u00e2p\u00e9es', qty: 80, unit: 'g', k: 33, p: 0.7, g: 7.7, l: 0.1 },
    { name: 'Poivron rouge', qty: 80, unit: 'g', k: 25, p: 0.8, g: 5.9, l: 0.2 },
    { name: 'Champignons', qty: 80, unit: 'g', k: 18, p: 1.8, g: 3.3, l: 0.1 },
    { name: 'Ma\u00efs doux', qty: 60, unit: 'g', k: 70, p: 2.1, g: 15, l: 0.6 },
    { name: 'Haricots verts', qty: 80, unit: 'g', k: 22, p: 1.8, g: 5.0, l: 0.1 },
    { name: 'Oignons rouges', qty: 40, unit: 'g', k: 17, p: 0.5, g: 3.9, l: 0.1 },
    // Marocains & méditerranéens
    { name: 'Zaalouk (aubergine tomate)', qty: 80, unit: 'g', k: 52, p: 1.2, g: 6, l: 2.8 },
    { name: 'Taktouka (poivron tomate)', qty: 80, unit: 'g', k: 48, p: 1.5, g: 7, l: 1.8 },
    { name: 'Chakchouka (l\u00e9gumes \u00e9pic\u00e9s)', qty: 80, unit: 'g', k: 55, p: 2, g: 7, l: 2.2 },
    { name: 'Poivron grill\u00e9', qty: 80, unit: 'g', k: 31, p: 1.0, g: 7, l: 0.4 },
    { name: 'Aubergine r\u00f4tie', qty: 80, unit: 'g', k: 23, p: 0.9, g: 5, l: 0.2 },
    { name: 'Brocoli vapeur', qty: 80, unit: 'g', k: 27, p: 2.4, g: 5, l: 0.3 },
    { name: 'Chou-fleur r\u00f4ti', qty: 80, unit: 'g', k: 30, p: 2.3, g: 5.6, l: 0.3 },
    { name: '\u00c9pinards cuits', qty: 80, unit: 'g', k: 23, p: 2.9, g: 3.6, l: 0.3 },
    { name: 'Courgette grill\u00e9e', qty: 80, unit: 'g', k: 18, p: 1.4, g: 3.6, l: 0.2 },
    { name: 'Carottes r\u00f4ties', qty: 80, unit: 'g', k: 47, p: 1.0, g: 11, l: 0.2 },
    { name: 'Tomates Beldi (marocaines)', qty: 100, unit: 'g', k: 20, p: 1.0, g: 4.2, l: 0.3 },
    { name: 'Navet cuit', qty: 80, unit: 'g', k: 22, p: 0.7, g: 5, l: 0.1 },
    { name: 'Petits pois', qty: 80, unit: 'g', k: 64, p: 4.3, g: 11, l: 0.4 },
    { name: 'Haricots verts vapeur', qty: 80, unit: 'g', k: 22, p: 1.8, g: 5, l: 0.1 },
    { name: 'Feuilles de menthe fra\u00eeche', qty: 10, unit: 'g', k: 4, p: 0.3, g: 0.8, l: 0.1 },
    // Prestige
    { name: 'Betterave r\u00f4tie', qty: 80, unit: 'g', k: 46, p: 1.7, g: 10, l: 0.2, premium: true },
    { name: 'Asperges blanches', qty: 80, unit: 'g', k: 18, p: 2.0, g: 3.1, l: 0.1, premium: true },
    { name: 'Fenouil effil\u00f3ch\u00e9', qty: 60, unit: 'g', k: 16, p: 0.6, g: 3.7, l: 0.1, premium: true },
    { name: 'Radis Watermelon', qty: 50, unit: 'g', k: 9, p: 0.4, g: 1.9, l: 0.1, premium: true },
    { name: 'Micro-pousses', qty: 20, unit: 'g', k: 10, p: 1.2, g: 1.0, l: 0.5, premium: true },
    { name: 'Fleurs comestibles', qty: 5, unit: 'g', k: 3, p: 0.2, g: 0.5, l: 0.1, premium: true },
    { name: 'Avocat tranch\u00e9', qty: 60, unit: 'g', k: 96, p: 1.2, g: 5.1, l: 8.8, premium: true },
    { name: 'Tomates Heirloom', qty: 100, unit: 'g', k: 22, p: 1.1, g: 4.8, l: 0.3, premium: true },
    { name: 'C\u00e9leri r\u00e9moulade', qty: 80, unit: 'g', k: 38, p: 0.5, g: 4, l: 2.5, premium: true }
  ],
  fats: [
    // Classiques
    { name: 'Avocat', qty: 60, unit: 'g', k: 96, p: 1.2, g: 5.1, l: 8.8 },
    { name: "Huile d'olive extra-vierge", qty: 10, unit: 'ml', k: 88, p: 0, g: 0, l: 10 },
    { name: 'Amandes effil\u00e9es', qty: 20, unit: 'g', k: 116, p: 4.2, g: 4.4, l: 10 },
    { name: 'Noix de Grenoble', qty: 20, unit: 'g', k: 131, p: 3.0, g: 2.8, l: 13 },
    { name: 'Graines de chia', qty: 15, unit: 'g', k: 73, p: 2.5, g: 6.2, l: 4.6 },
    { name: 'Olives Taggi\u00e0sche', qty: 30, unit: 'g', k: 45, p: 0.3, g: 2.5, l: 4.2 },
    { name: 'Tahini de s\u00e9same blanc', qty: 15, unit: 'g', k: 89, p: 2.5, g: 3.2, l: 8.1 },
    { name: 'Graines de s\u00e9same torr\u00e9fi\u00e9es', qty: 10, unit: 'g', k: 57, p: 1.8, g: 2.3, l: 4.9 },
    // Marocains & méditerranéens
    { name: "Huile d\u2019argan (filet)", qty: 10, unit: 'ml', k: 88, p: 0, g: 0, l: 10 },
    { name: 'Olives beldi marocaines', qty: 30, unit: 'g', k: 52, p: 0.3, g: 0, l: 5.5 },
    { name: 'Olives vertes marin\u00e9es', qty: 30, unit: 'g', k: 42, p: 0.3, g: 0.5, l: 4.5 },
    { name: 'Amandes enti\u00e8res', qty: 20, unit: 'g', k: 116, p: 4.2, g: 4.4, l: 10 },
    { name: 'Pistaches', qty: 20, unit: 'g', k: 113, p: 4.2, g: 5.5, l: 9.2 },
    // Prestige
    { name: 'Huile de truffe blanche', qty: 5, unit: 'ml', k: 44, p: 0, g: 0, l: 5.0, premium: true },
    { name: 'Pignons de pin grill\u00e9s', qty: 15, unit: 'g', k: 102, p: 2.1, g: 2.0, l: 10.2, premium: true },
    { name: 'Noisettes concass\u00e9es', qty: 15, unit: 'g', k: 94, p: 2.3, g: 2.5, l: 9.0, premium: true },
    { name: 'Parmesan 24 mois', qty: 15, unit: 'g', k: 59, p: 5.4, g: 0.3, l: 4.1, premium: true },
    { name: 'Noix de cajou', qty: 20, unit: 'g', k: 113, p: 3.0, g: 6.3, l: 9.0, premium: true },
    { name: 'Amlou (amandes+argan+miel)', qty: 20, unit: 'g', k: 112, p: 3.2, g: 5, l: 9.5, premium: true }
  ],
  sauces: [
    // Classiques
    { name: 'Vinaigrette l\u00e9g\u00e8re', qty: 15, unit: 'ml', k: 45, p: 0, g: 2.0, l: 4.0 },
    { name: 'Jus de citron', qty: 20, unit: 'ml', k: 5, p: 0.1, g: 1.3, l: 0.0 },
    { name: 'Sauce yaourt menthe', qty: 30, unit: 'ml', k: 28, p: 1.8, g: 2.8, l: 0.6 },
    { name: 'Sauce tahini citronn\u00e9e', qty: 20, unit: 'g', k: 60, p: 1.8, g: 3.0, l: 5.0 },
    { name: 'Sauce soja r\u00e9duite', qty: 10, unit: 'ml', k: 6, p: 0.7, g: 0.9, l: 0.0 },
    { name: 'Pesto G\u00eanois', qty: 15, unit: 'g', k: 72, p: 1.5, g: 1.5, l: 7.0 },
    // Prestige
    { name: 'Vinaigrette au miso', qty: 20, unit: 'g', k: 52, p: 1.2, g: 4.5, l: 3.2, premium: true },
    { name: 'Caesar l\u00e9g\u00e8re', qty: 25, unit: 'g', k: 55, p: 2.0, g: 2.5, l: 4.5, premium: true },
    { name: 'Green Goddess', qty: 25, unit: 'g', k: 48, p: 0.8, g: 2.0, l: 4.2, premium: true },
    { name: 'Yuzu kosho', qty: 10, unit: 'g', k: 12, p: 0.4, g: 2.0, l: 0.2, premium: true },
    { name: 'Chermoula', qty: 20, unit: 'g', k: 38, p: 0.5, g: 1.5, l: 3.5, premium: true },
    { name: 'Gribiche express', qty: 25, unit: 'g', k: 68, p: 2.5, g: 1.0, l: 6.0, premium: true },
    // Marocaines & world
    { name: 'Chermoula verte', qty: 20, unit: 'g', k: 38, p: 0.5, g: 1.5, l: 3.5 },
    { name: 'Harissa', qty: 15, unit: 'g', k: 32, p: 1.2, g: 4, l: 1.5 },
    { name: 'Vinaigrette citron-cumin', qty: 15, unit: 'ml', k: 52, p: 0.1, g: 1.5, l: 5.0 },
    { name: 'Sauce \u00e0 l\u2019ail (chtitha)', qty: 20, unit: 'g', k: 45, p: 0.8, g: 3, l: 3.5 },
    { name: 'Sauce yaourt concombre (ra\u00efta)', qty: 30, unit: 'ml', k: 25, p: 1.5, g: 2.5, l: 0.8 },
    { name: 'Huile d\u2019olive citronn\u00e9e', qty: 15, unit: 'ml', k: 130, p: 0, g: 0.2, l: 14.5 },
    { name: 'Sauce tomate \u00e9pic\u00e9e', qty: 30, unit: 'g', k: 28, p: 0.8, g: 5, l: 0.8 },
    { name: 'Sauce tha\u00efe cacahu\u00e8te', qty: 25, unit: 'g', k: 89, p: 3.5, g: 7, l: 5.8, premium: true },
    { name: 'Sauce argan miel', qty: 15, unit: 'ml', k: 96, p: 0.5, g: 8, l: 7, premium: true },
    { name: 'Ponzu maison', qty: 15, unit: 'ml', k: 14, p: 0.5, g: 2.8, l: 0.1, premium: true }
  ]
};

// ─── COMPOSITIONS SIGNATURE ───
// 5 bowls curétés par le "chef" — l'utilisateur adopte et personnalise
var SIGNATURE_BOWLS = [
  {
    id: 'japanese_wave',
    label: 'Vague Japonaise',
    subtitle: 'Fra\u00eecheur umami \u00b7 \u2191 Prot\u00e9ines',
    palette: '#2D6A6A',
    base: 'Riz noir V\u00e9n\u00e9r\u00e9',
    proteins: ['Steak de thon snack\u00e9', 'Edamame'],
    veggies: ['Radis Watermelon', 'Concombre', 'Micro-pousses'],
    fats: ['Graines de s\u00e9same torr\u00e9fi\u00e9es'],
    sauce: 'Yuzu kosho'
  },
  {
    id: 'mediterranean_sun',
    label: 'M\u00e9diterran\u00e9e Dor\u00e9e',
    subtitle: '\u00c9quilibre parfait \u00b7 Anti-inflammatoire',
    palette: '#C47A2B',
    base: 'Freekeh',
    proteins: ['Poulpe grill\u00e9', 'Feta AOP'],
    veggies: ['Tomates Heirloom', 'Fenouil effil\u00f3ch\u00e9', 'Oignons rouges'],
    fats: ['Olives Taggi\u00e0sche', 'Pignons de pin grill\u00e9s'],
    sauce: 'Chermoula'
  },
  {
    id: 'green_goddess_bowl',
    label: 'La D\u00e9esse Verte',
    subtitle: 'D\u00e9tox & vitalit\u00e9 \u00b7 Faible calorie',
    palette: '#2A6A3A',
    base: 'M\u00e2che',
    proteins: ['Tofu soyeux', 'Edamame'],
    veggies: ['\u00c9pinards baby', 'Asperges blanches', 'Avocat tranch\u00e9', 'Micro-pousses'],
    fats: ['Graines de chia'],
    sauce: 'Green Goddess'
  },
  {
    id: 'cesar_prestige',
    label: 'C\u00e9sar R\u00e9invent\u00e9',
    subtitle: 'Classique \u00e9lev\u00e9 \u00b7 \u2191 Sati\u00e9t\u00e9',
    palette: '#5A3A8A',
    base: 'Quinoa',
    proteins: ['Poulet grill\u00e9', 'Parmesan 24 mois'],
    veggies: ['Roquette', 'Tomates cerises', 'Fleurs comestibles'],
    fats: ['Noisettes concass\u00e9es'],
    sauce: 'Caesar l\u00e9g\u00e8re'
  },
  {
    id: 'nordic_gravlax',
    label: 'Nordique Signature',
    subtitle: 'Om\u00e9ga-3 \u00b7 Raffinement scandinave',
    palette: '#3A5A8A',
    base: 'Sarrasin grill\u00e9',
    proteins: ['Gravlax maison'],
    veggies: ['Fenouil effil\u00f3ch\u00e9', 'Radis Watermelon', 'Betterave r\u00f4tie'],
    fats: ['Noix de Grenoble', 'Huile de truffe blanche'],
    sauce: 'Gribiche express'
  }
];

// Résoudre une composition signature en objets SALAD_DB complets
function resolveSignatureBowl(sig) {
  function findItem(cat, name) {
    var list = SALAD_DB[cat];
    for (var i = 0; i < list.length; i++) {
      if (list[i].name === name) return JSON.parse(JSON.stringify(list[i]));
    }
    return null;
  }
  var resolved = { base: null, proteins: [], veggies: [], fats: [], sauce: null };
  resolved.base = findItem('bases', sig.base);
  (sig.proteins || []).forEach(function(n) { var it = findItem('proteins', n); if (it) resolved.proteins.push(it); });
  (sig.veggies || []).forEach(function(n) { var it = findItem('veggies', n); if (it) resolved.veggies.push(it); });
  (sig.fats || []).forEach(function(n) { var it = findItem('fats', n); if (it) resolved.fats.push(it); });
  resolved.sauce = findItem('sauces', sig.sauce);
  return resolved;
}

function calcSaladMacros(sb) {
  // CRITIQUE-E1: guard sb null
  if (!sb) return { k: 0, p: 0, g: 0, l: 0 };
  var total = { k: 0, p: 0, g: 0, l: 0 };
  // IMPORTANT-E2: fallbacks || 0 pour éviter NaN si ingrédient incomplet
  if (sb.base) { total.k += (sb.base.k||0); total.p += (sb.base.p||0); total.g += (sb.base.g||0); total.l += (sb.base.l||0); }
  (sb.proteins || []).forEach(function(x) { total.k += (x.k||0); total.p += (x.p||0); total.g += (x.g||0); total.l += (x.l||0); });
  (sb.veggies || []).forEach(function(x) { total.k += (x.k||0); total.p += (x.p||0); total.g += (x.g||0); total.l += (x.l||0); });
  (sb.fats || []).forEach(function(x) { total.k += (x.k||0); total.p += (x.p||0); total.g += (x.g||0); total.l += (x.l||0); });
  if (sb.sauce) { total.k += (sb.sauce.k||0); total.p += (sb.sauce.p||0); total.g += (sb.sauce.g||0); total.l += (sb.sauce.l||0); }
  return { k: Math.round(total.k), p: Math.round(total.p), g: Math.round(total.g), l: Math.round(total.l) };
}

function renderSaladBar(p) {
  var S = window.S;
  var sb = S.saladBar;
  // CRITIQUE-E1: guard sb null — évite crash si saladBar non initialisé
  if (!sb) { p.innerHTML = ''; return; }
  p.innerHTML = '';

  // Macro targets — calculés selon le slot via getMealSplit()
  var tgtMacros = { k: 600, p: 40, g: 65, l: 20 };
  if (window.calcMacros && window.calcTarget) {
    var dm = window.calcMacros(), dk = window.calcTarget();
    if (dk > 0) {
      var _split = window.getMealSplit ? window.getMealSplit() : null;
      var mealRatio;
      if (_split) {
        var _slotKey = sb.mealTarget || 'lunch';
        if (_slotKey === 'breakfast')    mealRatio = _split.pctBreak;
        else if (_slotKey === 'lunch')   mealRatio = _split.pctLunch;
        else if (_slotKey === 'snack')   mealRatio = _split.pctSnack || 0.10;
        else                             mealRatio = _split.pctDinner;
      } else {
        var _defaults = { breakfast: 0.25, lunch: 0.35, snack: 0.10, dinner: 0.30 };
        mealRatio = _defaults[sb.mealTarget] || 0.35;
      }
      tgtMacros.k = Math.round(dk * mealRatio);
      tgtMacros.p = Math.round(dm.p * mealRatio);
      tgtMacros.g = Math.round(dm.g * mealRatio);
      tgtMacros.l = Math.round(dm.l * mealRatio);
    }
  }

  var macros = calcSaladMacros(sb);
  var pct = tgtMacros.k > 0 ? macros.k / tgtMacros.k : 0;
  var barColor = pct < 0.9 ? 'var(--green,#1A4A1A)' : (pct <= 1.05 ? 'var(--orange,#6A4A1A)' : 'var(--red,#5A1010)');

  // ── Header ──
  var header = h('div', { style: 'display:flex;align-items:center;justify-content:space-between;padding:16px 16px 8px' });
  header.appendChild(h('button', {
    style: 'background:none;border:none;font-size:16px;cursor:pointer;color:var(--text);padding:4px 8px',
    onclick: function() { S.saladBar.open = false; window.render(); }
  }, '\u2190 Retour'));
  header.appendChild(h('div', { style: 'font-size:18px;font-weight:700;color:var(--text);letter-spacing:-0.3px' }, '\u2728 L\u2019Atelier Bowl'));

  // Meal target toggle
  var toggleWrap = h('div', { style: 'display:flex;gap:4px;flex-wrap:wrap' });
  [
    { slot: 'breakfast', label: window.t('onb.s9.breakfast') },
    { slot: 'lunch',     label: window.t('onb.s9.lunch') },
    { slot: 'snack',     label: window.t('onb.s9.snack') },
    { slot: 'dinner',    label: window.t('onb.s9.dinner') }
  ].forEach(function(item) {
    toggleWrap.appendChild(h('button', {
      style: 'padding:6px 14px;border-radius:2px;border:1px solid ' + (sb.mealTarget === item.slot ? 'var(--black,#0A0A09)' : 'var(--border)') + ';background:' + (sb.mealTarget === item.slot ? 'var(--black,#0A0A09)' : 'transparent') + ';color:' + (sb.mealTarget === item.slot ? 'var(--ivory,#FAF9F6)' : 'var(--grey,#6B6B65)') + ';font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;cursor:pointer',
      onclick: (function(s) { return function() { sb.mealTarget = s; window.render(); }; })(item.slot)
    }, item.label));
  });
  header.appendChild(toggleWrap);
  p.appendChild(header);

  // ── Macro progress bar (sticky) ──
  var progressBar = h('div', { style: 'position:sticky;top:0;z-index:10;background:var(--ivory,#FAF9F6);padding:10px 16px;border-bottom:1px solid var(--border,#D8D8D0)' });
  var kcalRow = h('div', { style: 'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px' });
  kcalRow.appendChild(h('span', { style: 'font-family:Georgia,serif;font-size:14px;color:' + barColor }, macros.k + ' / ' + tgtMacros.k + ' kcal'));
  kcalRow.appendChild(h('span', { style: 'font-size:11px;color:var(--grey)' }, Math.round(pct * 100) + '%'));
  progressBar.appendChild(kcalRow);

  var barTrack = h('div', { style: 'height:8px;background:var(--border);border-radius:2px;overflow:hidden;margin-bottom:8px' });
  barTrack.appendChild(h('div', { style: 'height:100%;width:' + Math.min(pct * 100, 100) + '%;background:' + barColor + ';border-radius:2px;transition:width 0.2s ease' }));
  progressBar.appendChild(barTrack);

  var chipsRow = h('div', { style: 'display:flex;gap:8px' });
  [
    { label: 'P', cur: macros.p, tgt: tgtMacros.p, cssClass: 'macro-fill-protein' },
    { label: 'G', cur: macros.g, tgt: tgtMacros.g, cssClass: 'macro-fill-carbs' },
    { label: 'L', cur: macros.l, tgt: tgtMacros.l, cssClass: 'macro-fill-fat' }
  ].forEach(function(m) {
    var macroColor = m.cssClass === 'macro-fill-protein' ? 'var(--green)' : m.cssClass === 'macro-fill-carbs' ? 'var(--blue, #6A9ADA)' : 'var(--orange)';
    var valEl = h('div', { style: 'font-size:13px;font-weight:700;color:' + macroColor });
    valEl.appendChild(document.createTextNode(m.cur));
    var tgtSpan = h('span', { style: 'font-weight:400;color:var(--grey)' }, '/' + m.tgt + 'g');
    valEl.appendChild(tgtSpan);
    chipsRow.appendChild(h('div', { style: 'flex:1;background:var(--card);border-radius:2px;padding:4px 8px;text-align:center;border:1px solid var(--border)' }, [
      h('div', { style: 'font-size:9px;color:var(--grey);text-transform:uppercase;letter-spacing:1px' }, m.label),
      valEl
    ]));
  });
  progressBar.appendChild(chipsRow);
  p.appendChild(progressBar);

  // ── Compositions Signature carousel ──
  var sigSection = h('div', { style: 'padding:12px 16px 4px' });
  sigSection.appendChild(h('div', {
    style: 'font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-bottom:10px'
  }, '★ Signatures du chef'));
  var sigScroll = h('div', {
    style: 'display:flex;gap:10px;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch;scrollbar-width:none'
  });
  SIGNATURE_BOWLS.forEach(function(sig) {
    var isActive = sb._signatureId === sig.id;
    var card = h('button', {
      style: 'flex:0 0 auto;width:150px;padding:10px 12px;border-radius:2px;border:1.5px solid ' +
        (isActive ? sig.palette : 'var(--border)') +
        ';background:' + (isActive ? sig.palette + '18' : 'var(--card)') +
        ';text-align:left;cursor:pointer;transition:all 0.2s',
      onclick: function() {
        var resolved = resolveSignatureBowl(sig);
        sb.base = resolved.base;
        sb.proteins = resolved.proteins;
        sb.veggies = resolved.veggies;
        sb.fats = resolved.fats;
        sb.sauce = resolved.sauce;
        sb._signatureId = isActive ? null : sig.id;
        window.render();
      }
    });
    card.appendChild(h('div', {
      style: 'font-size:13px;font-weight:700;color:' + sig.palette + ';margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis'
    }, sig.label));
    card.appendChild(h('div', {
      style: 'font-size:11px;color:var(--grey);line-height:1.3;white-space:normal'
    }, sig.subtitle));
    sigScroll.appendChild(card);
  });
  sigSection.appendChild(sigScroll);
  p.appendChild(sigSection);

  // ── Helper: render ingredient section ──
  function renderSection(title, icon, items, selectedItems, isRadio, maxSel, onToggle, onQty) {
    var sec = h('div', { style: 'padding:12px 16px' });
    sec.appendChild(h('div', { style: 'font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-bottom:8px' }, icon + ' ' + title));
    var grid = h('div', { style: 'display:flex;flex-wrap:wrap;gap:6px' });
    items.forEach(function(item) {
      var selIdx = -1;
      if (isRadio) {
        selIdx = (selectedItems && selectedItems.name === item.name) ? 0 : -1;
      } else {
        for (var i = 0; i < selectedItems.length; i++) {
          if (selectedItems[i].name === item.name) { selIdx = i; break; }
        }
      }
      var isSel = selIdx >= 0;
      var canAdd = isSel || isRadio || selectedItems.length < maxSel;
      var chipStyle = 'padding:5px 10px;border-radius:2px;border:1.5px solid ' +
        (isSel ? 'var(--green,#1A4A1A)' : 'var(--border)') +
        ';background:' + (isSel ? 'var(--greenbg,rgba(26,74,26,.06))' : 'var(--card)') +
        ';color:var(--text);font-size:13px;cursor:' + (canAdd ? 'pointer' : 'not-allowed') +
        ';font-weight:' + (isSel ? '700' : '400') +
        ';opacity:' + (canAdd ? '1' : '0.45') + ';transition:all 0.2s';
      var chipLabel = item.premium ? (item.name + ' ◆') : item.name;
      var chipBtn = h('button', {
        style: chipStyle + (item.premium && !isSel ? ';border-style:dashed' : ''),
        onclick: function() { if (canAdd || isSel) onToggle(item); }
      }, chipLabel);
      grid.appendChild(chipBtn);
    });
    sec.appendChild(grid);

    // Qty controls for selected items
    var selList = isRadio ? (selectedItems ? [selectedItems] : []) : selectedItems;
    if (selList.length > 0) {
      var qtyWrap = h('div', { style: 'margin-top:8px;display:flex;flex-direction:column;gap:4px' });
      selList.forEach(function(sel, idx) {
        var qRow = h('div', { style: 'display:flex;align-items:center;justify-content:space-between;background:var(--card);border-radius:2px;padding:4px 10px;border:1px solid var(--border)' });
        qRow.appendChild(h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--black,#0A0A09)' }, sel.name));
        var qCtrl = h('div', { style: 'display:flex;align-items:center;gap:6px' });
        var step = sel.unit === 'ml' ? 10 : 25;
        qCtrl.appendChild(h('button', {
          style: 'width:24px;height:24px;border-radius:2px;border:1px solid var(--border,#D8D8D0);background:var(--ivory2,#F4F4F0);font-size:13px;cursor:pointer;color:var(--grey,#6B6B65);display:flex;align-items:center;justify-content:center;transition:border-color .2s',
          onclick: function() { onQty(sel, -step); }
        }, '\u2212'));
        qCtrl.appendChild(h('span', { style: 'font-family:Georgia,serif;font-size:13px;min-width:50px;text-align:center;color:var(--black,#0A0A09)' }, sel.qty + sel.unit));
        qCtrl.appendChild(h('button', {
          style: 'width:24px;height:24px;border-radius:2px;border:1px solid var(--border,#D8D8D0);background:var(--ivory2,#F4F4F0);font-size:13px;cursor:pointer;color:var(--grey,#6B6B65);display:flex;align-items:center;justify-content:center;transition:border-color .2s',
          onclick: function() { onQty(sel, step); }
        }, '+'));
        var selMacros = computeItemMacros(sel);
        qCtrl.appendChild(h('span', { style: 'font-size:11px;color:var(--grey);min-width:60px;text-align:right' }, selMacros.k + 'kcal'));
        qRow.appendChild(qCtrl);
        qtyWrap.appendChild(qRow);
      });
      sec.appendChild(qtyWrap);
    }
    return sec;
  }

  // ── Helper: compute macros proportional to current qty ──
  function computeItemMacros(item) {
    var dbItem = findInDb(item.name);
    if (!dbItem) return { k: item.k, p: item.p, g: item.g, l: item.l };
    var ratio = dbItem.qty ? (item.qty / dbItem.qty) : 1;
    return {
      k: Math.round(dbItem.k * ratio),
      p: Math.round(dbItem.p * ratio * 10) / 10,
      g: Math.round(dbItem.g * ratio * 10) / 10,
      l: Math.round(dbItem.l * ratio * 10) / 10
    };
  }

  function findInDb(name) {
    var cats = ['bases', 'proteins', 'veggies', 'fats', 'sauces'];
    for (var c = 0; c < cats.length; c++) {
      var list = SALAD_DB[cats[c]];
      for (var i = 0; i < list.length; i++) {
        if (list[i].name === name) return list[i];
      }
    }
    return null;
  }

  function adjustQty(item, delta) {
    var dbItem = findInDb(item.name);
    var minQty = dbItem ? Math.round(dbItem.qty / 4) : 10;
    var newQty = Math.max(minQty, item.qty + delta);
    var ratio = newQty / (dbItem ? (dbItem.qty || 1) : (item.qty || 1));
    item.qty = newQty;
    if (dbItem) {
      item.k = Math.round(dbItem.k * ratio);
      item.p = Math.round(dbItem.p * ratio * 10) / 10;
      item.g = Math.round(dbItem.g * ratio * 10) / 10;
      item.l = Math.round(dbItem.l * ratio * 10) / 10;
    }
    window.render();
  }

  function cloneItem(item) {
    return { name: item.name, qty: item.qty, unit: item.unit, k: item.k, p: item.p, g: item.g, l: item.l };
  }

  // ── Base ──
  p.appendChild(renderSection(
    'La Base', '\uD83C\uDF3E',
    SALAD_DB.bases, sb.base, true, 1,
    function(item) {
      if (sb.base && sb.base.name === item.name) { sb.base = null; }
      else { sb.base = cloneItem(item); }
      window.render();
    },
    function(sel, delta) { adjustQty(sel, delta); }
  ));

  // ── Proteins ──
  p.appendChild(renderSection(
    'Prot\u00e9ines nobles', '\uD83E\uDDC0',
    SALAD_DB.proteins, sb.proteins, false, 3,
    function(item) {
      var idx = -1;
      for (var i = 0; i < sb.proteins.length; i++) { if (sb.proteins[i].name === item.name) { idx = i; break; } }
      if (idx >= 0) { sb.proteins.splice(idx, 1); }
      else if (sb.proteins.length < 3) { sb.proteins.push(cloneItem(item)); }
      window.render();
    },
    function(sel, delta) { adjustQty(sel, delta); }
  ));

  // ── Veggies ──
  p.appendChild(renderSection(
    'Jardini\u00e8re', '\uD83C\uDF31',
    SALAD_DB.veggies, sb.veggies, false, 10,
    function(item) {
      var idx = -1;
      for (var i = 0; i < sb.veggies.length; i++) { if (sb.veggies[i].name === item.name) { idx = i; break; } }
      if (idx >= 0) { sb.veggies.splice(idx, 1); }
      else { sb.veggies.push(cloneItem(item)); }
      window.render();
    },
    function(sel, delta) { adjustQty(sel, delta); }
  ));

  // ── Fats ──
  p.appendChild(renderSection(
    'Finitions & textures', '\u2728',
    SALAD_DB.fats, sb.fats, false, 3,
    function(item) {
      var idx = -1;
      for (var i = 0; i < sb.fats.length; i++) { if (sb.fats[i].name === item.name) { idx = i; break; } }
      if (idx >= 0) { sb.fats.splice(idx, 1); }
      else if (sb.fats.length < 3) { sb.fats.push(cloneItem(item)); }
      window.render();
    },
    function(sel, delta) { adjustQty(sel, delta); }
  ));

  // ── Sauce ──
  p.appendChild(renderSection(
    'L\u2019assaisonnement', '\uD83C\uDF3F',
    SALAD_DB.sauces, sb.sauce, true, 1,
    function(item) {
      if (sb.sauce && sb.sauce.name === item.name) { sb.sauce = null; }
      else { sb.sauce = cloneItem(item); }
      window.render();
    },
    function(sel, delta) { adjustQty(sel, delta); }
  ));

  // ── Recap + Actions ──
  var recap = h('div', { style: 'padding:16px;background:var(--card);margin:8px 16px;border-radius:2px;border:1px solid var(--border)' });
  recap.appendChild(h('div', { style: 'font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-bottom:10px' }, 'Votre composition'));

  var allItems = [];
  if (sb.base) allItems.push(sb.base);
  sb.proteins.forEach(function(x) { allItems.push(x); });
  sb.veggies.forEach(function(x) { allItems.push(x); });
  sb.fats.forEach(function(x) { allItems.push(x); });
  if (sb.sauce) allItems.push(sb.sauce);

  if (allItems.length === 0) {
    recap.appendChild(h('div', { style: 'color:var(--grey);font-size:13px;text-align:center;padding:12px' }, 'Composez votre cr\u00e9ation ou partez d\u2019une composition signature ci-dessus'));
  } else {
    allItems.forEach(function(item) {
      var m = computeItemMacros(item);
      var row = h('div', { style: 'display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border)' });
      row.appendChild(h('span', { style: 'font-size:13px;color:var(--text)' }, item.name + ' ' + item.qty + item.unit));
      row.appendChild(h('span', { style: 'font-size:11px;color:var(--grey)' }, m.k + 'kcal \u00b7 P' + m.p + ' G' + m.g + ' L' + m.l));
      recap.appendChild(row);
    });
    var totalRow = h('div', { style: 'display:flex;justify-content:space-between;padding:8px 0 0;font-weight:700' });
    totalRow.appendChild(h('span', { style: 'font-size:13px;color:var(--text)' }, 'Total'));
    totalRow.appendChild(h('span', { style: 'font-size:13px;color:' + barColor }, macros.k + 'kcal \u00b7 P' + macros.p + ' G' + macros.g + ' L' + macros.l));
    recap.appendChild(totalRow);
  }
  p.appendChild(recap);

  // ── Action buttons ──
  var actWrap = h('div', { style: 'padding:8px 16px 24px;display:flex;flex-direction:column;gap:8px' });

  var btnAdd = h('button', {
    style: 'width:100%;padding:14px;min-height:44px;border:none;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;cursor:' + (allItems.length > 0 ? 'pointer' : 'not-allowed') + ';opacity:' + (allItems.length > 0 ? '1' : '0.5'),
    onclick: function() {
      if (allItems.length === 0) return;
      var slot = sb.mealTarget;
      var saladIngredients = allItems.map(function(x) { return x.name + ' ' + x.qty + x.unit; }).join(', ');
      var saladRecipe = {
        _id: 'SALAD_' + Date.now(),
        n: 'Mon Atelier Bowl \u2728',
        k: macros.k, p: macros.p, g: macros.g, l: macros.l,
        f: '\uD83E\uDD57',
        lv: 1,
        i: saladIngredients,
        _scaledIngredients: allItems.slice(),
        _scalingRatio: 1,
        tags: ['atelier', 'bowl', 'custom'],
        st: ['Pr\u00e9parez et templ\u00e9risez vos ingr\u00e9dients.', 'Disposez la base au fond du bol.', 'Ajoutez les prot\u00e9ines et les garnitures.', 'Nappez de sauce au dernier moment et servez.']
      };
      if (!S.weekPlan) S.weekPlan = [];
      if (!S.weekPlan[S.selectedDay]) S.weekPlan[S.selectedDay] = {};
      S.weekPlan[S.selectedDay][slot] = saladRecipe;
      S.saladBar.open = false;
      try { if (window.saveProfile) window.saveProfile(); } catch(e) { console.warn('[nutrition] saladBar saveProfile error:', e); }
      window.render();
    }
  }, 'Valider ma composition — ' + (sb.mealTarget === 'breakfast' ? window.t('onb.s9.breakfast') : sb.mealTarget === 'snack' ? window.t('onb.s9.snack') : sb.mealTarget === 'dinner' ? window.t('onb.s9.dinner') : window.t('onb.s9.lunch')));
  actWrap.appendChild(btnAdd);

  actWrap.appendChild(h('button', {
    'class': 'btn-secondary',
    onclick: function() {
      sb.base = null; sb.proteins = []; sb.veggies = []; sb.fats = []; sb.sauce = null;
      window.render();
    }
  }, 'Repartir de z\u00e9ro'));

  p.appendChild(actWrap);
}

// ─── WHEY SMOOTHIES DATABASE ───
var WHEY_SMOOTHIES = [
  // === CHOCOLAT ===
  { id:'sm_choco_01', name:'Chocolat Noir Énergie', flavors:['chocolate'], goal:['muscle','performance'], timing:'post', cal:380, p:35, c:42, f:8, prep:'3min',
    ingredients:[{name:'Whey chocolat',qty:30,unit:'g'},{name:'Lait écrémé',qty:250,unit:'ml'},{name:'Banane congelée',qty:100,unit:'g'},{name:'Cacao pur',qty:10,unit:'g'},{name:'Beurre d\'amande',qty:15,unit:'g'}],
    steps:['Verser le lait écrémé en premier, puis le beurre d\'amande — cela évite qu\'il colle aux parois.','Ajouter la banane congelée coupée en tronçons, puis tamiser le cacao pur directement sur les autres ingrédients.','Incorporer la whey en dernier, mixer 50 secondes à puissance maximale jusqu\'à consistance veloutée.','Ajouter 1 pincée de fleur de sel avant de servir — elle réveille les notes torréfiées du cacao.'],
    tips:'Le beurre d\'amande mixé froid avec la banane congelée crée une émulsion naturelle : plus de mousse, moins d\'air, une texture digne d\'une ganache fluide.' },
  { id:'sm_choco_02', name:'Brownie Shake Récupération', flavors:['chocolate'], goal:['muscle','recovery'], timing:'post', cal:433, p:40, c:48, f:9, prep:'4min',
    ingredients:[{name:'Whey chocolat',qty:35,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Flocons d\'avoine',qty:40,unit:'g'},{name:'Cacao pur',qty:8,unit:'g'},{name:'Datte Medjool',qty:2,unit:'pce'}],
    steps:['Dénoyauter les dattes et les mixer 20 secondes avec le lait entier chaud (60 °C) — la chaleur liquéfie leur sucre et fond l\'amidon des flocons.','Laisser tiédir 2 minutes, puis ajouter flocons d\'avoine, cacao tamisé et whey chocolat.','Mixer 60 secondes à puissance max pour obtenir une texture onctueuse rappelant la pâte à brownie cuite.','Boire à température ambiante ou légèrement tiède — la chaleur double la perception des arômes de cacao.'],
    tips:'Une datte Medjool fondue dans du lait chaud se comporte comme un caramel naturel : elle lie, sucre et apporte une profondeur vanillée que le sucre blanc ne peut pas imiter.' },
  { id:'sm_choco_03', name:'Chocolat Menthe Explosif', flavors:['chocolate'], goal:['fat_loss','performance'], timing:'pre', cal:290, p:32, c:28, f:6, prep:'2min',
    ingredients:[{name:'Whey chocolat',qty:30,unit:'g'},{name:'Eau froide',qty:300,unit:'ml'},{name:'Épinards frais',qty:30,unit:'g'},{name:'Menthe fraîche',qty:5,unit:'g'},{name:'Glaçons',qty:100,unit:'g'}],
    steps:['Mixer l\'eau glacée avec les épinards frais 20 secondes — la base verte doit être parfaitement lisse avant d\'introduire la menthe.','Frotter les feuilles de menthe entre les paumes pour libérer les huiles essentielles, puis les ajouter avec les glaçons.','Incorporer la whey en dernier, mixer 30 secondes supplémentaires à vitesse maximale, servir aussitôt dans un verre préalablement réfrigéré.'],
    tips:'Froisser la menthe à la main juste avant de mixer libère 30 % d\'arôme supplémentaire. C\'est le même geste qu\'on utilise pour un mojito — et le résultat est tout aussi saisissant.' },

  // === VANILLE ===
  { id:'sm_van_01', name:'Vanilla Cream Gainer', flavors:['vanilla'], goal:['muscle'], timing:'post', cal:500, p:38, c:65, f:10, prep:'3min',
    ingredients:[{name:'Whey vanille',qty:35,unit:'g'},{name:'Lait entier',qty:250,unit:'ml'},{name:'Flocons d\'avoine',qty:50,unit:'g'},{name:'Miel',qty:15,unit:'g'},{name:'Vanille extrait',qty:2,unit:'ml'}],
    steps:['Tremper les flocons d\'avoine 2 minutes dans le lait tiède — ils gonflent et libèrent leur amidon pour une texture veloutée.','Verser la préparation dans le blender, ajouter la whey, le miel et l\'extrait de vanille.','Mixer 40 secondes à vitesse maximale jusqu\'à obtenir une consistance lisse et nappante.','Déguster immédiatement dans un verre refroidi au congélateur 5 minutes.'],
    tips:'Le trempage court des flocons est le secret d\'une texture crémeuse sans grains — la vanille s\'exprime mieux dans une base légèrement tiède avant d\'être émulsionnée.' },
  { id:'sm_van_02', name:'Vanilla Latte Matin', flavors:['vanilla','coffee'], goal:['performance','fat_loss'], timing:'pre', cal:310, p:33, c:30, f:7, prep:'3min',
    ingredients:[{name:'Whey vanille',qty:30,unit:'g'},{name:'Café expresso froid',qty:60,unit:'ml'},{name:'Lait d\'amande',qty:200,unit:'ml'},{name:'Glaçons',qty:80,unit:'g'},{name:'Cannelle',qty:1,unit:'g'}],
    steps:['Préparer l\'expresso la veille et le réfrigérer — un café froid révèle des notes de caramel absent du café chaud.','Verser le lait d\'amande, le café froid et les glaçons dans le blender, mixer 20 secondes.','Ajouter la whey et mixer 15 secondes — pas davantage pour ne pas oxyder les arômes.','Servir dans un verre givre, saupoudrer la cannelle d\'un geste circulaire au dernier moment.'],
    tips:'La cannelle posée en surface, jamais mixée, libère ses huiles essentielles au contact des lèvres — le parfum précède le goût et annonce la vanille.' },
  { id:'sm_van_03', name:'Vanilla Banana Overnight', flavors:['vanilla','banana'], goal:['muscle','recovery'], timing:'anytime', cal:440, p:36, c:55, f:8, prep:'5min',
    ingredients:[{name:'Whey vanille',qty:30,unit:'g'},{name:'Lait écrémé',qty:200,unit:'ml'},{name:'Banane',qty:120,unit:'g'},{name:'Flocons d\'avoine',qty:40,unit:'g'},{name:'Graines de chia',qty:10,unit:'g'}],
    steps:['Mixer le lait avec la banane et la whey vanille 30 secondes — la banane très mûre donne un fil de caramel naturel.','Verser dans un récipient hermétique, incorporer les flocons et les graines de chia en remuant doucement.','Réfrigérer au moins 2 heures — la nuit idéalement — pour que le chia gélifie et que les saveurs se fondent.'],
    tips:'Choisissez une banane dont la peau montre des taches noires : c\'est là que les sucres simples se convertissent en esters fruités qui amplifient la vanille.' },

  // === FRAISE ===
  { id:'sm_straw_01', name:'Fraise Citron Vitalité', flavors:['strawberry','lemon'], goal:['fat_loss','performance'], timing:'post', cal:280, p:30, c:32, f:3, prep:'3min',
    ingredients:[{name:'Whey fraise',qty:25,unit:'g'},{name:'Fraises congelées',qty:150,unit:'g'},{name:'Jus de citron',qty:30,unit:'ml'},{name:'Eau',qty:200,unit:'ml'},{name:'Stevia',qty:1,unit:'g'}],
    steps:['Sortir les fraises congelées 5 min à température ambiante — elles libèrent davantage de jus et d\'arôme.','Mixer fraises + jus de citron + stevia 20 secondes à puissance maximale pour émulsionner.','Ajouter la whey + eau glacée, mixer 10 secondes supplémentaires — ne pas sur-mixer pour garder la fraîcheur.','Servir immédiatement dans un verre préalablement réfrigéré.'],
    tips:'Le citron ne masque pas la fraise — il en amplifie les arômes fruités par contraste acide. Une pincée de fleur de sel magnifie le tout.' },
  { id:'sm_straw_02', name:'Strawberry Cheesecake Shake', flavors:['strawberry'], goal:['muscle','anytime'], timing:'anytime', cal:390, p:38, c:38, f:9, prep:'4min',
    ingredients:[{name:'Whey fraise',qty:30,unit:'g'},{name:'Fromage blanc 0%',qty:100,unit:'g'},{name:'Fraises',qty:100,unit:'g'},{name:'Lait',qty:150,unit:'ml'},{name:'Vanille',qty:1,unit:'g'}],
    steps:['Mixer les fraises seules 15 secondes pour obtenir un coulis grossier — la base aromatique du shake.','Ajouter le lait froid, le fromage blanc, la vanille et la whey ; mixer 25 secondes à vitesse moyenne.','Ajuster la consistance avec un trait de lait si trop épais, puis servir sans attendre.'],
    tips:'Infuser la vanille dans le lait froid 10 minutes avant de mixer : l\'arôme se diffuse de façon infiniment plus profonde qu\'en ajout direct.' },

  // === CACAHUÈTE ===
  { id:'sm_peanut_01', name:'PB&J Power Shake', flavors:['peanut','strawberry'], goal:['muscle','performance'], timing:'post', cal:474, p:42, c:45, f:14, prep:'3min',
    ingredients:[{name:'Whey cacahuète',qty:30,unit:'g'},{name:'Beurre de cacahuète',qty:20,unit:'g'},{name:'Fraises congelées',qty:80,unit:'g'},{name:'Lait écrémé',qty:250,unit:'ml'},{name:'Miel',qty:10,unit:'g'}],
    steps:['Congeler les fraises 1h minimum — elles épaississent sans diluer.','Chauffer légèrement le beurre de cacahuète 10 secondes au micro-ondes pour le fluidifier avant de mixer.','Mixer à pleine puissance 45 secondes, puis incorporer le miel en filet et mixer 5 secondes.'],
    tips:'Une goutte d\'extrait de vanille révèle la noisette naturelle de la cacahuète. La fraise apporte l\'acidité qui équilibre — ne pas la supprimer.' },
  { id:'sm_peanut_02', name:'Cacahuète Chocolat Noir Ultime', flavors:['peanut','chocolate'], goal:['muscle'], timing:'anytime', cal:464, p:40, c:40, f:16, prep:'3min',
    ingredients:[{name:'Whey cacahuète',qty:25,unit:'g'},{name:'Whey chocolat',qty:15,unit:'g'},{name:'Beurre d\'arachide',qty:25,unit:'g'},{name:'Lait entier',qty:250,unit:'ml'},{name:'Banane',qty:80,unit:'g'}],
    steps:['Congeler la banane coupée en rondelles la veille — texture veloutée et froide garantie.','Mixer d\'abord le beurre d\'arachide avec le lait chaud pour émulsionner les matières grasses.','Ajouter les wheys et la banane congelée, mixer 40 secondes à pleine puissance.'],
    tips:'Choisir un cacao à 22-24% de beurre de cacao pour l\'intensité. La cacahuète et le chocolat noir partagent le même registre torréfié — l\'accord est naturel, pas construit.' },

  // === CAFÉ ===
  { id:'sm_coffee_01', name:'Cold Brew Pre-Workout', flavors:['coffee'], goal:['performance','fat_loss'], timing:'pre', cal:260, p:32, c:22, f:5, prep:'3min',
    ingredients:[{name:'Whey café',qty:30,unit:'g'},{name:'Cold brew concentré',qty:100,unit:'ml'},{name:'Lait d\'amande',qty:200,unit:'ml'},{name:'Glaçons',qty:100,unit:'g'},{name:'Extrait vanille',qty:1,unit:'ml'}],
    steps:['Préparer le cold brew la veille : gros grains, eau froide, 12h au frigo — ne jamais utiliser du café chaud refroidi.','Mixer cold brew, lait d\'amande, extrait de vanille et whey avec les glaçons 30 secondes.','Servir dans un verre givré, boire dans les 10 minutes pour préserver les arômes volatils.'],
    tips:'Le cold brew est moins acide et plus riche en arômes sucrés que l\'expresso — c\'est sa supériorité ici. La vanille n\'est pas optionnelle : elle arrondit l\'amertume résiduelle.' },
  { id:'sm_coffee_02', name:'Tiramisu Shake Masse', flavors:['coffee','vanilla'], goal:['muscle'], timing:'post', cal:430, p:38, c:50, f:8, prep:'5min',
    ingredients:[{name:'Whey café',qty:30,unit:'g'},{name:'Ricotta légère',qty:80,unit:'g'},{name:'Café fort',qty:60,unit:'ml'},{name:'Lait',qty:150,unit:'ml'},{name:'Cacao pur',qty:5,unit:'g'},{name:'Miel',qty:10,unit:'g'}],
    steps:['Préparer un café fort serré (70ml) et le refroidir au congélateur 15 minutes — pas à température ambiante.','Mixer ricotta + lait + whey café jusqu\'à texture parfaitement lisse et aérée.','Incorporer le café froid et le miel, mixer 10 secondes, saupoudrer de cacao tamisé au service.'],
    tips:'La ricotta — et non le mascarpone — est le secret du tiramisu allégé : même onctuosité, tiers des calories. Le cacao doit être tamisé comme dans la vraie recette, pas saupoudré en bloc.' },

  // === MYRTILLE ===
  { id:'sm_blue_01', name:'Blueberry Antioxydant Warrior', flavors:['blueberry'], goal:['recovery','performance'], timing:'post', cal:310, p:30, c:38, f:4, prep:'3min',
    ingredients:[{name:'Whey myrtille ou vanille',qty:25,unit:'g'},{name:'Myrtilles congelées',qty:150,unit:'g'},{name:'Épinards',qty:30,unit:'g'},{name:'Eau de coco',qty:200,unit:'ml'},{name:'Citron',qty:10,unit:'ml'}],
    steps:['Mixer les épinards avec l\'eau de coco 20 secondes à pleine puissance — les cellules végétales doivent être totalement brisées.','Ajouter les myrtilles congelées et mixer 20 secondes supplémentaires pour une couleur violet profond homogène.','Incorporer la whey et le jus de citron, mixer 10 secondes — le citron est toujours ajouté en dernier pour préserver sa fraîcheur volatile.'],
    tips:'Le citron ajouté en fin de mixage préserve ses composés aromatiques fugaces. Il joue ici un rôle de révélateur : sans lui, les épinards prennent le dessus sur la myrtille.' },
  { id:'sm_blue_02', name:'Myrtille Lavande Zen', flavors:['blueberry'], goal:['recovery'], timing:'anytime', cal:290, p:28, c:35, f:5, prep:'3min',
    ingredients:[{name:'Whey nature ou vanille',qty:25,unit:'g'},{name:'Myrtilles',qty:120,unit:'g'},{name:'Yaourt grec 0%',qty:100,unit:'g'},{name:'Lait',qty:100,unit:'ml'},{name:'Miel de lavande',qty:10,unit:'g'}],
    steps:['Mixer lait + yaourt grec 10 secondes pour créer une base crémeuse aérée.','Ajouter les myrtilles et le miel de lavande, mixer 20 secondes — la lavande est délicate, ne pas sur-mixer.','Incorporer la whey, mixer 10 secondes, puis servir avec quelques myrtilles entières réservées au fond du verre.'],
    tips:'Le miel de lavande est le véritable secret de cette recette : son parfum floral évoque la Provence et transforme un simple smoothie protéiné en accord gastronomique. Un miel d\'acacia fonctionne aussi si la lavande est introuvable.' },

  // === NOIX DE COCO ===
  { id:'sm_coco_01', name:'Tropical Gainz', flavors:['coconut','banana'], goal:['muscle','performance'], timing:'post', cal:484, p:36, c:58, f:12, prep:'4min',
    ingredients:[{name:'Whey coco ou vanille',qty:30,unit:'g'},{name:'Lait de coco',qty:150,unit:'ml'},{name:'Banane',qty:120,unit:'g'},{name:'Ananas',qty:100,unit:'g'},{name:'Flocons de coco',qty:10,unit:'g'}],
    steps:['Couper banane et ananas en morceaux et congeler 2h minimum — le froid tropical est indispensable.','Mixer fruits congelés + lait de coco jusqu\'à texture épaisse type sorbet.','Ajouter la whey, mixer 20 secondes, garnir de flocons de coco légèrement torréfiés à sec.'],
    tips:'Torréfier les flocons de coco à sec 2 minutes dans une poêle — la différence aromatique entre coco crue et coco torréfiée est celle entre un ingrédient et une signature. La bromélaïne de l\'ananas est un bonus, le goût est la raison principale.' },
  { id:'sm_coco_02', name:'Coco Matcha Équilibre', flavors:['coconut','matcha'], goal:['fat_loss','performance'], timing:'pre', cal:313, p:30, c:28, f:9, prep:'4min',
    ingredients:[{name:'Whey nature ou vanille',qty:25,unit:'g'},{name:'Lait de coco léger',qty:200,unit:'ml'},{name:'Matcha grade cérémonial',qty:4,unit:'g'},{name:'Glaçons',qty:80,unit:'g'},{name:'Miel',qty:8,unit:'g'}],
    steps:['Dissoudre le matcha dans 30ml d\'eau à 70°C, fouetter, laisser refroidir 5 minutes.','Mixer lait de coco léger, whey et miel avec les glaçons 20 secondes.','Incorporer le matcha refroidi, mixer 10 secondes — ne pas prolonger pour préserver la fraîcheur du matcha.'],
    tips:'Coco et matcha : deux douceurs végétales qui se soutiennent sans se couvrir. Le miel doit rester en retrait — une demi-cuillère de moins que la recette classique révèle l\'amertume noble du matcha.' },

  // === CITRON ===
  { id:'sm_lemon_01', name:'Limonade Protéinée Été', flavors:['lemon'], goal:['fat_loss','anytime'], timing:'anytime', cal:220, p:28, c:22, f:2, prep:'2min',
    ingredients:[{name:'Whey citron ou nature',qty:25,unit:'g'},{name:'Jus de citron frais',qty:60,unit:'ml'},{name:'Eau pétillante',qty:300,unit:'ml'},{name:'Stevia',qty:1,unit:'g'},{name:'Menthe',qty:3,unit:'g'}],
    steps:['Prédissoudre la whey dans 50 ml d\'eau plate en remuant — évite les grumeaux au contact de l\'acide citrique.','Ajouter le jus de citron + stevia, mélanger délicatement.','Verser l\'eau pétillante en filet sur le côté du verre incliné pour préserver les bulles, puis déposer la menthe fraîche et les glaçons.'],
    tips:'Ne jamais shaker une préparation pétillante. Verser l\'eau gazeuse toujours en dernier, en filet, comme un barman verse un Spritz : les bulles sont la texture, les tuer c\'est tuer le plaisir.' },
  { id:'sm_lemon_02', name:'Lemon Cheesecake Detox', flavors:['lemon'], goal:['fat_loss'], timing:'anytime', cal:260, p:32, c:26, f:4, prep:'4min',
    ingredients:[{name:'Whey citron ou vanille',qty:25,unit:'g'},{name:'Fromage blanc 0%',qty:120,unit:'g'},{name:'Citron zeste+jus',qty:1,unit:'pce'},{name:'Lait écrémé',qty:100,unit:'ml'},{name:'Gingembre',qty:2,unit:'g'}],
    steps:['Zester finement le citron sur le fromage blanc et laisser macérer 5 minutes — le zeste infuse ses huiles essentielles dans le gras du fromage.','Ajouter le jus de citron, le lait écrémé, le gingembre râpé et la whey ; mixer 20 secondes à vitesse moyenne.','Réfrigérer 10 minutes avant de servir — la texture se raffermit et les arômes s\'homogénéisent.'],
    tips:'Macérer le zeste dans le fromage blanc avant de mixer est le geste technique décisif : les huiles essentielles du zeste sont liposolubles et s\'extraient dans la matière grasse, pas dans l\'eau. Le résultat est incomparablement plus parfumé.' },

  // === BANANE ===
  { id:'sm_ban_01', name:'Banana Power Breakfast', flavors:['banana','vanilla'], goal:['muscle','performance'], timing:'pre', cal:410, p:34, c:56, f:6, prep:'3min',
    ingredients:[{name:'Whey banane ou vanille',qty:30,unit:'g'},{name:'Banane mûre',qty:150,unit:'g'},{name:'Lait écrémé',qty:200,unit:'ml'},{name:'Flocons d\'avoine',qty:40,unit:'g'},{name:'Cannelle',qty:1,unit:'g'}],
    steps:['Mixer flocons d\'avoine avec lait 15 secondes pour créer une base crémeuse — les flocons s\'hydratent et s\'intègrent.','Ajouter banane bien mûre (taches noires = plus sucrée, plus aromatique) et whey.','Mixer 20 secondes, saupoudrer la cannelle après mixage — elle perfume en surface sans être noyée.'],
    tips:'La maturité de la banane change tout : une banane à taches noires apporte deux fois plus de douceur naturelle. La cannelle est un exhausteur — mettre avant l\'effort, pas dans le shake, crée un accord olfactif à la dégustation.' },

  // === NOISETTE ===
  { id:'sm_hazel_01', name:'Ferrero Shake', flavors:['hazelnut','chocolate'], goal:['muscle'], timing:'anytime', cal:470, p:38, c:48, f:14, prep:'3min',
    ingredients:[{name:'Whey noisette ou chocolat',qty:30,unit:'g'},{name:'Pâte de noisette pure',qty:15,unit:'g'},{name:'Cacao pur',qty:8,unit:'g'},{name:'Lait entier',qty:250,unit:'ml'},{name:'Banane',qty:80,unit:'g'}],
    steps:['Torréfier les éclats de noisettes à sec 3 minutes dans une poêle chaude — libère les huiles aromatiques.','Mixer banane + lait + pâte de noisette ensemble 20 secondes pour lier les graisses.','Ajouter cacao et whey, mixer 20 secondes, garnir des noisettes torréfiées au dernier moment.'],
    tips:'La torréfaction à sec des noisettes décuple le Maillard. Une pincée de fleur de sel sur les éclats au service — le contraste sel/chocolat est la signature des grands.' },

  // === MATCHA ===
  { id:'sm_matcha_01', name:'Matcha Warrior Bowl', flavors:['matcha'], goal:['performance','fat_loss'], timing:'pre', cal:320, p:30, c:38, f:5, prep:'5min',
    ingredients:[{name:'Whey nature ou vanille',qty:25,unit:'g'},{name:'Matcha grade cérémonial',qty:5,unit:'g'},{name:'Lait d\'avoine',qty:200,unit:'ml'},{name:'Miel de manuka',qty:10,unit:'g'},{name:'Gingembre râpé',qty:2,unit:'g'}],
    steps:['Dissoudre le matcha dans 50ml d\'eau à 70°C, fouetter en W avec un chasen ou un petit fouet — jamais en cercle pour éviter les grumeaux.','Laisser refroidir le matcha 5 minutes, mixer avec lait d\'avoine, whey et miel de manuka.','Terminer avec le gingembre râpé — incorporer à la main, ne pas remixer pour préserver la fraîcheur de l\'arôme.'],
    tips:'Le miel de manuka n\'est pas un sucrant banal : sa complexité aromatique (boisé, balsamique) s\'associe parfaitement à l\'umami végétal du matcha. Utiliser grade cérémonial, jamais culinaire.' },
  { id:'sm_matcha_02', name:'Green Machine Récupération', flavors:['matcha','coconut'], goal:['recovery'], timing:'post', cal:330, p:32, c:35, f:7, prep:'4min',
    ingredients:[{name:'Whey vanille',qty:25,unit:'g'},{name:'Matcha',qty:4,unit:'g'},{name:'Lait de coco léger',qty:150,unit:'ml'},{name:'Épinards',qty:40,unit:'g'},{name:'Pomme verte',qty:80,unit:'g'},{name:'Citron',qty:15,unit:'ml'}],
    steps:['Mixer d\'abord épinards + lait de coco — base verte homogène sans fils verts.','Dissoudre le matcha séparément dans 30ml d\'eau tiède, ajouter avec la pomme et la whey.','Mixer 45 secondes à pleine puissance, passer au tamis fin si nécessaire — la texture doit être soyeuse.'],
    tips:'La pomme verte apporte la fraîcheur acide que la coco ne peut pas donner. Le citron souligne — il ne doit pas dominer. Si le shake vire trop vert foncé, la pomme est insuffisante : en ajouter.' },

  // === NATURE / UNFLAVORED ===
  { id:'sm_nature_01', name:'Clean Shake Neutre', flavors:['unflavored'], goal:['muscle','fat_loss'], timing:'anytime', cal:280, p:33, c:28, f:5, prep:'2min',
    ingredients:[{name:'Whey nature',qty:30,unit:'g'},{name:'Lait écrémé',qty:250,unit:'ml'},{name:'Flocons d\'avoine',qty:25,unit:'g'},{name:'Amandes effilées',qty:10,unit:'g'}],
    steps:['Mixer les flocons d\'avoine avec la moitié du lait écrémé 20 secondes à pleine puissance pour créer une base "lait d\'avoine maison" lisse — les flocons hydratés s\'intègrent parfaitement et épaississent sans morceaux.','Ajouter le reste du lait froid, la whey nature et les amandes effilées ; mixer 20 secondes à vitesse moyenne — les amandes doivent être réduites en micro-éclats qui apportent le croquant, pas en poudre uniforme.','Goûter avant de servir : sur une base neutre, l\'équilibre est tout. Ajuster avec une pincée de fleur de sel si la whey manque de relief — le sel est l\'exhausteur de goût le plus puissant sur les protéines.'],
    tips:'Une base neutre n\'est pas une base fade : c\'est une toile blanche. La fleur de sel est le geste du pâtissier — elle ne sale pas, elle révèle. Une pincée change tout ce que la whey nature a à dire.' },
  { id:'sm_nature_02', name:'Athlete\'s Functional Shake', flavors:['unflavored'], goal:['performance','recovery'], timing:'post', cal:360, p:38, c:38, f:7, prep:'3min',
    ingredients:[{name:'Whey nature',qty:35,unit:'g'},{name:'Yaourt grec 0%',qty:100,unit:'g'},{name:'Jus d\'orange frais',qty:150,unit:'ml'},{name:'Banane',qty:80,unit:'g'},{name:'Curcuma',qty:1,unit:'g'},{name:'Poivre noir',qty:0.5,unit:'g'}],
    steps:['Commencer par mixer banane + jus d\'orange + poivre noir fraîchement moulu ensemble 15 secondes : le poivre doit se disperser dans la matière sucrée acide pour que la pipérine s\'active au contact des lipides du yaourt qui suivent.','Ajouter le yaourt grec et le curcuma, mixer 20 secondes — le curcuma se fixe sur les matières grasses du yaourt pour une absorption optimale ; ne jamais le dissoudre dans le liquide seul.','Incorporer la whey nature en dernier, mixer 15 secondes à vitesse modérée. Consommer dans les 20 minutes post-séance : la fenêtre anabolique et anti-inflammatoire combinées est maximale à ce créneau.'],
    tips:'Curcuma + poivre + matière grasse : c\'est le trio de biodisponibilité. Changer l\'ordre d\'incorporation revient à ignorer la chimie — et perdre jusqu\'à 80 % de l\'effet anti-inflammatoire du curcuma.' },

  // === MULTI-PARFUMS ===
  { id:'sm_multi_01', name:'Reese\'s Smoothie Bowl', flavors:['peanut','chocolate'], goal:['muscle'], timing:'anytime', cal:520, p:42, c:55, f:15, prep:'5min',
    ingredients:[{name:'Whey chocolat',qty:30,unit:'g'},{name:'Beurre de cacahuète',qty:20,unit:'g'},{name:'Banane congelée',qty:150,unit:'g'},{name:'Lait',qty:100,unit:'ml'},{name:'Granola',qty:30,unit:'g'}],
    steps:['Congeler la banane coupée en rondelles minimum 2 heures à l\'avance — c\'est l\'unique secret d\'un bowl dense et crémeux sans glace diluante.','Mixer banane congelée + lait à vitesse maximale 10 secondes seulement : stopper dès que la texture "nice cream" est atteinte, ne jamais sur-mixer ou elle devient liquide.','Ajouter le beurre de cacahuète et la whey chocolat, mixer 5 secondes en impulsions courtes pour marbrer sans homogénéiser complètement — les veines de cacahuète sont la signature visuelle.','Verser immédiatement dans un bol froid (passé 5 minutes au congélateur), déposer le granola en dernière seconde pour qu\'il reste croustillant — jamais dans le blender.'],
    tips:'La texture bowl ne se fabrique pas avec moins de liquide : elle se fabrique avec une banane congelée. C\'est la différence entre un shake raté et un vrai bowl ferme qui tient la cuillère à la verticale.' },
  { id:'sm_multi_02', name:'Sunrise Recovery', flavors:['strawberry','banana'], goal:['recovery','muscle'], timing:'post', cal:390, p:34, c:50, f:5, prep:'3min',
    ingredients:[{name:'Whey vanille ou fraise',qty:25,unit:'g'},{name:'Fraises',qty:100,unit:'g'},{name:'Banane',qty:100,unit:'g'},{name:'Jus d\'orange',qty:100,unit:'ml'},{name:'Miel',qty:8,unit:'g'},{name:'Glaçons',qty:80,unit:'g'}],
    steps:['Congeler les fraises entières et la banane en rondelles la veille : les fruits congelés remplacent les glaçons sans diluer les arômes — la concentration en saveur est incomparablement supérieure.','Mixer jus d\'orange + miel ensemble 5 secondes pour dissoudre le miel à froid — ne jamais ajouter un sucrant cristallisé directement sur des fruits congelés qui le bloqueraient en grumeaux.','Ajouter les fruits congelés et mixer à pleine puissance 25 secondes ; incorporer la whey en dernier, mixer 10 secondes supplémentaires — la whey ajoutée trop tôt mousse excessivement et perd en onctuosité.'],
    tips:'La règle d\'or du smoothie fruité post-effort : zéro glaçon, 100 % fruits congelés. Le froid vient des fruits, les arômes restent intacts, et la texture est soyeuse — pas aqueuse.' },
  { id:'sm_multi_03', name:'Mocha Hazelnut Dream', flavors:['coffee','hazelnut'], goal:['performance'], timing:'pre', cal:340, p:32, c:35, f:9, prep:'4min',
    ingredients:[{name:'Whey café ou noisette',qty:30,unit:'g'},{name:'Café expresso',qty:60,unit:'ml'},{name:'Pâte de noisette',qty:10,unit:'g'},{name:'Lait écrémé',qty:200,unit:'ml'},{name:'Cacao pur',qty:5,unit:'g'}],
    steps:['Préparer l\'expresso et le verser immédiatement sur la pâte de noisette dans le blender à chaud : la chaleur du café émulsionne instantanément la matière grasse de la noisette en une base soyeuse et parfumée.','Laisser la préparation café-noisette refroidir 5 minutes, puis ajouter le lait écrémé froid et le cacao tamisé (jamais en vrac : les grumeaux de cacao ne se défont plus une fois mixés).','Ajouter la whey en dernier, mixer 20 secondes à vitesse moyenne — pas maximale : le café carboné sur-agité devient amer. Servir immédiatement sur glaçons sans remuer.'],
    tips:'L\'expresso chaud sur la pâte de noisette n\'est pas un hasard : c\'est une émulsion à chaud, comme une ganache. Le résultat est un corps en bouche que le simple mixage à froid ne peut jamais donner.' },

  // === BANANE #2 ===
  { id:'sm_ban_02', name:'Banana Split Recovery', flavors:['banana','vanilla'], goal:['recovery'], timing:'post', cal:380, p:36, c:48, f:6, prep:'3min',
    ingredients:[{name:'Whey banane ou vanille',qty:30,unit:'g'},{name:'Banane congelée',qty:120,unit:'g'},{name:'Skyr nature',qty:100,unit:'g'},{name:'Lait écrémé',qty:150,unit:'ml'},{name:'Miel',qty:10,unit:'g'}],
    steps:['Utiliser une banane congelée en rondelles — impératif pour la texture glacée et crémeuse sans glaçons.','Mixer banane congelée + lait écrémé 15 secondes jusqu\'à consistance glace pilée.','Ajouter skyr et whey, mixer 20 secondes, finir avec un filet de miel sans remixer — il doit rester en veine dorée.'],
    tips:'Le skyr et la banane congelée forment ensemble une base de glace protéinée naturelle. Le miel en filet final n\'est pas une touche décorative — c\'est l\'équilibre acide-sucré du skyr qui en a besoin.' },

  // === NOISETTE #2 ===
  { id:'sm_hazel_02', name:'Noisette Overnight Shake', flavors:['hazelnut'], goal:['muscle','recovery'], timing:'anytime', cal:440, p:35, c:45, f:13, prep:'5min',
    ingredients:[{name:'Whey noisette',qty:30,unit:'g'},{name:'Purée de noisette complète',qty:20,unit:'g'},{name:'Lait d\'avoine',qty:250,unit:'ml'},{name:'Flocons d\'avoine',qty:30,unit:'g'},{name:'Cacao pur',qty:5,unit:'g'},{name:'Datte Medjool',qty:1,unit:'pce'}],
    steps:['Dénoyauter la datte et la faire tremper 10 minutes dans le lait d\'avoine tiède — elle se mixe parfaitement lisse.','Ajouter flocons pré-trempés, purée de noisette, cacao et whey.','Mixer 40 secondes à pleine puissance — déguster dans l\'heure, la texture est à son apogée.'],
    tips:'La datte Medjool apporte une note de caramel brun qui contraste superbement avec l\'amertume du cacao. C\'est le sucrant qui mérite d\'être utilisé.' },

  // === MULTI #4 — Lemon Matcha Zen ===
  { id:'sm_multi_04', name:'Lemon Matcha Zen', flavors:['lemon','matcha'], goal:['fat_loss','performance'], timing:'pre', cal:260, p:30, c:28, f:4, prep:'3min',
    ingredients:[{name:'Whey nature ou citron',qty:25,unit:'g'},{name:'Matcha cérémonie',qty:3,unit:'g'},{name:'Jus de citron frais',qty:30,unit:'ml'},{name:'Eau de coco',qty:200,unit:'ml'},{name:'Miel',qty:8,unit:'g'},{name:'Gingembre frais',qty:5,unit:'g'}],
    steps:['Dissoudre le matcha dans 30 ml d\'eau à 70 °C précis (jamais bouillante : au-dessus de 80 °C les catéchines s\'oxydent et le matcha vire amer), fouetter en zigzag 30 secondes avec un chasen ou un petit fouet à main.','Râper finement le gingembre frais et le presser dans le jus de citron : le jus de citron extrait les arômes du gingembre bien mieux que le simple mixage — laisser macérer 2 minutes.','Verser l\'eau de coco bien froide et la whey dans le blender, mixer 15 secondes, puis incorporer le matcha refroidi et la macération citron-gingembre en dernier. Mixer 5 secondes seulement — les arômes du matcha sont volatils.'],
    tips:'Le matcha est un ingrédient thermosensible et fragile : il se dissout avant, il refroidit, il s\'incorpore en dernier. Chaque étape dans le désordre coûte la moitié du parfum.' },

  // === PISTACHE ===
  { id:'sm_pist_01', name:'Pistache Baklava Dream', flavors:['pistachio'], goal:['muscle'], timing:'post', cal:420, p:36, c:31, f:17, prep:'3min',
    ingredients:[{name:'Whey pistache',qty:30,unit:'g'},{name:'Lait entier',qty:250,unit:'ml'},{name:'Miel',qty:15,unit:'g'},{name:'Pistaches concassées',qty:20,unit:'g'},{name:'Eau de rose',qty:5,unit:'ml'},{name:'Glaçons',qty:80,unit:'g'}],
    steps:['Concasser les pistaches au couteau — grossier, pas en poudre, pour préserver les morceaux croquants.','Mixer lait, whey et miel 20 secondes jusqu\'à homogène.','Verser sur glaçons, ajouter l\'eau de rose et les pistaches par-dessus sans remixer — le parfum doit rester en surface.'],
    tips:'L\'eau de rose ne se mélange pas — elle se pose. Une seule goutte suffit si elle est concentrée. Les pistaches non-salées font toute la différence : la douceur naturelle ressort.' },
  { id:'sm_pist_02', name:'Pistache Citron Frais', flavors:['pistachio','lemon'], goal:['fat_loss'], timing:'pre', cal:280, p:40, c:25, f:2, prep:'3min',
    ingredients:[{name:'Whey pistache',qty:30,unit:'g'},{name:'Lait écrémé',qty:250,unit:'ml'},{name:'Jus de citron frais',qty:30,unit:'ml'},{name:'Yaourt grec 0%',qty:80,unit:'g'},{name:'Glaçons',qty:100,unit:'g'},{name:'Stevia',qty:1,unit:'g'}],
    steps:['Mixer lait écrémé et yaourt grec d\'abord — base froide et dense.','Ajouter whey et stevia, mixer 20 secondes.','Presser le citron à la main directement dans le blender, couvercle fermé, puis mixer 10 secondes finale.'],
    tips:'La pistache est naturellement douce et beurrée — le citron est indispensable pour trancher cette rondeur. Ne pas sucrer davantage : la whey pistache apporte déjà sa propre douceur.' },
  { id:'sm_pist_03', name:'Pistache Vanille Royale', flavors:['pistachio','vanilla'], goal:['recovery'], timing:'anytime', cal:365, p:44, c:27, f:9, prep:'4min',
    ingredients:[{name:'Whey pistache',qty:25,unit:'g'},{name:'Whey vanille',qty:10,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Yaourt grec 0%',qty:100,unit:'g'},{name:'Miel',qty:10,unit:'g'}],
    steps:['Verser lait entier et yaourt grec dans le blender, mixer 10 secondes pour aérer.','Ajouter whey pistache, whey vanille et miel.','Mixer à pleine puissance 25 secondes — servir aussitôt, la mousse est à son maximum.'],
    tips:'La vanille n\'est pas un doublon : elle agit comme un exhausteur de goût de la pistache, comme le sel l\'est du sucre. Ne pas les séparer — le duo est l\'accord.' },
  { id:'sm_pist_04', name:'Pistache Matcha Green', flavors:['pistachio','matcha'], goal:['performance'], timing:'pre', cal:300, p:27, c:36, f:6, prep:'4min',
    ingredients:[{name:'Whey pistache',qty:30,unit:'g'},{name:'Matcha grade cérémonial',qty:3,unit:'g'},{name:'Lait d\'amande',qty:250,unit:'ml'},{name:'Banane',qty:80,unit:'g'},{name:'Miel',qty:10,unit:'g'},{name:'Gingembre frais',qty:2,unit:'g'}],
    steps:['Dissoudre le matcha dans 30ml d\'eau à 70°C — jamais bouillante — en fouettant en zigzag, pas en cercle.','Congeler la banane en amont pour une texture glacée naturelle, mixer avec lait d\'amande et whey.','Incorporer le matcha refroidi et le gingembre râpé, mixer 20 secondes et servir immédiatement.'],
    tips:'Pistache et matcha partagent la même verticalité végétale. Le gingembre est le liant aromatique : sans lui, les deux saveurs coexistent sans dialoguer.' },

  // === NOISETTE #3 ===
  { id:'sm_hazel_03', name:'Nutella Sportif', flavors:['hazelnut','chocolate'], goal:['muscle'], timing:'post', cal:460, p:39, c:47, f:13, prep:'4min',
    ingredients:[{name:'Whey noisette',qty:35,unit:'g'},{name:'Lait entier',qty:250,unit:'ml'},{name:'Cacao pur',qty:8,unit:'g'},{name:'Banane mûre',qty:80,unit:'g'},{name:'Miel',qty:10,unit:'g'}],
    steps:['Mixer la banane coupée avec le miel et le lait 15 secondes — base sucrée homogène.','Ajouter le cacao pur tamisé pour éviter les grumeaux, puis la whey noisette.','Mixer 30 secondes à haute vitesse — la banane émulsionne naturellement les graisses du cacao.'],
    tips:'Utiliser un cacao naturel non-alcalinisé pour préserver les flavonoïdes et l\'acidité légère qui tranche avec la douceur noisette. Le vrai Nutella n\'est que l\'idée — ce shake est la réalité.' },

  // === BANANE #3 ===
  { id:'sm_ban_03', name:'Banana Bread Shake', flavors:['banana','vanilla'], goal:['muscle'], timing:'anytime', cal:430, p:35, c:43, f:14, prep:'4min',
    ingredients:[{name:'Whey banane ou vanille',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Flocons d\'avoine',qty:30,unit:'g'},{name:'Cannelle',qty:1,unit:'g'},{name:'Miel',qty:10,unit:'g'},{name:'Noix',qty:5,unit:'g'}],
    steps:['Mixer lait entier + flocons d\'avoine 20 secondes pour une base lisse et crémeuse.','Ajouter whey, miel et cannelle, mixer 20 secondes.','Concasser les noix grossièrement au couteau et les ajouter après mixage — croquant intentionnel, ne pas les mixer.'],
    tips:'Les noix ne se mixent pas — leur croquant rompt la texture veloutée et crée un contraste textural qui transforme un shake en expérience. Une pincée de fleur de sel sur les noix décuple leur goût.' },

  // === CHOCOLAT #4 — Choco Framboise Express ===
  { id:'sm_choco_04', name:'Choco Framboise Express', flavors:['chocolate','strawberry'], goal:['fat_loss','recovery'], timing:'post', cal:290, p:32, c:30, f:5, prep:'3min',
    ingredients:[{name:'Whey chocolat',qty:30,unit:'g'},{name:'Fraises congelées',qty:100,unit:'g'},{name:'Lait écrémé',qty:200,unit:'ml'},{name:'Miel',qty:5,unit:'g'},{name:'Glaçons',qty:80,unit:'g'}],
    steps:['Verser le lait écrémé froid dans le blender, ajouter le miel et mixer 5 secondes pour l\'incorporer.','Ajouter les fraises congelées directement (elles jouent le rôle des glaçons), puis la whey.','Mixer 45 secondes à pleine puissance — les fraises encore partiellement gelées créent une texture granita-mousse inimitable.','Ajouter quelques gouttes de jus de citron au service pour rehausser la vivacité fruitée sans modifier les macros.'],
    tips:'L\'acidité naturelle de la fraise tranche le chocolat avec la même élégance qu\'une framboise dans un entremets : elle allège, elle contraste, elle surprend.' },

  // === VANILLE #4 — Vanille Caramel Salé ===
  { id:'sm_van_04', name:'Vanille Caramel Salé', flavors:['vanilla'], goal:['muscle','recovery'], timing:'anytime', cal:400, p:35, c:48, f:7, prep:'3min',
    ingredients:[{name:'Whey vanille',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Miel',qty:15,unit:'g'},{name:'Flocons d\'avoine',qty:30,unit:'g'},{name:'Sel',qty:1,unit:'g'}],
    steps:['Tiédir le lait entier à 40 °C — jamais plus — et y dissoudre le miel avec le sel en fouettant : la fleur de sel catalyse les notes de caramel du miel.','Verser dans le blender avec les flocons, mixer 20 secondes, ajouter la whey vanille.','Mixer 15 secondes supplémentaires à vitesse modérée pour préserver la mousse crémeuse.'],
    tips:'Une pincée de fleur de sel sur le dessus au service, pas dans le blender : elle doit craqueler sous la langue et laisser éclater le caramel vanillé en bouche.' },

  // === CAFÉ #3 — Café Express ===
  { id:'sm_coffee_03', name:'Café Express Glacé', flavors:['coffee'], goal:['performance','fat_loss'], timing:'pre', cal:230, p:30, c:20, f:4, prep:'1min',
    ingredients:[{name:'Whey café',qty:30,unit:'g'},{name:'Lait entier',qty:150,unit:'ml'},{name:'Glaçons',qty:100,unit:'g'}],
    steps:['Remplir le shaker de glaçons en premier, ajouter le lait froid puis la whey café.','Shaker 20 secondes avec vigueur — le froid extrait le maximum d\'arômes de la whey.','Servir immédiatement dans un verre préalablement réfrigéré pour conserver la température idéale.'],
    tips:'La règle d\'or des baristas : le froid en premier, le chaud en dernier. Ici tout est froid — le glaçon n\'est pas une option, c\'est la technique.' },

  // === FRAISE #3 — Fraise Simple ===
  { id:'sm_straw_03', name:'Fraise Pure', flavors:['strawberry'], goal:['fat_loss','recovery'], timing:'anytime', cal:270, p:38, c:25, f:2, prep:'2min',
    ingredients:[{name:'Whey fraise',qty:30,unit:'g'},{name:'Yaourt grec 0%',qty:200,unit:'g'},{name:'Fraises congelées',qty:80,unit:'g'},{name:'Eau',qty:100,unit:'ml'}],
    steps:['Mixer les fraises congelées avec l\'eau 15 secondes pour créer une base glacée homogène.','Ajouter le yaourt grec et la whey, mixer 15 secondes — la texture doit rester épaisse, presque en smoothie bowl.','Servir à la cuillère dans un bol frais, non dans un verre.'],
    tips:'La fraise congelée + yaourt grec forme une texture proche d\'un sorbet protéiné. Quelques fraises fraîches tranchées en garniture apportent le contraste chaud-froid et l\'intensité aromatique.' },

  // === NOISETTE #4 — Noisette Rapide ===
  { id:'sm_hazel_04', name:'Noisette Rapide', flavors:['hazelnut'], goal:['muscle'], timing:'anytime', cal:346, p:36, c:28, f:10, prep:'1min',
    ingredients:[{name:'Whey noisette',qty:35,unit:'g'},{name:'Lait entier',qty:300,unit:'ml'},{name:'Cacao pur',qty:5,unit:'g'}],
    steps:['Verser lait, whey noisette et cacao dans le shaker.','Shaker énergiquement 20 secondes, puis 10 secondes supplémentaires après retournement.','Servir dans un verre froid et déguster dans les 5 minutes.'],
    tips:'Trois ingrédients, zéro compromis sur la saveur. Ajouter une pincée de sel avant de shaker — cela amplifie la noisette sans ajouter une calorie.' },

  // === FRAMBOISE ===
  { id:'sm_rasp_01', name:'Framboise Express', flavors:['raspberry'], goal:['fat_loss','recovery'], timing:'anytime', cal:260, p:31, c:22, f:5, prep:'2min',
    ingredients:[{name:'Whey framboise',qty:30,unit:'g'},{name:'Lait demi-\u00e9cr\u00e9m\u00e9',qty:200,unit:'ml'},{name:'Fruits rouges surgel\u00e9s',qty:80,unit:'g'}],
    steps:['Verser le lait froid dans le blender, ajouter les fruits rouges surgelés — le froid du lait + les fruits crée une émulsion naturelle.','Ajouter la whey framboise et mixer 25 secondes à puissance maximale.','Servir immédiatement avec quelques framboises fraîches posées sur le dessus, sans les mixer.'],
    tips:'Les fruits surgelés remplacent avantageusement les glaçons : ils refroidissent ET apportent de la densité aromatique. Ne jamais utiliser des glaçons quand on peut utiliser des fruits.' },

  // === CARAMEL SALÉ ===
  { id:'sm_caramel_01', name:'Caramel Salé Express', flavors:['caramel_sale'], goal:['muscle','recovery'], timing:'post', cal:310, p:31, c:26, f:9, prep:'2min',
    ingredients:[{name:'Whey caramel sal\u00e9',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Banane',qty:60,unit:'g'},{name:'Pincée de sel',qty:1,unit:'g'}],
    steps:['Écraser la banane à la fourchette jusqu\'à obtenir une purée lisse — aucun morceau.','Verser le lait froid sur la purée, incorporer au fouet 10 secondes pour homogénéiser.','Ajouter la whey et la pincée de sel, shaker énergiquement 20 secondes.','Servir immédiatement dans un verre frappé.'],
    tips:'Le sel ne masque pas — il révèle. Une fleur de sel ajoutée en surface juste avant de boire crée un contraste caramel-sel foudroyant, comme dans un caramel Ispahan.' },

  // === COOKIES & CREAM ===
  { id:'sm_cookies_01', name:'Cookies & Cream Shake', flavors:['cookies_cream'], goal:['muscle'], timing:'post', cal:300, p:33, c:17, f:11, prep:'1min',
    ingredients:[{name:'Whey cookies',qty:30,unit:'g'},{name:'Lait entier',qty:250,unit:'ml'},{name:'Cacao pur',qty:8,unit:'g'}],
    steps:['Tamiser le cacao directement dans le shaker pour éviter tout grumeau.','Ajouter le lait froid, puis la whey cookies, shaker 25 secondes.','Servir avec 2 glaçons dans le verre pour une texture plus ferme.'],
    tips:'Le cacao noir extra-brut intensifie le profil "oreo" — évitez le cacao sucré qui écrase les notes biscuitées de la whey.' },

  // === TIRAMISU ===
  { id:'sm_tiramisu_01', name:'Tiramisu Protéiné', flavors:['tiramisu'], goal:['muscle','recovery'], timing:'anytime', cal:265, p:31, c:14, f:9, prep:'2min',
    ingredients:[{name:'Whey tiramisu',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Caf\u00e9 expresso froid',qty:50,unit:'ml'},{name:'Cacao pur',qty:5,unit:'g'}],
    steps:['Préparer le café la veille, refroidir au réfrigérateur toute la nuit — l\'amertume s\'adoucit.','Mélanger café froid + lait en versant doucement pour ne pas mousser.','Ajouter whey + cacao, shaker 20 secondes, saupoudrer de cacao non sucré avant de boire.'],
    tips:'Un café froid 12h au frigo perd son âcreté et développe des arômes chocolatés profonds — c\'est la même logique qu\'un cold brew, et c\'est là que le tiramisu prend son caractère.' },

  // === ORANGE ===
  { id:'sm_orange_01', name:'Orange Soleil', flavors:['orange'], goal:['performance','fat_loss'], timing:'pre', cal:240, p:29, c:21, f:4, prep:'2min',
    ingredients:[{name:'Whey orange',qty:30,unit:'g'},{name:'Eau de coco',qty:200,unit:'ml'},{name:'Lait demi-\u00e9cr\u00e9m\u00e9',qty:150,unit:'ml'},{name:'Jus de citron',qty:20,unit:'ml'}],
    steps:['Presser le citron sur le côté — quelques zestes râpés dans l\'eau de coco avant d\'ajouter le lait.','Mélanger eau de coco + lait froid, verser en spirale pour oxygéner légèrement.','Ajouter whey + jus de citron, shaker 20 secondes.'],
    tips:'L\'accord orange-citron-coco évoque une limonada tropicale : les zestes de citron sur l\'eau de coco libèrent des huiles essentielles aromatiques qui font toute la différence sur le nez.' },

  // === BIRTHDAY CAKE ===
  { id:'sm_birthday_01', name:'Birthday Cake Shake', flavors:['birthday_cake'], goal:['muscle'], timing:'post', cal:285, p:32, c:16, f:10, prep:'1min',
    ingredients:[{name:'Whey birthday cake',qty:30,unit:'g'},{name:'Lait entier',qty:250,unit:'ml'},{name:'Extrait vanille',qty:3,unit:'ml'}],
    steps:['Gratter les graines d\'une demi-gousse de vanille dans le lait avant de shaker, ou utiliser l\'extrait.','Verser lait + extrait de vanille, ajouter la whey, shaker 20 secondes vigoureusement.','Servir dans un verre froid, éventuellement avec quelques sprinkles colorés pour l\'esprit fête.'],
    tips:'La vanille vraie — même 3 ml d\'extrait pur — transforme radicalement ce shake : la vanilline synthétique de la whey devient ronde et profonde, comme un sablé breton fraîchement sorti du four.' },

  // === CANNELLE ===
  { id:'sm_cinnamon_01', name:'Cannelle Dorée', flavors:['cinnamon'], goal:['muscle','fat_loss'], timing:'anytime', cal:305, p:31, c:26, f:9, prep:'2min',
    ingredients:[{name:'Whey cannelle',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Banane',qty:50,unit:'g'},{name:'Cannelle',qty:3,unit:'g'}],
    steps:['Laisser infuser la cannelle dans le lait froid 5 minutes avant de mixer — elle libère ses huiles essentielles sans chaleur.','Écraser la banane à la fourchette, incorporer au lait cannelle.','Ajouter la whey, shaker 20 secondes.'],
    tips:'La cannelle de Ceylan (véritable) est infiniment plus fine et florale que la cannelle Cassia — un seul gramme de plus change tout le profil aromatique du shake.' },

  // === CHEESECAKE CITRON ===
  { id:'sm_cheesecake_01', name:'Cheesecake Citron Frais', flavors:['cheesecake_citron'], goal:['fat_loss','recovery'], timing:'anytime', cal:260, p:42, c:19, f:2, prep:'2min',
    ingredients:[{name:'Whey cheesecake citron',qty:30,unit:'g'},{name:'Fromage blanc 0%',qty:150,unit:'g'},{name:'Jus de citron',qty:30,unit:'ml'},{name:'Miel',qty:10,unit:'g'}],
    steps:['Zester un demi-citron jaune directement dans le fromage blanc avant toute autre opération.','Ajouter jus de citron + miel, fouetter 10 secondes pour une base lisse.','Incorporer la whey, mixer 15 secondes — texture épaisse, ne pas allonger.'],
    tips:'Le zeste libère des huiles essentielles que le jus seul n\'apporte pas — c\'est la différence entre un cheesecake qui évoque le citron et celui qui le transcende.' },

  // === TOFFEE ===
  { id:'sm_toffee_01', name:'Toffee Choco Banane', flavors:['toffee'], goal:['muscle'], timing:'post', cal:345, p:32, c:32, f:9, prep:'2min',
    ingredients:[{name:'Whey toffee',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Banane',qty:80,unit:'g'},{name:'Cacao pur',qty:5,unit:'g'}],
    steps:['Congeler la banane 1 heure — le sucre se concentre et le toffee devient plus profond.','Mixer banane congelée + lait + cacao 20 secondes.','Ajouter la whey, mixer 15 secondes — texture épaisse, servir immédiatement.'],
    tips:'Le cacao cru amplifie le profil caramel brun du toffee au lieu de le noyer — utiliser du cacao à 100% non sucré, en quantité minimale.' },

  // === CHOCOLAT BLANC ===
  { id:'sm_whitechoc_01', name:'Chocolat Blanc Fraise', flavors:['white_chocolate'], goal:['recovery','muscle'], timing:'post', cal:300, p:31, c:23, f:9, prep:'2min',
    ingredients:[{name:'Whey chocolat blanc',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Fraises congel\u00e9es',qty:80,unit:'g'}],
    steps:['Utiliser des fraises congelées directement — elles font office de glaçons aromatisés.','Mixer fraises + lait 20 secondes à vitesse maximale pour une base rose dense.','Ajouter la whey, mixer 10 secondes — arrêter avant que la texture ne devienne trop liquide.'],
    tips:'Le chocolat blanc est un amplificateur de texture, pas de saveur : son gras lacté porte l\'acidité de la fraise et lui donne cette rondeur veloutée qu\'on ne trouve pas avec un autre chocolat.' },

  // === PIÑA COLADA ===
  { id:'sm_pina_01', name:'Pi\u00f1a Colada Protéinée', flavors:['pina_colada'], goal:['recovery','performance'], timing:'post', cal:285, p:25, c:27, f:9, prep:'3min',
    ingredients:[{name:'Whey pi\u00f1a colada',qty:30,unit:'g'},{name:'Eau de coco',qty:200,unit:'ml'},{name:'Ananas',qty:100,unit:'g'},{name:'Lait de coco',qty:30,unit:'ml'}],
    steps:['Couper l\'ananas en morceaux, placer au congélateur 30 minutes — froid naturel sans dilution.','Mixer ananas frais/congelé + eau de coco + lait de coco 20 secondes.','Ajouter la whey, mixer 15 secondes — texture légèrement fibreuse acceptable et désirable.'],
    tips:'Un trait de jus de citron vert pressé juste avant de servir réveille l\'ananas et rehausse le coco : c\'est l\'acidité qui fait la différence entre un piña colada plat et un piña colada vivant.' },

  // === VANILLE CANNELLE ===
  { id:'sm_vanilla_cinn_01', name:'Vanille Cannelle Douce', flavors:['vanilla_cinnamon'], goal:['muscle','recovery'], timing:'anytime', cal:285, p:31, c:20, f:9, prep:'1min',
    ingredients:[{name:'Whey vanille cannelle',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Cannelle',qty:2,unit:'g'},{name:'Miel',qty:8,unit:'g'}],
    steps:['Faire infuser la cannelle dans le lait froid 5 minutes — elle libère ses arômes sans chaleur.','Ajouter le miel, dissoudre en agitant doucement.','Incorporer la whey, shaker 20 secondes.'],
    tips:'L\'accord vanille-cannelle est un classique de la pâtisserie orientale : la cannelle apporte la chaleur épicée, la vanille la douceur florale. En hiver, c\'est le seul shake qui réchauffe l\'âme après une séance à froid.' },

  // === SPÉCULOOS ===
  { id:'sm_speculoos_01', name:'Sp\u00e9culoos Shake', flavors:['speculoos'], goal:['muscle'], timing:'post', cal:340, p:31, c:33, f:9, prep:'2min',
    ingredients:[{name:'Whey sp\u00e9culoos',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Banane',qty:80,unit:'g'},{name:'Cannelle',qty:2,unit:'g'}],
    steps:['Écraser la banane très mûre (tachée) à la fourchette — le sucre naturel est à son maximum.','Mixer banane + lait 15 secondes pour une base homogène.','Ajouter whey + cannelle, shaker 15 secondes — ne pas trop mixer pour garder le côté rustique.'],
    tips:'Le spéculoos repose sur la cannelle, la cardamome et la cassonade — une banane très mûre apporte exactement cette cassonade naturelle qui manque à la whey. Choisir une cannelle de Ceylan pour le côté floral.' },

  // === CAPPUCCINO ===
  { id:'sm_cappuccino_01', name:'Cappuccino Glacé', flavors:['cappuccino'], goal:['performance','fat_loss'], timing:'pre', cal:255, p:31, c:13, f:9, prep:'2min',
    ingredients:[{name:'Whey cappuccino',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Caf\u00e9 expresso froid',qty:80,unit:'ml'},{name:'Gla\u00e7ons',qty:80,unit:'g'}],
    steps:['Préparer un ristretto serré, refroidir 5 minutes — éviter l\'expresso long qui dilue les arômes.','Shaker lait + café + glaçons + whey 20 secondes — les glaçons créent une mousse froide naturelle.','Servir immédiatement, boire avant que la mousse ne retombe.'],
    tips:'La mousse d\'un cappuccino vient du contraste chaud-froid lors du shakage — plus les glaçons sont gros, plus la mousse est dense. Un ristretto concentré plutôt qu\'un expresso dilué préserve les arômes de torréfaction.' },

  // === PAIN D'ÉPICES ===
  { id:'sm_gingerbread_01', name:"Pain d'\u00c9pices Hivernal", flavors:['gingerbread'], goal:['recovery','muscle'], timing:'anytime', cal:290, p:31, c:22, f:9, prep:'2min',
    ingredients:[{name:'Whey pain d\'\u00e9pices',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Gingembre r\u00e2p\u00e9',qty:5,unit:'g'},{name:'Miel',qty:10,unit:'g'}],
    steps:['Râper le gingembre très finement sur une microplane — la pulpe et le jus, pas les fibres.','Faire infuser le gingembre râpé dans le lait froid 3 minutes avant de mixer.','Ajouter whey + miel, mixer 20 secondes — saupoudrer de cannelle sur la mousse avant de servir.'],
    tips:'Le pain d\'épices traditionnel associe gingembre, cannelle, anis étoilé et muscade — le gingembre frais apporte un piquant vivant que le gingembre sec ne peut pas reproduire. Une pincée de muscade râpée change tout le profil.' },

  // === RASPBERRY #2-3 ===
  { id:'sm_rasp_02', name:'Framboise Coco Flash', flavors:['raspberry'], goal:['fat_loss','recovery'], timing:'post', cal:192, p:25, c:19, f:2, prep:'1min',
    ingredients:[{name:'Whey framboise',qty:30,unit:'g'},{name:'Eau de coco',qty:200,unit:'ml'},{name:'Fraises congelées',qty:80,unit:'g'}],
    steps:['Verser l\'eau de coco bien froide dans le shaker.','Ajouter la whey framboise et shaker vigoureusement 25 secondes pour une mousse légère.','Écraser grossièrement les fraises congelées à la fourchette et déposer dans le verre — ne pas mixer, conserver la texture en morceaux.'],
    tips:'L\'eau de coco amplifie la rondeur sucrée de la framboise sans sucre ajouté. La fraise écrasée en garniture apporte une dimension texturale que le mixage détruirait.' },
  { id:'sm_rasp_03', name:'Framboise Myrtille Grec', flavors:['raspberry'], goal:['muscle','recovery'], timing:'post', cal:253, p:35, c:24, f:2, prep:'3min',
    ingredients:[{name:'Whey framboise',qty:30,unit:'g'},{name:'Yaourt grec 0%',qty:100,unit:'g'},{name:'Myrtilles congelées',qty:80,unit:'g'},{name:'Miel',qty:10,unit:'g'},{name:'Glaçons',qty:100,unit:'g'}],
    steps:['Placer les myrtilles congelées + glaçons dans le blender, mixer 10 secondes — la base doit être granuleuse, pas encore lisse.','Ajouter yaourt grec, whey, miel ; mixer 30 secondes à puissance maximum jusqu\'à texture veloutée.','Verser en inclinant le verre pour préserver la mousse, servir aussitôt.'],
    tips:'Framboise + myrtille forment l\'accord "fruits rouges d\'altitude" : acidité vive de la framboise, profondeur tannique de la myrtille. Le miel doit être ajouté après le yaourt, jamais en premier.' },

  // === CARAMEL SALÉ #2-3 ===
  { id:'sm_caramel_02', name:'Caramel Lait Flash', flavors:['caramel_sale'], goal:['muscle','performance'], timing:'anytime', cal:280, p:32, c:15, f:10, prep:'1min',
    ingredients:[{name:'Whey caramel salé',qty:30,unit:'g'},{name:'Lait entier',qty:250,unit:'ml'}],
    steps:['Refroidir le shaker 2 minutes au congélateur avant usage.','Verser le lait entier glacé, ajouter la whey, shaker 30 secondes vigoureusement.','Servir dans un verre froid et consommer immédiatement.'],
    tips:'Un shaker froid produit une mousse plus serrée et exalte les notes de caramel beurré — la température est un ingrédient à part entière.' },
  { id:'sm_caramel_03', name:'Caramel Banane Peanut Power', flavors:['caramel_sale'], goal:['muscle','performance'], timing:'pre', cal:391, p:34, c:37, f:12, prep:'4min',
    ingredients:[{name:'Whey caramel salé',qty:30,unit:'g'},{name:'Banane',qty:100,unit:'g'},{name:'Beurre de cacahuète',qty:15,unit:'g'},{name:'Lait demi-écrémé',qty:150,unit:'ml'}],
    steps:['Congeler la banane 1 heure avant — texture crémeuse garantie sans glaçons.','Mixer banane congelée + lait à vitesse croissante, 20 secondes.','Ajouter whey + beurre de cacahuète, mixer 20 secondes supplémentaires.','Terminer par une pincée de fleur de sel sur la mousse.'],
    tips:'Le mariage cacahuète-caramel salé est un classique de la confiserie de luxe : le gras de la cacahuète arrondit l\'amertume du caramel, la banane apporte la rondeur sucrée naturelle.' },

  // === COOKIES & CREAM #2-3 ===
  { id:'sm_cookies_02', name:'Cookies Cacao Shaker', flavors:['cookies_cream'], goal:['muscle','fat_loss'], timing:'post', cal:282, p:34, c:20, f:8, prep:'1min',
    ingredients:[{name:'Whey cookies',qty:30,unit:'g'},{name:'Lait demi-écrémé',qty:250,unit:'ml'},{name:'Cacao pur',qty:10,unit:'g'}],
    steps:['Verser le lait dans le shaker, incorporer le cacao en pluie fine en agitant doucement — il se disperse sans coller.','Ajouter la whey cookies, fermer et shaker 30 secondes à amplitude maximale.','Servir dans un verre froid dès la fin du shaking pour profiter de la mousse.'],
    tips:'Le cacao froid se disperse mieux que le cacao ajouté après la whey — une astuce de pâtissier pour un résultat sans grumeaux ni fond chocolaté.' },
  { id:'sm_cookies_03', name:'Cookies Cream Banana Split', flavors:['cookies_cream'], goal:['muscle'], timing:'post', cal:363, p:41, c:28, f:10, prep:'4min',
    ingredients:[{name:'Whey cookies',qty:30,unit:'g'},{name:'Fromage blanc 0%',qty:100,unit:'g'},{name:'Banane',qty:80,unit:'g'},{name:'Beurre de cacahuète',qty:15,unit:'g'}],
    steps:['Congeler la banane 2 heures — elle remplace la glace et donne une texture soft-serve naturelle.','Mixer fromage blanc + banane + beurre de cacahuète 30 secondes à pleine puissance.','Ajouter la whey, mixer 15 secondes — ne pas trop mixer pour garder la texture épaisse.'],
    tips:'Ce smoothie se mange à la cuillère, pas à la paille : épaisseur de crème glacée, richesse d\'un brownie, légèreté d\'un dessert protéiné. Dispersez quelques éclats de cacao grué sur le dessus.' },

  // === TIRAMISU #2-3 ===
  { id:'sm_tiramisu_02', name:'Tiramisu Expresso Shaker', flavors:['tiramisu'], goal:['performance','muscle'], timing:'pre', cal:249, p:31, c:12, f:9, prep:'1min',
    ingredients:[{name:'Whey tiramisu',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Café expresso froid',qty:60,unit:'ml'}],
    steps:['Préparer un ristretto serré, laisser refroidir 5 minutes — un expresso trop dilué noie les arômes.','Verser lait + café dans le shaker, ajouter la whey, shaker 20 secondes.','Servir aussitôt pour que le café conserve toute sa puissance aromatique.'],
    tips:'Un ristretto plutôt qu\'un long expresso concentre les arômes torréfiés sans excès d\'eau — la caféine active les performances, l\'intensité aromatique fait le reste.' },
  { id:'sm_tiramisu_03', name:'Tiramisu Fromage Blanc Café', flavors:['tiramisu'], goal:['fat_loss','muscle'], timing:'anytime', cal:263, p:44, c:13, f:4, prep:'3min',
    ingredients:[{name:'Whey tiramisu',qty:30,unit:'g'},{name:'Fromage blanc 0%',qty:150,unit:'g'},{name:'Café expresso froid',qty:80,unit:'ml'},{name:'Cacao pur',qty:10,unit:'g'},{name:'Cannelle',qty:2,unit:'g'}],
    steps:['Verser le café froid dans le blender en premier — il va "dissoudre" le fromage blanc en douceur.','Ajouter fromage blanc + whey + cacao, mixer 15 secondes.','Incorporer la cannelle en dernier, mixer 5 secondes — elle ne doit pas disparaître dans la masse.','Saupoudrer généreusement de cacao non sucré avant de servir.'],
    tips:'La cannelle est le secret du tiramisu napolitain : une touche épicée qui soulève les notes café-cacao et rappelle le vrai mascarpone.' },

  // === ORANGE #2-3 ===
  { id:'sm_orange_02', name:'Orange Coco Vitesse', flavors:['orange'], goal:['fat_loss','recovery'], timing:'post', cal:173, p:25, c:15, f:2, prep:'1min',
    ingredients:[{name:'Whey orange',qty:30,unit:'g'},{name:'Eau de coco',qty:250,unit:'ml'}],
    steps:['Utiliser une eau de coco sortie du réfrigérateur — jamais à température ambiante.','Verser dans le shaker, ajouter la whey orange, shaker 20 secondes.','Servir dans un verre givré pour maximiser la sensation de fraîcheur.'],
    tips:'L\'eau de coco froide accentue le côté agrumes de la whey orange — deux sources d\'électrolytes qui se renforcent mutuellement pour une récupération cardio optimale.' },
  { id:'sm_orange_03', name:'Orange Ananas Tropical Grec', flavors:['orange'], goal:['recovery','performance'], timing:'post', cal:264, p:35, c:27, f:2, prep:'4min',
    ingredients:[{name:'Whey orange',qty:30,unit:'g'},{name:'Ananas',qty:120,unit:'g'},{name:'Yaourt grec 0%',qty:100,unit:'g'},{name:'Eau de coco',qty:100,unit:'ml'}],
    steps:['Couper l\'ananas en cubes, placer au congélateur 30 minutes pour intensifier la fraîcheur.','Mixer eau de coco + ananas frais 20 secondes, puis ajouter yaourt + whey.','Mixer 20 secondes, décorer de dés d\'ananas frais en surface.'],
    tips:'La bromélaïne de l\'ananas frais — jamais cuit ni pasteurisé — agit directement sur l\'inflammation musculaire. L\'association orange + ananas crée une acidité vive qui réveille sans agresser.' },

  // === BIRTHDAY CAKE #2-3 ===
  { id:'sm_birthday_02', name:'Birthday Shake Express', flavors:['birthday_cake'], goal:['muscle'], timing:'anytime', cal:217, p:31, c:12, f:5, prep:'1min',
    ingredients:[{name:'Whey birthday cake',qty:30,unit:'g'},{name:'Lait demi-écrémé',qty:200,unit:'ml'}],
    steps:['Mettre le shaker et le lait au réfrigérateur 10 minutes avant.','Verser lait froid, ajouter whey birthday cake, shaker 20 secondes fermes.','Servir immédiatement pour profiter de la texture mousseuse.'],
    tips:'Boire dans les 3 minutes après shaking pour profiter de la texture mousseuse maximale — au-delà, la mousse retombe et le shake perd son côté festif.' },
  { id:'sm_birthday_03', name:"Gâteau d'Anniversaire Tropical", flavors:['birthday_cake'], goal:['muscle','performance'], timing:'post', cal:327, p:30, c:36, f:7, prep:'3min',
    ingredients:[{name:'Whey birthday cake',qty:30,unit:'g'},{name:'Lait entier',qty:150,unit:'ml'},{name:'Banane',qty:80,unit:'g'},{name:'Miel',qty:10,unit:'g'}],
    steps:['Congeler la banane 1 heure — elle apporte une texture crémeuse naturelle et intensifie le sucré.','Placer banane + lait dans le blender, mixer 20 secondes.','Ajouter whey + miel, mixer 15 secondes pour homogénéiser sans détruire la mousse.'],
    tips:'Le miel de fleurs d\'oranger sur une base birthday cake crée une complexité aromatique inattendue — floral, vanillé, fruité. Consommer dans les 30 minutes post-entraînement pour maximiser la synthèse glycogénique.' },

  // === CANNELLE #2-3 ===
  { id:'sm_cinnamon_02', name:'Cannelle Pure Power', flavors:['cinnamon'], goal:['fat_loss'], timing:'anytime', cal:126, p:24, c:4, f:2, prep:'1min',
    ingredients:[{name:'Whey cannelle',qty:30,unit:'g'},{name:'Eau',qty:250,unit:'ml'},{name:'Cannelle',qty:2,unit:'g'}],
    steps:['Verser l\'eau froide dans le shaker, ajouter la cannelle en premier et agiter 5 secondes pour la disperser.','Incorporer la whey cannelle, shaker 20 secondes.','Servir aussitôt — la cannelle se redépose rapidement si laissée au repos.'],
    tips:'Eau très froide + cannelle = amertume nulle, arôme épicé net. Pour réguler la glycémie en même temps qu\'on hydrate : une association rare et efficace.' },
  { id:'sm_cinnamon_03', name:'Bowl Cannelle Douce', flavors:['cinnamon'], goal:['muscle','recovery'], timing:'post', cal:326, p:41, c:36, f:2, prep:'3min',
    ingredients:[{name:'Whey cannelle',qty:30,unit:'g'},{name:'Yaourt grec 0%',qty:150,unit:'g'},{name:'Banane',qty:80,unit:'g'},{name:'Cannelle',qty:2,unit:'g'},{name:'Miel',qty:10,unit:'g'}],
    steps:['Mixer banane + yaourt grec + miel 20 secondes — base crémeuse bien homogène.','Ajouter whey + cannelle, mixer 15 secondes à vitesse réduite pour préserver les arômes volatils.','Verser dans un bol, garnir d\'un trait de miel et d\'une pincée de cannelle pour le service.'],
    tips:'Le miel de châtaignier renforce les notes épicées de la cannelle là où le miel toutes fleurs les adoucit — choisissez selon l\'intensité souhaitée. Ce bol protéiné se sert à température fraîche, pas glacée.' },

  // === CHEESECAKE CITRON #2-3 ===
  { id:'sm_cheesecake_02', name:'Cheesecake Frais Express', flavors:['cheesecake_citron'], goal:['fat_loss','muscle'], timing:'anytime', cal:218, p:42, c:8, f:2, prep:'1min',
    ingredients:[{name:'Whey cheesecake citron',qty:30,unit:'g'},{name:'Fromage blanc 0%',qty:150,unit:'g'},{name:'Jus de citron',qty:30,unit:'ml'}],
    steps:['Verser le fromage blanc dans un bol, fouetter 10 secondes à la main pour l\'aérer légèrement.','Ajouter whey + jus de citron, shaker ou fouet 20 secondes — conserver la texture dense.','Réfrigérer 5 minutes avant de déguster pour que la texture se raffermisse.'],
    tips:'Le fromage blanc fouetté avant l\'ajout de la whey incorpore de l\'air et donne une texture beaucoup plus légère — comme une mousse de cheesecake plutôt qu\'un simple shake.' },
  { id:'sm_cheesecake_03', name:'Fraise Cheesecake Glacé', flavors:['cheesecake_citron'], goal:['fat_loss','recovery'], timing:'anytime', cal:246, p:35, c:22, f:2, prep:'4min',
    ingredients:[{name:'Whey cheesecake citron',qty:30,unit:'g'},{name:'Yaourt grec 0%',qty:100,unit:'g'},{name:'Fraises congelées',qty:100,unit:'g'},{name:'Miel',qty:10,unit:'g'},{name:'Glaçons',qty:100,unit:'g'}],
    steps:['Ne jamais décongeler les fraises — elles tempèrent le miel et maintiennent la fraîcheur.','Placer yaourt + fraises congelées + miel dans le blender, mixer 30 secondes.','Ajouter whey + glaçons, mixer 20 secondes à pleine puissance pour une texture glacée dense.'],
    tips:'Les fraises congelées + citron de la whey créent un accord acidulé-fruité typique du cheesecake new-yorkais : ne pas sucrer davantage — l\'équilibre est déjà parfait.' },

  // === TOFFEE #2-3 ===
  { id:'sm_toffee_02', name:'Toffee Lait Flash', flavors:['toffee'], goal:['muscle'], timing:'anytime', cal:253, p:31, c:12, f:9, prep:'1min',
    ingredients:[{name:'Whey toffee',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'}],
    steps:['Sortir le lait du réfrigérateur au dernier moment — lait à 4°C maximum.','Verser dans le shaker, ajouter whey toffee, shaker 20 secondes à amplitude complète.','Servir immédiatement dans un verre froid pour préserver la saveur caramel.'],
    tips:'Le lait entier est le seul medium qui révèle le toffee dans toute sa complexité : les matières grasses portent les arômes caramel beurré là où l\'eau ou le lait écrémé les aplatissent.' },
  { id:'sm_toffee_03', name:'Toffee Banane Cacahuète', flavors:['toffee'], goal:['muscle','performance'], timing:'pre', cal:392, p:34, c:37, f:12, prep:'4min',
    ingredients:[{name:'Whey toffee',qty:30,unit:'g'},{name:'Banane',qty:100,unit:'g'},{name:'Beurre de cacahuète',qty:15,unit:'g'},{name:'Lait demi-écrémé',qty:150,unit:'ml'},{name:'Glaçons',qty:100,unit:'g'}],
    steps:['Congeler la banane 1 heure avant.','Mixer banane congelée + lait à vitesse progressive, 20 secondes.','Ajouter whey + beurre de cacahuète + glaçons, mixer 30 secondes à pleine puissance.'],
    tips:'Toffee + cacahuète + banane mûre : c\'est l\'accord Banoffee transposé en pre-workout. Les glucides rapides de la banane se combinent parfaitement à l\'énergie lente de la cacahuète — consommer 45 minutes avant l\'effort.' },

  // === CHOCOLAT BLANC #2-3 ===
  { id:'sm_whitechoc_02', name:'Coco Blanc Léger', flavors:['white_chocolate'], goal:['fat_loss','recovery'], timing:'anytime', cal:178, p:25, c:15, f:2, prep:'1min',
    ingredients:[{name:'Whey chocolat blanc',qty:30,unit:'g'},{name:'Eau de coco',qty:250,unit:'ml'}],
    steps:['Utiliser une eau de coco bien froide, sortie du réfrigérateur.','Verser dans le shaker, ajouter whey chocolat blanc, shaker 20 secondes.','Servir immédiatement dans un verre givré.'],
    tips:'L\'accord chocolat blanc + noix de coco est l\'un des plus classiques de la pâtisserie — deux sources de sucrosité douce qui se complètent sans se dominer. Idéal après un effort sous la chaleur.' },
  { id:'sm_whitechoc_03', name:'Chocolat Blanc Myrtille Amande', flavors:['white_chocolate'], goal:['muscle','recovery'], timing:'post', cal:337, p:33, c:22, f:13, prep:'4min',
    ingredients:[{name:'Whey chocolat blanc',qty:30,unit:'g'},{name:'Lait demi-écrémé',qty:150,unit:'ml'},{name:'Myrtilles congelées',qty:80,unit:'g'},{name:'Purée d\'amande',qty:15,unit:'g'},{name:'Glaçons',qty:100,unit:'g'}],
    steps:['Verser le lait + myrtilles congelées + glaçons dans le blender, mixer 30 secondes — base violet intense.','Ajouter purée d\'amande, mixer 10 secondes pour l\'incorporer sans l\'homogénéiser complètement.','Ajouter la whey, mixer 15 secondes à vitesse réduite.'],
    tips:'Le trio chocolat blanc-myrtille-amande est un accord signature : la myrtille apporte acidité et couleur, l\'amande une note torréfiée qui rappelle le praliné blanc, le chocolat blanc arrondit l\'ensemble.' },

  // === PIÑA COLADA #2-3 ===
  { id:'sm_pina_02', name:'Coco Express', flavors:['pina_colada'], goal:['muscle','performance'], timing:'post', cal:173, p:25, c:15, f:2, prep:'1min',
    ingredients:[{name:'Whey piña colada',qty:30,unit:'g'},{name:'Eau de coco',qty:250,unit:'ml'}],
    steps:['Utiliser de l\'eau de coco nature — non sucrée, non aromatisée, sortie du réfrigérateur.','Verser dans le shaker, ajouter la whey piña colada, shaker 20 secondes.','Servir dans un verre glacé pour une expérience tropicale rafraîchissante.'],
    tips:'Ce shake minimaliste repose entièrement sur la qualité de la whey — une eau de coco bien froide fait ressortir les notes d\'ananas et de noix de coco sans artifice.' },
  { id:'sm_pina_03', name:'Tropicale Crémeuse', flavors:['pina_colada'], goal:['muscle','recovery'], timing:'post', cal:217, p:25, c:21, f:4, prep:'3min',
    ingredients:[{name:'Whey piña colada',qty:30,unit:'g'},{name:'Ananas',qty:100,unit:'g'},{name:'Eau de coco',qty:100,unit:'ml'},{name:'Lait de coco',qty:30,unit:'ml'},{name:'Glaçons',qty:100,unit:'g'}],
    steps:['Couper l\'ananas, mixer avec les glaçons 20 secondes — base granita d\'ananas.','Ajouter eau de coco + lait de coco, mixer 10 secondes.','Incorporer la whey, mixer 15 secondes, ajouter un trait de citron vert avant de servir.'],
    tips:'Le lait de coco est gras et crémeux, l\'eau de coco est légère et sucrée — les deux ensemble donnent exactement la texture d\'un vrai piña colada. Le citron vert est indispensable pour la finition.' },

  // === VANILLE CANNELLE #2-3 ===
  { id:'sm_vanilla_cinn_02', name:'Lait Vanille Cannelle Flash', flavors:['vanilla_cinnamon'], goal:['muscle','recovery'], timing:'anytime', cal:253, p:31, c:13, f:9, prep:'1min',
    ingredients:[{name:'Whey vanille cannelle',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Cannelle',qty:2,unit:'g'}],
    steps:['Infuser la cannelle dans le lait entier froid 3 minutes avant de shaker.','Ajouter la whey vanille cannelle, shaker 25 secondes vigoureusement.','Servir dans un verre froid, saupoudrer une pincée de cannelle au service.'],
    tips:'Lait entier + cannelle infusée à froid : la texture est onctueuse, la cannelle est diffuse mais présente — jamais dominante. C\'est un lait de Noël protéiné.' },
  { id:'sm_vanilla_cinn_03', name:'Banana Vanille Épicée', flavors:['vanilla_cinnamon'], goal:['muscle','performance'], timing:'pre', cal:333, p:44, c:32, f:3, prep:'4min',
    ingredients:[{name:'Whey vanille cannelle',qty:30,unit:'g'},{name:'Yaourt grec 0%',qty:150,unit:'g'},{name:'Banane',qty:80,unit:'g'},{name:'Lait demi-écrémé',qty:100,unit:'ml'},{name:'Cannelle',qty:2,unit:'g'}],
    steps:['Congeler la banane à l\'avance — texture naturellement glacée et sucrosité concentrée.','Placer yaourt + banane congelée + lait dans le blender, mixer 20 secondes.','Ajouter whey + cannelle, mixer 15 secondes à vitesse modérée.'],
    tips:'Yaourt grec + vanille + cannelle + banane : c\'est l\'accord d\'un lassi indien raffiné. Riche en protéines, en glucides lents, parfait 45 minutes avant une séance longue durée.' },

  // === SPÉCULOOS #2-3 ===
  { id:'sm_speculoos_02', name:'Shaker Biscuit Lacté', flavors:['speculoos'], goal:['muscle','fat_loss'], timing:'post', cal:237, p:32, c:16, f:5, prep:'1min',
    ingredients:[{name:'Whey spéculoos',qty:30,unit:'g'},{name:'Lait demi-écrémé',qty:250,unit:'ml'},{name:'Cannelle',qty:2,unit:'g'}],
    steps:['Verser le lait froid dans le shaker, ajouter la cannelle en premier.','Ajouter la whey spéculoos, shaker 20 secondes à amplitude maximale.','Servir immédiatement pour profiter de la texture mousseuse et des arômes de biscuit.'],
    tips:'La cannelle dans un lait froid diffuse lentement ses arômes — si vous préparez ce shake 2 minutes avant de le boire, laissez la cannelle reposer dans le lait avant de fermer le shaker.' },
  { id:'sm_speculoos_03', name:'Fromage Blanc Épice Dorée', flavors:['speculoos'], goal:['fat_loss','muscle'], timing:'anytime', cal:319, p:43, c:33, f:2, prep:'4min',
    ingredients:[{name:'Whey spéculoos',qty:30,unit:'g'},{name:'Fromage blanc 0%',qty:150,unit:'g'},{name:'Banane',qty:70,unit:'g'},{name:'Miel',qty:10,unit:'g'},{name:'Cannelle',qty:2,unit:'g'}],
    steps:['Couper la banane mûre, mixer avec fromage blanc + miel 20 secondes.','Ajouter whey + cannelle, mixer 15 secondes — s\'arrêter à texture de crème épaisse.','Servir en bol avec quelques éclats de spéculoos émiettés en surface si macro permettent.'],
    tips:'Ce bol protéiné rappelle un biscuit belge reconstitué à la cuillère : fromage blanc pour la fraîcheur, miel pour le caramel, cannelle pour la chaleur épicée — les trois piliers du spéculoos.' },

  // === CAPPUCCINO #2-3 ===
  { id:'sm_cappuccino_02', name:'Expresso Lait Flash', flavors:['cappuccino'], goal:['performance','muscle'], timing:'pre', cal:253, p:31, c:13, f:9, prep:'1min',
    ingredients:[{name:'Whey cappuccino',qty:30,unit:'g'},{name:'Café expresso froid',qty:100,unit:'ml'},{name:'Lait entier',qty:200,unit:'ml'}],
    steps:['Préparer un double ristretto (pas un long expresso), laisser refroidir à température ambiante — jamais le mettre chaud au shaker.','Verser café refroidi + lait dans le shaker, ajouter la whey, shaker 20 secondes.','Servir dans un verre givre et déguster aussitôt.'],
    tips:'Un double ristretto concentre les arômes de café sans excès d\'eau — la caféine est identique mais le goût est deux fois plus intense. C\'est la base d\'un cappuccino digne d\'un bar milanais.' },
  { id:'sm_cappuccino_03', name:'Frozen Cappuccino Banana', flavors:['cappuccino'], goal:['muscle','recovery'], timing:'post', cal:255, p:35, c:25, f:2, prep:'4min',
    ingredients:[{name:'Whey cappuccino',qty:30,unit:'g'},{name:'Yaourt grec 0%',qty:100,unit:'g'},{name:'Café expresso froid',qty:50,unit:'ml'},{name:'Banane',qty:80,unit:'g'},{name:'Glaçons',qty:100,unit:'g'}],
    steps:['Préparer l\'expresso, laisser refroidir. Couper la banane en rondelles, congeler 20 minutes.','Mixer yaourt + café + banane congelée 30 secondes.','Ajouter whey + glaçons, mixer 15 secondes — texture semi-glacée.'],
    tips:'Banane mûre + café : le sucre naturel de la banane contrebalance l\'amertume de l\'expresso exactement comme le sucre dans un cappuccino traditionnel — mais avec des glucides de qualité.' },

  // === PAIN D'ÉPICES #2-3 ===
  { id:'sm_gingerbread_02', name:"Shaker Pain d'Épices Lacté", flavors:['gingerbread'], goal:['muscle','recovery'], timing:'post', cal:233, p:32, c:15, f:5, prep:'1min',
    ingredients:[{name:"Whey pain d'épices",qty:30,unit:'g'},{name:'Lait demi-écrémé',qty:250,unit:'ml'},{name:'Gingembre râpé',qty:5,unit:'g'}],
    steps:['Râper finement le gingembre frais, récupérer le jus en pressant la pulpe entre les doigts.','Verser lait froid + jus de gingembre dans le shaker, ajouter la whey, shaker 25 secondes.','Servir dans un verre froid et consommer dans les 5 minutes.'],
    tips:'Le jus de gingembre pressé se disperse mieux que la pulpe râpée — texture plus lisse, piquant mieux distribué. Ce shake est un digestif autant qu\'une récupération musculaire.' },
  { id:'sm_gingerbread_03', name:'Bol Épicé Fromage Banane', flavors:['gingerbread'], goal:['fat_loss','muscle'], timing:'anytime', cal:315, p:43, c:32, f:2, prep:'4min',
    ingredients:[{name:"Whey pain d'épices",qty:30,unit:'g'},{name:'Fromage blanc 0%',qty:150,unit:'g'},{name:'Banane',qty:70,unit:'g'},{name:'Gingembre râpé',qty:5,unit:'g'},{name:'Miel',qty:10,unit:'g'}],
    steps:['Couper la banane, l\'écraser avec le miel à la fourchette pour former une pâte homogène.','Mixer pâte banane-miel + fromage blanc 15 secondes.','Ajouter whey + gingembre très finement râpé, mixer 15 secondes — le gingembre en dernier pour préserver ses huiles essentielles.'],
    tips:'Gingembre + miel + cannelle : c\'est le trinôme du pain d\'épices alsacien. La finesse du râpage du gingembre est critique — trop grossier, il donne une texture fibreuse désagréable ; très fin, il se fond et parfume sans agresser.' },

  // === CHOCOLAT #5-11 ===
  { id:'sm_choco_05', name:'Forêt Noire Express', flavors:['chocolate'], goal:['fat_loss'], timing:'post', cal:234, p:36, c:18, f:2, prep:'1min',
    ingredients:[{name:'Whey chocolat',qty:30,unit:'g'},{name:'Fraises congelées',qty:150,unit:'g'},{name:'Yaourt grec 0%',qty:100,unit:'g'},{name:'Eau',qty:100,unit:'ml'}],
    steps:['Placer le yaourt grec au congélateur 15 minutes avant — légèrement pris, il donnera une texture quasi-glacée incomparable.','Verser l\'eau dans le blender, ajouter les fraises congelées puis le yaourt froid.','Incorporer la whey chocolat en dernier, mixer 40 secondes — la consistance doit évoquer un sorbet mousseux.'],
    tips:'Le yaourt grec légèrement congelé remplace avantageusement la crème dans une Forêt Noire : même onctuosité, acidité lactique en bonus, zéro culpabilité.' },
  { id:'sm_choco_06', name:'Avocat Noir', flavors:['chocolate'], goal:['muscle'], timing:'anytime', cal:419, p:34, c:19, f:23, prep:'3min',
    ingredients:[{name:'Whey chocolat',qty:30,unit:'g'},{name:'Avocat',qty:75,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Cacao pur',qty:10,unit:'g'}],
    steps:['Utiliser un avocat à température ambiante (jamais réfrigéré) — ses graisses s\'émulsionnent deux fois mieux à 20 °C qu\'à 4 °C.','Mixer l\'avocat avec le lait entier 20 secondes seuls pour créer une crème de base parfaitement lisse.','Tamiser le cacao pur et ajouter la whey, mixer 60 secondes supplémentaires à haute vitesse.','Ajouter 1 pincée de piment d\'Espelette au service — elle amplifie les notes amères du cacao sans apporter de chaleur perceptible.'],
    tips:'L\'avocat est le beurre de cacao du monde végétal : même onctuosité, mêmes acides gras mono-insaturés. Avec du cacao pur, vous obtenez un smoothie dont la texture rappelle une ganache — luxueux, et pourtant sain.' },
  { id:'sm_choco_07', name:'Jaffa Power', flavors:['chocolate'], goal:['performance'], timing:'pre', cal:266, p:26, c:36, f:2, prep:'1min',
    ingredients:[{name:'Whey chocolat',qty:30,unit:'g'},{name:"Jus d'orange",qty:150,unit:'ml'},{name:'Banane',qty:80,unit:'g'},{name:'Eau',qty:50,unit:'ml'}],
    steps:['Utiliser le jus d\'une orange pressée à la main plutôt qu\'un jus industriel — les huiles essentielles du zeste restent dans la pulpe pressée manuellement.','Verser l\'eau, puis le jus d\'orange dans le blender, ajouter la banane coupée.','Incorporer la whey en dernier, mixer 45 secondes. Râper légèrement le zeste d\'une demi-orange sur le dessus avant de servir.'],
    tips:'Le zeste d\'orange, même en quantité infinitésimale, contient dix fois plus d\'arôme que le jus. C\'est le secret des chocolatiers pour les ganaches à l\'orange : ce n\'est pas le sucre acide qui parle, c\'est l\'huile essentielle.' },
  { id:'sm_choco_08', name:'After Eight Recovery', flavors:['chocolate'], goal:['recovery'], timing:'post', cal:218, p:42, c:8, f:2, prep:'3min',
    ingredients:[{name:'Whey chocolat',qty:30,unit:'g'},{name:'Fromage blanc 0%',qty:150,unit:'g'},{name:'Menthe fraîche',qty:8,unit:'g'},{name:'Glaçons',qty:100,unit:'g'},{name:'Eau',qty:80,unit:'ml'}],
    steps:['Blanchir les feuilles de menthe 10 secondes dans l\'eau bouillante, puis plonger immédiatement dans l\'eau glacée — la chlorophylle se fixe et la couleur reste vert vif.','Mixer menthe blanchie + eau froide + fromage blanc 30 secondes pour obtenir une base crème verte.','Ajouter la whey et les glaçons, mixer 60 secondes à puissance maximale jusqu\'à texture mousseuse et aérée.'],
    tips:'La technique de blanchiment de la menthe, empruntée à la cuisine fine, fixe les arômes volatils et donne une couleur émeraude spectaculaire — l\'After Eight devient une expérience visuelle avant même d\'être gustative.' },
  { id:'sm_choco_09', name:'Dark Espresso Boost', flavors:['chocolate'], goal:['performance'], timing:'pre', cal:277, p:31, c:27, f:5, prep:'1min',
    ingredients:[{name:'Whey chocolat',qty:30,unit:'g'},{name:'Café expresso froid',qty:100,unit:'ml'},{name:'Lait demi-écrémé',qty:200,unit:'ml'},{name:'Banane',qty:60,unit:'g'}],
    steps:['Préparer le double expresso et le verser sur 2-3 glaçons — le choc thermique rapide préserve les arômes volatils du café et évite l\'oxydation.','Verser lait froid + café glacé dans le blender, ajouter la banane coupée (idéalement congelée la veille).','Incorporer la whey en dernier, mixer 50 secondes — la banane congelée crée une émulsion naturelle avec le café pour une texture de cold brew latte épais.'],
    tips:'Refroidir un expresso en choc thermique plutôt qu\'en le laissant reposer préserve ses arômes floraux et évite l\'amertume : le même principe que pour un café japonais iced — la technique fait toute la différence.' },
  { id:'sm_choco_10', name:'Bounty Shake', flavors:['chocolate'], goal:['muscle'], timing:'anytime', cal:285, p:26, c:34, f:5, prep:'1min',
    ingredients:[{name:'Whey chocolat',qty:30,unit:'g'},{name:'Lait de coco',qty:50,unit:'ml'},{name:'Eau de coco',qty:150,unit:'ml'},{name:'Banane',qty:100,unit:'g'}],
    steps:['Congeler la banane en morceaux au moins 2 heures à l\'avance — elle deviendra le "cœur" crémeux du Bounty.','Verser l\'eau de coco puis le lait de coco dans le blender, ajouter la banane congelée.','Incorporer la whey en dernier, mixer 45 secondes. Servir dans un verre froid, éventuellement avec quelques copeaux de noix de coco grillée sur le dessus (0 impact macro).'],
    tips:'Faire griller 30 secondes à sec quelques flocons de noix de coco avant de les poser sur le smoothie libère les aldéhydes de noix de coco — un arôme dix fois plus puissant que cru, pour un effet Bounty absolument saisissant.' },
  { id:'sm_choco_11', name:'Brownie Batter', flavors:['chocolate'], goal:['muscle'], timing:'anytime', cal:415, p:36, c:25, f:19, prep:'1min',
    ingredients:[{name:'Whey chocolat',qty:30,unit:'g'},{name:'Beurre de cacahuète',qty:20,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Miel',qty:10,unit:'g'}],
    steps:['Tiédir légèrement le lait entier (40 °C, jamais plus) — la chaleur douce fluidifie le beurre de cacahuète et favorise son émulsion homogène.','Verser le lait tiède dans le shaker, ajouter le beurre de cacahuète et le miel, agiter 20 secondes.','Incorporer la whey, ajouter 1 pincée généreuse de fleur de sel, shaker vigoureusement 60 secondes jusqu\'à texture crémeuse et légèrement mousseuse.'],
    tips:'La fleur de sel sur le chocolat-cacahuète n\'est pas un accessoire : c\'est le même principe que le macaron chocolat-caramel salé — le sel supprime l\'amertume, amplifie le sucré, et crée cette tension gustative qui rend le brownie inoubliable.' },

  // === VANILLE #5-11 ===
  { id:'sm_van_05', name:'Tropical Sunrise', flavors:['vanilla'], goal:['performance'], timing:'post', cal:258, p:25, c:35, f:2, prep:'2min',
    ingredients:[{name:'Whey vanille',qty:30,unit:'g'},{name:'Mangue',qty:150,unit:'g'},{name:'Eau de coco',qty:200,unit:'ml'},{name:'Glaçons',qty:80,unit:'g'}],
    steps:['Utiliser de la mangue Alphonso congelée — sa chair fibreuse et ses notes de fleur d\'oranger magnifient la vanille mieux que toute autre variété.','Mixer l\'eau de coco avec la mangue et les glaçons 45 secondes à pleine puissance pour une émulsion dense.','Ajouter la whey vanille, mixer 10 secondes seulement — la protéine ne doit pas se réchauffer ni mousser excessivement.'],
    tips:'La mangue congelée remplace les glaçons et intensifie le fructose naturel : la vanille y trouve un contrepoint tropical qui la rend lumineuse.' },
  { id:'sm_van_06', name:'Zen Matcha Latte', flavors:['vanilla'], goal:['fat_loss'], timing:'pre', cal:250, p:40, c:18, f:2, prep:'3min',
    ingredients:[{name:'Whey vanille',qty:30,unit:'g'},{name:'Yaourt grec 0%',qty:150,unit:'g'},{name:'Matcha',qty:5,unit:'g'},{name:'Miel',qty:10,unit:'g'},{name:'Eau',qty:100,unit:'ml'}],
    steps:['Tamiser le matcha dans l\'eau à 70 °C (jamais bouillante) et fouetter en zigzag jusqu\'à mousse verte homogène — la méthode chasen japonaise.','Laisser tiédir 5 minutes, puis mixer avec le yaourt grec et le miel.','Incorporer la whey vanille et mixer 20 secondes à basse vitesse pour ne pas dénaturer les catéchines du matcha.'],
    tips:'Vanille et matcha partagent les mêmes notes vertes et lactées — l\'un sublimant l\'amer de l\'autre : ensemble, ils créent une harmonie absolue, jamais une compétition.' },
  { id:'sm_van_07', name:'Fraise Velvet', flavors:['vanilla'], goal:['recovery'], timing:'anytime', cal:269, p:32, c:24, f:5, prep:'2min',
    ingredients:[{name:'Whey vanille',qty:30,unit:'g'},{name:'Fraises congelées',qty:150,unit:'g'},{name:'Lait demi-écrémé',qty:200,unit:'ml'},{name:'Extrait vanille',qty:3,unit:'ml'}],
    steps:['Verser le lait et l\'extrait de vanille dans le blender, ajouter les fraises congelées directement — le choc thermique crée une mousse naturelle.','Mixer 45 secondes à puissance maximale pour une texture "velvet" : lisse, dense, sans fibres apparentes.','Ajouter la whey vanille, pulser 3 fois brièvement pour l\'incorporer sans détruire la mousse.'],
    tips:'L\'extrait de vanille pure amplifie les aldéhydes naturels des fraises congelées — choisissez un extrait bourbon Madagascar pour cet effet de confiture chaude servie froide.' },
  { id:'sm_van_08', name:'Espresso Power', flavors:['vanilla'], goal:['performance'], timing:'pre', cal:333, p:31, c:32, f:9, prep:'1min',
    ingredients:[{name:'Whey vanille',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Café expresso froid',qty:100,unit:'ml'},{name:'Banane',qty:80,unit:'g'}],
    steps:['Préparer un double ristretto (pas un expresso allongé) et le refroidir au réfrigérateur — la concentration maximise les notes de cacao qui dialoguent avec la vanille.','Verser lait entier, café froid et banane dans le blender, mixer 30 secondes.','Ajouter la whey vanille et shaker énergiquement 20 secondes — ne pas blender pour conserver la texture fluide du latte.'],
    tips:'Le ristretto froid + banane mûre crée un profil aromatique de banane flambée : la vanille agit comme un pont entre l\'amertume du café et la douceur du fruit.' },
  { id:'sm_van_09', name:'Blueberry Storm', flavors:['vanilla'], goal:['recovery'], timing:'post', cal:287, p:39, c:26, f:3, prep:'3min',
    ingredients:[{name:'Whey vanille',qty:30,unit:'g'},{name:'Myrtilles congelées',qty:120,unit:'g'},{name:'Yaourt grec 0%',qty:100,unit:'g'},{name:'Lait demi-écrémé',qty:100,unit:'ml'}],
    steps:['Mixer les myrtilles congelées avec le lait à pleine puissance 45 secondes — le violet profond indique que les anthocyanes sont libérées.','Ajouter le yaourt grec, mixer 20 secondes pour une texture dense et crémeuse.','Incorporer la whey vanille en pulsant 5 fois : la vanille s\'intègre sans se dissoudre uniformément, créant des stries aromatiques.'],
    tips:'La vanille bourbon avec ses notes de fève tonka joue un rôle révélateur sur les myrtilles : elle atténue leur acidité et fait émerger leur côté confiture sauvage.' },
  { id:'sm_van_10', name:'Coco Paradise', flavors:['vanilla'], goal:['muscle'], timing:'anytime', cal:354, p:38, c:37, f:6, prep:'3min',
    ingredients:[{name:'Whey vanille',qty:30,unit:'g'},{name:'Fromage blanc 0%',qty:100,unit:'g'},{name:'Banane',qty:100,unit:'g'},{name:'Eau de coco',qty:150,unit:'ml'},{name:'Lait de coco',qty:60,unit:'ml'}],
    steps:['Mixer l\'eau de coco avec le lait de coco et la banane 30 secondes — cette base tropicale est l\'écrin parfait pour la vanille.','Ajouter le fromage blanc et mixer 20 secondes pour une émulsion dense et stable.','Incorporer la whey vanille, mixer 15 secondes à basse vitesse pour préserver les arômes délicats de la noix de coco.'],
    tips:'Le lait de coco apporte les triglycérides à chaîne moyenne qui transportent les molécules aromatiques de la vanille — la saveur s\'installe plus longtemps en bouche.' },
  { id:'sm_van_11', name:'Vanille Absolue', flavors:['vanilla'], goal:['muscle'], timing:'anytime', cal:512, p:39, c:44, f:20, prep:'1min',
    ingredients:[{name:'Whey vanille',qty:30,unit:'g'},{name:'Lait entier',qty:300,unit:'ml'},{name:'Beurre de cacahuète',qty:15,unit:'g'},{name:'Banane',qty:100,unit:'g'}],
    steps:['Congeler la banane en rondelles la veille — elle devient crémeuse comme de la glace et concentre ses sucres naturels.','Mixer lait entier, beurre de cacahuète et banane congelée 1 minute à pleine puissance jusqu\'à texture parfaitement lisse.','Ajouter la whey vanille, pulser 5 secondes seulement — la vanille doit rester en suspension, perceptible à chaque gorgée.'],
    tips:'C\'est le smoothie de la vanille dans toute sa majesté : la cacahuète en apporte les notes grillées, la banane le velouté, et la whey vanille bourbon les conclut sur un accord lacté et floral inimitable.' }
];

// ─── RECIPE PICKER ───────────────────────────────────────────────────────────
function renderRecipePicker(p) {
  var S = window.S;
  var picker = S._recipePicker;
  if (!picker) return;
  var slotKey = picker.slotKey;
  var query = picker.query || '';
  var slotLabels = { breakfast: 'Petit-déjeuner', lunch: 'Déjeuner', snack: 'Collation', dinner: 'Dîner' };
  var slotLabel = slotLabels[slotKey] || slotKey;

  // ── Restore / init macro filter state from sessionStorage ──
  var SFC_FILTER_KEY = 'sfc_recipe_filters';
  var savedFilters = (function() {
    try { return JSON.parse(sessionStorage.getItem(SFC_FILTER_KEY) || 'null'); } catch(e) { return null; }
  })();
  if (!picker._filtersInit) {
    picker.minKcal    = savedFilters ? savedFilters.minKcal    : 0;
    picker.maxKcal    = savedFilters ? savedFilters.maxKcal    : 1200;
    picker.minProt    = savedFilters ? savedFilters.minProt    : 0;
    picker.activeTags = savedFilters ? (savedFilters.activeTags || []) : [];
    picker.sortBy     = savedFilters ? (savedFilters.sortBy || 'default') : 'default';
    picker._filtersInit = true;
  }

  // ── Helper: save filters to sessionStorage ──
  function saveFilters() {
    try {
      sessionStorage.setItem(SFC_FILTER_KEY, JSON.stringify({
        minKcal:    picker.minKcal,
        maxKcal:    picker.maxKcal,
        minProt:    picker.minProt,
        activeTags: picker.activeTags,
        sortBy:     picker.sortBy
      }));
    } catch(e) {}
  }

  var overlay = h('div', {
    style: 'position:fixed;top:0;left:0;right:0;bottom:0;background:var(--bg,#F4F3EE);z-index:9200;display:flex;flex-direction:column;overflow:hidden'
  });

  // Header
  var hdr = h('div', { style: 'display:flex;align-items:center;gap:10px;padding:16px 16px 12px;background:var(--card,#FFFFFF);box-shadow:0 2px 8px rgba(0,0,0,0.08);flex-shrink:0' });
  hdr.appendChild(h('button', {
    style: 'background:none;border:none;font-size:18px;cursor:pointer;padding:4px 8px',
    onclick: function() { S._recipePicker = null; window.render(); }
  }, '\u2190'));
  hdr.appendChild(h('div', { style: 'font-size:16px;font-weight:700;color:var(--black,#0A0A09);flex:1' }, '\uD83C\uDF7D Choisir une recette \u2014 ' + slotLabel));
  overlay.appendChild(hdr);

  // Search box
  var searchWrap = h('div', { style: 'padding:12px 16px;background:var(--card,#FFFFFF);border-top:1px solid var(--border,#E5E4DE);flex-shrink:0' });
  var searchInput = h('input', {
    type: 'text',
    placeholder: 'Rechercher une recette...',
    value: query,
    style: 'width:100%;padding:12px 16px;border:1px solid var(--border,#D8D8D0);border-radius:2px;font-size:16px;background:var(--bg,#FAF9F6);box-sizing:border-box'
  });
  searchInput.addEventListener('input', function(e) { S._recipePicker.query = e.target.value; window.render(); });
  searchWrap.appendChild(searchInput);
  overlay.appendChild(searchWrap);

  // ── Macro filter zone ──
  var filterZone = h('div', { style: 'padding:12px 16px 8px;background:var(--ivory,#FAF9F6);border-top:1px solid var(--border,#E5E4DE);flex-shrink:0' });

  // Row 1: kcal range + protein min
  var row1 = h('div', { style: 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:8px' });

  // Min kcal
  var minKcalWrap = h('div');
  var minKcalLabel = h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px' }, 'Kcal min');
  var minKcalInput = h('input', {
    type: 'range',
    min: '0', max: '1200', step: '50',
    value: String(picker.minKcal),
    style: 'width:100%;accent-color:var(--accent,#1A4A1A)'
  });
  var minKcalVal = h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--black,#0A0A09);text-align:center;margin-top:2px' }, picker.minKcal + ' kcal');
  minKcalInput.addEventListener('input', function(e) {
    picker.minKcal = parseInt(e.target.value, 10);
    if (picker.minKcal > picker.maxKcal) picker.maxKcal = picker.minKcal;
    saveFilters();
    window.render();
  });
  minKcalWrap.appendChild(minKcalLabel);
  minKcalWrap.appendChild(minKcalInput);
  minKcalWrap.appendChild(minKcalVal);
  row1.appendChild(minKcalWrap);

  // Max kcal
  var maxKcalWrap = h('div');
  var maxKcalLabel = h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px' }, 'Kcal max');
  var maxKcalInput = h('input', {
    type: 'range',
    min: '0', max: '1200', step: '50',
    value: String(picker.maxKcal),
    style: 'width:100%;accent-color:var(--accent,#1A4A1A)'
  });
  var maxKcalVal = h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--black,#0A0A09);text-align:center;margin-top:2px' }, picker.maxKcal + ' kcal');
  maxKcalInput.addEventListener('input', function(e) {
    picker.maxKcal = parseInt(e.target.value, 10);
    if (picker.maxKcal < picker.minKcal) picker.minKcal = picker.maxKcal;
    saveFilters();
    window.render();
  });
  maxKcalWrap.appendChild(maxKcalLabel);
  maxKcalWrap.appendChild(maxKcalInput);
  maxKcalWrap.appendChild(maxKcalVal);
  row1.appendChild(maxKcalWrap);

  // Protein min
  var minProtWrap = h('div');
  var minProtLabel = h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px' }, 'Prot\u00e9ines min.');
  var minProtInput = h('input', {
    type: 'range',
    min: '0', max: '60', step: '5',
    value: String(picker.minProt),
    style: 'width:100%;accent-color:var(--accent,#1A4A1A)'
  });
  var minProtVal = h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--black,#0A0A09);text-align:center;margin-top:2px' }, picker.minProt + 'g');
  minProtInput.addEventListener('input', function(e) {
    picker.minProt = parseInt(e.target.value, 10);
    saveFilters();
    window.render();
  });
  minProtWrap.appendChild(minProtLabel);
  minProtWrap.appendChild(minProtInput);
  minProtWrap.appendChild(minProtVal);
  row1.appendChild(minProtWrap);

  filterZone.appendChild(row1);

  // Row 2: tag chips
  var TAG_DEFS = [
    { key: 'high-protein', label: 'Prot\u00e9in\u00e9' },
    { key: 'vegetarian',   label: 'V\u00e9g\u00e9tarien' },
    { key: 'vegan',        label: 'Vegan' },
    { key: 'low-carb',     label: 'Low-carb' },
    { key: 'gluten-free',  label: 'Sans gluten' },
    { key: 'quick',        label: 'Rapide' },
    { key: 'meal-prep',    label: 'Meal prep' }
  ];
  var tagRow = h('div', { style: 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px' });
  TAG_DEFS.forEach(function(td) {
    var isActive = picker.activeTags.indexOf(td.key) >= 0;
    var chip = h('button', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;padding:4px 10px;border-radius:2px;cursor:pointer;border:1px solid ' + (isActive ? 'var(--accent,#1A4A1A)' : 'var(--border,#D8D8D0)') + ';background:' + (isActive ? 'var(--accent,#1A4A1A)' : 'var(--ivory,#FAF9F6)') + ';color:' + (isActive ? 'var(--ivory,#FAF9F6)' : 'var(--grey,#6B6B65)')
    }, td.label);
    chip.addEventListener('click', function() {
      var idx = picker.activeTags.indexOf(td.key);
      if (idx >= 0) { picker.activeTags.splice(idx, 1); } else { picker.activeTags.push(td.key); }
      saveFilters();
      window.render();
    });
    tagRow.appendChild(chip);
  });
  filterZone.appendChild(tagRow);

  // Row 3: sort select + reset button
  var row3 = h('div', { style: 'display:flex;align-items:center;gap:10px' });
  var sortLabel = h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);letter-spacing:1px;text-transform:uppercase;white-space:nowrap' }, 'Trier par');
  var sortSelect = h('select', { style: 'flex:1;padding:6px 10px;border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;background:var(--ivory,#FAF9F6);color:var(--black,#0A0A09)' });
  var sortOptions = [
    { value: 'default',   label: 'Par d\u00e9faut' },
    { value: 'prot-desc', label: 'Prot\u00e9ines \u2193' },
    { value: 'kcal-asc',  label: 'Calories \u2191' },
    { value: 'kcal-desc', label: 'Calories \u2193' }
  ];
  sortOptions.forEach(function(opt) {
    var option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    if (picker.sortBy === opt.value) option.selected = true;
    sortSelect.appendChild(option);
  });
  sortSelect.addEventListener('change', function(e) {
    picker.sortBy = e.target.value;
    saveFilters();
    window.render();
  });
  row3.appendChild(sortLabel);
  row3.appendChild(sortSelect);

  // Reset button
  var resetBtn = h('button', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;padding:6px 12px;border:1px solid var(--border,#D8D8D0);border-radius:2px;background:transparent;color:var(--grey,#6B6B65);cursor:pointer;white-space:nowrap;letter-spacing:1px;text-transform:uppercase'
  }, 'R\u00e9init.');
  resetBtn.addEventListener('click', function() {
    picker.minKcal = 0; picker.maxKcal = 1200; picker.minProt = 0;
    picker.activeTags = []; picker.sortBy = 'default';
    try { sessionStorage.removeItem(SFC_FILTER_KEY); } catch(e) {}
    window.render();
  });
  row3.appendChild(resetBtn);
  filterZone.appendChild(row3);

  overlay.appendChild(filterZone);

  // Recipe list
  var listWrap = h('div', { style: 'flex:1;overflow-y:auto;padding:12px 16px' });

  var pool = ((typeof getPool === 'function') ? getPool(slotKey) : (window.RecipeEngine ? window.RecipeEngine.getPool(slotKey) : [])) || [];
  var q = query.toLowerCase().trim();

  // Apply all filters
  var filtered = pool.filter(function(r) {
    if (q && r.n.toLowerCase().indexOf(q) < 0) return false;
    if ((r.k || 0) < picker.minKcal) return false;
    if (picker.maxKcal < 1200 && (r.k || 0) > picker.maxKcal) return false;
    if (picker.minProt > 0 && (r.p || 0) < picker.minProt) return false;
    if (picker.activeTags.length > 0) {
      var rTags = r.tags || [];
      for (var ti = 0; ti < picker.activeTags.length; ti++) {
        if (rTags.indexOf(picker.activeTags[ti]) < 0) return false;
      }
    }
    return true;
  });

  // Apply sort
  if (picker.sortBy === 'prot-desc') {
    filtered = filtered.slice().sort(function(a, b) {
      var ratioA = (a.k > 0) ? (a.p / a.k) : 0;
      var ratioB = (b.k > 0) ? (b.p / b.k) : 0;
      return ratioB - ratioA;
    });
  } else if (picker.sortBy === 'kcal-asc') {
    filtered = filtered.slice().sort(function(a, b) { return (a.k || 0) - (b.k || 0); });
  } else if (picker.sortBy === 'kcal-desc') {
    filtered = filtered.slice().sort(function(a, b) { return (b.k || 0) - (a.k || 0); });
  }

  // Result count indicator
  listWrap.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin-bottom:10px' }, filtered.length + ' recette' + (filtered.length !== 1 ? 's' : '') + ' trouv\u00e9e' + (filtered.length !== 1 ? 's' : '')));

  if (!filtered.length) {
    listWrap.appendChild(h('div', { style: 'text-align:center;color:var(--grey,#888);padding:40px 16px;font-size:13px' }, 'Aucune recette trouv\u00e9e.'));
  } else {
    filtered.forEach(function(recipe) {
      var card = h('div', {
        style: 'background:var(--card,#FFFFFF);border-radius:2px;padding:14px 16px;margin-bottom:10px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;box-shadow:0 1px 3px rgba(0,0,0,0.08)'
      });
      card.addEventListener('click', function() {
        if (!S.weekPlan || !S.weekPlan[S.selectedDay]) { S._recipePicker = null; window.render(); return; }
        var c = typeof calcTarget === 'function' ? calcTarget() : 0;
        var split = window.getMealSplit ? window.getMealSplit() : null;
        var tgt = 0;
        if (c && split) {
          tgt = slotKey === 'breakfast' ? Math.round(c * split.pctBreak) :
                slotKey === 'lunch'     ? Math.round(c * split.pctLunch) :
                slotKey === 'snack'     ? Math.round(c * split.pctSnack) :
                                          Math.round(c * split.pctDinner);
        }
        var nr = tgt > 0 && typeof window.enrichWithScaling === 'function' ? window.enrichWithScaling(recipe, tgt) : recipe;
        S.weekPlan[S.selectedDay][slotKey] = nr;
        S._recipePicker = null;
        window.render();
      });
      var left = h('div', { style: 'flex:1;min-width:0' });
      left.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:14px;color:var(--black,#0A0A09);white-space:nowrap;overflow:hidden;text-overflow:ellipsis' }, (recipe.f || '') + ' ' + recipe.n));
      left.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin-top:2px' }, recipe.k + ' kcal \u00b7 ' + recipe.p + 'g prot \u00b7 ' + recipe.g + 'g glu \u00b7 ' + recipe.l + 'g lip'));
      card.appendChild(left);
      card.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;color:var(--grey2,#7A7A74);font-size:13px;margin-left:10px' }, '\u276F'));
      listWrap.appendChild(card);
    });
  }
  overlay.appendChild(listWrap);
  // Append to #app (not p) — p has .fade-in class whose transform:translateY animation
  // breaks position:fixed children (CSS spec: fixed elements are positioned relative to
  // the nearest transformed ancestor, not the viewport → overlay collapses to 0 height)
  (document.getElementById('app') || p).appendChild(overlay);
}

// ─── RENDER SMOOTHIE BAR ───
function renderSmoothieBar(p) {
  var S = window.S;
  p.innerHTML = '';
  var flavors = S.wheyFlavors || [];
  var allergies = (S.allergies || []).filter(function(a) { return a !== 'Aucune'; });
  var intolerances = (S.intolerances || []).filter(function(a) { return a !== 'Aucune'; });
  if (!flavors.length) {
    var flavorTip = h('div', {style:'background:var(--greenbg,rgba(26,74,26,.06));border-left:3px solid var(--green,#1A4A1A);padding:12px 16px;border-radius:0 2px 2px 0;margin-bottom:16px'});
    flavorTip.appendChild(h('div', {style:'font-size:13px;font-weight:700;color:var(--green,#1A4A1A);margin-bottom:4px'}, '\uD83D\uDCA1 S\u00e9lectionnez vos parfums'));
    flavorTip.appendChild(h('div', {style:'font-size:13px;color:var(--fg2,#666);line-height:1.5'}, 'Vous voyez toutes les recettes car aucun parfum n\'est s\u00e9lectionn\u00e9. Pour filtrer selon ce que vous avez chez vous, allez dans Pr\u00e9f\u00e9rences > Whey & Suppl\u00e9ments et cochez vos parfums.'));
    p.appendChild(flavorTip);
  }
  // Vérifie si un smoothie contient un ingrédient allergène ou intolérant
  function smoothieHasAllergen(sm) {
    var ingText = (sm.ingredients || []).map(function(i) { return i.name; }).join(' ').toLowerCase();
    // Vérification allergies
    for (var a = 0; a < allergies.length; a++) {
      var al = allergies[a].toLowerCase();
      if (al === 'arachides' && /arachide|cacahu[eè]te/.test(ingText)) return true;
      if ((al === 'fruits à coque' || al === 'fruits a coque') && /amande|noisette|noix|cajou|pistache|pecan|macadamia/.test(ingText.replace(/noix de coco|noix de muscade/g, ''))) return true;
      if ((al === 'oeufs' || al === 'œufs') && /oeuf|œuf/.test(ingText)) return true;
      if (al === 'lait/produits laitiers' && /lait|fromage|yaourt|beurre|crème|ricotta|cottage|skyr/.test(ingText.replace(/lait de coco|lait d.amande|lait d.avoine|lait de soja|lait de riz/g, ''))) return true;
      if (al === 'soja' && /soja|tofu/.test(ingText)) return true;
      if (al === 'gluten/blé' && /farine|pain|avoine|orge|seigle/.test(ingText.replace(/galette de riz|farine de riz|farine de sarrasin/g, ''))) return true;
    }
    // Vérification intolérances (celiac/gluten, lactose) — AFDIAG / INCO 2020
    for (var t = 0; t < intolerances.length; t++) {
      var it = intolerances[t].toLowerCase();
      if (it === 'gluten') {
        var gi = ingText.replace(/galette de riz|farine de riz|farine de sarrasin|lait d.avoine(?! certifi)|avoine certifi/g, '');
        if (/farine|pain|avoine|orge|seigle|couscous|semoule|épeautre|epeautre|boulgour|seitan|kamut|sauce soja/.test(gi)) return true;
      }
      if (it === 'lactose' && /lait|fromage|yaourt|beurre|crème|ricotta|skyr/.test(ingText.replace(/lait de coco|lait d.amande|lait d.avoine|lait de soja|lait de riz|beurre de cacahu|beurre d.amande/g, ''))) return true;
    }
    return false;
  }
  var filtered = WHEY_SMOOTHIES.filter(function(sm) {
    if (smoothieHasAllergen(sm)) return false;
    if (!flavors.length) return true;
    return sm.flavors.some(function(f) { return flavors.indexOf(f) !== -1; });
  });

  p.appendChild(h('div', {style:'font-size:13px;color:var(--fg2,#888);margin-bottom:12px'},
    '🥛 ' + filtered.length + ' recettes de smoothies' + (flavors.length ? ' filtrées pour vos parfums' : '') + ' — Shake by SmartFitCoach'));

  // ── Conseil substitution whey végétale (régime végétarien/vegan) ──
  // Les recettes de smoothies utilisent de la whey classique (lactosérum).
  // Pour un végétarien/vegan utilisant de la whey végétale (pois, riz, chanvre),
  // les macros sont quasi-identiques et la substitution est directe.
  if (S.regime === 2 || S.regime === 3) {
    var wheyVegetaleNote = h('div', {style:'background:var(--ivory2,#f8f7f2);border-left:3px solid var(--accent,#1A4A1A);padding:10px 14px;margin-bottom:12px;font-size:13px;color:var(--black,#0A0A09);font-family:"Helvetica Neue",Arial,sans-serif'});
    wheyVegetaleNote.appendChild(h('strong', {}, '\u26A0\uFE0F Substitution Whey V\u00e9g\u00e9tale'));
    wheyVegetaleNote.appendChild(h('div', {style:'margin-top:4px;color:var(--grey,#666)'}, 'Ces recettes utilisent de la whey classique (lactos\u00e9rum). Remplacez par une whey v\u00e9g\u00e9tale (prot\u00e9ine de pois, riz brun ou chanvre) \u2014 m\u00eames macros, substitution directe 1:1. Choisissez un isolat pour minimiser l\u2019impact digestif.'));
    p.appendChild(wheyVegetaleNote);
  }

  if (!filtered.length) {
    p.appendChild(h('div', {style:'text-align:center;padding:24px;color:var(--fg2)'}, 'Aucune recette pour ces parfums. Sélectionnez d\'autres parfums dans vos préférences.'));
    return;
  }

  filtered.forEach(function(sm) {
    var tColors = {pre:'#E07B00', post:'#1A6B2A', other:'#4A6A8A'};
    var tLabels = {pre:'⚡ Pré-workout', post:'💪 Post-workout', other:'🕐 Libre'};
    var tKey = sm.timing === 'pre' ? 'pre' : sm.timing === 'post' ? 'post' : 'other';

    var card = h('div', {
      style: 'background:var(--card,#fff);border:1.5px solid var(--border,#E5E4DE);border-radius:2px;padding:14px 16px;margin-bottom:10px;cursor:pointer;transition:all 0.2s ease',
      onclick: function() { showSmoothieModal(sm); }
    });

    // Ligne 1 : badge timing + temps préparation
    var topRow = h('div', {style:'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px'});
    topRow.appendChild(h('span', {style:'display:inline-block;background:'+tColors[tKey]+';color:#fff;font-size:11px;font-weight:700;letter-spacing:0.4px;padding:3px 9px;border-radius:2px;text-transform:uppercase'}, tLabels[tKey]));
    if (sm.prep) topRow.appendChild(h('span', {style:'font-size:11px;color:var(--fg2,#888)'}, '⏱ ' + sm.prep));
    card.appendChild(topRow);

    // Ligne 2 : nom + chevron
    var nameRow = h('div', {style:'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px'});
    nameRow.appendChild(h('div', {style:'font-size:15px;font-weight:700;color:var(--text,#0A0A09);flex:1;line-height:1.3'}, sm.name));
    nameRow.appendChild(h('span', {style:'font-size:18px;color:var(--green,#1A4A1A);font-weight:700;margin-left:8px;flex-shrink:0'}, '\u276F'));
    card.appendChild(nameRow);

    // Ligne 3 : macros
    var macroRow = h('div', {style:'display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap'});
    var macroItems = [
      {v: sm.cal + ' kcal', bg: 'rgba(26,74,26,0.08)', c: 'var(--green,#1A4A1A)'},
      {v: 'P ' + sm.p + 'g', bg: 'rgba(26,74,26,0.05)', c: 'var(--text,#0A0A09)'},
      {v: 'G ' + sm.c + 'g', bg: 'rgba(26,74,26,0.05)', c: 'var(--text,#0A0A09)'},
      {v: 'L ' + sm.f + 'g', bg: 'rgba(26,74,26,0.05)', c: 'var(--text,#0A0A09)'}
    ];
    macroItems.forEach(function(mi) {
      macroRow.appendChild(h('span', {style:'font-size:11px;font-weight:600;padding:3px 8px;background:'+mi.bg+';color:'+mi.c+';border-radius:2px'}, mi.v));
    });
    card.appendChild(macroRow);

    // Ligne 4 : tags (parfums + objectifs)
    var allTags = (sm.flavors || []).concat(sm.goal || []);
    if (allTags.length > 0) {
      var tagRow = h('div', {style:'display:flex;flex-wrap:wrap;gap:4px'});
      allTags.slice(0, 5).forEach(function(tag) {
        tagRow.appendChild(h('span', {style:'font-size:11px;color:var(--fg2,#888);background:var(--bg,#F7F6F1);padding:2px 7px;border-radius:2px'}, '#' + tag.replace(/_/g,' ')));
      });
      card.appendChild(tagRow);
    }

    p.appendChild(card);
  });
}

// Modal smoothie détail
function showToast(msg, ms) {
  var toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#0A0A09;color:#fff;padding:12px 20px;border-radius:2px;font-size:13px;font-weight:600;z-index:99999;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.08)';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(function(){ toast.style.opacity='0'; toast.style.transition='opacity 0.4s'; setTimeout(function(){ if(toast.parentNode) toast.parentNode.removeChild(toast); }, 400); }, ms || 2500);
}

function showSmoothieModal(sm) {
  var S = window.S;
  // Nettoyer tout overlay précédent
  var old = document.getElementById('_smoothie_modal_ov');
  if (old && old.parentNode) old.parentNode.removeChild(old);

  // Overlay impératif
  var ov = h('div', {id:'_smoothie_modal_ov', style:'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(10,10,9,0.55);z-index:99999;display:flex;align-items:flex-end;justify-content:center;padding:0',
    onclick:function(e){ if(e.target===ov){ var el=document.getElementById('_smoothie_modal_ov'); if(el&&el.parentNode) el.parentNode.removeChild(el); } }});

  // Sheet bottom-up (style bottom sheet mobile)
  var box = h('div', {style:'background:var(--card,#fff);border-radius:2px 2px 0 0;width:100%;max-width:480px;max-height:88vh;display:flex;flex-direction:column;overflow:hidden'});

  // ── HEADER ──
  var timingColors = {pre:'#E07B00', post:'#1A6B2A', other:'#4A4A8A'};
  var timingLabels = {pre:'⚡ Pré-workout', post:'💪 Post-workout', other:'🕐 Libre'};
  var tKey = sm.timing === 'pre' ? 'pre' : sm.timing === 'post' ? 'post' : 'other';
  var tColor = timingColors[tKey];

  var header = h('div', {style:'background:var(--green,#1A4A1A);padding:20px 20px 16px;position:relative;flex-shrink:0'});

  // Badge timing
  header.appendChild(h('span', {style:'display:inline-block;background:'+tColor+';color:#fff;font-size:11px;font-weight:700;letter-spacing:0.5px;padding:3px 10px;border-radius:2px;text-transform:uppercase;margin-bottom:10px'}, timingLabels[tKey]));

  // Titre
  var titleRow = h('div', {style:'display:flex;align-items:flex-start;justify-content:space-between;gap:12px'});
  titleRow.appendChild(h('div', {style:'font-size:18px;font-weight:800;color:#fff;line-height:1.2;flex:1'}, '\uD83E\uDD5B ' + sm.name));
  titleRow.appendChild(h('button', {
    style:'flex-shrink:0;width:32px;height:32px;background:rgba(255,255,255,0.18);border:none;color:#fff;font-size:18px;cursor:pointer;border-radius:50%;display:flex;align-items:center;justify-content:center;line-height:1;margin-top:-2px',
    onclick:function(){ var el=document.getElementById('_smoothie_modal_ov'); if(el&&el.parentNode) el.parentNode.removeChild(el); }
  }, '×'));
  header.appendChild(titleRow);

  // Macros row
  var macrosRow = h('div', {style:'display:flex;gap:0;margin-top:12px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden'});
  var macros = [
    {label:'Calories', val:sm.cal, unit:'kcal'},
    {label:'Protéines', val:sm.p+'g', unit:'P'},
    {label:'Glucides', val:sm.c+'g', unit:'G'},
    {label:'Lipides', val:sm.f+'g', unit:'L'}
  ];
  macros.forEach(function(m, i) {
    var cell = h('div', {style:'flex:1;text-align:center;padding:8px 4px'+(i<3?';border-right:1px solid rgba(255,255,255,0.15)':'')});
    cell.appendChild(h('div', {style:'font-size:15px;font-weight:800;color:#fff'}, String(m.val)));
    cell.appendChild(h('div', {style:'font-size:9px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.5px;margin-top:1px'}, m.label));
    macrosRow.appendChild(cell);
  });
  header.appendChild(macrosRow);

  // Prep time
  var prepRow = h('div', {style:'display:flex;align-items:center;justify-content:space-between;margin-top:8px'});
  if (sm.prep) {
    prepRow.appendChild(h('div', {style:'font-size:11px;color:rgba(255,255,255,0.65)'}, '⏱ Préparation : '+sm.prep));
  }
  header.appendChild(prepRow);
  box.appendChild(header);

  // ── BODY (scrollable) ──
  var body = h('div', {style:'flex:1;overflow-y:auto;padding:0 0 4px'});

  // Section Ingrédients
  var ingSection = h('div', {style:'padding:16px 20px 0'});
  ingSection.appendChild(h('div', {style:'font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--fg2,#888);margin-bottom:10px'}, 'Ingrédients'));

  if (sm.ingredients && sm.ingredients.length > 0) {
    sm.ingredients.forEach(function(ing, idx) {
      var row = h('div', {style:'display:flex;align-items:center;gap:10px;padding:9px 0;'+(idx < sm.ingredients.length-1 ? 'border-bottom:1px solid var(--border,#F0EFEA)':'')});
      // Quantité pill
      var qtyPill = h('div', {style:'flex-shrink:0;min-width:52px;background:rgba(26,74,26,0.07);border-radius:2px;padding:4px 8px;text-align:center'});
      qtyPill.appendChild(h('div', {style:'font-size:13px;font-weight:700;color:var(--green,#1A4A1A);line-height:1.2'}, String(ing.qty)));
      qtyPill.appendChild(h('div', {style:'font-size:9px;color:var(--fg2,#888);line-height:1.1'}, ing.unit));
      row.appendChild(qtyPill);
      row.appendChild(h('div', {style:'font-size:13px;color:var(--text,#0A0A09);font-weight:500;flex:1'}, ing.name));
      ingSection.appendChild(row);
    });
  } else {
    ingSection.appendChild(h('div', {style:'font-size:13px;color:var(--fg2,#888);font-style:italic'}, 'Ingrédients non disponibles.'));
  }
  body.appendChild(ingSection);

  // Séparateur
  body.appendChild(h('div', {style:'height:1px;background:var(--border,#E5E4DE);margin:16px 20px 0'}));

  // Section Préparation
  var stepsSection = h('div', {style:'padding:16px 20px 0'});
  stepsSection.appendChild(h('div', {style:'font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--fg2,#888);margin-bottom:10px'}, 'Préparation'));

  if (sm.steps && sm.steps.length > 0) {
    sm.steps.forEach(function(step, i) {
      var row = h('div', {style:'display:flex;gap:12px;padding:0 0 12px'});
      // Numéro pastille
      var num = h('div', {style:'flex-shrink:0;width:24px;height:24px;background:var(--green,#1A4A1A);color:#fff;border-radius:50%;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px'}, String(i+1));
      row.appendChild(num);
      row.appendChild(h('div', {style:'font-size:13px;color:var(--text,#0A0A09);line-height:1.55;flex:1;padding-top:2px'}, step));
      stepsSection.appendChild(row);
    });
  } else {
    stepsSection.appendChild(h('div', {style:'font-size:13px;color:var(--fg2,#888);font-style:italic'}, 'Étapes non disponibles.'));
  }
  body.appendChild(stepsSection);

  // Tips
  if (sm.tips) {
    var tipDiv = h('div', {style:'margin:12px 20px 0;background:var(--greenbg,rgba(26,74,26,0.06));border-left:3px solid var(--green,#1A4A1A);padding:10px 12px;border-radius:0 2px 2px 0;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);line-height:1.6'}, sm.tips);
    body.appendChild(tipDiv);
  }
  body.appendChild(h('div', {style:'height:12px'}));
  box.appendChild(body);

  // ── FOOTER ──
  var dayNames = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  var dayLabel = dayNames[typeof S.selectedDay === 'number' ? S.selectedDay : 0] || 'Lun';
  var footer = h('div', {style:'padding:12px 20px 20px;border-top:1px solid var(--border,#E5E4DE);flex-shrink:0;background:var(--card,#fff)'});

  var addBtn = h('button', {
    style:'width:100%;padding:16px;min-height:44px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:none;border-radius:2px;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:0.2px;box-shadow:0 1px 3px rgba(0,0,0,0.08)',
    onclick: function() {
      if (!S.weekPlan || !S.weekPlan[S.selectedDay]) {
        addBtn.textContent = 'Générez d\'abord votre plan semaine';
        addBtn.style.background = '#888';
        return;
      }
      var smoothieAsRecipe = {
        n: sm.name, f: '🥛', k: sm.cal, p: sm.p, g: sm.c, l: sm.f,
        i: (sm.ingredients||[]).map(function(ing){ return ing.qty+' '+ing.unit+' '+ing.name; }).join(', '),
        ingredients: sm.ingredients, st: sm.steps, w: true,
        tags: ['whey','smoothie'].concat(sm.goal || []),
        lv: 1, _id: sm.id, _smoothie: true
      };
      var split = window.getMealSplit ? window.getMealSplit() : null;
      var totalTarget = typeof calcTarget === 'function' ? calcTarget() : (window.S.caloriesTarget || 2000);
      var snackTargetBefore = split ? Math.round(totalTarget * split.pctSnack) : Math.round(totalTarget * 0.15);
      var delta = sm.cal - snackTargetBefore;
      var dayPlan = S.weekPlan[S.selectedDay];
      if (!dayPlan) return; // guard: weekPlan can be shorter than expected
      dayPlan.snack = smoothieAsRecipe;
      if (split && Math.abs(delta) > 30) {
        var otherSum = split.pctBreak + split.pctLunch + split.pctDinner;
        if (otherSum > 0) {
          [{key:'breakfast',pct:split.pctBreak},{key:'lunch',pct:split.pctLunch},{key:'dinner',pct:split.pctDinner}].forEach(function(sl) {
            var recipe = dayPlan[sl.key];
            if (!recipe) return;
            var adjustment = -delta * (sl.pct / otherSum);
            var oldCal = recipe.k || 0;
            var newTargetCals = Math.round(oldCal + adjustment);
            if (newTargetCals <= 0) return;
            var eWS = window.enrichWithScaling;
            if (eWS && recipe._id && ((/^R\d+$/.test(recipe._id) && window.RecipeEngine) || /^L\d+$/.test(recipe._id))) {
              dayPlan[sl.key] = eWS(recipe, newTargetCals);
            } else {
              var ratio = oldCal > 0 ? newTargetCals / oldCal : 1;
              recipe.k = newTargetCals;
              recipe.p = Math.round((recipe.p || 0) * ratio);
              recipe.g = Math.round((recipe.g || 0) * ratio);
              recipe.l = Math.round((recipe.l || 0) * ratio);
            }
          });
        }
      }
      try { if (window.saveProfile) window.saveProfile(); } catch(e) { console.warn('[nutrition] smoothie saveProfile error:', e); }
      var el = document.getElementById('_smoothie_modal_ov');
      if (el && el.parentNode) el.parentNode.removeChild(el);
      S.smoothieBarOpen = false;
      goStep(12);
      showToast('✅ Smoothie ajouté en collation — Plan recalculé', 2500);
    }
  }, '🥛 Ajouter à mon plan — Collation '+dayLabel);
  footer.appendChild(addBtn);
  box.appendChild(footer);
  ov.appendChild(box);
  document.body.appendChild(ov);
}

// ─── SHOPPING LIST ───
function renderShoppingList(p) {
  var s = window.S;
  p.innerHTML = '';

  // État arabe : stocké dans window.S.shopArMode (ne pas perturber I18N global)
  var arMode = !!s.shopArMode;
  var AR = window.SHOP_AR || null;

  // ── Helper : traduire si mode arabe actif ──
  function arUI(key, fallback) {
    if (arMode && AR && AR.ui[key]) return AR.ui[key];
    return fallback;
  }
  function arSection(name) {
    if (arMode && AR) return AR.translateSection(name);
    return name;
  }
  function arIngredient(name) {
    if (arMode && AR) return AR.translateIngredient(name);
    return name;
  }

  // Header
  var header = h('div', {style:'padding:20px 16px 8px'});
  var titleEl = h('div', {
    style:'font-size:18px;font-weight:700;color:var(--text);margin-bottom:4px' + (arMode ? ';direction:rtl;text-align:right;font-family:"Segoe UI",Arial,Tahoma,sans-serif' : ''),
    'class': arMode ? 'shop-ar-title' : ''
  }, arMode ? (AR ? AR.ui['title'] : 'قائمة التسوق') : '\uD83D\uDED2 ' + window.t('shop.title'));
  var subtitleEl = h('div', {
    style:'font-size:13px;color:var(--text-secondary)' + (arMode ? ';direction:rtl;text-align:right;font-family:"Segoe UI",Arial,Tahoma,sans-serif' : '')
  }, arMode ? (AR ? AR.ui['subtitle'] : 'الأسبوع كامل') : 'Semaine complète — cochez au fur et à mesure');
  header.appendChild(titleEl);
  header.appendChild(subtitleEl);
  p.appendChild(header);

  // Bouton retour
  var btnBack = h('button', {
    style:'margin:0 16px 12px;padding:10px 14px;background:transparent;border:none;color:var(--text-secondary);font-size:13px;cursor:pointer;display:flex;align-items:center;gap:6px' + (arMode ? ';direction:rtl;font-family:"Segoe UI",Arial,Tahoma,sans-serif' : ''),
    'class': 'shop-print-hide',
    onclick: function() { window.S.shopListOpen = false; if(window.render) window.render(); }
  }, arMode ? (AR ? AR.ui['back'] : '← ارجع') : '← Retour au plan');
  p.appendChild(btnBack);

  if (!s.weekPlan || !window.RecipeEngine) {
    p.appendChild(h('div', {style:'padding:20px;text-align:center;color:var(--text-secondary)'}, arUI('no_plan', 'Générez d\'abord votre plan de repas.')));
    return;
  }

  var list = window.RecipeEngine.generateShoppingList(s.weekPlan, {shopFreq: s.shopFreq}) || [];
  if (!s.shopChecked) s.shopChecked = {};
  cleanShopChecked(list);

  if (!list.length) {
    p.appendChild(h('div', {style:'padding:20px;text-align:center;color:var(--text-secondary)'}, arUI('no_items', 'Aucun ingrédient détecté dans le plan.')));
    return;
  }

  // ── Label fréquence de courses ──
  var freqLabel = list._freqLabel || '7 jours';
  var freqBanner = h('div', {style:'margin:0 16px 12px;padding:10px 14px;background:var(--card);border-radius:2px;display:flex;align-items:center;gap:8px;font-size:13px'});
  freqBanner.appendChild(h('span', {style:'font-size:16px'}, '\uD83D\uDED2'));
  freqBanner.appendChild(h('div', {}, [
    h('div', {style:'font-weight:600;color:var(--text)'}, 'Liste pour ' + freqLabel),
    h('div', {style:'font-size:11px;color:var(--text-secondary)'}, s.shopFreq === '2x_week' ? 'Faites 2 courses par semaine — renouvelez dans 4 jours' : s.shopFreq === 'daily' ? 'Courses pour aujourd\'hui uniquement' : s.shopFreq === 'biweekly' ? 'Quantités déjà doublées pour 14 jours — stock et surgelés recommandés' : 'Courses pour toute la semaine')
  ]));
  p.appendChild(freqBanner);

  // Affichage du budget total estimé dans la liste de courses
  if (window.RecipeEngine && window.RecipeEngine.calcWeekPlanBudget && s.weekPlan) {
    var shopBudget = window.RecipeEngine.calcWeekPlanBudget(s.weekPlan);
    if (shopBudget && shopBudget.totalMAD > 0) {
      var budgetLine = h('div', {style:'margin:0 16px 12px;padding:10px 14px;background:rgba(26,74,26,0.08);border-radius:2px;display:flex;justify-content:space-between;align-items:center'});
      budgetLine.appendChild(h('span', {style:'font-size:13px;font-weight:600;color:var(--text)'}, '💰 Budget total estimé'));
      budgetLine.appendChild(h('span', {style:'font-size:16px;font-weight:700;color:var(--accent,#1A4A1A)'}, '~' + Math.round(shopBudget.weeklyMAD) + ' DH'));
      p.appendChild(budgetLine);
    }
  }

  // ── Boutons actions ──
  var actions = h('div', {style:'display:flex;gap:10px;padding:0 16px 12px;flex-wrap:wrap', 'class':'shop-print-hide'});

  var btnPDF = h('button', {
    style:'flex:1;padding:10px 14px;background:var(--black);color:#fff;border:none;border-radius:2px;font-size:13px;font-weight:600;cursor:pointer;min-width:140px',
    onclick: function() { exportShoppingListPDF(list, s.shopChecked); }
  }, arMode ? (AR ? AR.ui['download_pdf'] : '📄 PDF') : '\uD83D\uDCC4 ' + window.t('shop.export'));

  var btnReset = h('button', {
    style:'padding:10px 14px;background:var(--card);color:var(--text);border:1px solid var(--border);border-radius:2px;font-size:13px;cursor:pointer',
    onclick: function() { s.shopChecked = {}; if(window.render) window.render(); }
  }, arMode ? (AR ? AR.ui['reset'] : '↺') : '\u21ba ' + window.t('shop.reset'));

  // Bouton toggle arabe / FR
  var btnAR = h('button', {
    'class': 'btn-shop-ar' + (arMode ? ' active' : ''),
    onclick: function() {
      window.S.shopArMode = !window.S.shopArMode;
      if (window.render) window.render();
    }
  }, arMode ? 'FR' : 'عربي');

  // Bouton imprimer en arabe
  var btnPrintAR = h('button', {
    'class': 'btn-shop-print-ar',
    onclick: function() { printShoppingListAR(list); }
  }, arMode ? (AR ? AR.ui['print'] : '🖨️ طباعة') : '🖨️ طباعة');

  actions.appendChild(btnPDF);
  actions.appendChild(btnReset);
  actions.appendChild(btnAR);
  actions.appendChild(btnPrintAR);

  // Compteur
  var total = list.reduce(function(n,cat){return n+cat.items.length;}, 0);
  var checked = Object.keys(s.shopChecked).filter(function(k){return s.shopChecked[k];}).length;
  var counterText = arMode
    ? (checked + ' / ' + total + ' ' + (AR ? AR.ui['articles_bought'] : 'منتج مشترى'))
    : (checked + ' / ' + total + ' ' + window.t('shop.bought'));
  var counter = h('div', {
    style:'padding:0 16px 8px;font-size:13px;color:var(--text-secondary)' + (arMode ? ';direction:rtl;text-align:right;font-family:"Segoe UI",Arial,Tahoma,sans-serif' : ''),
    'class':'shop-print-hide'
  }, counterText);

  p.appendChild(actions);
  p.appendChild(counter);

  var sectionsCount = list.length;
  var infoBarText = arMode
    ? (sectionsCount + ' ' + (AR ? AR.ui['sections'] : 'رايون') + ' — ' + total + ' ' + (AR ? AR.ui['articles'] : 'منتج') + ' — ' + (AR ? AR.ui['optimized_route'] : 'مسار محسّن'))
    : (sectionsCount + ' ' + window.t('shop.aisles') + ' — ' + total + ' ' + window.t('shop.items') + ' — ' + window.t('shop.optimized'));
  var infoBar = h('div', {
    style:'margin:0 16px 12px;padding:10px 14px;border:1px solid var(--border);font-size:11px;letter-spacing:' + (arMode ? '0' : '1px') + ';color:var(--grey)' + (arMode ? ';direction:rtl;text-align:right;font-family:"Segoe UI",Arial,Tahoma,sans-serif' : ';font-family:"Helvetica Neue",Arial,sans-serif'),
    'class':'shop-print-hide'
  }, infoBarText);
  p.appendChild(infoBar);

  // ── Liste par catégorie (affichage interactif) ──
  var shopContainer = h('div', {
    'class': arMode ? 'shop-ar' : '',
    style: arMode ? 'direction:rtl' : ''
  });

  list.forEach(function(cat) {
    var catBlock = h('div', {style:'margin:0 16px 14px;background:var(--card);border-radius:2px;overflow:hidden'});

    var catChecked = cat.items.filter(function(item){return s.shopChecked[item.name];}).length;
    var catHeaderStyle = 'padding:12px 16px 10px;background:var(--ivory2,#F4F4F0);border-bottom:1px solid var(--border);font-size:11px;text-transform:uppercase;color:var(--black,#0A0A09);display:flex;justify-content:space-between;align-items:center;' +
      (arMode ? 'direction:rtl;text-align:right;font-family:"Segoe UI",Arial,Tahoma,sans-serif;letter-spacing:0' : 'font-family:"Helvetica Neue",Arial,sans-serif;letter-spacing:2px');

    catBlock.appendChild(h('div', {style: catHeaderStyle, 'class':'shop-cat-header'},
      h('span', {}, arSection(cat.category)),
      h('span', {style:'font-weight:400;color:var(--text-secondary);font-size:13px'}, catChecked + '/' + cat.items.length)
    ));

    cat.items.forEach(function(item) {
      // Ignorer les items sans quantité valide
      if (!item.qty || isNaN(item.qty) || item.qty <= 0) return;

      var isChecked = !!s.shopChecked[item.name];
      var rowStyle = 'display:flex;align-items:center;padding:10px 14px;border-top:1px solid var(--border);cursor:pointer;' +
        (isChecked ? 'opacity:0.45;' : '') +
        (arMode ? 'flex-direction:row-reverse;direction:rtl;' : '');

      var row = h('div', {
        style: rowStyle,
        'class': 'shop-item-row',
        onclick: function() {
          s.shopChecked[item.name] = !s.shopChecked[item.name];
          if(window.render) window.render();
        }
      });

      // Checkbox custom
      var cbStyle = 'width:20px;height:20px;border-radius:2px;border:2px solid ' + (isChecked ? 'var(--accent)' : 'var(--border)') +
        ';flex-shrink:0;display:flex;align-items:center;justify-content:center;background:' + (isChecked ? 'var(--accent)' : 'transparent') +
        (arMode ? ';margin-left:12px;margin-right:0' : ';margin-right:12px');
      var cb = h('div', {style: cbStyle, 'class':'shop-cb'});
      if (isChecked) cb.appendChild(h('span', {style:'color:#fff;font-size:13px;font-weight:700'}, '✓'));

      var labelStyle = 'flex:1' + (arMode ? ';text-align:right;font-family:"Segoe UI",Arial,Tahoma,sans-serif' : '');
      var label = h('div', {style: labelStyle, 'class':'shop-item-label'});

      var displayName = arIngredient(item.name);
      // Majuscule initiale pour les noms en mode français
      if (!arMode && displayName && displayName.length > 0) {
        displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
      }
      var nameStyle = 'font-size:13px;color:var(--text);' +
        (arMode ? 'font-family:"Segoe UI",Arial,Tahoma,sans-serif;' : 'font-family:Georgia,serif;') +
        (isChecked ? 'text-decoration:line-through;opacity:0.6;' : '');
      label.appendChild(h('div', {style: nameStyle}, displayName));
      label.appendChild(h('div', {style:'font-size:11px;font-family:"Helvetica Neue",Arial,sans-serif;color:var(--text-secondary)'}, item.qty + ' ' + item.unit));

      row.appendChild(cb);
      row.appendChild(label);
      catBlock.appendChild(row);
    });

    shopContainer.appendChild(catBlock);
  });

  p.appendChild(shopContainer);
}

// ─── PRINT EN ARABE ───
function printShoppingListAR(list) {
  var AR = window.SHOP_AR;
  var now = new Date();
  var dateStr = now.toLocaleDateString('ar-MA', {year:'numeric', month:'long', day:'numeric'});
  function escHTML(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  // Construire le HTML d'impression (toutes les valeurs dynamiques échappées)
  var html = '<div class="shop-print-area">';
  html += '<div class="shop-print-title">' + escHTML(AR ? AR.ui['print_title'] : 'قائمة التسوق') + '</div>';
  html += '<div class="shop-print-date">' + escHTML(AR ? AR.ui['date_label'] : 'تاريخ الطباعة') + ' : ' + escHTML(dateStr) + '</div>';

  list.forEach(function(cat) {
    html += '<div class="shop-cat-block">';
    var catName = AR ? AR.translateSection(cat.category) : cat.category;
    html += '<div class="shop-cat-name">' + escHTML(catName) + '</div>';
    cat.items.forEach(function(item) {
      var ingName = AR ? AR.translateIngredient(item.name) : item.name;
      html += '<div class="shop-print-item">';
      html += '<span>' + escHTML(ingName) + '</span>';
      html += '<span>' + escHTML(item.qty) + ' ' + escHTML(item.unit) + '</span>';
      html += '</div>';
    });
    html += '</div>';
  });
  html += '</div>';

  // Impression via iframe dédié (évite les problèmes de redirection avec window.open)
  var title = AR ? AR.ui['print_title'] : 'قائمة التسوق';
  var fullHTML = '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>' + escHTML(title) + '</title><style>' +
    'body{font-family:"Segoe UI",Arial,Tahoma,sans-serif;direction:rtl;text-align:right;padding:20px;color:#000;background:#fff;}' +
    '.shop-print-title{font-size:24px;font-weight:700;margin-bottom:4px;}' +
    '.shop-print-date{font-size:13px;color:#666;margin-bottom:16px;}' +
    '.shop-cat-block{margin-bottom:12px;page-break-inside:avoid;}' +
    '.shop-cat-name{font-size:13px;font-weight:700;background:#f0f0f0;padding:6px 10px;border-radius:2px;margin-bottom:4px;}' +
    '.shop-print-item{display:flex;justify-content:space-between;padding:3px 10px;font-size:13px;border-bottom:1px solid #eee;}' +
    '@media print{body{padding:10px;}}' +
    '</style></head><body>' + html + '</body></html>';

  try {
    // Approche 1: Blob URL (propre, sans redirection)
    var blob = new Blob([fullHTML], {type: 'text/html;charset=utf-8'});
    var blobUrl = URL.createObjectURL(blob);
    var printWin = window.open(blobUrl, '_blank', 'width=700,height=900');
    if (printWin) {
      printWin.onload = function() {
        try { printWin.print(); } catch(e) {}
        setTimeout(function() { URL.revokeObjectURL(blobUrl); }, 5000);
      };
      return;
    }
    URL.revokeObjectURL(blobUrl);
  } catch(e) {}

  // Approche 2: iframe caché (fallback — ne redirige jamais)
  var iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);
  try {
    var idoc = iframe.contentWindow.document;
    idoc.open('text/html', 'replace');
    idoc.write(fullHTML);
    idoc.close();
    iframe.contentWindow.focus();
    setTimeout(function() {
      try { iframe.contentWindow.print(); } catch(pe) {}
      setTimeout(function() {
        try { document.body.removeChild(iframe); } catch(re) {}
      }, 3000);
    }, 300);
  } catch(fe) {
    try { document.body.removeChild(iframe); } catch(re2) {}
  }
}

function exportShoppingListPDF(list, shopChecked) {
  if (!window.jspdf || !window.jspdf.jsPDF) { alert('Export PDF non disponible'); return; }
  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF({ unit: 'mm', format: 'a4' });
  var y = 20;
  var margin = 15;
  var pageW = 210;

  // Titre
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Liste de courses — SmartFitCoach', margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.text('Semaine du ' + new Date().toLocaleDateString('fr-FR'), margin, y);
  doc.setTextColor(0);
  y += 10;

  list.forEach(function(cat) {
    if (y > 270) { doc.addPage(); y = 20; }

    // Catégorie header
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(margin, y - 4, pageW - margin * 2, 8, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    var catLines = doc.splitTextToSize(cat.category || '', pageW - margin * 2 - 6);
    doc.text(catLines, margin + 3, y + 1);
    y += 10;

    var catItems = Array.isArray(cat.items) ? cat.items : [];
    catItems.forEach(function(item) {
      if (y > 278) { doc.addPage(); y = 20; }
      var itemName = item.name || '';
      var isChecked = !!(shopChecked && shopChecked[itemName]);

      // Case à cocher
      doc.setDrawColor(180);
      doc.setLineWidth(0.4);
      doc.rect(margin, y - 3.5, 4, 4);
      if (isChecked) {
        doc.setDrawColor(80);
        doc.setLineWidth(0.8);
        doc.line(margin + 0.5, y - 1.5, margin + 1.8, y - 0.2);
        doc.line(margin + 1.8, y - 0.2, margin + 3.5, y - 3);
        doc.setLineWidth(0.4);
      }

      // Nom + quantité
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(isChecked ? 150 : 0);
      var itemNameLines = doc.splitTextToSize(itemName, pageW - margin * 2 - 30);
      doc.text(itemNameLines, margin + 7, y);
      doc.setTextColor(120);
      doc.text((item.qty || '') + ' ' + (item.unit || ''), pageW - margin - 20, y, {align:'right'});
      doc.setTextColor(0);

      y += itemNameLines.length * 6;
    });
    y += 4;
  });

  // Note bas de page
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Généré par SmartFitCoach — ' + new Date().toLocaleDateString('fr-FR'), margin, 290);

  doc.save('liste-courses-smartfitcoach.pdf');
}

// ─── SALADE COMPOSER ───
// State-based approach: sets S.saladBar.open = true and calls render().
// Avoids DOM overlay that was destroyed by any window.render() call.
window.openSaladComposer = function openSaladComposer(slotKey) {
  var S = window.S;
  if (!S) return;
  if (!S.saladBar) {
    S.saladBar = { open: false, base: null, proteins: [], veggies: [], fats: [], sauce: null, mealTarget: 'lunch' };
  }
  // Reset ingredients for a fresh composition
  S.saladBar.base = null;
  S.saladBar.proteins = [];
  S.saladBar.veggies = [];
  S.saladBar.fats = [];
  S.saladBar.sauce = null;
  S.saladBar.open = true;
  if (slotKey === 'breakfast' || slotKey === 'lunch' || slotKey === 'snack' || slotKey === 'dinner') {
    S.saladBar.mealTarget = slotKey;
  }
  if (window.render) window.render();
};

// ─── STEP 6: BODY SCAN — ANALYSE DE COMPOSITION CORPORELLE (OPTIONNEL) ───
// Optionnel · sans friction · si passé, goStep(7) directement.
// Si utilisé, S._bodyFatEstimate est défini et calcBMR() utilisera Katch-McArdle automatiquement.
function renderBodyScan(p) {
  renderProgressBar(p, 6, 12);
  p.appendChild(h('div', {'class': 'eyebrow', style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:8px'}, 'OPTIONNEL \u00b7 30 SECONDES'));
  p.appendChild(h('h1', {html: 'Ton corps,<br><em>analys\u00e9.</em>', style: 'font-family:Georgia,serif;font-size:28px;font-weight:normal;line-height:1.2;margin-bottom:12px'}));
  p.appendChild(h('p', {style: 'font-family:Georgia,serif;font-style:italic;font-size:14px;color:var(--grey,#6B6B65);line-height:1.65;margin-bottom:28px'}, 'Notre IA peut estimer ta composition corporelle \u00e0 partir d\u2019une photo. Cela permet un calcul pr\u00e9cis de ta masse maigre et affine tes besoins prot\u00e9iques.'));

  // If already scanned, show result and allow rescan
  if (S._bodyFatEstimate !== null && S._bodyFatEstimate !== undefined) {
    var _lbmDisp = Math.round(S.weight * (1 - S._bodyFatEstimate / 100));
    var _scanResult = h('div', {style: 'padding:14px 16px;border:1px solid var(--green,#1A4A1A);background:var(--greenbg,rgba(26,74,26,.06));margin-bottom:20px;border-radius:2px'});
    _scanResult.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--green,#1A4A1A);margin-bottom:6px'}, 'Estimation enregistr\u00e9e'));
    _scanResult.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;margin-bottom:4px'}, S._bodyFatEstimate + '% de masse graisseuse'));
    _scanResult.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65)'}, 'Masse maigre estim\u00e9e\u00a0: ' + _lbmDisp + '\u00a0kg \u2014 Formule Katch-McArdle activ\u00e9e'));
    p.appendChild(_scanResult);
    p.appendChild(h('button', {'class': 'btn-primary', onclick: function() {
      S.bodyScanDone = true;
      goStep(7);
    }}, 'Continuer avec cette estimation \u2192'));
    p.appendChild(h('button', {style: 'display:block;margin:12px auto 0;background:none;border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);cursor:pointer;text-decoration:underline;text-underline-offset:3px;padding:8px', onclick: function() {
      S._bodyFatEstimate = null;
      window.render();
    }}, 'R\u00e9initialiser'));
    p.appendChild(h('button', {'class': 'btn-back', 'aria-label': 'Retour', onclick: function() { goStep(5); }, html: backArrowHtml() + window.t('onb.back')}));
    return;
  }

  // ── Silhouette selector (simplified body type selector as primary method) ──
  var _bodyTypes = [
    {id: 'very_lean',     label: 'Tr\u00e8s sec',      range: [5, 10],   desc: '5-10% MG',  sub: 'Veines apparentes, muscle \u00e0 nu'},
    {id: 'lean',          label: 'Sec',              range: [11, 17],  desc: '11-17% MG', sub: 'D\u00e9finition musculaire visible'},
    {id: 'average',       label: 'Normal',           range: [18, 24],  desc: '18-24% MG', sub: 'Silhouette standard'},
    {id: 'above_average', label: 'Envelopp\u00e9',   range: [25, 32],  desc: '25-32% MG', sub: 'Tour de taille visible'},
    {id: 'heavy',         label: 'Fort',             range: [33, 45],  desc: '33-45% MG', sub: 'Surpoids notable'}
  ];
  // Adjust ranges for women (women carry ~5-8% more essential fat)
  if (S.sex === 'femme') {
    _bodyTypes = [
      {id: 'very_lean',     label: 'Tr\u00e8s sec',     range: [14, 18], desc: '14-18% MG', sub: 'Ath\u00e8te de comp\u00e9tition'},
      {id: 'lean',          label: 'Sec',             range: [19, 24], desc: '19-24% MG', sub: 'D\u00e9finition visible'},
      {id: 'average',       label: 'Normal',          range: [25, 31], desc: '25-31% MG', sub: 'Silhouette standard'},
      {id: 'above_average', label: 'Envelopp\u00e9e', range: [32, 39], desc: '32-39% MG', sub: 'Tour de taille visible'},
      {id: 'heavy',         label: 'Fort',            range: [40, 50], desc: '40-50% MG', sub: 'Surpoids notable'}
    ];
  }
  p.appendChild(h('div', {'class': 'section-label'}, 'S\u00e9lectionnez votre silhouette approximative'));
  var _silGrid = h('div', {style: 'display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:24px'});
  _bodyTypes.forEach(function(bt) {
    var _midBf = Math.round((bt.range[0] + bt.range[1]) / 2);
    var _selected = (S._bodyFatEstimate !== null && S._bodyFatEstimate !== undefined &&
      S._bodyFatEstimate >= bt.range[0] && S._bodyFatEstimate <= bt.range[1]);
    var _card = h('div', {
      style: 'display:flex;flex-direction:column;align-items:center;padding:10px 6px;border:1.5px solid ' +
        (_selected ? 'var(--black,#1A1A18)' : 'var(--border,#E8E6DF)') +
        ';background:' + (_selected ? 'var(--ivory2,#F4F4F0)' : 'transparent') +
        ';cursor:pointer;border-radius:2px;text-align:center;transition:border-color .15s',
      onclick: (function(midBf, range) {
        return function() {
          S._bodyFatEstimate = midBf;
          window.render();
        };
      })(_midBf, bt.range)
    });
    // Simple ASCII silhouette indicator using unicode
    var _icon = bt.id === 'very_lean' ? '\uD83C\uDFC3' : bt.id === 'lean' ? '\uD83E\uDDD8' : bt.id === 'average' ? '\uD83D\uDE4B' : bt.id === 'above_average' ? '\uD83D\uDEB6' : '\uD83E\uDDD4';
    _card.appendChild(h('div', {style: 'font-size:20px;margin-bottom:4px'}, _icon));
    _card.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:11px;font-weight:600;margin-bottom:2px'}, bt.label));
    _card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:var(--grey,#6B6B65)'}, bt.desc));
    _silGrid.appendChild(_card);
  });
  p.appendChild(_silGrid);

  if (S._bodyFatEstimate !== null && S._bodyFatEstimate !== undefined) {
    var _midSel = S._bodyFatEstimate;
    var _lbmSel = Math.round(S.weight * (1 - _midSel / 100));
    var _previewBox = h('div', {style: 'padding:10px 14px;border:1px solid var(--border,#E8E6DF);background:var(--ivory2,#F4F4F0);margin-bottom:16px;border-radius:2px'});
    _previewBox.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);line-height:1.6'}, '\u2713 Masse graisseuse\u00a0: ' + _midSel + '% \u00b7 Masse maigre\u00a0: ' + _lbmSel + '\u00a0kg'));
    _previewBox.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);font-style:italic'}, 'Formule Katch-McArdle sera utilis\u00e9e pour vos besoins caloriques'));
    p.appendChild(_previewBox);
    p.appendChild(h('button', {'class': 'btn-primary', onclick: function() {
      S.bodyScanDone = true;
      if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
      goStep(7);
    }}, 'Confirmer et continuer \u2192'));
  }

  // Skip link
  p.appendChild(h('button', {style: 'display:block;margin:16px auto 0;background:none;border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey,#6B6B65);cursor:pointer;padding:10px;min-height:44px', onclick: function() {
    S.bodyScanDone = true;
    goStep(7);
  }}, 'Passer cette \u00e9tape \u2192'));
  p.appendChild(h('button', {'class': 'btn-back', 'aria-label': 'Retour', onclick: function() { goStep(5); }, html: backArrowHtml() + window.t('onb.back')}));
}

// ─── STEP 7: PROVISIONAL PREVIEW — APERÇU DE L'ESTIMATION PERSONNALISÉE ───
// Montre les estimations BMR/TDEE/objectif AVANT les questions médicales.
// Si S._bodyFatEstimate est défini, utilise Katch-McArdle (déjà géré dans calcBMR()).
function renderProvisionalPreview(p) {
  if (!S.sex || !S.weight || !S.height || S.goal === null || S.goal === undefined) {
    goStep(1); return; // goStep(1) contient la logique d'auto-skip vers le bon step manquant
  }
  if (S.activity === null || S.activity === undefined) { goStep(5); return; }
  renderProgressBar(p, 7, 12);
  var _bmr = typeof calcBMR === 'function' ? calcBMR() : 0;
  var _tdee = typeof calcTDEE === 'function' ? Math.round(calcTDEE()) : 0;
  var _tgt  = typeof calcTarget === 'function' ? calcTarget() : 0;
  var _goalObj = (S.goal !== null && S.goal !== undefined && window.GOALS && window.GOALS[S.goal]) ? window.GOALS[S.goal] : null;
  var _useKM = (S._bodyFatEstimate !== null && S._bodyFatEstimate !== undefined && S._bodyFatEstimate >= 4);

  p.appendChild(h('div', {'class': 'eyebrow', style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:8px'}, 'APERCU · PROVISOIRE'));
  p.appendChild(h('h1', {html: 'Ton programme<br><em>estimatif.</em>', style: 'font-family:Georgia,serif;font-size:28px;font-weight:normal;line-height:1.2;margin-bottom:12px'}));
  p.appendChild(h('p', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey,#6B6B65);line-height:1.6;margin-bottom:24px'}, 'Voici une premi\u00e8re estimation bas\u00e9e sur tes donn\u00e9es. Nous affinerons apr\u00e8s quelques questions de sant\u00e9.'));

  if (_useKM) {
    var _lbmPrev = Math.round(S.weight * (1 - S._bodyFatEstimate / 100));
    p.appendChild(h('div', {style: 'display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border:1px solid var(--green,#1A4A1A);background:var(--greenbg,rgba(26,74,26,.06));margin-bottom:16px;border-radius:2px'}, [
      h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--green,#1A4A1A)'}, 'Katch-McArdle'),
      h('span', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65)'}, 'Calcul affin\u00e9 par composition corporelle \u00b7 ' + _lbmPrev + '\u00a0kg LBM')
    ]));
  }

  // Big numbers grid
  var _grid = h('div', {style: 'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px'});
  var _c1 = h('div', {'class': 'big-number', style: 'margin-bottom:0'});
  _c1.appendChild(h('div', {'class': 'bn-val'}, String(_tdee)));
  _c1.appendChild(h('div', {'class': 'bn-label'}, 'TDEE'));
  _c1.appendChild(h('div', {style: 'font-size:10px;color:var(--grey);font-style:italic;margin-top:2px'}, 'D\u00e9pense journali\u00e8re'));
  _grid.appendChild(_c1);
  if (_tgt > 0) {
    var _c2 = h('div', {'class': 'big-number', style: 'margin-bottom:0'});
    _c2.appendChild(h('div', {'class': 'bn-val'}, String(_tgt)));
    _c2.appendChild(h('div', {'class': 'bn-label'}, _goalObj ? _goalObj.name : 'Cible'));
    _c2.appendChild(h('div', {style: 'font-size:10px;color:var(--grey);font-style:italic;margin-top:2px'}, 'Calories cibles/jour'));
    _grid.appendChild(_c2);
  }
  p.appendChild(_grid);

  if (_bmr > 0) {
    p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);text-align:center;margin-bottom:20px'}, 'M\u00e9tabolisme de base (BMR)\u00a0: ' + _bmr + '\u00a0kcal/j'));
  }

  p.appendChild(h('div', {style: 'padding:12px 14px;border:1px solid var(--border,#E8E6DF);background:var(--ivory2,#F4F4F0);margin-bottom:24px;border-radius:2px'},[
    h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:4px'}, 'PROCHAINE \u00c9TAPE'),
    h('div', {style: 'font-family:Georgia,serif;font-size:13px;font-style:italic;color:var(--black,#1A1A18);line-height:1.5'}, 'Quelques questions m\u00e9dicales pour affiner les calculs et garantir des recommandations s\u00fbres.')
  ]));

  p.appendChild(h('button', {'class': 'btn-primary', onclick: function() {
    goStep(8);
  }}, 'Affiner avec mes donn\u00e9es de sant\u00e9 \u2192'));
  p.appendChild(h('button', {'class': 'btn-back', 'aria-label': 'Retour', onclick: function() { goStep(6); }, html: backArrowHtml() + window.t('onb.back')}));
}

// ─── PUBLIC API ───
window.WHEY_SMOOTHIES = WHEY_SMOOTHIES;

window.NUTRITION = {
  render: function(p) {
    // ─── INTERSTITIEL: si un programme existe et qu'on revient à l'étape 0 ───
    // Propose à l'utilisateur de consulter son programme ou d'en créer un nouveau.
    if (S.weekPlan && S.nStep === 0) {
      var content = h('div', {'class': 'fade-in'});
      renderNutritionChoice(content);
      p.appendChild(content);
      return;
    }

    // Header with step indicator (nStep 1-12)
    // nStep 11 (résultats) and 12 (planning) are post-generation — no header needed
    if (S.nStep >= 1 && S.nStep <= 10) {
      var hdr = h('header', {'class': 'header'});
      hdr.appendChild(h('div', {'class': 'logo', html: 'SMARTFITCOACH<span>Nutrition & Sport</span>'}));
      p.appendChild(hdr);
    }
    var content = h('div', {'class': 'fade-in'});
    if (S.shopListOpen) { renderShoppingList(content); p.appendChild(content); return; }
    if (S.saladBar && S.saladBar.open) { renderSaladBar(content); p.appendChild(content); return; }
    if (S._recipePicker) { renderRecipePicker(p); return; }
    if (S.smoothieBarOpen) {
      content.appendChild(h('div', {style:'display:flex;align-items:center;gap:12px;margin-bottom:16px'}, [
        h('button', {'class':'btn-secondary', style:'padding:8px 14px', onclick:function(){S.smoothieBarOpen=false;window.render();}}, '\u2190 Retour'),
        h('div', {style:'font-size:17px;font-weight:700'}, '\uD83E\uDD64 Smoothies Whey')
      ]));
      var smZone = h('div');
      renderSmoothieBar(smZone);
      content.appendChild(smZone);
      p.appendChild(content);
      return;
    }
    // ─── NEW FLOW ROUTING TABLE (nStep 0-12) ───
    // 0=Splash  1=N3(Prénom+Sexe)  2=N4(Naissance)  3=N5(Poids+Taille)
    // 4=N1+N2(Objectif+Poids cible)  5=N6+N7(Activité+Sommeil)
    // 6=BodyScan(optionnel)  7=ProvisionalPreview  8=Medical(PRESERVED)
    // 9=Habitudes  10=Préférences  11=Résultats/Macros  12=Planning semaine
    if (typeof S.nStep !== 'number' || S.nStep < 0 || S.nStep > 12) { S.nStep = 0; }
    if (S.nStep === 0) renderSplash(content);
    else if (S.nStep === 1) renderStep1(content);           // N3: Prénom + Sexe
    else if (S.nStep === 2) renderStep2(content);           // N4: Date naissance + cycle/grossesse
    else if (S.nStep === 3) renderStep3(content);           // N5: Poids + Taille
    else if (S.nStep === 4) renderStep6(content);           // N1+N2: Objectif + poids cible
    else if (S.nStep === 5) renderActiviteSommeil(content); // N6+N7: Activité + Sommeil
    else if (S.nStep === 6) renderBodyScan(content);        // Body Scan (optionnel)
    else if (S.nStep === 7) renderProvisionalPreview(content); // Provisional preview
    else if (S.nStep === 8) renderStep4(content);           // MEDICAL (PRESERVED — nStep 8)
    else if (S.nStep === 9) renderStep5(content);           // Habitudes alimentaires
    else if (S.nStep === 10) renderStep7(content);          // Préférences / régime / allergies
    else if (S.nStep === 11) renderStep8(content);          // Résultats / macros
    else if (S.nStep === 12) renderStep9(content);          // Planning semaine
    p.appendChild(content);
    renderModal(p);
  }
};

})();
