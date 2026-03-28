// app-nutrition.js — MTD: Nutrition Wizard (10 steps)
(function(){
'use strict';
var S = window.S;
var h = window.h, txt = window.txt, svgRing = window.svgRing;

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
var ACTIVITIES = window.ACTIVITIES;
var GOALS = window.GOALS;
var TRAINS = window.TRAINS;
var SLEEPS = window.SLEEPS;
var MEDICAL = window.MEDICAL;
var MEDICAL_ADVICE = window.MEDICAL_ADVICE;
var COOK_LEVELS = window.COOK_LEVELS;
var ALLERGIES = window.ALLERGIES;
var INTOLERANCES = window.INTOLERANCES;
var REGIMES = window.REGIMES;
var CUISINES = window.CUISINES;
var CUISINE_FLAGS = window.CUISINE_FLAGS;
var SHOPPING = window.SHOPPING;
var STAPLES = window.STAPLES;
var DAY_NAMES = window.DAY_NAMES;
var MEAL_SPLIT = window.MEAL_SPLIT;
var RATIOS = window.RATIOS;

var ALCOHOL_DB = window.ALCOHOL_DB;
var ALCOHOL_FREQS = window.ALCOHOL_FREQS;
var FOOD_HABITS_MEALS = window.FOOD_HABITS_MEALS;
var EATING_LOCATIONS = window.EATING_LOCATIONS;
var BODY_ZONES = window.BODY_ZONES;
var SUPPLEMENTS_DB = window.SUPPLEMENTS_DB;
var getSupplementRecommendations = window.getSupplementRecommendations;

var calcBMR = window.calcBMR;
var calcTDEE = window.calcTDEE;
var calcTarget = window.calcTarget;
var calcMacros = window.calcMacros;
var calcBMI = window.calcBMI;
var bmiInfo = window.bmiInfo;
var calcWeightProjection = window.calcWeightProjection;
var alcoholWeeklyKcal = window.alcoholWeeklyKcal;

var filterRecipes = window.filterRecipes;
var generateWeek = window.generateWeek;
var swapMeal = window.swapMeal;
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

function goStep(n) {
  S.nStep = n;
  bb('nutrition_step', {step: n});
  window.render();
}

// ─── STEP 0: SPLASH ───
function renderSplash(app) {
  var sp = h('div', {id: 'splash'});
  sp.appendChild(h('div', {'class': 'splash-logo'}, 'MTD'));
  sp.appendChild(h('div', {'class': 'splash-sub'}, 'Nutrition & Sport personnalis\u00e9s'));
  sp.appendChild(h('div', {'class': 'splash-line'}));
  var quotes = [
    "La nourriture que vous mangez peut \u00eatre la forme de m\u00e9decine la plus s\u00fbre ou la plus lente forme de poison.",
    "Que ton aliment soit ta seule m\u00e9decine.",
    "Le corps est le serviteur de l\u2019esprit.",
    "Prends soin de ton corps, c\u2019est le seul endroit o\u00f9 tu es oblig\u00e9 de vivre.",
    "La sant\u00e9 n\u2019est pas tout, mais sans la sant\u00e9 tout n\u2019est rien."
  ];
  sp.appendChild(h('div', {'class': 'splash-quote'}, quotes[Math.floor(Math.random() * quotes.length)]));
  sp.appendChild(h('button', {'class': 'splash-btn', onclick: function() { goStep(1); }}, window.t('onb.start')));
  app.appendChild(sp);
}

// ─── STEP 1: IDENTITE ───
function renderStep1(p) {
  // Greeting
  var user = authUser();
  if (user && user.name) {
    p.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;font-style:italic;margin-bottom:20px'}, 'Bonjour, ' + user.name));
  }
  p.appendChild(h('div', {'class': 'eyebrow'}, window.t('onb.step') + ' I'));
  p.appendChild(h('h1', {html: 'Votre<br><em>identit\u00e9</em>'}));
  p.appendChild(h('p', {'class': 'subtitle'}, 'Ces donn\u00e9es permettent de calculer votre m\u00e9tabolisme de base et vos besoins caloriques journaliers.'));
  if (window.TIPS) TIPS.renderTip(p, 'identity');

  // Sex (MANDATORY)
  var sexLabel = h('div', {'class': 'section-label'});
  sexLabel.appendChild(txt(window.t('onb.s1.sex')));
  sexLabel.appendChild(reqDot());
  p.appendChild(sexLabel);
  var g = h('div', {'class': 'card-grid-2'});
  [{icon: '\u2642', name: window.t('onb.s1.male'), val: 'homme'}, {icon: '\u2640', name: window.t('onb.s1.female'), val: 'femme'}].forEach(function(o) {
    g.appendChild(h('div', {'class': 'sel-card' + (S.sex === o.val ? ' on' : ''), onclick: function() { S.sex = o.val; window.render(); }}, [
      h('span', {'class': 'card-icon'}, o.icon),
      h('div', {'class': 'card-name'}, o.name)
    ]));
  });
  p.appendChild(g);

  // Cycle menstruel (femmes uniquement)
  if (S.sex === 'femme') {
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
      clWrap.appendChild(h('input', {'class': 'num-input', type: 'number', min: '21', max: '35', step: '1', value: String(S.cycleLength), inputmode: 'numeric', oninput: function(e) {
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
          var phaseColors = {menstruation: '#C0392B', follicular: '#E67E22', ovulation: '#27AE60', luteal: '#E67E22'};
          var phaseColor = phaseColors[cycleInfo.phase.id] || '#E67E22';
          var phaseCard = h('div', {style: 'border-left:3px solid ' + phaseColor + ';padding:12px 16px;background:var(--ivory2);margin:12px 0'});
          phaseCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;margin-bottom:4px'}, cycleInfo.phase.icon + ' ' + cycleInfo.phase.name));
          phaseCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:6px'}, 'Jour ' + cycleInfo.dayInCycle + ' de votre cycle'));
          phaseCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);font-style:italic'}, cycleInfo.phase.desc));

          // Progress bar showing position in cycle
          var barWrap = h('div', {style: 'margin-top:10px;height:8px;background:var(--border);border-radius:4px;overflow:hidden;display:flex'});
          var CYCLE_PHASES = window.CYCLE_PHASES;
          var barColors = {menstruation: '#C0392B', follicular: '#E67E22', ovulation: '#27AE60', luteal: '#E67E22'};
          for (var ci = 0; ci < CYCLE_PHASES.length; ci++) {
            var cp = CYCLE_PHASES[ci];
            var segStart = Math.round(cp.days[0] * S.cycleLength / 28);
            var segEnd = Math.round(cp.days[1] * S.cycleLength / 28);
            var segWidth = ((segEnd - segStart + 1) / S.cycleLength * 100);
            var segColor = barColors[cp.id] || '#ccc';
            var isCurrentSeg = cycleInfo.phase.id === cp.id;
            barWrap.appendChild(h('div', {style: 'width:' + segWidth + '%;background:' + segColor + ';opacity:' + (isCurrentSeg ? '1' : '0.3') + ';height:100%'}));
          }
          phaseCard.appendChild(barWrap);

          // Position marker
          var markerPct = ((cycleInfo.dayInCycle - 1) / S.cycleLength * 100);
          var markerWrap = h('div', {style: 'position:relative;height:10px;margin-top:2px'});
          markerWrap.appendChild(h('div', {style: 'position:absolute;left:' + markerPct + '%;transform:translateX(-50%);font-size:8px;color:var(--noir)'}, '\u25B2'));
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
      if (S.pregnant) { S.cycleTracking = false; }
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
          var progWrap = h('div', {style: 'height:8px;background:var(--border);border-radius:4px;overflow:hidden;margin:8px 0'});
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
          markerWPreg.appendChild(h('div', {style: 'position:absolute;left:' + markerPctPreg + '%;transform:translateX(-50%);font-size:8px;color:var(--noir)'}, '\u25B2'));
          triCard.appendChild(markerWPreg);

          triCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;margin-top:6px'}, triInfo.trimester.desc));
          triCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-top:4px'}, triInfo.weeksLeft + ' semaines avant le terme'));
          p.appendChild(triCard);

          // Weight guidance
          var wgPreg = window.getPregnancyWeightGuideline ? window.getPregnancyWeightGuideline() : null;
          if (wgPreg) {
            var wgCard = h('div', {style: 'border-left:3px solid ' + triColor + ';padding:14px 16px;background:var(--ivory2);margin-bottom:12px'});
            wgCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px;margin-bottom:8px'}, 'Prise de poids recommand\u00e9e (IOM 2009)'));
            var preBmi = S.prePregnancyWeight ? S.prePregnancyWeight / Math.pow(S.height / 100, 2) : (calcBMI ? (calcBMI() || 0) : 0);
            wgCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:4px'}, 'IMC pr\u00e9-grossesse : ' + (preBmi || 0).toFixed(1) + ' (' + wgPreg.category + ')'));
            wgCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:4px'}, 'Gain total recommand\u00e9 : ' + wgPreg.totalGainMin + ' \u2014 ' + wgPreg.totalGainMax + ' kg'));
            wgCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:4px'}, '\u00c0 la semaine ' + S.pregnancyWeek + ' : +' + wgPreg.currentExpectedGainMin + ' \u00e0 +' + wgPreg.currentExpectedGainMax + ' kg attendus'));
            wgCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey)'}, 'Poids attendu : ' + wgPreg.expectedWeightMin + ' kg \u2014 ' + wgPreg.expectedWeightMax + ' kg'));

            if (S.weight && S.prePregnancyWeight) {
              var actualGain = S.weight - S.prePregnancyWeight;
              var withinRange = actualGain >= wgPreg.currentExpectedGainMin && actualGain <= wgPreg.currentExpectedGainMax;
              var belowRange = actualGain < wgPreg.currentExpectedGainMin;
              var statusColor = withinRange ? '#27AE60' : (belowRange ? '#3498DB' : '#E67E22');
              var statusText = withinRange ? 'Dans la fourchette recommand\u00e9e' : (belowRange ? 'En dessous de la fourchette' : 'Au-dessus de la fourchette');
              wgCard.appendChild(h('div', {style: 'margin-top:8px;padding:6px 10px;background:rgba(0,0,0,0.03);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:' + statusColor}, 'Prise actuelle : +' + actualGain.toFixed(1) + ' kg \u2014 ' + statusText));
            }
            p.appendChild(wgCard);
          }
        }
      }
    }

    p.appendChild(h('div', {style: 'height:8px'}));
  }

  // Age (MANDATORY 14-70)
  var ageLabel = h('div', {'class': 'section-label'});
  ageLabel.appendChild(txt(window.t('onb.s2.age')));
  ageLabel.appendChild(reqDot());
  p.appendChild(ageLabel);
  var aw = h('div', {'class': 'num-input-wrap'});
  aw.appendChild(h('input', {'class': 'num-input', type: 'number', min: '14', max: '70', step: '1', value: String(S.age), inputmode: 'numeric', placeholder: '28', oninput: function(e) {
    var v = parseInt(e.target.value);
    if (!isNaN(v) && v >= 14 && v <= 70) S.age = v;
  }, onblur: function(e) {
    var v = parseInt(e.target.value);
    if (isNaN(v) || v < 14) e.target.value = S.age = 14;
    else if (v > 70) e.target.value = S.age = 70;
  }}));
  aw.appendChild(h('span', {'class': 'num-unit'}, 'ans'));
  p.appendChild(aw);
  p.appendChild(h('div', {'class': 'num-hint'}, 'Entre 14 et 70 ans'));

  if (S.age && S.age < 18) {
    var minorWarn = h('div', {style: 'background:rgba(180,120,0,0.1);border:1px solid #B47800;border-radius:6px;padding:10px 12px;font-size:11px;color:#7A5200;margin-top:8px;line-height:1.5'},
      'Pour les moins de 18 ans, ce programme doit \u00eatre suivi avec l\'accompagnement d\'un professionnel de sant\u00e9 ou d\'un m\u00e9decin.');
    p.appendChild(minorWarn);
  }

  p.appendChild(h('div', {style: 'height:16px'}));
  p.appendChild(h('button', {'class': 'btn-primary', disabled: !S.sex, onclick: function() { if (S.sex) { bb('nutrition_identity', {sex: S.sex, age: S.age}); goStep(2); } }}, window.t('onb.next')));
}

// ─── STEP 2: MORPHOLOGIE ───
function renderStep2(p) {
  p.appendChild(h('div', {'class': 'eyebrow'}, window.t('onb.step') + ' II'));
  p.appendChild(h('h1', {html: 'Votre<br><em>morphologie</em>'}));
  p.appendChild(h('p', {'class': 'subtitle'}, 'Poids et taille pour calculer votre IMC et calibrer les besoins caloriques.'));
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
      style: 'padding:6px 16px;border-radius:20px;font-size:12px;border:1px solid var(--border,#D8D8D0);cursor:pointer;' +
        'background:' + (isActive ? 'var(--black,#0A0A09)' : 'transparent') + ';' +
        'color:' + (isActive ? 'var(--ivory,#FAFAF7)' : 'var(--text,#0A0A09)'),
      onclick: function(e) {
        e.preventDefault();
        if (window.UNITS) window.UNITS.setWeightUnit(u);
      }
    }, u);
    weightUnitDiv.appendChild(btn);
  });
  p.appendChild(weightUnitDiv);
  var wRange = window.UNITS ? window.UNITS.weightRange() : {min: 30, max: 300, step: 0.1};
  var wVal = window.UNITS ? window.UNITS.displayWeightVal(S.weight) : S.weight;
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
      style: 'padding:6px 16px;border-radius:20px;font-size:12px;border:1px solid var(--border,#D8D8D0);cursor:pointer;' +
        'background:' + (isActiveH ? 'var(--black,#0A0A09)' : 'transparent') + ';' +
        'color:' + (isActiveH ? 'var(--ivory,#FAFAF7)' : 'var(--text,#0A0A09)'),
      onclick: function(e) {
        e.preventDefault();
        if (window.UNITS) window.UNITS.setHeightUnit(u);
      }
    }, u === 'ft' ? 'ft\u00b7in' : 'cm');
    heightUnitDiv.appendChild(btnH);
  });
  p.appendChild(heightUnitDiv);
  var hRange = window.UNITS ? window.UNITS.heightRange() : {min: 120, max: 250, step: 1};
  var hVal = window.UNITS ? window.UNITS.displayHeightVal(S.height) : S.height;
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

  // Photo upload section
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
    frontZone.appendChild(h('div', {'class': 'photo-label'}, 'Photo de face'));
  } else {
    frontZone.appendChild(h('div', {'class': 'photo-icon'}, '\ud83d\udcf7'));
    frontZone.appendChild(h('div', {'class': 'photo-label'}, 'Photo de face'));
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
    backZone.appendChild(h('div', {'class': 'photo-label'}, 'Photo de dos'));
  } else {
    backZone.appendChild(h('div', {'class': 'photo-icon'}, '\ud83d\udcf7'));
    backZone.appendChild(h('div', {'class': 'photo-label'}, 'Photo de dos'));
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

  p.appendChild(h('div', {style: 'height:24px'}));
  var _step2ok = !!(S.weight && S.height);
  p.appendChild(h('button', {'class': 'btn-primary', disabled: !_step2ok, onclick: function() { if (_step2ok) goStep(3); }}, window.t('onb.next')));
  p.appendChild(h('button', {'class': 'btn-back', onclick: function() { goStep(1); }, html: backArrowHtml() + window.t('onb.back')}));
}

// ─── STEP 3: ACTIVITE ───
function renderStep3(p) {
  p.appendChild(h('div', {'class': 'eyebrow'}, window.t('onb.step') + ' III'));
  p.appendChild(h('h1', {html: 'Votre<br><em>activit\u00e9</em>'}));
  p.appendChild(h('p', {'class': 'subtitle'}, 'Niveau d\'activit\u00e9 physique, type d\'entra\u00eenement et qualit\u00e9 de sommeil.'));
  if (window.TIPS) TIPS.renderTip(p, 'activity');

  // Frequency sport (MANDATORY)
  var actLabel = h('div', {'class': 'section-label'});
  actLabel.appendChild(txt('Fr\u00e9quence sport'));
  actLabel.appendChild(reqDot());
  p.appendChild(actLabel);
  var list = h('div', {'class': 'level-list'});
  ACTIVITIES.forEach(function(a, i) {
    list.appendChild(h('div', {'class': 'level-item' + (S.activity === i ? ' on' : ''), onclick: function() { S.activity = i; window.render(); }}, [
      h('div', {}, [h('div', {'class': 'level-name'}, a.icon + ' ' + a.name), h('div', {'class': 'level-desc'}, a.desc)]),
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
    cw.appendChild(h('span', {'class': 'chip' + (S.train.indexOf(i) !== -1 ? ' on' : ''), onclick: function() { var idx = S.train.indexOf(i); if (idx === -1) S.train.push(i); else S.train.splice(idx, 1); window.render(); }}, t.icon + ' ' + t.name));
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

  p.appendChild(h('div', {style: 'height:24px'}));
  var ok = S.activity !== null && S.train.length > 0 && S.sleep !== null;
  p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function() { if (ok) goStep(4); }}, window.t('onb.next')));
  p.appendChild(h('button', {'class': 'btn-back', onclick: function() { goStep(2); }, html: backArrowHtml() + window.t('onb.back')}));
}

// ─── STEP 4: SANTE ───
function renderStep4(p) {
  p.appendChild(h('div', {'class': 'eyebrow'}, window.t('onb.step') + ' IV'));
  p.appendChild(h('h1', {html: 'Votre<br><em>sant\u00e9</em>'}));
  p.appendChild(h('p', {'class': 'subtitle'}, 'S\u00e9lectionnez vos conditions m\u00e9dicales pour adapter les macros et obtenir des recommandations nutritionnelles personnalis\u00e9es.'));
  if (window.TIPS) TIPS.renderTip(p, 'health');

  var none = S.medical.length === 0;
  var nb = h('div', {'class': 'sel-card' + (none ? ' on' : ''), style: 'margin-bottom:16px;text-align:center', onclick: function() { S.medical = []; window.render(); }});
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
        if (on) S.medical = S.medical.filter(function(x) { return x !== item.id; });
        else S.medical.push(item.id);
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
      if (adv) sel.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;color:var(--grey);margin-bottom:4px;padding-left:8px;border-left:1px solid var(--border)'}, adv.warn));
    });
    p.appendChild(sel);
  }

  p.appendChild(h('div', {style: 'height:8px'}));
  var warn = h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;color:var(--grey3);text-align:center;margin-bottom:16px'});
  warn.textContent = '\u26a0 Ces informations ne remplacent pas un avis m\u00e9dical. Consultez votre m\u00e9decin.';
  p.appendChild(warn);

  p.appendChild(h('button', {'class': 'btn-primary', onclick: function() { goStep(5); }}, window.t('onb.next')));
  p.appendChild(h('button', {'class': 'btn-back', onclick: function() { goStep(3); }, html: backArrowHtml() + window.t('onb.back')}));
}

// ─── STEP 5: HABITUDES ALIMENTAIRES ───
function renderStep5(p) {
  p.appendChild(h('div', {'class': 'eyebrow'}, window.t('onb.step') + ' V'));
  p.appendChild(h('h1', {html: 'Vos<br><em>habitudes alimentaires</em>'}));
  p.appendChild(h('p', {'class': 'subtitle'}, 'Personnalisez vos recommandations selon votre mode de vie'));
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

  // Hydratation quotidienne
  p.appendChild(h('div', {'class': 'section-label'}, 'Hydratation quotidienne'));
  var hydOpts = ['< 1L/jour', '1-2L/jour', '2L+/jour'];
  var hydWrap = h('div', {'class': 'chip-wrap'});
  hydOpts.forEach(function(opt) {
    hydWrap.appendChild(h('span', {'class': 'chip' + (S.hydration === opt ? ' on' : ''), onclick: function() { S.hydration = opt; window.render(); }}, opt));
  });
  p.appendChild(hydWrap);

  // Divider: Supplémentation
  var suppDiv = h('div', {'class': 'divider', style: 'margin:28px 0 18px'});
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
    p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:#E67E22;margin-top:6px'}, '\u26A0 Caf\u00e9ine : max 200 mg/jour pendant la grossesse (environ 1 tasse de caf\u00e9)'));
  }

  // Divider: Consommation d'alcool
  if (S.pregnant && S.sex === 'femme') {
    // Pregnancy: no alcohol
    var alcPregDiv = h('div', {'class': 'divider', style: 'margin:28px 0 18px'});
    alcPregDiv.appendChild(h('div', {'class': 'divider-line'}));
    alcPregDiv.appendChild(h('div', {'class': 'divider-text'}, 'Consommation d\u2019alcool'));
    alcPregDiv.appendChild(h('div', {'class': 'divider-line'}));
    p.appendChild(alcPregDiv);
    var alcPregWarn = h('div', {style: 'border-left:3px solid #C0392B;padding:14px 16px;background:rgba(192,57,43,0.06);margin-bottom:16px'});
    alcPregWarn.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px;color:#C0392B;margin-bottom:4px'}, '\u26D4 Z\u00e9ro alcool pendant la grossesse'));
    alcPregWarn.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#C0392B'}, 'Aucune quantit\u00e9 d\'alcool n\'est consid\u00e9r\u00e9e comme s\u00fbre pendant la grossesse. L\'alcool traverse le placenta et peut affecter le d\u00e9veloppement du b\u00e9b\u00e9.'));
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
              style: 'padding:4px 8px;font-size:10px;min-width:24px;text-align:center',
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
    p.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:14px;text-align:center;padding:12px;margin-top:8px;border:1px solid var(--border);background:var(--ivory2)'}, 'Total : ' + totalAlcKcal + ' kcal/semaine d\u2019alcool'));

    if (totalAlcKcal > 500) {
      var alcWarn = h('div', {style: 'border-left:2px solid var(--orange);padding:12px 16px;background:var(--orangebg);margin-top:8px'});
      alcWarn.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--orange)'}, '\u26a0 Consommation \u00e9lev\u00e9e : ' + totalAlcKcal + ' kcal/semaine repr\u00e9sente environ ' + Math.round(totalAlcKcal / 7) + ' kcal/jour suppl\u00e9mentaires. Cela peut freiner vos objectifs.'));
      p.appendChild(alcWarn);
    }
  }
  } // end else (non-pregnant alcohol section)

  // Sélecteur de langue
  var f_lang = h('div', {'class': 'field'});
  f_lang.appendChild(h('label', {'class': 'field-label'}, '\uD83C\uDF10 ' + (window.t ? window.t('Langue / Language') : 'Langue / Language')));
  var langSelect = h('select', {'class': 'num-input', style: 'width:100%;padding:10px 12px;font-size:14px;border-radius:8px;border:1px solid var(--border);background:var(--card);color:var(--text)',
    onchange: function() {
      window.I18N.setLang(this.value);
    }
  });
  [['fr', '\uD83C\uDDEB\uD83C\uDDF7 Français'], ['en', '\uD83C\uDDEC\uD83C\uDDE7 English']].forEach(function(opt) {
    var o = h('option', {value: opt[0]}, opt[1]);
    if ((S.lang || (window.I18N ? window.I18N.current : 'fr') || 'fr') === opt[0]) o.setAttribute('selected', 'selected');
    langSelect.appendChild(o);
  });
  f_lang.appendChild(langSelect);
  p.appendChild(f_lang);

  // Devise fixée en MAD

  p.appendChild(h('div', {style: 'height:24px'}));
  var canContinue = S.mealsPerDay !== null && S.eatingLocation !== null && S.mealPrepTime !== null && S.alcoholFreq !== null;
  p.appendChild(h('button', {'class': 'btn-primary', disabled: !canContinue, onclick: function() {
    if (canContinue) {
      bb('nutrition_habits', {meals: S.mealsPerDay, location: S.eatingLocation, prepTime: S.mealPrepTime, alcoholFreq: S.alcoholFreq});
      goStep(6);
    }
  }}, window.t('onb.next')));
  p.appendChild(h('button', {'class': 'btn-back', onclick: function() { goStep(4); }, html: backArrowHtml() + window.t('onb.back')}));
}

// ─── STEP 6: OBJECTIF ───
function renderStep6(p) {
  p.appendChild(h('div', {'class': 'eyebrow'}, window.t('onb.step') + ' VI'));
  p.appendChild(h('h1', {html: 'Votre<br><em>objectif</em>'}));
  if (window.TIPS) TIPS.renderTip(p, 'goal');

  // Pregnancy: override goal
  if (S.pregnant && S.sex === 'femme') {
    p.appendChild(h('p', {'class': 'subtitle'}, 'Pendant la grossesse, l\'objectif est le maintien + les besoins suppl\u00e9mentaires de la grossesse.'));

    // Auto-select maintain
    S.goal = 1; // index of "Maintien" in GOALS

    var pregObjCard = h('div', {style: 'border-left:3px solid #E8A87C;padding:16px;background:var(--ivory2);margin-bottom:16px'});
    pregObjCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:18px;margin-bottom:8px'}, '\uD83E\uDD30 ' + window.t('onb.s6.maintain') + ' + besoins grossesse'));
    pregObjCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);margin-bottom:4px'}, 'La perte de poids est d\u00e9conseill\u00e9e pendant la grossesse.'));

    var triPreg = window.getPregnancyTrimester ? window.getPregnancyTrimester() : null;
    if (triPreg) {
      var extraCal = triPreg.trimester.calorieExtra;
      var tdeeBase = Math.round(calcTDEE());
      var totalPreg = tdeeBase + extraCal;
      pregObjCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey);margin-top:8px'}, 'Besoins de base : ' + tdeeBase + ' kcal + ' + extraCal + ' kcal (trimestre ' + triPreg.trimesterNumber + ') = ' + totalPreg + ' kcal/jour'));
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
          if (isNaN(baseW) || baseW <= 0) return;
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
            { label: 'Min recommand\u00e9', data: minData, borderColor: '#27AE60', borderWidth: 1, pointRadius: 0, fill: false },
            { label: 'Max recommand\u00e9', data: maxData, borderColor: '#27AE60', borderWidth: 1, pointRadius: 0, fill: '-1', backgroundColor: 'rgba(39,174,96,0.12)' }
          ];
          if (S.weight) {
            var pointData = new Array(41).fill(null);
            var cw = S.pregnancyWeek || 0;
            if (cw >= 0 && cw <= 40) pointData[cw] = S.weight;
            datasets.push({ label: 'Poids actuel', data: pointData, borderColor: '#E8A87C', pointRadius: 6, pointBackgroundColor: '#E8A87C', showLine: false });
          }
          try { window.createChart(curveCanvas, {
            type: 'line', data: { labels: labels, datasets: datasets },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { font: { family: 'Helvetica Neue', size: 9 } } } }, scales: { x: { grid: { color: '#E5E4DE' }, ticks: { font: { family: 'Helvetica Neue', size: 8 }, color: '#9A9A94', maxTicksLimit: 10 } }, y: { grid: { color: '#E5E4DE' }, ticks: { font: { family: 'Georgia', size: 11 }, color: '#0A0A09' } } } }
          }); } catch(e){}
        }, 150);
      }
    }

    p.appendChild(h('div', {style: 'height:16px'}));
    p.appendChild(h('button', {'class': 'btn-primary', onclick: function() {
      bb('nutrition_goal', {goal: 'maintain_pregnancy', target: calcTarget()});
      goStep(7);
    }}, window.t('onb.next')));
    p.appendChild(h('button', {'class': 'btn-back', onclick: function() { goStep(5); }, html: backArrowHtml() + window.t('onb.back')}));
    return;
  }

  p.appendChild(h('p', {'class': 'subtitle'}, 'Votre objectif d\u00e9termine la r\u00e9partition calorique et les ratios de macronutriments.'));

  // Goal selection (MANDATORY)
  var goalLabel = h('div', {'class': 'section-label'});
  goalLabel.appendChild(txt('Objectif principal'));
  goalLabel.appendChild(reqDot());
  p.appendChild(goalLabel);
  var gg = h('div', {'class': 'card-grid-2'});
  GOALS.forEach(function(gl, i) {
    gg.appendChild(h('div', {'class': 'sel-card' + (S.goal === i ? ' on' : ''), onclick: function() {
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
    }}, [
      h('span', {'class': 'card-icon'}, gl.icon),
      h('div', {'class': 'card-name'}, gl.name),
      h('div', {'class': 'card-sub'}, gl.desc)
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
    var goalKey = GOALS[S.goal].key;
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
        projBox.appendChild(h('div', {style: 'font-family:Georgia;font-size:22px;font-style:italic'}, '~' + proj.weeks + ' semaines'));
        projBox.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:10px;color:var(--grey);margin-top:4px'},
          proj.months + ' mois \u2014 ' + proj.targetDate.toLocaleDateString('fr-FR', {day:'numeric',month:'long',year:'numeric'})));
        projBox.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey3,#9A9A94);margin-top:4px'},
          (proj.weeklyChange > 0 ? '+' : '') + (proj.weeklyChange || 0).toFixed(2) + ' kg/semaine'));
        p.appendChild(projBox);
      }
    }
  }

  p.appendChild(h('div', {style: 'height:16px'}));
  var goalOk = S.goal !== null;
  var _tcaConflict = false;
  if (goalOk && S.goal !== null) {
    var gk = GOALS[S.goal].key;
    if ((gk === 'cut' || gk === 'shred' || gk === 'bulk' || gk === 'lean_bulk') && !S.targetWeight) goalOk = false;
    if ((gk === 'cut' || gk === 'shred') && S.medical && S.medical.indexOf('tca') !== -1) {
      goalOk = false;
      _tcaConflict = true;
    }
  }
  if (_tcaConflict) {
    p.appendChild(h('div', {style: 'background:#FCE4EC;border-left:4px solid #C62828;padding:10px 14px;border-radius:2px;margin-bottom:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#B71C1C;line-height:1.6'}, '⚠ CONFLIT : Objectif sèche/coupe incompatible avec un historique de TCA. Choisissez Maintien ou Prise de masse.'));
  }
  p.appendChild(h('button', {'class': 'btn-primary', disabled: !goalOk, onclick: function() {
    if (goalOk) {
      bb('nutrition_goal', {goal: GOALS[S.goal].key, target: calcTarget(), targetWeight: S.targetWeight});
      goStep(7);
    }
  }}, window.t('onb.next')));
  p.appendChild(h('button', {'class': 'btn-back', onclick: function() { goStep(5); }, html: backArrowHtml() + window.t('onb.back')}));
}

// ─── STEP 7: PREFERENCES ───
function renderStep7(p) {
  p.appendChild(h('div', {'class': 'eyebrow'}, window.t('onb.step') + ' VII'));
  p.appendChild(h('h1', {html: 'Vos<br><em>pr\u00e9f\u00e9rences</em>'}));
  p.appendChild(h('p', {'class': 'subtitle'}, 'Personnalisez vos recettes selon votre niveau cuisine, allergies et cuisines du monde pr\u00e9f\u00e9r\u00e9es.'));
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

  // Excluded
  p.appendChild(h('div', {'class': 'section-label'}, 'Aliments exclus'));
  var fi = h('div', {'class': 'field'});
  fi.appendChild(h('input', {type: 'text', placeholder: 'Ex: avocat, bœuf, saumon...', value: S.excluded, oninput: function(e) { S.excluded = e.target.value; }}));
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
  SHOPPING[0].items.forEach(function(it) {
    sfg.appendChild(h('div', {'class': 'sel-card' + (S.shopFreq === it.id ? ' on' : ''), onclick: function() { S.shopFreq = it.id; window.render(); }}, [
      h('div', {'class': 'card-name', style: 'font-size:13px'}, it.name),
      h('div', {'class': 'card-sub'}, it.desc)
    ]));
  });
  p.appendChild(sfg);

  // Stores
  p.appendChild(h('div', {'class': 'section-label'}, 'O\u00f9 faites-vous vos courses ?'));
  var sg = h('div', {'class': 'chip-wrap'});
  SHOPPING[1].items.forEach(function(it) {
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
  SHOPPING[2].items.forEach(function(it) {
    bg.appendChild(h('div', {'class': 'sel-card' + (S.shopBudget === it.id ? ' on' : ''), onclick: function() { S.shopBudget = it.id; window.render(); }}, [
      h('div', {'class': 'card-name', style: 'font-size:13px'}, it.name),
      h('div', {'class': 'card-sub'}, it.desc)
    ]));
  });
  p.appendChild(bg);

  // Preferences
  p.appendChild(h('div', {'class': 'section-label'}, 'Pr\u00e9f\u00e9rences produits'));
  var pg = h('div', {'class': 'chip-wrap'});
  SHOPPING[3].items.forEach(function(it) {
    var on = S.shopPrefs.indexOf(it.id) !== -1;
    pg.appendChild(h('span', {'class': 'chip' + (on ? ' on' : ''), onclick: function() {
      if (on) S.shopPrefs = S.shopPrefs.filter(function(x) { return x !== it.id; });
      else S.shopPrefs.push(it.id);
      window.render();
    }}, it.name));
  });
  p.appendChild(pg);

  p.appendChild(h('div', {style: 'height:24px'}));
  var ok = S.whey !== null;
  p.appendChild(h('button', {'class': 'btn-primary', disabled: !ok, onclick: function() {
    if (ok) {
      S.weekPlan = generateWeek();
      bb('nutrition_preferences', {cookLevel: S.cookLevel, whey: S.whey, regime: S.regime});
      if (window.GAMIFICATION && window.GAMIFICATION.unlockBadge) window.GAMIFICATION.unlockBadge('first_plan');
      goStep(8);
    }
  }}, window.t('onb.finish')));
  p.appendChild(h('button', {'class': 'btn-back', onclick: function() { goStep(6); }, html: backArrowHtml() + window.t('onb.back')}));
}

// ─── STEP 8: RESULTATS ───
function renderStep8(p) {
  // CRITIQUE-3: garde S.goal null — ne peut pas calculer les macros sans objectif
  if (S.goal === null) { goStep(6); return; }
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
  var _profItems = [S.sex==='homme'?'Homme':'Femme', S.age+' ans', (window.UNITS ? window.UNITS.displayWeight(S.weight) : S.weight+'kg'), (window.UNITS ? window.UNITS.displayHeight(S.height) : (S.height/100).toFixed(2)+'m')];
  if(S.activity!==null&&S.activity!==undefined&&ACTIVITIES[S.activity])_profItems.push(ACTIVITIES[S.activity].name);
  if(S.goal!==null&&S.goal!==undefined&&GOALS[S.goal])_profItems.push(GOALS[S.goal].name);
  rh.appendChild(h('div', {style:'text-align:center;font-family:"Helvetica Neue",sans-serif;font-size:10px;color:var(--grey);letter-spacing:1px;margin:8px 0'}, _profItems.join(' \u00B7 ')));
  var _m=calcMacros();
  if(_m.proteinPerKg){rh.appendChild(h('div',{style:'text-align:center;font-family:"Helvetica Neue",sans-serif;font-size:9px;color:var(--grey2);letter-spacing:1px'},'Prot\u00e9ines: '+_m.proteinPerKg+'g/kg \u00B7 Lipides: '+_m.fatPerKg+'g/kg \u00B7 Glucides: '+(_m.carbsPerKg||'-')+'g/kg'));}
  p.appendChild(rh);
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
      var bg = c.level === 'CRITIQUE' ? '#FFEBEE' : c.level === 'ÉLEVÉ' ? '#FFF3E0' : '#E3F2FD';
      var border = c.level === 'CRITIQUE' ? '#C0392B' : c.level === 'ÉLEVÉ' ? '#E67E22' : '#1976D2';
      var color = c.level === 'CRITIQUE' ? '#7B1A1A' : c.level === 'ÉLEVÉ' ? '#5D4037' : '#0D47A1';
      p.appendChild(h('div', {style: 'background:' + bg + ';border-left:4px solid ' + border + ';padding:10px 14px;margin-bottom:10px;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:' + color + ';line-height:1.5'}, c.message));
    });
  }

  // Big numbers
  var sr = h('div', {style: 'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px'});
  var c1 = h('div', {'class': 'big-number', style: 'margin-bottom:0'});
  c1.appendChild(h('div', {'class': 'bn-val'}, String(tdee)));
  c1.appendChild(h('div', {'class': 'bn-label'}, window.t('onb.s8.tdee')));
  sr.appendChild(c1);
  var c2 = h('div', {'class': 'big-number', style: 'margin-bottom:0'});
  c2.appendChild(h('div', {'class': 'bn-val'}, String(tgt)));
  c2.appendChild(h('div', {'class': 'bn-label'}, (S.goal!==null&&GOALS[S.goal])?GOALS[S.goal].name:''));
  sr.appendChild(c2);
  p.appendChild(sr);

    // Bandeau validation NutritionMaster (XSS-safe DOM construction)
    if (window.S._nm && window.S._nm.errors && window.S._nm.errors.length === 0) {
      var nmDiv = document.createElement('div');
      nmDiv.style.cssText = 'margin:8px 0;padding:8px 12px;background:var(--greenbg,rgba(26,74,26,.06));border-left:3px solid var(--green,#1A4A1A);font-size:12px;color:var(--text-secondary,#5A5A54)';
      nmDiv.textContent = '\u2713 Calculs valid\u00e9s par NutritionMaster \u2014 P\u00d74 + G\u00d74 + L\u00d79 = ' + Number(window.S._nm.caloriesCheck) + ' kcal';
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
      var cohColor = coherenceOk ? '#27AE60' : '#E67E22';
      var cohBg = coherenceOk ? '#E8F5E9' : '#FFF3E0';
      var cohBorder = coherenceOk ? '#27AE60' : '#E67E22';
      var sessBox = h('div', {style: 'background:' + cohBg + ';border:1px solid ' + cohBorder + ';padding:10px 14px;margin-bottom:12px;font-family:"Helvetica Neue",sans-serif;font-size:11px'});
      var sessTitle = h('div', {style: 'display:flex;justify-content:space-between;margin-bottom:4px'});
      sessTitle.appendChild(h('span', {style: 'font-weight:bold;color:' + cohColor}, '\uD83C\uDFCB\uFE0F S\u00e9ances musculation — 7 derniers jours'));
      sessTitle.appendChild(h('span', {style: 'font-weight:bold;color:' + cohColor}, totalWkKcal + '\u00a0kcal'));
      sessBox.appendChild(sessTitle);
      sessBox.appendChild(h('div', {style: 'color:var(--grey)'}, weekSess.length + '\u00a0s\u00e9ance' + (weekSess.length > 1 ? 's' : '') + ' valid\u00e9e' + (weekSess.length > 1 ? 's' : '') + ' \u2014 moy. ' + avgPerSess + '\u00a0kcal/s\u00e9ance'));
      sessBox.appendChild(h('div', {style: 'color:var(--grey);margin-top:4px;font-style:italic;font-size:9px'}, coherenceOk ? '\u2713 Coh\u00e9rent avec votre facteur d\'activit\u00e9 TDEE' : '\u26a0 D\u00e9calage vs facteur d\'activit\u00e9 s\u00e9lectionn\u00e9 \u2014 pensez \u00e0 mettre \u00e0 jour votre niveau d\'activit\u00e9 dans votre profil'));
      p.appendChild(sessBox);
    }
  }

  // SVG Rings
  var tot = m.g + m.p + m.l;
  var rr = h('div', {'class': 'rings-row'});
  rr.appendChild(svgRing(90, 5, tot > 0 ? m.g / tot * 100 : 0, '#1A3A6A', window.t('onb.s8.carbs'), m.g));
  rr.appendChild(svgRing(90, 5, tot > 0 ? m.p / tot * 100 : 0, '#1A4A1A', window.t('onb.s8.proteins'), m.p));
  rr.appendChild(svgRing(90, 5, tot > 0 ? m.l / tot * 100 : 0, '#6A4A1A', window.t('onb.s8.fats'), m.l));
  p.appendChild(rr);

  // Meal split — N-01: dynamique selon S.mealsPerDay
  function getMealSplit(n) {
    switch(n) {
      case 2: return [{n:window.t('onb.s9.lunch'),pct:50},{n:window.t('onb.s9.dinner'),pct:50}];
      case 3: return [{n:window.t('onb.s9.breakfast'),pct:25},{n:window.t('onb.s9.lunch'),pct:45},{n:window.t('onb.s9.dinner'),pct:30}];
      case 5: return [{n:window.t('onb.s9.breakfast'),pct:20},{n:'Collation mat.',pct:10},{n:window.t('onb.s9.lunch'),pct:35},{n:window.t('onb.s9.snack'),pct:10},{n:window.t('onb.s9.dinner'),pct:25}];
      default: return [{n:window.t('onb.s9.breakfast'),pct:25},{n:window.t('onb.s9.lunch'),pct:40},{n:window.t('onb.s9.snack'),pct:5},{n:window.t('onb.s9.dinner'),pct:30}];
    }
  }
  p.appendChild(h('div', {'class': 'section-label'}, 'R\u00e9partition par repas (' + (S.mealsPerDay||3) + ' repas/j)'));
  var ms = h('div', {'class': 'meal-split'});
  getMealSplit(S.mealsPerDay||3).forEach(function(meal) {
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
  stats.appendChild(h('div', {'class': 'stat-cell'}, [h('div', {'class': 'stat-val'}, ppk), h('div', {'class': 'stat-label'}, 'g prot/kg')]));
  if (bmi !== null) {
    var bi = bmiInfo(bmi);
    var imcClass = bmi < 18.5 ? 'stat-warn' : bmi < 25 ? 'stat-good' : bmi < 30 ? 'stat-warn' : 'stat-alert';
    stats.appendChild(h('div', {'class': 'stat-cell ' + imcClass}, [h('div', {'class': 'stat-val', style: 'color:' + bi.color}, bmi.toFixed(1)), h('div', {'class': 'stat-label'}, window.t('onb.s2.bmi'))]));
  }
  p.appendChild(stats);

  // Medical warnings
  if (S.medical.length > 0) {
    var mw = h('div', {style: 'border-left:2px solid var(--orange);padding:12px 16px;background:var(--orangebg);margin:16px 0'});
    mw.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--orange);margin-bottom:8px'}, 'Recommandations m\u00e9dicales'));
    S.medical.forEach(function(id) {
      var adv = MEDICAL_ADVICE[id];
      if (adv) mw.appendChild(h('div', {style: 'font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;color:var(--grey);margin-bottom:4px;padding-left:8px;border-left:1px solid var(--border)'}, adv.warn));
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
      pregResCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:20px;margin-bottom:4px'}, triRes.trimester.icon + ' Grossesse \u2014 ' + triRes.trimester.name + ' (Semaine ' + triRes.week + '/40)'));

      // Progress bar
      var pregProgW = h('div', {style: 'height:8px;background:var(--border);border-radius:4px;overflow:hidden;margin:8px 0;display:flex'});
      pregProgW.appendChild(h('div', {style: 'width:' + (13/40*100) + '%;background:#E8A87C;opacity:' + (triRes.trimesterNumber === 1 ? '1' : '0.3')}));
      pregProgW.appendChild(h('div', {style: 'width:' + (14/40*100) + '%;background:#C38D6B;opacity:' + (triRes.trimesterNumber === 2 ? '1' : '0.3')}));
      pregProgW.appendChild(h('div', {style: 'width:' + ((100-13/40*100-14/40*100)) + '%;background:#D4A5A5;opacity:' + (triRes.trimesterNumber === 3 ? '1' : '0.3')}));
      pregResCard.appendChild(pregProgW);

      // Calorie info
      var tdeeRes = Math.round(calcTDEE());
      var extraRes = triRes.trimester.calorieExtra;
      pregResCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey);margin:8px 0'}, 'TDEE ' + tdeeRes + ' kcal + ' + extraRes + ' kcal grossesse = ' + (tdeeRes + extraRes) + ' kcal/jour'));

      // Nutrition tips
      var pregNutList = h('div', {style: 'border-left:2px solid #27AE60;padding:8px 12px;margin:10px 0'});
      pregNutList.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#27AE60;margin-bottom:6px'}, 'Recommandations nutritionnelles'));
      (triRes.trimester.nutritionTips || []).forEach(function(tip) {
        pregNutList.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);margin-bottom:3px;padding-left:8px'}, '\u2022 ' + tip));
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
        pregSuppList.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);margin-bottom:3px;padding-left:8px'}, '\u25C6 ' + s));
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
            { label: 'Min recommand\u00e9', data: pregMinD, borderColor: '#27AE60', borderWidth: 1, pointRadius: 0, fill: false },
            { label: 'Max recommand\u00e9', data: pregMaxD, borderColor: '#27AE60', borderWidth: 1, pointRadius: 0, fill: '-1', backgroundColor: 'rgba(39,174,96,0.12)' }
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
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { font: { family: 'Helvetica Neue', size: 9 } } } }, scales: { x: { grid: { color: '#E5E4DE' }, ticks: { font: { family: 'Helvetica Neue', size: 8 }, color: '#9A9A94', maxTicksLimit: 12 } }, y: { grid: { color: '#E5E4DE' }, ticks: { font: { family: 'Georgia', size: 11 }, color: '#0A0A09' } } } }
          }); } catch(e){}
        }, 150);

        // Weight outside range warning
        if (S.weight && S.prePregnancyWeight && pregWg) {
          var aGain = S.weight - S.prePregnancyWeight;
          if (aGain < pregWg.currentExpectedGainMin || aGain > pregWg.currentExpectedGainMax) {
            var aboveBelow = aGain > pregWg.currentExpectedGainMax ? 'au-dessus' : 'en dessous';
            var pregWeightWarn = h('div', {style: 'border-left:3px solid #E67E22;padding:12px 16px;background:var(--orangebg);margin:12px 0'});
            pregWeightWarn.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#E67E22'}, '\u26A0 Votre poids est ' + aboveBelow + ' de la fourchette recommand\u00e9e. Consultez votre m\u00e9decin.'));
            p.appendChild(pregWeightWarn);
          }
        }
      }

      // Medical disclaimer
      var pregDisclaimer = h('div', {style: 'border-left:3px solid #C0392B;padding:12px 16px;background:rgba(192,57,43,0.06);margin:12px 0'});
      pregDisclaimer.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#C0392B'}, '\u26A0 Ce suivi ne remplace pas votre suivi m\u00e9dical. Consultez votre sage-femme ou gyn\u00e9cologue.'));
      p.appendChild(pregDisclaimer);
    }
  }

  // Cycle menstruel — Phase actuelle
  if (S.sex === 'femme' && S.cycleTracking) {
    var cycleInfo = window.getCurrentCyclePhase ? window.getCurrentCyclePhase() : null;
    if (cycleInfo) {
      var phaseColors = {menstruation: '#C0392B', follicular: '#E67E22', ovulation: '#27AE60', luteal: '#E67E22'};
      var phaseColor = phaseColors[cycleInfo.phase.id] || '#E67E22';
  
      p.appendChild(h('div', {'class': 'section-label'}, 'Cycle menstruel \u2014 Phase actuelle'));
      var cycCard = h('div', {style: 'border-left:3px solid ' + phaseColor + ';padding:16px;background:var(--ivory2);margin-bottom:16px'});
  
      cycCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:20px;margin-bottom:4px'}, cycleInfo.phase.icon + ' ' + cycleInfo.phase.name));
      cycCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey);margin-bottom:8px'}, 'Jour ' + cycleInfo.dayInCycle + '/' + S.cycleLength + ' du cycle'));
      cycCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);font-style:italic;margin-bottom:12px'}, cycleInfo.phase.desc));
  
      // Nutrition tips
      var tipsList = h('div', {style: 'border-left:2px solid #27AE60;padding:8px 12px;margin-bottom:10px'});
      tipsList.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#27AE60;margin-bottom:6px'}, 'Conseils nutrition'));
      (cycleInfo.phase.nutritionTips || []).forEach(function(tip) {
        tipsList.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);margin-bottom:3px;padding-left:8px'}, '\u2022 ' + tip));
      });
      cycCard.appendChild(tipsList);
  
      // Calorie adjustment note
      if (cycleInfo.phase.calorieAdjust !== 0) {
        var adjPct = Math.round(cycleInfo.phase.calorieAdjust * 100);
        var baseCal = Math.round(calcTDEE() * GOALS[S.goal].mult);
        var adjCal = tgt;
        var adjNote = h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:' + phaseColor + ';margin-top:8px;padding:6px 10px;background:rgba(0,0,0,0.03);border-radius:2px'});
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
    if (!S.weightHistory) S.weightHistory = [];
    var today = new Date().toISOString().split('T')[0];
    S.weightHistory.push({date: today, weight: v});
    // Cap to 52 entries (1 year of weekly weigh-ins) to limit localStorage size
    if (S.weightHistory.length > 52) S.weightHistory = S.weightHistory.slice(-52);
    S.weight = v;
    // Persist to localStorage
    try {
      var uid = (window.AUTH && window.AUTH.getUser()) ? window.AUTH.getUser().id : 'anon';
      localStorage.setItem('mtd_weight_history_' + uid, JSON.stringify(S.weightHistory));
    } catch(e) {}
    bb('weight_logged', {weight: v});
    if (window.GAMIFICATION && window.GAMIFICATION.unlockBadge) {
      window.GAMIFICATION.unlockBadge('first_weigh');
      if (S.weightHistory.length >= 10) window.GAMIFICATION.unlockBadge('weight_10');
      if (S.targetWeight && v <= S.targetWeight && GOALS[S.goal] && (GOALS[S.goal].key === 'cut' || GOALS[S.goal].key === 'shred')) window.GAMIFICATION.unlockBadge('weight_goal');
      if (S.weightHistory.length >= 2) {
        var first = S.weightHistory[0].weight;
        if (first - v >= 1) window.GAMIFICATION.unlockBadge('first_kg_lost');
        if (first - v >= 5) window.GAMIFICATION.unlockBadge('five_kg');
      }
    }
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
      alcInfo.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--orange)'}, 'Alcool : +' + totalAlcKcal + ' kcal/semaine soit +' + Math.round(totalAlcKcal / 7) + ' kcal/jour en moyenne'));
      p.appendChild(alcInfo);
    }
  }

  // Supplémentation recommandée
  if (window.TIPS) TIPS.renderTip(p, 'supplements');
  if (getSupplementRecommendations) {
    var suppRecs = getSupplementRecommendations() || [];
    if (suppRecs.length > 0) {
      p.appendChild(h('div', {'class': 'section-label'}, 'Suppl\u00e9mentation recommand\u00e9e'));

      // If user takes creatine, show special card first
      if (S.creatine) {
        var creatRec = null;
        for (var cri = 0; cri < suppRecs.length; cri++) {
          if (suppRecs[cri].id === 'creatine') { creatRec = suppRecs[cri]; break; }
        }
        if (creatRec) {
          var creatCard = h('div', {style: 'border-left:3px solid #27AE60;padding:14px 16px;background:var(--greenbg);margin-bottom:12px'});
          creatCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:16px;margin-bottom:4px'}, creatRec.icon + ' Cr\u00e9atine \u2014 Votre dose : ' + (S.creatineDose || '?') + 'g/jour'));
          if (S.creatineDose && creatRec.dosage && S.creatineDose !== creatRec.dosage.dose) {
            creatCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--orange);margin-bottom:4px'}, '\u26A0 Dose recommand\u00e9e : ' + creatRec.dosage.dose + 'g/jour (bas\u00e9 sur votre poids)'));
          }
          creatCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey)'}, creatRec.dosage.timing));
          p.appendChild(creatCard);
        }
      }

      // Show all relevant supplement recommendations
      suppRecs.forEach(function(rec) {
        if (S.creatine && rec.id === 'creatine') return; // already shown above
        var recCard = h('div', {style: 'border:1px solid var(--border);padding:14px 16px;background:var(--ivory2);margin-bottom:8px'});
        recCard.appendChild(h('div', {style: 'font-family:Georgia,serif;font-size:15px;margin-bottom:2px'}, rec.icon + ' ' + rec.name));
        recCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);margin-bottom:6px;font-style:italic'}, rec.desc));
        recCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);margin-bottom:2px'}, '\u25C6 Dosage : ' + rec.dosage.dose + ' ' + rec.dosage.unit));
        recCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey);margin-bottom:2px'}, '\u25C6 Timing : ' + rec.dosage.timing));
        if (rec.dosage.note) {
          recCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:var(--grey3,#9A9A94);margin-top:4px;font-style:italic'}, rec.dosage.note));
        }
        recCard.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:var(--grey3,#9A9A94);margin-top:4px'}, 'Source : ' + rec.evidence));

        // Highlight if user selected this supplement
        if (S.supplements.indexOf(rec.id) !== -1) {
          recCard.style.borderLeft = '3px solid #27AE60';
          recCard.style.background = 'var(--greenbg)';
        }
        p.appendChild(recCard);
      });

      // Medical disclaimer
      var disclaimerBox = h('div', {style: 'border-left:2px solid var(--orange);padding:12px 16px;background:var(--orangebg);margin:12px 0'});
      disclaimerBox.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--orange)'}, '\u26A0 Ces recommandations sont bas\u00e9es sur des \u00e9tudes scientifiques reconnues (ISSN, NIH, EFSA). Consultez votre m\u00e9decin avant toute suppl\u00e9mentation.'));
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

  // Scanner section
  if (window.SCANNER) {
    var scanSection = h('div', {style: 'margin:24px 0'});
    SCANNER.renderWidget(scanSection);
    p.appendChild(scanSection);
  }

  p.appendChild(h('button', {'class': 'btn-primary', onclick: function() { goStep(9); }}, 'Voir mon planning semaine'));
  p.appendChild(h('button', {'class': 'btn-back', onclick: function() { goStep(7); }, html: backArrowHtml() + 'Modifier mes pr\u00e9f\u00e9rences'}));
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

// ─── STEP 9: PLANNING ───
function renderStep9(p) {
  p.appendChild(h('div', {'class': 'eyebrow'}, 'Planning'));
  p.appendChild(h('h1', {html: 'Votre<br><em>semaine</em>'}));
  p.appendChild(h('p', {'class': 'subtitle'}, '7 jours \u00b7 4 repas/jour \u00b7 200 recettes halal du monde entier'));
  if (window.TIPS) TIPS.renderTip(p, 'planning');

  if (!S.weekPlan) S.weekPlan = generateWeek();

  // Day tabs
  var tabs = h('div', {'class': 'day-tabs'});
  DAY_NAMES.forEach(function(d, i) {
    tabs.appendChild(h('button', {'class': 'day-tab' + (S.selectedDay === i ? ' active' : ''), onclick: function() { S.selectedDay = i; window.render(); }}, 'J' + (i + 1) + ' ' + d));
  });
  p.appendChild(tabs);

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
    if (!r) return;
    dayTotal += r.k || 0;
    dayTotalP += r.p || 0;
    dayTotalG += r.g || 0;
    dayTotalL += r.l || 0;
    var card = h('div', {'class': 'meal-card', onclick: function(e) {
      if (e.target.closest && e.target.closest('.swap-btn')) return;
      S.modalRecipe = r;
      bb('recipe_view', {recipe: r.n});
      if (window.GAMIFICATION) {
        var rc = window.GAMIFICATION.incrementCounter('recipes_viewed');
        if (rc >= 10) window.GAMIFICATION.unlockBadge('recipes_10');
        if (rc >= 50) window.GAMIFICATION.unlockBadge('recipes_50');
      }
      window.render();
    }});
    card.appendChild(h('div', {'class': 'meal-type'}, sl.label));
    card.appendChild(h('div', {'class': 'meal-name'}, [h('span', {'class': 'meal-flag'}, r.f), txt(r.n)]));
    card.appendChild(h('div', {'class': 'meal-kcal'}, r.k + ' kcal'));
    var mc = h('div', {'class': 'meal-macros'});
    mc.appendChild(h('span', {}, 'G ' + r.g + 'g'));
    mc.appendChild(h('span', {}, 'P ' + r.p + 'g'));
    mc.appendChild(h('span', {}, 'L ' + r.l + 'g'));
    card.appendChild(mc);
    var stars = '';
    for (var s = 0; s < r.lv; s++) stars += '\u2605';
    for (var s2 = r.lv; s2 < 4; s2++) stars += '\u2606';
    card.appendChild(h('div', {'class': 'meal-level'}, stars));
    card.appendChild(h('div', {'class': 'swap-btn', onclick: function(e) {
      e.stopPropagation();
      swapMeal(S.selectedDay, sl.key);
      bb('meal_swap', {day: S.selectedDay, slot: sl.key});
      if (window.GAMIFICATION) {
        var sc = window.GAMIFICATION.incrementCounter('swaps');
        if (sc >= 20) window.GAMIFICATION.unlockBadge('swap_master');
      }
    }}, '\u21bb'));
    p.appendChild(card);
  });

  // Day total
  var diff = dayTotal - tgtCal, diffPct = tgtCal > 0 ? Math.abs(diff / tgtCal * 100) : 0, isOk = diffPct < 5;
  var total = h('div', {'class': 'day-total'});
  total.appendChild(h('div', {'class': 'dt-label'}, window.t('onb.s9.total')));
  var vd = h('div', {style: 'display:flex;align-items:center;gap:12px'});
  vd.appendChild(h('span', {'class': 'dt-val'}, dayTotal + ' kcal'));

  // Add macro breakdown
  var macroInfo = h('div', {style: 'display:flex;gap:12px;font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;color:var(--grey)'});
  macroInfo.appendChild(h('span', {}, 'G ' + dayTotalG + 'g'));
  macroInfo.appendChild(h('span', {}, 'P ' + dayTotalP + 'g'));
  macroInfo.appendChild(h('span', {}, 'L ' + dayTotalL + 'g'));
  vd.appendChild(macroInfo);

  vd.appendChild(h('span', {'class': 'dt-diff', style: 'color:' + (isOk ? '#1A4A1A' : '#6A4A1A')}, (diff >= 0 ? '+' : '') + diff + ' kcal ' + (isOk ? '\u2713' : '\u26a0')));
  total.appendChild(vd);
  p.appendChild(total);

  // Target macros comparison
  var targetMacros = calcMacros();
  var macroComparison = h('div', {style: 'display:flex;justify-content:space-between;padding:8px 16px;font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;color:var(--grey);border:1px solid var(--border);border-top:none;background:var(--ivory2)'});
  macroComparison.appendChild(h('span', {}, 'Objectif : G ' + targetMacros.g + 'g \u00b7 P ' + targetMacros.p + 'g \u00b7 L ' + targetMacros.l + 'g'));
  var totalMacroKcal = dayTotalP * 4 + dayTotalG * 4 + dayTotalL * 9;
  macroComparison.appendChild(h('span', {}, 'V\u00e9rif : ' + totalMacroKcal + ' kcal'));
  p.appendChild(macroComparison);

  // Whey tip
  if (S.whey) {
    var tip = h('div', {'class': 'whey-tip'});
    tip.appendChild(h('strong', {}, 'Conseil Whey \u2014 '));
    tip.appendChild(h('span', {}, 'Prends ta whey dans les 30 min apr\u00e8s l\'entra\u00eenement pour optimiser la synth\u00e8se prot\u00e9ique.'));
    p.appendChild(tip);
  }

  // Budget réel du plan semaine
  if (window.RecipeEngine && window.RecipeEngine.calcWeekPlanBudget && S.weekPlan) {
    var budget = window.RecipeEngine.calcWeekPlanBudget(S.weekPlan);
    if (budget.totalMAD > 0) {
      var budgetBlock = h('div', { style: 'margin:16px 0;padding:14px 16px;background:var(--card);border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.08)' });
      budgetBlock.appendChild(h('div', { style: 'font-weight:700;font-size:14px;margin-bottom:10px;color:var(--text)' }, '💰 Budget courses estimé'));
      var budgetGrid = h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:8px' });
      budgetGrid.appendChild(h('div', { style: 'background:var(--bg);border-radius:8px;padding:10px;text-align:center' },
        h('div', { style: 'font-size:11px;color:var(--text-secondary);margin-bottom:4px' }, 'Budget / jour'),
        h('div', { style: 'font-size:20px;font-weight:700;color:var(--accent)' }, budget.avgDailyMAD + ' ' + 'DH')
      ));
      budgetGrid.appendChild(h('div', { style: 'background:var(--bg);border-radius:8px;padding:10px;text-align:center' },
        h('div', { style: 'font-size:11px;color:var(--text-secondary);margin-bottom:4px' }, 'Budget / semaine'),
        h('div', { style: 'font-size:20px;font-weight:700;color:var(--accent)' }, budget.weeklyMAD + ' ' + 'DH')
      ));
      budgetBlock.appendChild(budgetGrid);
      if (budget.coveragePct < 100) {
        budgetBlock.appendChild(h('div', { style: 'font-size:11px;color:var(--text-secondary);margin-top:8px' },
          '* Estimation basée sur ' + budget.coveragePct + '% des repas (recettes avec prix disponibles)'
        ));
      }
      // Insère après le plan semaine
      p.appendChild(budgetBlock);
    }
  }

  // Bouton liste de courses améliorée — affiche le nombre d'articles en temps réel
  var _shopList = (window.RecipeEngine && S.weekPlan) ? window.RecipeEngine.generateShoppingList(S.weekPlan) : [];
  var _shopTotal = _shopList.reduce(function(n, cat) { return n + cat.items.length; }, 0);
  var _shopLabel = '\uD83D\uDECD ' + window.t('shop.title') + (_shopTotal > 0 ? ' (' + _shopTotal + ' articles)' : '');
  var btnShop = h('button', {
    style: 'width:100%;padding:12px;margin:8px 0;background:var(--card);border:1.5px solid var(--border);border-radius:12px;font-size:14px;font-weight:600;color:var(--text);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px',
    onclick: function() { window.S.shopListOpen = true; if(window.render) window.render(); }
  }, _shopLabel);
  p.appendChild(btnShop);

  // Salad bar button
  p.appendChild(h('button', {
    'class': 'regen-btn',
    style: 'margin-top:8px;background:var(--green,#1A4A1A);color:var(--ivory,#FAFAF7)',
    onclick: function() { window.S.saladBar.open = true; if(window.render) window.render(); }
  }, '\uD83E\uDD57 Composer une salade'));

  // Export PDF
  p.appendChild(h('button', {'class': 'btn-primary', style: 'margin-top:16px;background:var(--black2)', onclick: function() { window.exportDayPDF(S.selectedDay); }}, '\u21e9 Exporter le jour en PDF'));
  p.appendChild(h('div', {style: 'height:8px'}));
  p.appendChild(h('button', {'class': 'regen-btn', onclick: function() {
    S.weekPlan = generateWeek();
    bb('week_regenerated', {});
    window.render();
  }}, '\u21bb ' + window.t('onb.s9.generate')));
  p.appendChild(h('div', {style: 'height:12px'}));
  p.appendChild(h('button', {'class': 'btn-secondary', onclick: function() { goStep(8); }}, '\u2190 Retour aux r\u00e9sultats'));
}

// ─── MODAL ───
function renderModal(app) {
  // Attach to #app root (not the fade-in container) — position:fixed breaks when parent has CSS transform
  var root = document.getElementById('app') || app;
  var ov = h('div', {'class': 'modal-overlay' + (S.modalRecipe ? ' open' : ''), onclick: function(e) {
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
    if (r._scaledIngredients && r._scaledIngredients.length > 0) {
      r._scaledIngredients.forEach(function(ing) {
        var qtyStr = roundDisplayQty(ing.qty, ing.unit) + (ing.unit === 'pce' ? ' pce ' : ing.unit === 'ml' ? 'ml ' : 'g ') + ing.name;
        ingredList.appendChild(h('li', {}, qtyStr));
      });
    } else if (r.i) {
      // Bug 4: filter empty tokens from split
      r.i.split(',').forEach(function(ing) { if (ing.trim()) ingredList.appendChild(h('li', {}, ing.trim())); });
    } else if (r.ingredients && Array.isArray(r.ingredients)) {
      r.ingredients.forEach(function(ing) {
        var line = (ing.qty ? roundDisplayQty(ing.qty, ing.unit) : '') + (ing.unit && ing.unit !== 'pce' ? ing.unit + ' ' : ' ') + (ing.name || '');
        ingredList.appendChild(h('li', {}, line.trim()));
      });
    } else {
      ingredList.appendChild(h('li', {style: 'color:var(--grey);font-style:italic'}, 'Ingr\u00e9dients non disponibles.'));
    }
    body.appendChild(ingredList);
    body.appendChild(h('div', {'class': 'section-label'}, 'Pr\u00e9paration'));
    var sl = h('ol', {'class': 'step-list'});
    // Bug 1: r.st may be undefined on legacy recipes — also try r.steps
    var steps = Array.isArray(r.st) ? r.st : (r.steps && Array.isArray(r.steps) ? r.steps : []);
    if (steps.length === 0) {
      sl.appendChild(h('li', {style: 'color:var(--grey);font-style:italic'}, 'Voir la recette compl\u00e8te dans le livre de recettes.'));
    } else {
      steps.forEach(function(s) { sl.appendChild(h('li', {}, s || '')); });
    }
    body.appendChild(sl);
    // Bug 3: use local vars instead of r.p/r.g/r.l/r.k to avoid NaN
    var chk = prot * 4 + carbs * 4 + fats * 9;
    body.appendChild(h('div', {'class': 'macro-check'}, 'V\u00e9rification : P\u00d74 + G\u00d74 + L\u00d79 = ' + chk + ' kcal (affich\u00e9 : ' + kcal + ' kcal)'));
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
  doc.text('MTD MACRO CALCULATOR', M, 14);
  doc.setFontSize(16); doc.setFont('times', 'italic');
  doc.text(DAY_NAMES[dayIdx] + ' \u2014 Plan du jour', M, 26);
  doc.setFontSize(7); doc.setFont('helvetica', 'normal');
  var tgt = calcTarget(), mc = calcMacros();
  doc.text(tgt + ' kcal  |  G ' + mc.g + 'g  |  P ' + mc.p + 'g  |  L ' + mc.l + 'g', M, 33);
  y = 46;

  // Meals
  if (!S.weekPlan || !S.weekPlan[dayIdx]) { alert('Aucun plan disponible pour ce jour.'); return; }
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
  if (S.medical.length > 0) {
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
    doc.text('MTD Macro Calculator \u2014 g\u00e9n\u00e9r\u00e9 le ' + new Date().toLocaleDateString('fr-FR'), M, 290);
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
  doc.text('MTD MACRO CALCULATOR', M, 12);
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
  doc.text('MTD Macro Calculator', M, 290);
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

// ─── SALAD BAR ───
var SALAD_DB = {
  bases: [
    { name: 'Riz brun', qty: 100, unit: 'g', k: 111, p: 2.6, g: 23, l: 0.9 },
    { name: 'Quinoa', qty: 100, unit: 'g', k: 120, p: 4.4, g: 21, l: 1.9 },
    { name: 'P\u00e2tes compl\u00e8tes', qty: 100, unit: 'g', k: 157, p: 5.8, g: 30, l: 1.0 },
    { name: 'Couscous', qty: 100, unit: 'g', k: 112, p: 3.8, g: 23, l: 0.2 },
    { name: 'Lentilles', qty: 100, unit: 'g', k: 116, p: 9.0, g: 20, l: 0.4 },
    { name: 'Pois chiches', qty: 100, unit: 'g', k: 164, p: 8.9, g: 27, l: 2.6 },
    { name: 'Patate douce', qty: 100, unit: 'g', k: 86, p: 1.6, g: 20, l: 0.1 },
    { name: 'Boulgour', qty: 100, unit: 'g', k: 83, p: 3.1, g: 18, l: 0.2 }
  ],
  proteins: [
    { name: 'Poulet grill\u00e9', qty: 100, unit: 'g', k: 165, p: 31, g: 0, l: 3.6 },
    { name: 'Thon en bo\u00eete', qty: 100, unit: 'g', k: 132, p: 28, g: 0, l: 1.5 },
    { name: 'Saumon', qty: 100, unit: 'g', k: 208, p: 20, g: 0, l: 13 },
    { name: 'Crevettes', qty: 100, unit: 'g', k: 85, p: 18, g: 0, l: 0.9 },
    { name: 'Œuf dur', qty: 60, unit: 'g', k: 91, p: 7.5, g: 0.4, l: 6.3 },
    { name: 'Tofu ferme', qty: 100, unit: 'g', k: 76, p: 8.0, g: 1.9, l: 4.2 },
    { name: 'B\u0153uf hach\u00e9 5%', qty: 100, unit: 'g', k: 137, p: 22, g: 0, l: 5.0 },
    { name: 'Feta', qty: 50, unit: 'g', k: 133, p: 7.2, g: 1.1, l: 10.7 },
    { name: 'Mozzarella', qty: 60, unit: 'g', k: 133, p: 9.0, g: 1.5, l: 10 },
    { name: 'Saumon fum\u00e9', qty: 60, unit: 'g', k: 104, p: 11, g: 0, l: 6.5 }
  ],
  veggies: [
    { name: 'Tomates', qty: 100, unit: 'g', k: 18, p: 0.9, g: 3.9, l: 0.2 },
    { name: 'Concombre', qty: 100, unit: 'g', k: 15, p: 0.7, g: 3.6, l: 0.1 },
    { name: '\u00c9pinards', qty: 80, unit: 'g', k: 18, p: 2.3, g: 2.9, l: 0.3 },
    { name: 'Roquette', qty: 50, unit: 'g', k: 13, p: 1.3, g: 2.0, l: 0.4 },
    { name: 'Carottes', qty: 80, unit: 'g', k: 33, p: 0.7, g: 7.7, l: 0.1 },
    { name: 'Poivron rouge', qty: 80, unit: 'g', k: 25, p: 0.8, g: 5.9, l: 0.2 },
    { name: 'Champignons', qty: 80, unit: 'g', k: 18, p: 1.8, g: 3.3, l: 0.1 },
    { name: 'Ma\u00efs', qty: 60, unit: 'g', k: 70, p: 2.1, g: 15, l: 0.6 },
    { name: 'Haricots verts', qty: 80, unit: 'g', k: 22, p: 1.8, g: 5.0, l: 0.1 },
    { name: 'Oignons rouges', qty: 40, unit: 'g', k: 17, p: 0.5, g: 3.9, l: 0.1 }
  ],
  fats: [
    { name: 'Avocat', qty: 60, unit: 'g', k: 96, p: 1.2, g: 5.1, l: 8.8 },
    { name: 'Huile d\'olive', qty: 10, unit: 'ml', k: 88, p: 0, g: 0, l: 10 },
    { name: 'Amandes', qty: 20, unit: 'g', k: 116, p: 4.2, g: 4.4, l: 10 },
    { name: 'Noix', qty: 20, unit: 'g', k: 131, p: 3.0, g: 2.8, l: 13 },
    { name: 'Graines de chia', qty: 15, unit: 'g', k: 73, p: 2.5, g: 6.2, l: 4.6 },
    { name: 'Olives', qty: 30, unit: 'g', k: 41, p: 0.3, g: 2.2, l: 3.8 },
    { name: 'Tahini', qty: 15, unit: 'g', k: 89, p: 2.5, g: 3.2, l: 8.1 },
    { name: 'Graines de s\u00e9same', qty: 10, unit: 'g', k: 57, p: 1.8, g: 2.3, l: 4.9 }
  ],
  sauces: [
    { name: 'Vinaigrette l\u00e9g\u00e8re', qty: 15, unit: 'ml', k: 45, p: 0, g: 2.0, l: 4.0 },
    { name: 'Jus de citron', qty: 20, unit: 'ml', k: 5, p: 0.1, g: 1.3, l: 0.0 },
    { name: 'Sauce yaourt', qty: 30, unit: 'ml', k: 25, p: 1.5, g: 2.5, l: 0.5 },
    { name: 'Sauce tahini citronn\u00e9e', qty: 20, unit: 'g', k: 60, p: 1.8, g: 3.0, l: 5.0 },
    { name: 'Sauce soja', qty: 10, unit: 'ml', k: 6, p: 0.7, g: 0.9, l: 0.0 },
    { name: 'Pesto', qty: 15, unit: 'g', k: 72, p: 1.5, g: 1.5, l: 7.0 }
  ]
};

function calcSaladMacros(sb) {
  var total = { k: 0, p: 0, g: 0, l: 0 };
  if (sb.base) { total.k += sb.base.k; total.p += sb.base.p; total.g += sb.base.g; total.l += sb.base.l; }
  (sb.proteins || []).forEach(function(x) { total.k += x.k; total.p += x.p; total.g += x.g; total.l += x.l; });
  (sb.veggies || []).forEach(function(x) { total.k += x.k; total.p += x.p; total.g += x.g; total.l += x.l; });
  (sb.fats || []).forEach(function(x) { total.k += x.k; total.p += x.p; total.g += x.g; total.l += x.l; });
  if (sb.sauce) { total.k += sb.sauce.k; total.p += sb.sauce.p; total.g += sb.sauce.g; total.l += sb.sauce.l; }
  return { k: Math.round(total.k), p: Math.round(total.p), g: Math.round(total.g), l: Math.round(total.l) };
}

function renderSaladBar(p) {
  var S = window.S;
  var sb = S.saladBar;
  p.innerHTML = '';

  // Macro targets
  var tgtMacros = { k: 600, p: 40, g: 65, l: 20 };
  if (window.calcMacros && window.calcTarget) {
    var dm = window.calcMacros(), dk = window.calcTarget();
    if (dk > 0) {
      tgtMacros.k = Math.round(dk * 0.35);
      tgtMacros.p = Math.round(dm.p * 0.35);
      tgtMacros.g = Math.round(dm.g * 0.35);
      tgtMacros.l = Math.round(dm.l * 0.35);
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
  header.appendChild(h('div', { style: 'font-size:18px;font-weight:700;color:var(--text)' }, '\uD83E\uDD57 Bar \u00e0 Salade'));

  // Meal target toggle
  var toggleWrap = h('div', { style: 'display:flex;gap:4px' });
  ['lunch', 'dinner'].forEach(function(slot) {
    var label = slot === 'lunch' ? 'D\u00e9j' : 'D\u00eener';
    toggleWrap.appendChild(h('button', {
      style: 'padding:4px 10px;border-radius:20px;border:1.5px solid ' + (sb.mealTarget === slot ? barColor : 'var(--border)') + ';background:' + (sb.mealTarget === slot ? barColor : 'transparent') + ';color:' + (sb.mealTarget === slot ? '#fff' : 'var(--text)') + ';font-size:12px;cursor:pointer;font-weight:600',
      onclick: function() { sb.mealTarget = slot; window.render(); }
    }, label));
  });
  header.appendChild(toggleWrap);
  p.appendChild(header);

  // ── Macro progress bar (sticky) ──
  var progressBar = h('div', { style: 'position:sticky;top:0;z-index:10;background:var(--bg);padding:10px 16px;border-bottom:1px solid var(--border);box-shadow:0 2px 8px rgba(0,0,0,0.06)' });
  var kcalRow = h('div', { style: 'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px' });
  kcalRow.appendChild(h('span', { style: 'font-size:13px;font-weight:700;color:' + barColor }, macros.k + ' / ' + tgtMacros.k + ' kcal'));
  kcalRow.appendChild(h('span', { style: 'font-size:11px;color:var(--grey)' }, Math.round(pct * 100) + '%'));
  progressBar.appendChild(kcalRow);

  var barTrack = h('div', { style: 'height:8px;background:var(--border);border-radius:4px;overflow:hidden;margin-bottom:8px' });
  barTrack.appendChild(h('div', { style: 'height:100%;width:' + Math.min(pct * 100, 100) + '%;background:' + barColor + ';border-radius:4px;transition:width 0.3s' }));
  progressBar.appendChild(barTrack);

  var chipsRow = h('div', { style: 'display:flex;gap:8px' });
  [
    { label: 'P', cur: macros.p, tgt: tgtMacros.p, cssClass: 'macro-fill-protein' },
    { label: 'G', cur: macros.g, tgt: tgtMacros.g, cssClass: 'macro-fill-carbs' },
    { label: 'L', cur: macros.l, tgt: tgtMacros.l, cssClass: 'macro-fill-fat' }
  ].forEach(function(m) {
    chipsRow.appendChild(h('div', { style: 'flex:1;background:var(--card);border-radius:8px;padding:4px 8px;text-align:center;border:1px solid var(--border)' },
      h('div', { style: 'font-size:9px;color:var(--grey);text-transform:uppercase;letter-spacing:1px' }, m.label),
      h('div', { style: 'font-size:12px;font-weight:700;color:' + (m.cssClass === 'macro-fill-protein' ? 'var(--green)' : m.cssClass === 'macro-fill-carbs' ? 'var(--blue, #6A9ADA)' : 'var(--orange)') }, m.cur + '<span style="font-weight:400;color:var(--grey)">/' + m.tgt + 'g</span>')
    ));
  });
  progressBar.appendChild(chipsRow);
  p.appendChild(progressBar);

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
      var chipStyle = 'padding:5px 10px;border-radius:20px;border:1.5px solid ' +
        (isSel ? 'var(--green,#1A4A1A)' : 'var(--border)') +
        ';background:' + (isSel ? 'var(--greenbg,rgba(26,74,26,.06))' : 'var(--card)') +
        ';color:var(--text);font-size:12px;cursor:' + (canAdd ? 'pointer' : 'not-allowed') +
        ';font-weight:' + (isSel ? '700' : '400') +
        ';opacity:' + (canAdd ? '1' : '0.45') + ';transition:all 0.2s';
      grid.appendChild(h('button', {
        style: chipStyle,
        onclick: function() { if (canAdd || isSel) onToggle(item); }
      }, item.name));
    });
    sec.appendChild(grid);

    // Qty controls for selected items
    var selList = isRadio ? (selectedItems ? [selectedItems] : []) : selectedItems;
    if (selList.length > 0) {
      var qtyWrap = h('div', { style: 'margin-top:8px;display:flex;flex-direction:column;gap:4px' });
      selList.forEach(function(sel, idx) {
        var qRow = h('div', { style: 'display:flex;align-items:center;justify-content:space-between;background:var(--card);border-radius:8px;padding:4px 10px;border:1px solid var(--border)' });
        qRow.appendChild(h('span', { style: 'font-size:12px;font-weight:600;color:var(--text)' }, sel.name));
        var qCtrl = h('div', { style: 'display:flex;align-items:center;gap:6px' });
        var step = sel.unit === 'ml' ? 10 : 25;
        qCtrl.appendChild(h('button', {
          style: 'width:24px;height:24px;border-radius:50%;border:1px solid var(--border);background:var(--bg);font-size:14px;cursor:pointer;color:var(--text);display:flex;align-items:center;justify-content:center',
          onclick: function() { onQty(sel, -step); }
        }, '\u2212'));
        qCtrl.appendChild(h('span', { style: 'font-size:12px;min-width:50px;text-align:center;color:var(--text)' }, sel.qty + sel.unit));
        qCtrl.appendChild(h('button', {
          style: 'width:24px;height:24px;border-radius:50%;border:1px solid var(--border);background:var(--bg);font-size:14px;cursor:pointer;color:var(--text);display:flex;align-items:center;justify-content:center',
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
    var ratio = item.qty / dbItem.qty;
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
    var ratio = newQty / (dbItem ? dbItem.qty : item.qty);
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
    'Base glucidique', '\uD83C\uDF3E',
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
    'Prot\u00e9ines', '\uD83C\uDFCB\uFE0F',
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
    'L\u00e9gumes', '\uD83E\uDD6C',
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
    'Lipides', '\uD83E\uDD51',
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
    'Sauce', '\uD83E\uDD63',
    SALAD_DB.sauces, sb.sauce, true, 1,
    function(item) {
      if (sb.sauce && sb.sauce.name === item.name) { sb.sauce = null; }
      else { sb.sauce = cloneItem(item); }
      window.render();
    },
    function(sel, delta) { adjustQty(sel, delta); }
  ));

  // ── Recap + Actions ──
  var recap = h('div', { style: 'padding:16px;background:var(--card);margin:8px 16px;border-radius:12px;border:1px solid var(--border)' });
  recap.appendChild(h('div', { style: 'font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-bottom:10px' }, '\uD83D\uDCCB R\u00e9capitulatif'));

  var allItems = [];
  if (sb.base) allItems.push(sb.base);
  sb.proteins.forEach(function(x) { allItems.push(x); });
  sb.veggies.forEach(function(x) { allItems.push(x); });
  sb.fats.forEach(function(x) { allItems.push(x); });
  if (sb.sauce) allItems.push(sb.sauce);

  if (allItems.length === 0) {
    recap.appendChild(h('div', { style: 'color:var(--grey);font-size:13px;text-align:center;padding:12px' }, 'S\u00e9lectionne des ingr\u00e9dients pour composer ta salade'));
  } else {
    allItems.forEach(function(item) {
      var m = computeItemMacros(item);
      var row = h('div', { style: 'display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border)' });
      row.appendChild(h('span', { style: 'font-size:12px;color:var(--text)' }, item.name + ' ' + item.qty + item.unit));
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
    style: 'width:100%;padding:14px;min-height:44px;border:none;background:var(--black,#0A0A09);color:var(--ivory,#FAFAF7);font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;cursor:' + (allItems.length > 0 ? 'pointer' : 'not-allowed') + ';opacity:' + (allItems.length > 0 ? '1' : '0.5'),
    onclick: function() {
      if (allItems.length === 0) return;
      var slot = sb.mealTarget;
      var saladIngredients = allItems.map(function(x) { return x.name + ' ' + x.qty + x.unit; }).join(', ');
      var saladRecipe = {
        _id: 'SALAD_' + Date.now(),
        n: 'Ma Salade Perso \uD83E\uDD57',
        k: macros.k, p: macros.p, g: macros.g, l: macros.l,
        f: '\uD83E\uDD57',
        lv: 1,
        i: saladIngredients,
        _scaledIngredients: allItems.slice(),
        _scalingRatio: 1,
        tags: ['salade', 'custom'],
        st: ['Pr\u00e9parer tous les ingr\u00e9dients.', 'Assembler la salade dans un bol.', 'Assaisonner et servir.']
      };
      if (!S.weekPlan) S.weekPlan = [];
      if (!S.weekPlan[S.selectedDay]) S.weekPlan[S.selectedDay] = {};
      S.weekPlan[S.selectedDay][slot] = saladRecipe;
      S.saladBar.open = false;
      window.render();
    }
  }, '\uD83D\uDCBE Ajouter au plan (' + (sb.mealTarget === 'lunch' ? 'D\u00e9jeuner' : 'D\u00eener') + ')');
  actWrap.appendChild(btnAdd);

  actWrap.appendChild(h('button', {
    style: 'width:100%;padding:12px;border-radius:12px;border:1.5px solid var(--border);background:var(--card);color:var(--text);font-size:14px;font-weight:600;cursor:pointer',
    onclick: function() {
      sb.base = null; sb.proteins = []; sb.veggies = []; sb.fats = []; sb.sauce = null;
      window.render();
    }
  }, '\uD83D\uDD04 R\u00e9initialiser'));

  p.appendChild(actWrap);
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
    style:'font-size:20px;font-weight:700;color:var(--text);margin-bottom:4px' + (arMode ? ';direction:rtl;text-align:right;font-family:"Segoe UI",Arial,Tahoma,sans-serif' : ''),
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

  var list = window.RecipeEngine.generateShoppingList(s.weekPlan) || [];
  if (!s.shopChecked) s.shopChecked = {};
  cleanShopChecked(list);

  if (!list.length) {
    p.appendChild(h('div', {style:'padding:20px;text-align:center;color:var(--text-secondary)'}, arUI('no_items', 'Aucun ingrédient détecté dans le plan.')));
    return;
  }

  // ── Boutons actions ──
  var actions = h('div', {style:'display:flex;gap:10px;padding:0 16px 12px;flex-wrap:wrap', 'class':'shop-print-hide'});

  var btnPDF = h('button', {
    style:'flex:1;padding:10px 14px;background:var(--black);color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;min-width:140px',
    onclick: function() { exportShoppingListPDF(list, s.shopChecked); }
  }, arMode ? (AR ? AR.ui['download_pdf'] : '📄 PDF') : '\uD83D\uDCC4 ' + window.t('shop.export'));

  var btnReset = h('button', {
    style:'padding:10px 14px;background:var(--card);color:var(--text);border:1px solid var(--border);border-radius:10px;font-size:13px;cursor:pointer',
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
    style:'margin:0 16px 12px;padding:10px 14px;border:1px solid var(--border);font-size:10px;letter-spacing:' + (arMode ? '0' : '1px') + ';color:var(--grey)' + (arMode ? ';direction:rtl;text-align:right;font-family:"Segoe UI",Arial,Tahoma,sans-serif' : ';font-family:"Helvetica Neue",Arial,sans-serif'),
    'class':'shop-print-hide'
  }, infoBarText);
  p.appendChild(infoBar);

  // ── Liste par catégorie (affichage interactif) ──
  var shopContainer = h('div', {
    'class': arMode ? 'shop-ar' : '',
    style: arMode ? 'direction:rtl' : ''
  });

  list.forEach(function(cat) {
    var catBlock = h('div', {style:'margin:0 16px 14px;background:var(--card);border-radius:12px;overflow:hidden'});

    var catChecked = cat.items.filter(function(item){return s.shopChecked[item.name];}).length;
    var catHeaderStyle = 'padding:12px 16px 10px;background:var(--ivory2,#F4F4F0);border-bottom:1px solid var(--border);font-size:10px;text-transform:uppercase;color:var(--black,#0A0A09);display:flex;justify-content:space-between;align-items:center;' +
      (arMode ? 'direction:rtl;text-align:right;font-family:"Segoe UI",Arial,Tahoma,sans-serif;letter-spacing:0' : 'font-family:"Helvetica Neue",Arial,sans-serif;letter-spacing:2px');

    catBlock.appendChild(h('div', {style: catHeaderStyle, 'class':'shop-cat-header'},
      h('span', {}, arSection(cat.category)),
      h('span', {style:'font-weight:400;color:var(--text-secondary);font-size:12px'}, catChecked + '/' + cat.items.length)
    ));

    cat.items.forEach(function(item) {
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
      var cbStyle = 'width:20px;height:20px;border-radius:5px;border:2px solid ' + (isChecked ? 'var(--accent)' : 'var(--border)') +
        ';flex-shrink:0;display:flex;align-items:center;justify-content:center;background:' + (isChecked ? 'var(--accent)' : 'transparent') +
        (arMode ? ';margin-left:12px;margin-right:0' : ';margin-right:12px');
      var cb = h('div', {style: cbStyle, 'class':'shop-cb'});
      if (isChecked) cb.appendChild(h('span', {style:'color:#fff;font-size:12px;font-weight:700'}, '✓'));

      var labelStyle = 'flex:1' + (arMode ? ';text-align:right;font-family:"Segoe UI",Arial,Tahoma,sans-serif' : '');
      var label = h('div', {style: labelStyle, 'class':'shop-item-label'});

      var displayName = arIngredient(item.name);
      var nameStyle = 'font-size:14px;color:var(--text);' +
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

  // Ouvrir une fenêtre d'impression dédiée
  var printWin = window.open('', '_blank', 'width=700,height=900');
  if (!printWin) { window.print(); return; }
  printWin.document.write('<!DOCTYPE html><html lang="ar" dir="rtl"><head>');
  printWin.document.write('<meta charset="UTF-8">');
  printWin.document.write('<title>' + (AR ? AR.ui['print_title'] : 'قائمة التسوق') + '</title>');
  printWin.document.write('<style>');
  printWin.document.write('body{font-family:"Segoe UI",Arial,Tahoma,sans-serif;direction:rtl;text-align:right;padding:20px;color:#000;background:#fff;}');
  printWin.document.write('.shop-print-title{font-size:22px;font-weight:700;margin-bottom:4px;}');
  printWin.document.write('.shop-print-date{font-size:12px;color:#666;margin-bottom:16px;}');
  printWin.document.write('.shop-cat-block{margin-bottom:12px;page-break-inside:avoid;}');
  printWin.document.write('.shop-cat-name{font-size:13px;font-weight:700;background:#f0f0f0;padding:6px 10px;border-radius:4px;margin-bottom:4px;}');
  printWin.document.write('.shop-print-item{display:flex;justify-content:space-between;padding:3px 10px;font-size:12px;border-bottom:1px solid #eee;}');
  printWin.document.write('@media print{body{padding:10px;}}');
  printWin.document.write('</style></head><body>');
  printWin.document.write(html);
  printWin.document.write('</body></html>');
  printWin.document.close();
  printWin.focus();
  setTimeout(function() { printWin.print(); }, 400);
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

// ─── PUBLIC API ───
window.NUTRITION = {
  render: function(p) {
    // Header with step indicator and progress bar
    if (S.nStep >= 1 && S.nStep <= 9) {
      var hdr = h('header', {'class': 'header'});
      hdr.appendChild(h('div', {'class': 'logo', html: 'MTD<span>Nutrition & Sport</span>'}));
      hdr.appendChild(h('div', {'class': 'step-indicator'}, window.t('onb.step') + ' ' + S.nStep + ' ' + window.t('onb.of') + ' 9'));
      p.appendChild(hdr);
      var pb = h('div', {'class': 'progress-bar'});
      pb.appendChild(h('div', {'class': 'progress-fill', style: 'width:' + ((S.nStep - 1) / 8 * 100) + '%'}));
      p.appendChild(pb);
    }
    var content = h('div', {'class': 'fade-in'});
    if (S.shopListOpen) { renderShoppingList(content); p.appendChild(content); return; }
    if (S.saladBar && S.saladBar.open) { renderSaladBar(content); p.appendChild(content); return; }
    if (S.nStep === 0) renderSplash(content);
    else if (S.nStep === 1) renderStep1(content);
    else if (S.nStep === 2) renderStep2(content);
    else if (S.nStep === 3) renderStep3(content);
    else if (S.nStep === 4) renderStep4(content);
    else if (S.nStep === 5) renderStep5(content);
    else if (S.nStep === 6) renderStep6(content);
    else if (S.nStep === 7) renderStep7(content);
    else if (S.nStep === 8) renderStep8(content);
    else if (S.nStep === 9) renderStep9(content);
    p.appendChild(content);
    renderModal(p);
  }
};

})();
