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
    p.appendChild(h('div', {style:'font-size:12px;color:var(--fg2,#888);margin-bottom:8px;line-height:1.4'}, 'S\u00e9lectionnez les parfums de whey que vous avez chez vous. Seules les recettes compatibles vous seront propos\u00e9es.'));
    var flavorGrid = h('div', {'class': 'chip-wrap', style: 'gap:8px;margin-top:4px'});
    wheyFlavors.forEach(function(f) {
      var selected = S.wheyFlavors.indexOf(f.id) !== -1;
      var btn = h('span', {
        'class': 'chip' + (selected ? ' on' : ''),
        style: selected
          ? 'border:2px solid var(--orange,#f07b29);background:var(--orangebg,#fff3e6);'
          : 'border:2px solid #ccc;',
        onclick: (function(fid) {
          return function() {
            var idx = S.wheyFlavors.indexOf(fid);
            if (idx !== -1) { S.wheyFlavors.splice(idx, 1); }
            else { S.wheyFlavors.push(fid); }
            window.render();
          };
        })(f.id)
      }, f.icon + '\u00a0' + f.label);
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
  var halalBox = h('div', {style: 'width:20px;height:20px;border-radius:4px;border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;background:' + (S.halal ? 'var(--accent)' : 'transparent') + ';flex-shrink:0'}, S.halal ? h('span', {style: 'color:#fff;font-size:12px;font-weight:700'}, '\u2713') : null);
  halalRow.appendChild(halalBox);
  halalRow.appendChild(h('div', {style: 'font-size:13px;font-weight:500'}, '\u262a\ufe0f Halal \u2014 exclure porc & alcool'));
  p.appendChild(halalRow);

  // Salade builder toggle
  var saladRow = h('div', {style: 'display:flex;align-items:center;gap:10px;margin:8px 0;cursor:pointer', onclick: function() { S.saladBuilder = !S.saladBuilder; window.render(); }});
  var saladBox = h('div', {style: 'width:20px;height:20px;border-radius:4px;border:2px solid var(--blue,#1A3C5E);display:flex;align-items:center;justify-content:center;background:' + (S.saladBuilder ? 'var(--blue,#1A3C5E)' : 'transparent') + ';flex-shrink:0'}, S.saladBuilder ? h('span', {style: 'color:#fff;font-size:12px;font-weight:700'}, '\u2713') : null);
  saladRow.appendChild(saladBox);
  saladRow.appendChild(h('div', {style: 'font-size:13px;font-weight:500;font-family:"Helvetica Neue",Arial,sans-serif'}, '\uD83E\uDD57 Salades \u00e0 composer'));
  p.appendChild(saladRow);
  if (S.saladBuilder) {
    p.appendChild(h('div', {style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#9A9A94);margin:4px 0 8px 30px;line-height:1.5'}, 'Vous pourrez composer vos salades directement dans votre plan de repas.'));
  }

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
      // Synchroniser _nm avant generateWeek() pour que les recettes R-format soient correctement scalées
      if (window.computeNutritionState) { window.computeNutritionState(false); }
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
  stats.appendChild(h('div', {'class': 'stat-cell'}, [h('div', {'class': 'stat-val'}, ppk), h('div', {'class': 'stat-label'}, 'g prot/kg')]));
  if (bmi !== null) {
    var bi = bmiInfo(bmi);
    var imcClass = bmi < 18.5 ? 'stat-warn' : bmi < 25 ? 'stat-good' : bmi < 30 ? 'stat-warn' : 'stat-alert';
    stats.appendChild(h('div', {'class': 'stat-cell ' + imcClass}, [h('div', {'class': 'stat-val', style: 'color:' + bi.color}, bmi.toFixed(1)), h('div', {'class': 'stat-label'}, window.t('onb.s2.bmi'))]));
  }
  p.appendChild(stats);

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

  p.appendChild(h('button', {'class': 'btn-primary', onclick: function() {
    // Badge profil complet : déclenché quand l'utilisateur voit ses résultats et passe au planning
    if (window.GAMIFICATION && window.GAMIFICATION.unlockBadge) window.GAMIFICATION.unlockBadge('profile_complete');
    goStep(9);
  }}, 'Voir mon planning semaine'));
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
  p.appendChild(h('p', {'class': 'subtitle'}, '7 jours \u00b7 ' + (S.mealsPerDay || 3) + ' repas/jour \u00b7 489 recettes'));
  if (window.TIPS) TIPS.renderTip(p, 'planning');

  if (!S._nm && window.computeNutritionState) window.computeNutritionState(false);
  if (!S.weekPlan) S.weekPlan = generateWeek();
  // Bounds check: selectedDay must be in [0, 6]
  if (typeof S.selectedDay !== 'number' || S.selectedDay < 0 || S.selectedDay > 6) S.selectedDay = 0;

  // Day tabs
  var tabs = h('div', {'class': 'day-tabs'});
  DAY_NAMES.forEach(function(d, i) {
    tabs.appendChild(h('button', {'class': 'day-tab' + (S.selectedDay === i ? ' active' : ''), onclick: function() { S.selectedDay = i; window.render(); }}, 'J' + (i + 1) + ' ' + d));
  });
  p.appendChild(tabs);

  // Quick action buttons — Salad bar & Smoothie bar
  var quickActions = h('div', {style: 'display:flex;gap:8px;margin:12px 0 4px'});
  quickActions.appendChild(h('button', {
    style: 'flex:1;padding:10px 8px;background:var(--green,#1A4A1A);color:var(--ivory,#FAFAF7);border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px',
    onclick: function() { if (!window.S.saladBar) window.S.saladBar = { open: false, base: null, proteins: [], veggies: [], fats: [], sauce: null, mealTarget: 'lunch' }; window.S.saladBar.open = true; if(window.render) window.render(); }
  }, [h('span', {style:'font-size:18px'}, '\uD83E\uDD57'), h('span', {}, 'Composer une salade')]));
  if (S.whey === true || S.whey === 1) {
    quickActions.appendChild(h('button', {
      style: 'flex:1;padding:10px 8px;background:#6B3FA0;color:#fff;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px',
      onclick: function() { window.S.smoothieBarOpen = true; if(window.render) window.render(); }
    }, [h('span', {style:'font-size:18px'}, '\uD83E\uDD64'), h('span', {}, 'Smoothies Whey')]));
  }
  p.appendChild(quickActions);

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
          style: 'border:1.5px dashed var(--border,#E5E4DE);border-radius:10px;padding:16px;margin-bottom:16px;text-align:center;cursor:pointer;color:var(--grey,#888)',
          onclick: function() { S._addMealModalSlot = slotKey; window.render(); }
        });
        emptyCard.appendChild(h('div', {style: 'font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;color:var(--grey,#888)'}, slotLabel));
        emptyCard.appendChild(h('div', {style: 'font-size:22px;margin-bottom:4px'}, '+'));
        emptyCard.appendChild(h('div', {style: 'font-size:12px'}, 'Ajouter un repas'));
        p.appendChild(emptyCard);

        if (S._addMealModalSlot === slotKey) {
          var overlay = h('div', {
            style: 'position:fixed;inset:0;background:rgba(10,10,9,0.45);z-index:9000;display:flex;align-items:flex-end;justify-content:center',
            onclick: function(e) {
              if (e.target === overlay) { S._addMealModalSlot = null; window.render(); }
            }
          });
          var sheet = h('div', {
            style: 'background:var(--card,#FFFFFF);border-radius:18px 18px 0 0;padding:24px 20px 32px;width:100%;max-width:480px;box-shadow:0 -4px 24px rgba(0,0,0,0.12)'
          });
          sheet.appendChild(h('div', {
            style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:15px;font-weight:700;color:var(--black,#0A0A09);margin-bottom:16px;text-align:center'
          }, 'Ajouter \u00e0 ' + slotLabel));
          var choiceRow = h('div', {style: 'display:flex;gap:12px'});
          choiceRow.appendChild(h('button', {
            style: 'flex:1;padding:14px 8px;background:var(--card,#FFFFFF);border:1.5px solid var(--border,#E5E4DE);border-radius:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;font-weight:600;color:var(--black,#0A0A09);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px',
            onclick: function(e) {
              e.stopPropagation();
              S._addMealModalSlot = null;
              S._recipePicker = { slotKey: slotKey, query: '' };
              window.render();
            }
          }, [h('span', {style: 'font-size:22px'}, '\uD83C\uDF7D'), h('span', {}, 'Choisir une recette')]));
          choiceRow.appendChild(h('button', {
            style: 'flex:1;padding:14px 8px;background:var(--card,#FFFFFF);border:1.5px solid var(--blue,#1A3C5E);border-radius:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;font-weight:600;color:var(--blue,#1A3C5E);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px',
            onclick: function(e) {
              e.stopPropagation();
              S._addMealModalSlot = null;
              window.render();
              if (window.openSaladComposer) window.openSaladComposer(slotKey);
            }
          }, [h('span', {style: 'font-size:22px'}, '\uD83E\uDD57'), h('span', {}, 'Composer une salade')]));
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
      S.modalRecipe = r;
      bb('recipe_view', {recipe: r.n});
      if (window.GAMIFICATION) {
        var rc = window.GAMIFICATION.incrementCounter('recipes_viewed');
        if (rc >= 10) window.GAMIFICATION.unlockBadge('recipes_10');
        if (rc >= 50) window.GAMIFICATION.unlockBadge('recipes_50');
      }
      window.render();
    }});
    // Badge nutrient-timing : post-séance ou pré-séance selon trainTime
    var timingBadge = null;
    var tt = S.trainTime;
    if (tt) {
      var POST = {morning: 'breakfast', noon: 'lunch', evening: 'dinner'};
      var PRE  = {morning: null, noon: 'breakfast', evening: 'lunch'};
      if (POST[tt] === sl.key) timingBadge = h('span', {style: 'font-size:10px;font-weight:700;color:#fff;background:#1A8C1A;border-radius:4px;padding:1px 6px;margin-left:6px'}, '\uD83D\uDCAA Post-s\u00e9ance');
      else if (PRE[tt] === sl.key) timingBadge = h('span', {style: 'font-size:10px;font-weight:700;color:#fff;background:#E07B00;border-radius:4px;padding:1px 6px;margin-left:6px'}, '\u26A1 Pr\u00e9-s\u00e9ance');
    }
    var mealTypeEl = h('div', {'class': 'meal-type'});
    mealTypeEl.appendChild(document.createTextNode(sl.label));
    if (timingBadge) mealTypeEl.appendChild(timingBadge);
    card.appendChild(mealTypeEl);
    card.appendChild(h('div', {'class': 'meal-name'}, [h('span', {'class': 'meal-flag'}, r.f), txt(r.n)]));
    card.appendChild(h('div', {'class': 'meal-kcal'}, r.k + ' kcal'));
    var mc = h('div', {'class': 'meal-macros'});
    mc.appendChild(h('span', {}, 'G ' + r.g + 'g'));
    mc.appendChild(h('span', {}, 'P ' + r.p + 'g'));
    mc.appendChild(h('span', {}, 'L ' + r.l + 'g'));
    card.appendChild(mc);
    var lv = r.lv || 0;
    var stars = '';
    for (var s = 0; s < lv; s++) stars += '\u2605';
    for (var s2 = lv; s2 < 4; s2++) stars += '\u2606';
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

    // Bouton "Remplacer ce repas" avec mini-modal (slot déjà occupé)
    (function(slotKey, slotLabel) {
      var addBtn = h('button', {
        style: 'width:100%;padding:8px 12px;margin-bottom:8px;background:transparent;border:1.5px dashed var(--border,#E5E4DE);border-radius:10px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--blue,#1A3C5E);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px',
        onclick: function(e) {
          e.stopPropagation();
          S._addMealModalSlot = slotKey;
          window.render();
        }
      }, '\u21ba Remplacer ce repas');
      p.appendChild(addBtn);

      if (S._addMealModalSlot === slotKey) {
        var overlay = h('div', {
          style: 'position:fixed;inset:0;background:rgba(10,10,9,0.45);z-index:9000;display:flex;align-items:flex-end;justify-content:center',
          onclick: function(e) {
            if (e.target === overlay) { S._addMealModalSlot = null; window.render(); }
          }
        });
        var sheet = h('div', {
          style: 'background:var(--card,#FFFFFF);border-radius:18px 18px 0 0;padding:24px 20px 32px;width:100%;max-width:480px;box-shadow:0 -4px 24px rgba(0,0,0,0.12)'
        });
        sheet.appendChild(h('div', {
          style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:15px;font-weight:700;color:var(--black,#0A0A09);margin-bottom:16px;text-align:center'
        }, 'Remplacer ce repas — ' + slotLabel));
        var choiceRow = h('div', {style: 'display:flex;gap:12px'});
        var btnRecipe = h('button', {
          style: 'flex:1;padding:14px 8px;background:var(--card,#FFFFFF);border:1.5px solid var(--border,#E5E4DE);border-radius:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;font-weight:600;color:var(--black,#0A0A09);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px',
          onclick: function(e) {
            e.stopPropagation();
            S._addMealModalSlot = null;
            S._recipePicker = { slotKey: slotKey, query: '' };
            window.render();
          }
        }, [h('span', {style: 'font-size:22px'}, '\uD83C\uDF7D'), h('span', {}, 'Choisir une recette')]);
        var btnSalad = h('button', {
          style: 'flex:1;padding:14px 8px;background:var(--card,#FFFFFF);border:1.5px solid var(--blue,#1A3C5E);border-radius:12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;font-weight:600;color:var(--blue,#1A3C5E);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px',
          onclick: function(e) {
            e.stopPropagation();
            S._addMealModalSlot = null;
            window.render();
            if (window.openSaladComposer) window.openSaladComposer(slotKey);
          }
        }, [h('span', {style: 'font-size:22px'}, '\uD83E\uDD57'), h('span', {}, 'Composer une salade')]);
        choiceRow.appendChild(btnRecipe);
        choiceRow.appendChild(btnSalad);
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
    var netDiv = h('div', {style: 'background:#E8F5E9;border:1px solid #27AE60;border-radius:8px;padding:10px 14px;margin:8px 0;font-family:"Helvetica Neue",sans-serif;font-size:11px;color:#1A5C2A'});
    var netRow = h('div', {style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:4px'});
    netRow.appendChild(h('span', {style: 'font-weight:700'}, '\uD83C\uDFCB\uFE0F S\u00e9ance valid\u00e9e aujourd\'hui — d\u00e9pense'));
    netRow.appendChild(h('span', {style: 'font-weight:700'}, '+' + burned + ' kcal'));
    netDiv.appendChild(netRow);
    var netRow2 = h('div', {style: 'display:flex;justify-content:space-between;align-items:center'});
    netRow2.appendChild(h('span', {style: 'color:#1A5C2A'}, 'Objectif alimentaire ajust\u00e9 (net)'));
    netRow2.appendChild(h('span', {style: 'font-weight:600;color:#1A5C2A'}, netTarget + ' kcal'));
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
    tip.appendChild(h('span', {}, 'Prends ta whey dans les 30 min apr\u00e8s l\'entra\u00eenement pour optimiser la synth\u00e8se prot\u00e9ique.'));
    p.appendChild(tip);
  }

  // Budget réel du plan semaine
  if (window.RecipeEngine && window.RecipeEngine.calcWeekPlanBudget && S.weekPlan) {
    var budget = window.RecipeEngine.calcWeekPlanBudget(S.weekPlan);
    var budgetBlock = h('div', { style: 'margin:16px 0;padding:14px 16px;background:var(--card);border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.08)' });
    budgetBlock.appendChild(h('div', { style: 'font-weight:700;font-size:14px;margin-bottom:10px;color:var(--text)' }, '💰 Budget courses estimé'));
    if (budget.totalMAD > 0) {
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
      // Comparaison avec le budget alimentaire de l'utilisateur
      if (S.shopBudget && budget.avgDailyMAD > 0) {
        var budgetDayLimits = {budget_low: 45, budget_mid: 90, budget_high: 180};
        var dayLimit = budgetDayLimits[S.shopBudget];
        if (dayLimit) {
          var overBudget = budget.avgDailyMAD > dayLimit;
          var budgetStatus = overBudget
            ? '\u26a0\ufe0f Au-dessus de votre fourchette (' + dayLimit + ' DH/j)'
            : '\u2713 Dans votre fourchette budget';
          budgetBlock.appendChild(h('div', { style: 'font-size:12px;font-weight:600;color:' + (overBudget ? '#D32F2F' : 'var(--accent)') + ';margin-top:8px;text-align:center' }, budgetStatus));
        }
      }
      if (budget.coveragePct < 100) {
        budgetBlock.appendChild(h('div', { style: 'font-size:11px;color:var(--text-secondary);margin-top:8px' },
          '* Estimation basée sur ' + budget.coveragePct + '% des repas (recettes avec prix disponibles)'
        ));
      }
    } else {
      budgetBlock.appendChild(h('div', { style: 'font-size:12px;color:var(--text-secondary);text-align:center;padding:8px 0' },
        'Prix non disponibles pour ce plan — généralement disponibles dès la semaine suivante'
      ));
    }
    // Insère après le plan semaine
    p.appendChild(budgetBlock);
  }

  // Bouton liste de courses améliorée — affiche le nombre d'articles en temps réel
  var _shopList = (window.RecipeEngine && S.weekPlan) ? window.RecipeEngine.generateShoppingList(S.weekPlan, {shopFreq: S.shopFreq}) : [];
  var _shopTotal = _shopList.reduce(function(n, cat) { return n + cat.items.length; }, 0);
  var _shopLabel = '\uD83D\uDECD ' + window.t('shop.title') + (_shopTotal > 0 ? ' (' + _shopTotal + ' articles)' : '');
  var btnShop = h('button', {
    style: 'width:100%;padding:12px;margin:8px 0;background:var(--card);border:1.5px solid var(--border);border-radius:12px;font-size:14px;font-weight:600;color:var(--text);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px',
    onclick: function() { window.S.shopListOpen = true; if(window.render) window.render(); }
  }, _shopLabel);
  p.appendChild(btnShop);

  // Export PDF
  p.appendChild(h('button', {'class': 'btn-primary', style: 'margin-top:16px;background:var(--black2)', onclick: function() { window.exportDayPDF(S.selectedDay); }}, '\u21e9 Exporter le jour en PDF'));
  p.appendChild(h('div', {style: 'height:8px'}));
  p.appendChild(h('button', {'class': 'regen-btn', onclick: function() {
    if (window.computeNutritionState) window.computeNutritionState(false);
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
      if (fullR && fullR.ingredients && fullR.ingredients.length > 0) {
        fullR.ingredients.forEach(function(ing) { ingredList.appendChild(h('li', {}, fmtIng(ing))); });
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
    var chk = prot * 4 + carbs * 4 + fats * 9;
    var diffPctChk = kcal > 0 ? Math.abs((chk - kcal) / kcal * 100) : 0;
    var chkColor = diffPctChk <= 5 ? 'var(--green,#1A4A1A)' : 'var(--orange,#6A4A1A)';
    body.appendChild(h('div', {'class': 'macro-check', style: 'color:' + chkColor}, '\u2139\ufe0f \u00c9quivalent calorique macros : ' + chk + ' kcal' + (diffPctChk > 5 ? ' (\u00e9cart ' + Math.round(diffPctChk) + '% vs ' + kcal + ' kcal affich\u00e9)' : ' \u2713')));
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
      style: 'padding:4px 10px;border-radius:20px;border:1.5px solid ' + (sb.mealTarget === item.slot ? barColor : 'var(--border)') + ';background:' + (sb.mealTarget === item.slot ? barColor : 'transparent') + ';color:' + (sb.mealTarget === item.slot ? '#fff' : 'var(--text)') + ';font-size:12px;cursor:pointer;font-weight:600',
      onclick: (function(s) { return function() { sb.mealTarget = s; window.render(); }; })(item.slot)
    }, item.label));
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
      style: 'flex:0 0 auto;width:150px;padding:10px 12px;border-radius:14px;border:1.5px solid ' +
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
      style: 'font-size:12px;font-weight:700;color:' + sig.palette + ';margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis'
    }, sig.label));
    card.appendChild(h('div', {
      style: 'font-size:10px;color:var(--grey);line-height:1.3;white-space:normal'
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
      var chipStyle = 'padding:5px 10px;border-radius:20px;border:1.5px solid ' +
        (isSel ? 'var(--green,#1A4A1A)' : 'var(--border)') +
        ';background:' + (isSel ? 'var(--greenbg,rgba(26,74,26,.06))' : 'var(--card)') +
        ';color:var(--text);font-size:12px;cursor:' + (canAdd ? 'pointer' : 'not-allowed') +
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
  var recap = h('div', { style: 'padding:16px;background:var(--card);margin:8px 16px;border-radius:12px;border:1px solid var(--border)' });
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
      window.render();
    }
  }, 'Valider ma composition — ' + (sb.mealTarget === 'breakfast' ? window.t('onb.s9.breakfast') : sb.mealTarget === 'snack' ? window.t('onb.s9.snack') : sb.mealTarget === 'dinner' ? window.t('onb.s9.dinner') : window.t('onb.s9.lunch')));
  actWrap.appendChild(btnAdd);

  actWrap.appendChild(h('button', {
    style: 'width:100%;padding:12px;border-radius:12px;border:1.5px solid var(--border);background:var(--card);color:var(--text);font-size:14px;font-weight:600;cursor:pointer',
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
    steps:['Congeler la banane la veille en morceaux','Mettre tous les ingrédients dans le blender','Mixer 45 secondes à pleine puissance','Consommer dans les 10 min post-entraînement'],
    tips:'Ajouter des glaçons pour une texture plus épaisse. 1 cuillère de miel si glycogène à refaire.' },
  { id:'sm_choco_02', name:'Brownie Shake Récupération', flavors:['chocolate'], goal:['muscle','recovery'], timing:'post', cal:420, p:40, c:48, f:9, prep:'4min',
    ingredients:[{name:'Whey chocolat',qty:35,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Flocons d\'avoine',qty:40,unit:'g'},{name:'Cacao pur',qty:8,unit:'g'},{name:'Datte Medjool',qty:2,unit:'pcs'}],
    steps:['Faire tremper les flocons 5 min dans le lait','Ajouter le reste des ingrédients','Mixer jusqu\'à consistance crémeuse','Laisser reposer 1 min avant de boire'],
    tips:'Les flocons ralentissent l\'absorption — idéal si prochain repas dans 2h+.' },
  { id:'sm_choco_03', name:'Chocolat Menthe Explosif', flavors:['chocolate'], goal:['fat_loss','performance'], timing:'pre', cal:290, p:32, c:28, f:6, prep:'2min',
    ingredients:[{name:'Whey chocolat',qty:30,unit:'g'},{name:'Eau froide',qty:300,unit:'ml'},{name:'Épinards frais',qty:30,unit:'g'},{name:'Menthe fraîche',qty:5,unit:'g'},{name:'Glaçons',qty:100,unit:'g'}],
    steps:['Mettre eau et épinards en premier','Ajouter whey, menthe et glaçons','Mixer 30 secondes','Boire 30 min avant l\'entraînement'],
    tips:'Les épinards n\'ont aucun goût mais apportent fer et magnésium. Booster naturel.' },

  // === VANILLE ===
  { id:'sm_van_01', name:'Vanilla Cream Gainer', flavors:['vanilla'], goal:['muscle'], timing:'post', cal:500, p:38, c:65, f:10, prep:'3min',
    ingredients:[{name:'Whey vanille',qty:35,unit:'g'},{name:'Lait entier',qty:250,unit:'ml'},{name:'Flocons d\'avoine',qty:50,unit:'g'},{name:'Miel',qty:15,unit:'g'},{name:'Vanille extrait',qty:2,unit:'ml'}],
    steps:['Mixer lait et flocons 20 secondes','Ajouter whey, miel, extrait vanille','Mixer encore 20 secondes','Consommer immédiatement'],
    tips:'Shake calorique — parfait pour prise de masse en période de surplus.' },
  { id:'sm_van_02', name:'Vanilla Latte Matin', flavors:['vanilla','coffee'], goal:['performance','fat_loss'], timing:'pre', cal:310, p:33, c:30, f:7, prep:'3min',
    ingredients:[{name:'Whey vanille',qty:30,unit:'g'},{name:'Café expresso froid',qty:60,unit:'ml'},{name:'Lait d\'amande',qty:200,unit:'ml'},{name:'Glaçons',qty:80,unit:'g'},{name:'Cannelle',qty:1,unit:'g'}],
    steps:['Préparer expresso et le laisser refroidir','Combiner tous les ingrédients','Mixer 20 secondes','Saupoudrer de cannelle'],
    tips:'La caféine booste la performance de 3-7%. Parfait en matinal avant séance.' },
  { id:'sm_van_03', name:'Vanilla Banana Overnight', flavors:['vanilla','banana'], goal:['muscle','recovery'], timing:'anytime', cal:440, p:36, c:55, f:8, prep:'5min',
    ingredients:[{name:'Whey vanille',qty:30,unit:'g'},{name:'Lait écrémé',qty:200,unit:'ml'},{name:'Banane',qty:120,unit:'g'},{name:'Flocons d\'avoine',qty:40,unit:'g'},{name:'Graines de chia',qty:10,unit:'g'}],
    steps:['Mixer lait + banane + whey','Verser dans un verre','Ajouter flocons et chia','Mélanger et réfrigérer 1h ou boire immédiatement'],
    tips:'Avec réfrigération, texture pudding très rassasiante. Idéal collation.' },

  // === FRAISE ===
  { id:'sm_straw_01', name:'Fraise Citron Vitalité', flavors:['strawberry','lemon'], goal:['fat_loss','performance'], timing:'post', cal:280, p:30, c:32, f:3, prep:'3min',
    ingredients:[{name:'Whey fraise',qty:25,unit:'g'},{name:'Fraises congelées',qty:150,unit:'g'},{name:'Jus de citron',qty:30,unit:'ml'},{name:'Eau',qty:200,unit:'ml'},{name:'Stevia',qty:1,unit:'g'}],
    steps:['Décongeler légèrement les fraises','Mixer tous les ingrédients','Ajuster le citron selon goût','Consommer frais'],
    tips:'Moins de 300kcal — parfait en cut. La vitamine C aide l\'absorption du fer.' },
  { id:'sm_straw_02', name:'Strawberry Cheesecake Shake', flavors:['strawberry'], goal:['muscle','anytime'], timing:'anytime', cal:390, p:38, c:38, f:9, prep:'4min',
    ingredients:[{name:'Whey fraise',qty:30,unit:'g'},{name:'Fromage blanc 0%',qty:100,unit:'g'},{name:'Fraises',qty:100,unit:'g'},{name:'Lait',qty:150,unit:'ml'},{name:'Vanille',qty:1,unit:'g'}],
    steps:['Mixer fraises avec le lait','Ajouter fromage blanc et whey','Mixer jusqu\'à onctuosité','Servir avec quelques fraises fraîches'],
    tips:'Le fromage blanc double les protéines et la texture est sublime.' },

  // === CACAHUÈTE ===
  { id:'sm_peanut_01', name:'PB&J Power Shake', flavors:['peanut','strawberry'], goal:['muscle','performance'], timing:'post', cal:450, p:42, c:45, f:14, prep:'3min',
    ingredients:[{name:'Whey cacahuète',qty:30,unit:'g'},{name:'Beurre de cacahuète',qty:20,unit:'g'},{name:'Fraises congelées',qty:80,unit:'g'},{name:'Lait écrémé',qty:250,unit:'ml'},{name:'Miel',qty:10,unit:'g'}],
    steps:['Mettre tous les ingrédients dans le blender','Mixer 45 secondes','Goûter et ajuster le miel','Servir avec paille large'],
    tips:'Combo protéines + sucres rapides + lents = récupération optimale.' },
  { id:'sm_peanut_02', name:'Cacahuète Chocolat Noir Ultime', flavors:['peanut','chocolate'], goal:['muscle'], timing:'anytime', cal:480, p:40, c:40, f:16, prep:'3min',
    ingredients:[{name:'Whey cacahuète',qty:25,unit:'g'},{name:'Whey chocolat',qty:15,unit:'g'},{name:'Beurre d\'arachide',qty:25,unit:'g'},{name:'Lait entier',qty:250,unit:'ml'},{name:'Banane',qty:80,unit:'g'}],
    steps:['Peler et couper la banane','Mixer tous les ingrédients','Mixer 30 secondes puissance max','Consommer avec des glaçons'],
    tips:'Le mix de deux wheys = profil aminoacidé complet. Très rassasiant.' },

  // === CAFÉ ===
  { id:'sm_coffee_01', name:'Cold Brew Pre-Workout', flavors:['coffee'], goal:['performance','fat_loss'], timing:'pre', cal:260, p:32, c:22, f:5, prep:'3min',
    ingredients:[{name:'Whey café',qty:30,unit:'g'},{name:'Cold brew concentré',qty:100,unit:'ml'},{name:'Lait d\'amande',qty:200,unit:'ml'},{name:'Glaçons',qty:100,unit:'g'},{name:'Extrait vanille',qty:1,unit:'ml'}],
    steps:['Préparer cold brew la veille','Mixer tous les ingrédients avec glaçons','Servir immédiatement','Boire 20-30 min avant séance'],
    tips:'200mg caféine = dose optimale pour performance. Ne pas prendre après 16h.' },
  { id:'sm_coffee_02', name:'Tiramisu Shake Masse', flavors:['coffee','vanilla'], goal:['muscle'], timing:'post', cal:430, p:38, c:50, f:8, prep:'5min',
    ingredients:[{name:'Whey café',qty:30,unit:'g'},{name:'Ricotta légère',qty:80,unit:'g'},{name:'Café fort',qty:60,unit:'ml'},{name:'Lait',qty:150,unit:'ml'},{name:'Cacao pur',qty:5,unit:'g'},{name:'Miel',qty:10,unit:'g'}],
    steps:['Préparer café fort et refroidir','Mixer ricotta + lait + whey','Ajouter café + miel','Saupoudrer de cacao'],
    tips:'Goût tiramisu sans les calories du dessert. Texture très crémeuse.' },

  // === MYRTILLE ===
  { id:'sm_blue_01', name:'Blueberry Antioxydant Warrior', flavors:['blueberry'], goal:['recovery','performance'], timing:'post', cal:310, p:30, c:38, f:4, prep:'3min',
    ingredients:[{name:'Whey myrtille ou vanille',qty:25,unit:'g'},{name:'Myrtilles congelées',qty:150,unit:'g'},{name:'Épinards',qty:30,unit:'g'},{name:'Eau de coco',qty:200,unit:'ml'},{name:'Citron',qty:10,unit:'ml'}],
    steps:['Mixer épinards avec eau de coco','Ajouter myrtilles et whey','Mixer 40 secondes','Finir avec le jus de citron'],
    tips:'Anthocyanes = anti-inflammatoires naturels. Parfait post-WOD intense.' },
  { id:'sm_blue_02', name:'Myrtille Lavande Zen', flavors:['blueberry'], goal:['recovery'], timing:'anytime', cal:290, p:28, c:35, f:5, prep:'3min',
    ingredients:[{name:'Whey nature ou vanille',qty:25,unit:'g'},{name:'Myrtilles',qty:120,unit:'g'},{name:'Yaourt grec 0%',qty:100,unit:'g'},{name:'Lait',qty:100,unit:'ml'},{name:'Miel de lavande',qty:10,unit:'g'}],
    steps:['Mixer yaourt + lait + whey','Ajouter myrtilles et miel','Mixer 30 secondes','Servir avec quelques myrtilles entières'],
    tips:'Le yaourt grec = source de probiotiques. Intestin sain = meilleure absorption.' },

  // === NOIX DE COCO ===
  { id:'sm_coco_01', name:'Tropical Gainz', flavors:['coconut','banana'], goal:['muscle','performance'], timing:'post', cal:460, p:36, c:58, f:12, prep:'4min',
    ingredients:[{name:'Whey coco ou vanille',qty:30,unit:'g'},{name:'Lait de coco',qty:150,unit:'ml'},{name:'Banane',qty:120,unit:'g'},{name:'Ananas',qty:100,unit:'g'},{name:'Flocons de coco',qty:10,unit:'g'}],
    steps:['Couper banane et ananas','Mixer avec lait de coco et whey','Mixer 30 secondes','Garnir de flocons de coco'],
    tips:'Profil glucidique parfait post-WOD. L\'ananas contient de la bromélaïne anti-inflammatoire.' },
  { id:'sm_coco_02', name:'Coco Matcha Équilibre', flavors:['coconut','matcha'], goal:['fat_loss','performance'], timing:'pre', cal:300, p:30, c:28, f:9, prep:'4min',
    ingredients:[{name:'Whey nature ou vanille',qty:25,unit:'g'},{name:'Lait de coco léger',qty:200,unit:'ml'},{name:'Matcha grade cérémonial',qty:4,unit:'g'},{name:'Glaçons',qty:80,unit:'g'},{name:'Miel',qty:8,unit:'g'}],
    steps:['Dissoudre le matcha dans un peu d\'eau chaude','Refroidir au frigo 5 min','Mixer avec tous les ingrédients','Servir froid'],
    tips:'L-théanine du matcha + caféine = focus sans nervosité. Idéal avant séance technique.' },

  // === CITRON ===
  { id:'sm_lemon_01', name:'Limonade Protéinée Été', flavors:['lemon'], goal:['fat_loss','anytime'], timing:'anytime', cal:220, p:28, c:22, f:2, prep:'2min',
    ingredients:[{name:'Whey citron ou nature',qty:25,unit:'g'},{name:'Jus de citron frais',qty:60,unit:'ml'},{name:'Eau pétillante',qty:300,unit:'ml'},{name:'Stevia',qty:1,unit:'g'},{name:'Menthe',qty:3,unit:'g'}],
    steps:['Mélanger whey avec un peu d\'eau plate','Ajouter le jus de citron','Verser l\'eau pétillante délicatement','Finir avec menthe et glaçons'],
    tips:'Seulement 220kcal — option coupe-faim légère. L\'acide citrique aide la digestion.' },
  { id:'sm_lemon_02', name:'Lemon Cheesecake Detox', flavors:['lemon'], goal:['fat_loss'], timing:'anytime', cal:260, p:32, c:26, f:4, prep:'4min',
    ingredients:[{name:'Whey citron ou vanille',qty:25,unit:'g'},{name:'Fromage blanc 0%',qty:120,unit:'g'},{name:'Citron zeste+jus',qty:1,unit:'pcs'},{name:'Lait écrémé',qty:100,unit:'ml'},{name:'Gingembre',qty:2,unit:'g'}],
    steps:['Zester et presser le citron','Mixer tout avec fromage blanc','Ajouter le gingembre','Réfrigérer 15 min pour meilleure texture'],
    tips:'Gingembre = effet thermogénique naturel. Aide la digestion post-repas.' },

  // === BANANE ===
  { id:'sm_ban_01', name:'Banana Power Breakfast', flavors:['banana','vanilla'], goal:['muscle','performance'], timing:'pre', cal:410, p:34, c:56, f:6, prep:'3min',
    ingredients:[{name:'Whey banane ou vanille',qty:30,unit:'g'},{name:'Banane mûre',qty:150,unit:'g'},{name:'Lait écrémé',qty:200,unit:'ml'},{name:'Flocons d\'avoine',qty:40,unit:'g'},{name:'Cannelle',qty:1,unit:'g'}],
    steps:['Mixer flocons avec lait 10 secondes','Ajouter banane et whey','Mixer 20 secondes','Saupoudrer de cannelle'],
    tips:'Index glycémique moyen grâce aux flocons = énergie durable pour longue séance.' },

  // === NOISETTE ===
  { id:'sm_hazel_01', name:'Ferrero Shake', flavors:['hazelnut','chocolate'], goal:['muscle'], timing:'anytime', cal:470, p:38, c:48, f:14, prep:'3min',
    ingredients:[{name:'Whey noisette ou chocolat',qty:30,unit:'g'},{name:'Pâte de noisette pure',qty:15,unit:'g'},{name:'Cacao pur',qty:8,unit:'g'},{name:'Lait entier',qty:250,unit:'ml'},{name:'Banane',qty:80,unit:'g'}],
    steps:['Mixer banane avec lait','Ajouter pâte de noisette, cacao, whey','Mixer 30 secondes','Garnir d\'éclats de noisettes'],
    tips:'Goût Nutella mais avec macro-nutriments d\'athlète. Aucune huile de palme.' },

  // === MATCHA ===
  { id:'sm_matcha_01', name:'Matcha Warrior Bowl', flavors:['matcha'], goal:['performance','fat_loss'], timing:'pre', cal:320, p:30, c:38, f:5, prep:'5min',
    ingredients:[{name:'Whey nature ou vanille',qty:25,unit:'g'},{name:'Matcha grade cérémonial',qty:5,unit:'g'},{name:'Lait d\'avoine',qty:200,unit:'ml'},{name:'Miel de manuka',qty:10,unit:'g'},{name:'Gingembre râpé',qty:2,unit:'g'}],
    steps:['Dissoudre matcha dans 50ml eau chaude','Fouetter énergiquement sans grumeaux','Mixer avec lait, whey, miel','Ajouter gingembre'],
    tips:'EGCG du matcha booste le métabolisme. Double effet avec la caféine naturelle.' },
  { id:'sm_matcha_02', name:'Green Machine Récupération', flavors:['matcha','coconut'], goal:['recovery'], timing:'post', cal:330, p:32, c:35, f:7, prep:'4min',
    ingredients:[{name:'Whey vanille',qty:25,unit:'g'},{name:'Matcha',qty:4,unit:'g'},{name:'Lait de coco léger',qty:150,unit:'ml'},{name:'Épinards',qty:40,unit:'g'},{name:'Pomme verte',qty:80,unit:'g'},{name:'Citron',qty:15,unit:'ml'}],
    steps:['Mixer épinards avec lait de coco','Ajouter matcha, pomme, whey, citron','Mixer 45 secondes','Passer au tamis si texture trop épaisse'],
    tips:'Chlorophylle + antioxydants = combo récupération ultime après séance CrossFit.' },

  // === NATURE / UNFLAVORED ===
  { id:'sm_nature_01', name:'Clean Shake Neutre', flavors:['unflavored'], goal:['muscle','fat_loss'], timing:'anytime', cal:280, p:33, c:28, f:5, prep:'2min',
    ingredients:[{name:'Whey nature',qty:30,unit:'g'},{name:'Lait écrémé',qty:250,unit:'ml'},{name:'Flocons d\'avoine',qty:25,unit:'g'},{name:'Amandes effilées',qty:10,unit:'g'}],
    steps:['Mixer tout ensemble 20 secondes','Goûter — ajuster avec miel si nécessaire','Consommer immédiatement'],
    tips:'Base neutre : ajouter fruits frais selon humeur. Très digestible.' },
  { id:'sm_nature_02', name:'Athlete\'s Functional Shake', flavors:['unflavored'], goal:['performance','recovery'], timing:'post', cal:360, p:38, c:38, f:7, prep:'3min',
    ingredients:[{name:'Whey nature',qty:35,unit:'g'},{name:'Yaourt grec 0%',qty:100,unit:'g'},{name:'Jus d\'orange frais',qty:150,unit:'ml'},{name:'Banane',qty:80,unit:'g'},{name:'Curcuma',qty:1,unit:'g'},{name:'Poivre noir',qty:0.5,unit:'g'}],
    steps:['Mixer yaourt + jus d\'orange + banane','Ajouter whey, curcuma, poivre','Mixer 20 secondes','Boire dans les 30 min post-séance'],
    tips:'Le poivre active la biodisponibilité de la curcumine x20. Anti-inflammatoire puissant.' },

  // === MULTI-PARFUMS ===
  { id:'sm_multi_01', name:'Reese\'s Smoothie Bowl', flavors:['peanut','chocolate'], goal:['muscle'], timing:'anytime', cal:520, p:42, c:55, f:15, prep:'5min',
    ingredients:[{name:'Whey chocolat',qty:30,unit:'g'},{name:'Beurre de cacahuète',qty:20,unit:'g'},{name:'Banane congelée',qty:150,unit:'g'},{name:'Lait',qty:100,unit:'ml'},{name:'Granola',qty:30,unit:'g'}],
    steps:['Mixer banane + lait + whey + beurre de cacahuète','Texture épaisse (peu de lait)','Verser dans un bol','Garnir de granola'],
    tips:'Format bowl = plus rassasiant (mastication). Ajouter fruits frais en saison.' },
  { id:'sm_multi_02', name:'Sunrise Recovery', flavors:['strawberry','banana'], goal:['recovery','muscle'], timing:'post', cal:390, p:34, c:50, f:5, prep:'3min',
    ingredients:[{name:'Whey vanille ou fraise',qty:25,unit:'g'},{name:'Fraises',qty:100,unit:'g'},{name:'Banane',qty:100,unit:'g'},{name:'Jus d\'orange',qty:100,unit:'ml'},{name:'Miel',qty:8,unit:'g'},{name:'Glaçons',qty:80,unit:'g'}],
    steps:['Mixer fruits + jus d\'orange','Ajouter whey, miel, glaçons','Mixer 30 secondes','Servir immédiatement'],
    tips:'Ratio glucides/protéines 1.5:1 = optimal pour resynthèse glycogène post-WOD.' },
  { id:'sm_multi_03', name:'Mocha Hazelnut Dream', flavors:['coffee','hazelnut'], goal:['performance'], timing:'pre', cal:340, p:32, c:35, f:9, prep:'4min',
    ingredients:[{name:'Whey café ou noisette',qty:30,unit:'g'},{name:'Café expresso',qty:60,unit:'ml'},{name:'Pâte de noisette',qty:10,unit:'g'},{name:'Lait écrémé',qty:200,unit:'ml'},{name:'Cacao pur',qty:5,unit:'g'}],
    steps:['Préparer expresso refroidi','Mixer avec lait, whey, noisette, cacao','Servir sur glaçons','Boire 20-30 min avant séance'],
    tips:'Combo caféine + théobromine (cacao) = stimulation durable sans crash.' },

  // === BANANE #2 ===
  { id:'sm_ban_02', name:'Banana Split Recovery', flavors:['banana','vanilla'], goal:['recovery'], timing:'post', cal:380, p:36, c:48, f:6, prep:'3min',
    ingredients:[{name:'Whey banane ou vanille',qty:30,unit:'g'},{name:'Banane congelée',qty:120,unit:'g'},{name:'Skyr nature',qty:100,unit:'g'},{name:'Lait écrémé',qty:150,unit:'ml'},{name:'Miel',qty:10,unit:'g'}],
    steps:['Mixer banane congelée avec lait','Ajouter skyr et whey','Mixer jusqu\'à texture crémeuse','Finir avec un filet de miel'],
    tips:'La banane congelée donne une texture glacée sans ajouter de glace. Riche en potassium pour récupération musculaire.' },

  // === NOISETTE #2 ===
  { id:'sm_hazel_02', name:'Noisette Overnight Shake', flavors:['hazelnut'], goal:['muscle','recovery'], timing:'anytime', cal:440, p:35, c:45, f:13, prep:'5min',
    ingredients:[{name:'Whey noisette',qty:30,unit:'g'},{name:'Purée de noisette complète',qty:20,unit:'g'},{name:'Lait d\'avoine',qty:250,unit:'ml'},{name:'Flocons d\'avoine',qty:30,unit:'g'},{name:'Cacao pur',qty:5,unit:'g'},{name:'Datte Medjool',qty:1,unit:'pce'}],
    steps:['Faire tremper flocons 5 min dans lait d\'avoine','Ajouter datte dénoyautée, purée noisette, cacao, whey','Mixer 30 secondes','Consommer immédiatement ou conserver 2h au frais'],
    tips:'Datte Medjool = sucre naturel + fibres solubles. Meilleur shake noisette pour calorie dense.' },

  // === MULTI #4 — Lemon Matcha Zen ===
  { id:'sm_multi_04', name:'Lemon Matcha Zen', flavors:['lemon','matcha'], goal:['fat_loss','performance'], timing:'pre', cal:260, p:30, c:28, f:4, prep:'3min',
    ingredients:[{name:'Whey nature ou citron',qty:25,unit:'g'},{name:'Matcha cérémonie',qty:3,unit:'g'},{name:'Jus de citron frais',qty:30,unit:'ml'},{name:'Eau de coco',qty:200,unit:'ml'},{name:'Miel',qty:8,unit:'g'},{name:'Gingembre frais',qty:5,unit:'g'}],
    steps:['Dissoudre matcha dans un peu d\'eau chaude, laisser refroidir','Mixer eau de coco + citron + gingembre + whey','Ajouter matcha dissous','Mixer 15 secondes et servir sur glaçons'],
    tips:'Association catéchines (matcha) + vitamine C (citron) = absorption antioxydants x4. Idéal fasted cardio.' },

  // === PISTACHE ===
  { id:'sm_pist_01', name:'Pistache Baklava Dream', flavors:['pistachio'], goal:['muscle'], timing:'post', cal:420, p:36, c:31, f:17, prep:'3min',
    ingredients:[{name:'Whey pistache',qty:30,unit:'g'},{name:'Lait entier',qty:250,unit:'ml'},{name:'Miel',qty:15,unit:'g'},{name:'Pistaches concassées',qty:20,unit:'g'},{name:'Eau de rose',qty:5,unit:'ml'},{name:'Glaçons',qty:80,unit:'g'}],
    steps:['Concasser grossièrement les pistaches','Mixer lait entier, whey et miel 20 secondes','Ajouter pistaches concassées et eau de rose','Mixer 15 secondes puis servir sur glaçons'],
    tips:'L\'eau de rose est optionnelle mais transforme ce shake en vrai baklava liquide. Les pistaches apportent de bonnes graisses mono-insaturées.' },
  { id:'sm_pist_02', name:'Pistache Citron Frais', flavors:['pistachio','lemon'], goal:['fat_loss'], timing:'pre', cal:280, p:40, c:25, f:2, prep:'3min',
    ingredients:[{name:'Whey pistache',qty:30,unit:'g'},{name:'Lait écrémé',qty:250,unit:'ml'},{name:'Jus de citron frais',qty:30,unit:'ml'},{name:'Yaourt grec 0%',qty:80,unit:'g'},{name:'Glaçons',qty:100,unit:'g'},{name:'Stevia',qty:1,unit:'g'}],
    steps:['Mixer lait écrémé, yaourt grec et whey','Ajouter jus de citron et stevia','Mixer avec glaçons 30 secondes','Boire frais 20-30 min avant l\'effort'],
    tips:'Moins de 280 kcal pour 40g de protéines — ratio exceptionnel pour la sèche. Le citron masque l\'amertume du stevia et rafraîchit.' },
  { id:'sm_pist_03', name:'Pistache Vanille Royale', flavors:['pistachio','vanilla'], goal:['recovery'], timing:'anytime', cal:380, p:44, c:27, f:9, prep:'4min',
    ingredients:[{name:'Whey pistache',qty:25,unit:'g'},{name:'Whey vanille',qty:10,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Yaourt grec 0%',qty:100,unit:'g'},{name:'Miel',qty:10,unit:'g'}],
    steps:['Mixer lait entier et yaourt grec','Ajouter les deux wheys et le miel','Mixer 25 secondes à pleine puissance','Servir immédiatement pour texture optimale'],
    tips:'Le mix whey pistache + vanille crée un profil aminoacidé ultra-complet. Le yaourt grec double la densité protéique sans alourdir les lipides.' },
  { id:'sm_pist_04', name:'Pistache Matcha Green', flavors:['pistachio','matcha'], goal:['performance'], timing:'pre', cal:300, p:27, c:36, f:6, prep:'4min',
    ingredients:[{name:'Whey pistache',qty:30,unit:'g'},{name:'Matcha grade cérémonial',qty:3,unit:'g'},{name:'Lait d\'amande',qty:250,unit:'ml'},{name:'Banane',qty:80,unit:'g'},{name:'Miel',qty:10,unit:'g'},{name:'Gingembre frais',qty:2,unit:'g'}],
    steps:['Dissoudre le matcha dans 30ml d\'eau chaude et laisser refroidir','Mixer banane + lait d\'amande + whey + miel','Ajouter matcha dissous et gingembre râpé','Mixer 20 secondes et boire 25 min avant séance'],
    tips:'Pistache + matcha = duo antioxydants de compétition. La L-théanine du matcha combinée à la caféine naturelle offre un focus sans nervosité. Idéal avant séance technique.' },

  // === NOISETTE #3 ===
  { id:'sm_hazel_03', name:'Nutella Sportif', flavors:['hazelnut','chocolate'], goal:['muscle'], timing:'post', cal:460, p:39, c:47, f:13, prep:'4min',
    ingredients:[{name:'Whey noisette',qty:35,unit:'g'},{name:'Lait entier',qty:250,unit:'ml'},{name:'Cacao pur',qty:8,unit:'g'},{name:'Banane mûre',qty:80,unit:'g'},{name:'Miel',qty:10,unit:'g'}],
    steps:['Peler et couper la banane en morceaux','Mixer lait entier + banane + miel 15 secondes','Ajouter whey noisette et cacao pur','Mixer 30 secondes — texture onctueuse garantie'],
    tips:'Tout le plaisir du Nutella avec des macros d\'athlète et zéro huile de palme. Le cacao pur multiplie les flavonoïdes anti-inflammatoires. Parfait dans les 30 min post-WOD.' },

  // === BANANE #3 ===
  { id:'sm_ban_03', name:'Banana Bread Shake', flavors:['banana','vanilla'], goal:['muscle'], timing:'anytime', cal:430, p:35, c:43, f:14, prep:'4min',
    ingredients:[{name:'Whey banane ou vanille',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Flocons d\'avoine',qty:30,unit:'g'},{name:'Cannelle',qty:1,unit:'g'},{name:'Miel',qty:10,unit:'g'},{name:'Noix',qty:5,unit:'g'}],
    steps:['Mixer lait entier + flocons d\'avoine 15 secondes','Ajouter whey, miel et cannelle','Mixer 20 secondes jusqu\'à consistance veloutée','Terminer avec les noix concassées en garniture'],
    tips:'Les flocons ralentissent l\'absorption et prolongent la satiété. La cannelle améliore la sensibilité à l\'insuline. Idéal collation de journée ou post-entraînement léger.' },

  // === CHOCOLAT #4 — Choco Framboise Express ===
  { id:'sm_choco_04', name:'Choco Framboise Express', flavors:['chocolate','strawberry'], goal:['fat_loss','recovery'], timing:'post', cal:290, p:32, c:30, f:5, prep:'3min',
    ingredients:[{name:'Whey chocolat',qty:30,unit:'g'},{name:'Fraises congelées',qty:100,unit:'g'},{name:'Lait écrémé',qty:200,unit:'ml'},{name:'Miel',qty:5,unit:'g'},{name:'Glaçons',qty:80,unit:'g'}],
    steps:['Mixer tout ensemble 30 secondes','Boire froid'],
    tips:'Le combo chocolat-framboise est un classique pâtissier. Fraises congelées = texture épaisse sans glace.' },

  // === VANILLE #4 — Vanille Caramel Salé ===
  { id:'sm_van_04', name:'Vanille Caramel Salé', flavors:['vanilla'], goal:['muscle','recovery'], timing:'anytime', cal:400, p:35, c:48, f:7, prep:'3min',
    ingredients:[{name:'Whey vanille',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Miel',qty:15,unit:'g'},{name:'Flocons d\'avoine',qty:30,unit:'g'},{name:'Sel',qty:1,unit:'g'}],
    steps:['Mixer lait + flocons 15 secondes','Ajouter whey + miel + sel','Mixer 20 secondes'],
    tips:'La pincée de sel transforme le miel en caramel salé. Simple et addictif.' },

  // === CAFÉ #3 — Café Express ===
  { id:'sm_coffee_03', name:'Café Express Glacé', flavors:['coffee'], goal:['performance','fat_loss'], timing:'pre', cal:230, p:30, c:20, f:4, prep:'1min',
    ingredients:[{name:'Whey café',qty:30,unit:'g'},{name:'Lait entier',qty:150,unit:'ml'},{name:'Glaçons',qty:100,unit:'g'}],
    steps:['Mettre dans le shaker avec glaçons','Shaker 20 secondes','Boire immédiatement'],
    tips:'3 ingrédients, 1 minute. Le shaker suffit, pas besoin de blender.' },

  // === FRAISE #3 — Fraise Simple ===
  { id:'sm_straw_03', name:'Fraise Pure', flavors:['strawberry'], goal:['fat_loss','recovery'], timing:'anytime', cal:270, p:38, c:25, f:2, prep:'2min',
    ingredients:[{name:'Whey fraise',qty:30,unit:'g'},{name:'Yaourt grec 0%',qty:200,unit:'g'},{name:'Fraises congelées',qty:80,unit:'g'},{name:'Eau',qty:100,unit:'ml'}],
    steps:['Mixer tout 20 secondes','C\'est prêt'],
    tips:'Le yaourt grec donne une texture épaisse type smoothie bowl. Peut se manger à la cuillère.' },

  // === NOISETTE #4 — Noisette Rapide ===
  { id:'sm_hazel_04', name:'Noisette Rapide', flavors:['hazelnut'], goal:['muscle'], timing:'anytime', cal:330, p:36, c:28, f:10, prep:'1min',
    ingredients:[{name:'Whey noisette',qty:35,unit:'g'},{name:'Lait entier',qty:300,unit:'ml'},{name:'Cacao pur',qty:5,unit:'g'}],
    steps:['Shaker 15 secondes','Pas besoin de blender'],
    tips:'Le smoothie protéiné le plus rapide du bar. En shaker = zéro vaisselle.' },

  // === FRAMBOISE ===
  { id:'sm_rasp_01', name:'Framboise Express', flavors:['raspberry'], goal:['fat_loss','recovery'], timing:'anytime', cal:260, p:31, c:22, f:5, prep:'2min',
    ingredients:[{name:'Whey framboise',qty:30,unit:'g'},{name:'Lait demi-\u00e9cr\u00e9m\u00e9',qty:200,unit:'ml'},{name:'Fruits rouges surgel\u00e9s',qty:80,unit:'g'}],
    steps:['Mixer 20 secondes','Servir avec quelques framboises fra\u00eeches si dispo'],
    tips:'Les fruits surgelés donnent une texture glacée parfaite sans glaçons.' },

  // === CARAMEL SALÉ ===
  { id:'sm_caramel_01', name:'Caramel Salé Express', flavors:['caramel_sale'], goal:['muscle','recovery'], timing:'post', cal:310, p:31, c:26, f:9, prep:'2min',
    ingredients:[{name:'Whey caramel sal\u00e9',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Banane',qty:60,unit:'g'},{name:'Pincée de sel',qty:1,unit:'g'}],
    steps:['Mixer banane + lait 10 secondes','Ajouter la whey + sel','Shaker 15 secondes'],
    tips:'La pincée de sel amplifie le goût caramel. Secret de chef !' },

  // === COOKIES & CREAM ===
  { id:'sm_cookies_01', name:'Cookies & Cream Shake', flavors:['cookies_cream'], goal:['muscle'], timing:'post', cal:300, p:33, c:17, f:11, prep:'1min',
    ingredients:[{name:'Whey cookies',qty:30,unit:'g'},{name:'Lait entier',qty:250,unit:'ml'},{name:'Cacao pur',qty:8,unit:'g'}],
    steps:['Shaker 20 secondes — pas besoin de blender','Boire froid'],
    tips:'Ajouter 2 glaçons pour une texture encore plus gourmande.' },

  // === TIRAMISU ===
  { id:'sm_tiramisu_01', name:'Tiramisu Protéiné', flavors:['tiramisu'], goal:['muscle','recovery'], timing:'anytime', cal:265, p:31, c:14, f:9, prep:'2min',
    ingredients:[{name:'Whey tiramisu',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Caf\u00e9 expresso froid',qty:50,unit:'ml'},{name:'Cacao pur',qty:5,unit:'g'}],
    steps:['Mélanger café froid + lait','Ajouter whey + cacao','Shaker 20 secondes'],
    tips:'Préparer le café la veille et le mettre au frigo pour un tiramisu glacé.' },

  // === ORANGE ===
  { id:'sm_orange_01', name:'Orange Soleil', flavors:['orange'], goal:['performance','fat_loss'], timing:'pre', cal:240, p:29, c:21, f:4, prep:'2min',
    ingredients:[{name:'Whey orange',qty:30,unit:'g'},{name:'Eau de coco',qty:200,unit:'ml'},{name:'Lait demi-\u00e9cr\u00e9m\u00e9',qty:150,unit:'ml'},{name:'Jus de citron',qty:20,unit:'ml'}],
    steps:['Mélanger eau de coco + lait','Ajouter whey + jus citron','Shaker 20 secondes'],
    tips:'L\'eau de coco apporte des électrolytes naturels — idéal avant l\'effort.' },

  // === BIRTHDAY CAKE ===
  { id:'sm_birthday_01', name:'Birthday Cake Shake', flavors:['birthday_cake'], goal:['muscle'], timing:'post', cal:285, p:32, c:16, f:10, prep:'1min',
    ingredients:[{name:'Whey birthday cake',qty:30,unit:'g'},{name:'Lait entier',qty:250,unit:'ml'},{name:'Extrait vanille',qty:3,unit:'ml'}],
    steps:['Shaker 20 secondes','C\'est prêt'],
    tips:'Simple et festif. Parfait comme récompense post-entraînement.' },

  // === CANNELLE ===
  { id:'sm_cinnamon_01', name:'Cannelle Dorée', flavors:['cinnamon'], goal:['muscle','fat_loss'], timing:'anytime', cal:305, p:31, c:26, f:9, prep:'2min',
    ingredients:[{name:'Whey cannelle',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Banane',qty:50,unit:'g'},{name:'Cannelle',qty:3,unit:'g'}],
    steps:['Mixer banane + lait','Ajouter whey + cannelle','Shaker 15 secondes'],
    tips:'La cannelle régule la glycémie — excellent pour stabiliser l\'énergie.' },

  // === CHEESECAKE CITRON ===
  { id:'sm_cheesecake_01', name:'Cheesecake Citron Frais', flavors:['cheesecake_citron'], goal:['fat_loss','recovery'], timing:'anytime', cal:260, p:42, c:19, f:2, prep:'2min',
    ingredients:[{name:'Whey cheesecake citron',qty:30,unit:'g'},{name:'Fromage blanc 0%',qty:150,unit:'g'},{name:'Jus de citron',qty:30,unit:'ml'},{name:'Miel',qty:10,unit:'g'}],
    steps:['Mixer fromage blanc + jus citron + miel','Ajouter la whey','Mixer 15 secondes'],
    tips:'Texture ultra-crémeuse. Peut se manger en smoothie bowl avec des fruits.' },

  // === TOFFEE ===
  { id:'sm_toffee_01', name:'Toffee Choco Banane', flavors:['toffee'], goal:['muscle'], timing:'post', cal:345, p:32, c:32, f:9, prep:'2min',
    ingredients:[{name:'Whey toffee',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Banane',qty:80,unit:'g'},{name:'Cacao pur',qty:5,unit:'g'}],
    steps:['Mixer banane + lait + cacao','Ajouter la whey','Shaker 15 secondes'],
    tips:'La banane + toffee = combo caramel naturel sans sucre ajouté.' },

  // === CHOCOLAT BLANC ===
  { id:'sm_whitechoc_01', name:'Chocolat Blanc Fraise', flavors:['white_chocolate'], goal:['recovery','muscle'], timing:'post', cal:300, p:31, c:23, f:9, prep:'2min',
    ingredients:[{name:'Whey chocolat blanc',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Fraises congel\u00e9es',qty:80,unit:'g'}],
    steps:['Mixer fraises + lait 20 secondes','Ajouter la whey','Mixer 10 secondes'],
    tips:'Le contraste chocolat blanc + fraise est exceptionnel. Un dessert protéiné.' },

  // === PIÑA COLADA ===
  { id:'sm_pina_01', name:'Pi\u00f1a Colada Protéinée', flavors:['pina_colada'], goal:['recovery','performance'], timing:'post', cal:285, p:25, c:27, f:9, prep:'3min',
    ingredients:[{name:'Whey pi\u00f1a colada',qty:30,unit:'g'},{name:'Eau de coco',qty:200,unit:'ml'},{name:'Ananas',qty:100,unit:'g'},{name:'Lait de coco',qty:30,unit:'ml'}],
    steps:['Mixer ananas + eau de coco + lait de coco','Ajouter la whey','Mixer 15 secondes'],
    tips:'Fermer les yeux, boire lentement. Vous êtes à la plage.' },

  // === VANILLE CANNELLE ===
  { id:'sm_vanilla_cinn_01', name:'Vanille Cannelle Douce', flavors:['vanilla_cinnamon'], goal:['muscle','recovery'], timing:'anytime', cal:285, p:31, c:20, f:9, prep:'1min',
    ingredients:[{name:'Whey vanille cannelle',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Cannelle',qty:2,unit:'g'},{name:'Miel',qty:8,unit:'g'}],
    steps:['Tout dans le shaker','Shaker 20 secondes'],
    tips:'La cannelle double l\'effet saveur sans calorie. Parfait en hiver.' },

  // === SPÉCULOOS ===
  { id:'sm_speculoos_01', name:'Sp\u00e9culoos Shake', flavors:['speculoos'], goal:['muscle'], timing:'post', cal:340, p:31, c:33, f:9, prep:'2min',
    ingredients:[{name:'Whey sp\u00e9culoos',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Banane',qty:80,unit:'g'},{name:'Cannelle',qty:2,unit:'g'}],
    steps:['Mixer banane + lait','Ajouter whey + cannelle','Shaker 15 secondes'],
    tips:'La banane mûre + cannelle mime parfaitement le biscuit spéculoos.' },

  // === CAPPUCCINO ===
  { id:'sm_cappuccino_01', name:'Cappuccino Glacé', flavors:['cappuccino'], goal:['performance','fat_loss'], timing:'pre', cal:255, p:31, c:13, f:9, prep:'2min',
    ingredients:[{name:'Whey cappuccino',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Caf\u00e9 expresso froid',qty:80,unit:'ml'},{name:'Gla\u00e7ons',qty:80,unit:'g'}],
    steps:['Préparer le café et laisser refroidir','Shaker tous les ingrédients avec glaçons','Boire immédiatement'],
    tips:'Distinct du café classique : le cappuccino whey donne un goût plus mousseux et doux.' },

  // === PAIN D'ÉPICES ===
  { id:'sm_gingerbread_01', name:"Pain d'\u00c9pices Hivernal", flavors:['gingerbread'], goal:['recovery','muscle'], timing:'anytime', cal:290, p:31, c:22, f:9, prep:'2min',
    ingredients:[{name:'Whey pain d\'\u00e9pices',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Gingembre r\u00e2p\u00e9',qty:5,unit:'g'},{name:'Miel',qty:10,unit:'g'}],
    steps:['Mixer tous les ingrédients 20 secondes','Saupoudrer de cannelle si souhaité'],
    tips:'Le gingembre frais amplifie les épices de la whey. Excellent en récupération hivernale.' },

  // === RASPBERRY #2-3 ===
  { id:'sm_rasp_02', name:'Framboise Coco Flash', flavors:['raspberry'], goal:['fat_loss','recovery'], timing:'post', cal:192, p:25, c:19, f:2, prep:'1min',
    ingredients:[{name:'Whey framboise',qty:30,unit:'g'},{name:'Eau de coco',qty:200,unit:'ml'},{name:'Fraises congelées',qty:80,unit:'g'}],
    steps:['Verser l\'eau de coco dans le shaker','Ajouter la whey framboise, shaker 20 secondes','Écraser les fraises congelées dans le verre avant de servir'],
    tips:'Les fraises congelées rafraîchissent sans blender — écrasez-les légèrement à la fourchette.' },
  { id:'sm_rasp_03', name:'Framboise Myrtille Grec', flavors:['raspberry'], goal:['muscle','recovery'], timing:'post', cal:253, p:35, c:24, f:2, prep:'3min',
    ingredients:[{name:'Whey framboise',qty:30,unit:'g'},{name:'Yaourt grec 0%',qty:100,unit:'g'},{name:'Myrtilles congelées',qty:80,unit:'g'},{name:'Miel',qty:10,unit:'g'},{name:'Glaçons',qty:100,unit:'g'}],
    steps:['Placer myrtilles + glaçons dans le blender','Ajouter yaourt, whey et miel','Mixer 30 secondes jusqu\'à texture lisse'],
    tips:'Les myrtilles surgelées remplacent la glace pilée — texture naturellement épaisse et crémeuse.' },

  // === CARAMEL SALÉ #2-3 ===
  { id:'sm_caramel_02', name:'Caramel Lait Flash', flavors:['caramel_sale'], goal:['muscle','performance'], timing:'anytime', cal:280, p:32, c:15, f:10, prep:'1min',
    ingredients:[{name:'Whey caramel salé',qty:30,unit:'g'},{name:'Lait entier',qty:250,unit:'ml'}],
    steps:['Verser le lait froid dans le shaker','Ajouter la whey caramel salé, shaker 30 secondes'],
    tips:'Lait bien froid = mousse plus dense et goût caramel plus prononcé.' },
  { id:'sm_caramel_03', name:'Caramel Banane Peanut Power', flavors:['caramel_sale'], goal:['muscle','performance'], timing:'pre', cal:391, p:34, c:37, f:12, prep:'4min',
    ingredients:[{name:'Whey caramel salé',qty:30,unit:'g'},{name:'Banane',qty:100,unit:'g'},{name:'Beurre de cacahuète',qty:15,unit:'g'},{name:'Lait demi-écrémé',qty:150,unit:'ml'}],
    steps:['Couper la banane, mettre dans le blender avec le lait','Ajouter whey + beurre de cacahuète','Mixer 40 secondes'],
    tips:'Une pincée de fleur de sel intensifie le contraste caramel-cacahuète.' },

  // === COOKIES & CREAM #2-3 ===
  { id:'sm_cookies_02', name:'Cookies Cacao Shaker', flavors:['cookies_cream'], goal:['muscle','fat_loss'], timing:'post', cal:282, p:34, c:20, f:8, prep:'1min',
    ingredients:[{name:'Whey cookies',qty:30,unit:'g'},{name:'Lait demi-écrémé',qty:250,unit:'ml'},{name:'Cacao pur',qty:10,unit:'g'}],
    steps:['Verser le lait dans le shaker, ajouter le cacao d\'abord pour éviter les grumeaux','Ajouter la whey cookies, shaker 30 secondes'],
    tips:'Ajouter le cacao avant la whey évite qu\'il colle au fond du shaker.' },
  { id:'sm_cookies_03', name:'Cookies Cream Banana Split', flavors:['cookies_cream'], goal:['muscle'], timing:'post', cal:363, p:41, c:28, f:10, prep:'4min',
    ingredients:[{name:'Whey cookies',qty:30,unit:'g'},{name:'Fromage blanc 0%',qty:100,unit:'g'},{name:'Banane',qty:80,unit:'g'},{name:'Beurre de cacahuète',qty:15,unit:'g'}],
    steps:['Placer banane coupée, fromage blanc et beurre de cacahuète dans le blender','Ajouter la whey cookies','Mixer 45 secondes — texture épaisse à manger à la cuillère'],
    tips:'Congeler la banane 2h avant pour une texture façon glace sans glaçons.' },

  // === TIRAMISU #2-3 ===
  { id:'sm_tiramisu_02', name:'Tiramisu Expresso Shaker', flavors:['tiramisu'], goal:['performance','muscle'], timing:'pre', cal:249, p:31, c:12, f:9, prep:'1min',
    ingredients:[{name:'Whey tiramisu',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Café expresso froid',qty:60,unit:'ml'}],
    steps:['Préparer un expresso et le laisser refroidir 2 min','Verser lait + café dans le shaker, ajouter la whey, shaker 20 secondes'],
    tips:'La caféine amplifie la performance — idéal 30 min avant l\'effort.' },
  { id:'sm_tiramisu_03', name:'Tiramisu Fromage Blanc Café', flavors:['tiramisu'], goal:['fat_loss','muscle'], timing:'anytime', cal:263, p:44, c:13, f:4, prep:'3min',
    ingredients:[{name:'Whey tiramisu',qty:30,unit:'g'},{name:'Fromage blanc 0%',qty:150,unit:'g'},{name:'Café expresso froid',qty:80,unit:'ml'},{name:'Cacao pur',qty:10,unit:'g'},{name:'Cannelle',qty:2,unit:'g'}],
    steps:['Verser le café froid dans le blender avec le fromage blanc','Ajouter whey, cacao et cannelle','Mixer 20 secondes — saupoudrer de cacao avant de servir'],
    tips:'Texture épaisse façon dessert — peut se manger en bol avec des myrtilles.' },

  // === ORANGE #2-3 ===
  { id:'sm_orange_02', name:'Orange Coco Vitesse', flavors:['orange'], goal:['fat_loss','recovery'], timing:'post', cal:173, p:25, c:15, f:2, prep:'1min',
    ingredients:[{name:'Whey orange',qty:30,unit:'g'},{name:'Eau de coco',qty:250,unit:'ml'}],
    steps:['Verser l\'eau de coco froide dans le shaker','Ajouter la whey orange, shaker 20 secondes'],
    tips:'Eau de coco + électrolytes naturels — idéal récupération cardio.' },
  { id:'sm_orange_03', name:'Orange Ananas Tropical Grec', flavors:['orange'], goal:['recovery','performance'], timing:'post', cal:264, p:35, c:27, f:2, prep:'4min',
    ingredients:[{name:'Whey orange',qty:30,unit:'g'},{name:'Ananas',qty:120,unit:'g'},{name:'Yaourt grec 0%',qty:100,unit:'g'},{name:'Eau de coco',qty:100,unit:'ml'}],
    steps:['Couper l\'ananas en morceaux, mettre dans le blender avec l\'eau de coco','Ajouter yaourt grec + whey orange','Mixer 30 secondes, servir avec dés d\'ananas frais'],
    tips:'L\'ananas contient de la bromélaïne — enzyme anti-inflammatoire qui favorise la récupération.' },

  // === BIRTHDAY CAKE #2-3 ===
  { id:'sm_birthday_02', name:'Birthday Shake Express', flavors:['birthday_cake'], goal:['muscle'], timing:'anytime', cal:217, p:31, c:12, f:5, prep:'1min',
    ingredients:[{name:'Whey birthday cake',qty:30,unit:'g'},{name:'Lait demi-écrémé',qty:200,unit:'ml'}],
    steps:['Verser le lait dans le shaker','Ajouter la whey birthday cake, shaker 20 secondes'],
    tips:'Boire immédiatement pour une texture mousseuse optimale.' },
  { id:'sm_birthday_03', name:"Gâteau d'Anniversaire Tropical", flavors:['birthday_cake'], goal:['muscle','performance'], timing:'post', cal:327, p:30, c:36, f:7, prep:'3min',
    ingredients:[{name:'Whey birthday cake',qty:30,unit:'g'},{name:'Lait entier',qty:150,unit:'ml'},{name:'Banane',qty:80,unit:'g'},{name:'Miel',qty:10,unit:'g'}],
    steps:['Couper la banane, placer dans le blender','Ajouter lait, whey et miel','Mixer 30-45 secondes jusqu\'à texture lisse'],
    tips:'Idéal dans les 30 min post-entraînement pour recharger les glucides.' },

  // === CANNELLE #2-3 ===
  { id:'sm_cinnamon_02', name:'Cannelle Pure Power', flavors:['cinnamon'], goal:['fat_loss'], timing:'anytime', cal:126, p:24, c:4, f:2, prep:'1min',
    ingredients:[{name:'Whey cannelle',qty:30,unit:'g'},{name:'Eau',qty:250,unit:'ml'},{name:'Cannelle',qty:2,unit:'g'}],
    steps:['Verser l\'eau froide dans le shaker','Ajouter whey cannelle + cannelle moulue, shaker 20 secondes'],
    tips:'La cannelle amplifie le goût de la whey et aide à réguler la glycémie.' },
  { id:'sm_cinnamon_03', name:'Bowl Cannelle Douce', flavors:['cinnamon'], goal:['muscle','recovery'], timing:'post', cal:326, p:41, c:36, f:2, prep:'3min',
    ingredients:[{name:'Whey cannelle',qty:30,unit:'g'},{name:'Yaourt grec 0%',qty:150,unit:'g'},{name:'Banane',qty:80,unit:'g'},{name:'Cannelle',qty:2,unit:'g'},{name:'Miel',qty:10,unit:'g'}],
    steps:['Placer banane + yaourt grec + whey + cannelle + miel dans le blender','Mixer 30 secondes à pleine puissance'],
    tips:'Riche en protéines, faible en graisses — parfait pour la récupération musculaire.' },

  // === CHEESECAKE CITRON #2-3 ===
  { id:'sm_cheesecake_02', name:'Cheesecake Frais Express', flavors:['cheesecake_citron'], goal:['fat_loss','muscle'], timing:'anytime', cal:218, p:42, c:8, f:2, prep:'1min',
    ingredients:[{name:'Whey cheesecake citron',qty:30,unit:'g'},{name:'Fromage blanc 0%',qty:150,unit:'g'},{name:'Jus de citron',qty:30,unit:'ml'}],
    steps:['Verser le fromage blanc dans le shaker large','Ajouter whey + jus de citron, shaker ou fouet 20 secondes'],
    tips:'Le jus de citron frais renforce l\'acidité et donne un effet cheesecake très authentique.' },
  { id:'sm_cheesecake_03', name:'Fraise Cheesecake Glacé', flavors:['cheesecake_citron'], goal:['fat_loss','recovery'], timing:'anytime', cal:246, p:35, c:22, f:2, prep:'4min',
    ingredients:[{name:'Whey cheesecake citron',qty:30,unit:'g'},{name:'Yaourt grec 0%',qty:100,unit:'g'},{name:'Fraises congelées',qty:100,unit:'g'},{name:'Miel',qty:10,unit:'g'},{name:'Glaçons',qty:100,unit:'g'}],
    steps:['Placer fraises congelées + yaourt + whey + miel dans le blender','Ajouter glaçons, mixer 45 secondes jusqu\'à texture épaisse et glacée'],
    tips:'Les fraises congelées accentuent la fraîcheur citronnée — ne pas décongeler avant usage.' },

  // === TOFFEE #2-3 ===
  { id:'sm_toffee_02', name:'Toffee Lait Flash', flavors:['toffee'], goal:['muscle'], timing:'anytime', cal:253, p:31, c:12, f:9, prep:'1min',
    ingredients:[{name:'Whey toffee',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'}],
    steps:['Verser le lait entier froid dans le shaker','Ajouter la whey toffee, shaker 20 secondes'],
    tips:'Lait entier = profil caramel du toffee encore plus gourmand.' },
  { id:'sm_toffee_03', name:'Toffee Banane Cacahuète', flavors:['toffee'], goal:['muscle','performance'], timing:'pre', cal:392, p:34, c:37, f:12, prep:'4min',
    ingredients:[{name:'Whey toffee',qty:30,unit:'g'},{name:'Banane',qty:100,unit:'g'},{name:'Beurre de cacahuète',qty:15,unit:'g'},{name:'Lait demi-écrémé',qty:150,unit:'ml'},{name:'Glaçons',qty:100,unit:'g'}],
    steps:['Couper la banane, mettre dans le blender avec le lait','Ajouter whey + beurre de cacahuète + glaçons','Mixer 45 secondes à pleine puissance'],
    tips:'Glucides rapides (banane) + énergie durable (cacahuète) = pré-workout parfait.' },

  // === CHOCOLAT BLANC #2-3 ===
  { id:'sm_whitechoc_02', name:'Coco Blanc Léger', flavors:['white_chocolate'], goal:['fat_loss','recovery'], timing:'anytime', cal:178, p:25, c:15, f:2, prep:'1min',
    ingredients:[{name:'Whey chocolat blanc',qty:30,unit:'g'},{name:'Eau de coco',qty:250,unit:'ml'}],
    steps:['Verser l\'eau de coco fraîche dans le shaker','Ajouter la whey chocolat blanc, shaker 20 secondes'],
    tips:'Eau de coco + électrolytes naturels — idéal après effort intense sous la chaleur.' },
  { id:'sm_whitechoc_03', name:'Chocolat Blanc Myrtille Amande', flavors:['white_chocolate'], goal:['muscle','recovery'], timing:'post', cal:337, p:33, c:22, f:13, prep:'4min',
    ingredients:[{name:'Whey chocolat blanc',qty:30,unit:'g'},{name:'Lait demi-écrémé',qty:150,unit:'ml'},{name:'Myrtilles congelées',qty:80,unit:'g'},{name:'Purée d\'amande',qty:15,unit:'g'},{name:'Glaçons',qty:100,unit:'g'}],
    steps:['Verser le lait dans le blender, ajouter myrtilles congelées + glaçons','Incorporer whey + purée d\'amande','Mixer 45 secondes jusqu\'à texture onctueuse et violacée'],
    tips:'Myrtilles riches en antioxydants — parfaites pour réduire l\'inflammation post-effort.' },

  // === PIÑA COLADA #2-3 ===
  { id:'sm_pina_02', name:'Coco Express', flavors:['pina_colada'], goal:['muscle','performance'], timing:'post', cal:173, p:25, c:15, f:2, prep:'1min',
    ingredients:[{name:'Whey piña colada',qty:30,unit:'g'},{name:'Eau de coco',qty:250,unit:'ml'}],
    steps:['Verser l\'eau de coco dans le shaker','Ajouter la whey piña colada, shaker 20 secondes'],
    tips:'L\'eau de coco froide rend le shaker ultra-rafraîchissant après l\'effort.' },
  { id:'sm_pina_03', name:'Tropicale Crémeuse', flavors:['pina_colada'], goal:['muscle','recovery'], timing:'post', cal:217, p:25, c:21, f:4, prep:'3min',
    ingredients:[{name:'Whey piña colada',qty:30,unit:'g'},{name:'Ananas',qty:100,unit:'g'},{name:'Eau de coco',qty:100,unit:'ml'},{name:'Lait de coco',qty:30,unit:'ml'},{name:'Glaçons',qty:100,unit:'g'}],
    steps:['Couper l\'ananas, mettre dans le blender avec glaçons','Ajouter eau de coco + lait de coco','Incorporer la whey, mixer 30 secondes à pleine puissance'],
    tips:'Un filet de jus de citron vert rehausse l\'acidité naturelle de l\'ananas.' },

  // === VANILLE CANNELLE #2-3 ===
  { id:'sm_vanilla_cinn_02', name:'Lait Vanille Cannelle Flash', flavors:['vanilla_cinnamon'], goal:['muscle','recovery'], timing:'anytime', cal:253, p:31, c:13, f:9, prep:'1min',
    ingredients:[{name:'Whey vanille cannelle',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Cannelle',qty:2,unit:'g'}],
    steps:['Verser le lait entier froid dans le shaker','Ajouter whey + cannelle, shaker 25 secondes'],
    tips:'Lait entier bien froid pour une texture plus onctueuse et mousseuse.' },
  { id:'sm_vanilla_cinn_03', name:'Banana Vanille Épicée', flavors:['vanilla_cinnamon'], goal:['muscle','performance'], timing:'pre', cal:333, p:44, c:32, f:3, prep:'4min',
    ingredients:[{name:'Whey vanille cannelle',qty:30,unit:'g'},{name:'Yaourt grec 0%',qty:150,unit:'g'},{name:'Banane',qty:80,unit:'g'},{name:'Lait demi-écrémé',qty:100,unit:'ml'},{name:'Cannelle',qty:2,unit:'g'}],
    steps:['Éplucher et couper la banane en rondelles','Mettre yaourt + banane + lait dans le blender','Ajouter whey + cannelle, mixer 30 secondes'],
    tips:'Congeler la banane à l\'avance pour un smoothie glacé sans glaçons.' },

  // === SPÉCULOOS #2-3 ===
  { id:'sm_speculoos_02', name:'Shaker Biscuit Lacté', flavors:['speculoos'], goal:['muscle','fat_loss'], timing:'post', cal:237, p:32, c:16, f:5, prep:'1min',
    ingredients:[{name:'Whey spéculoos',qty:30,unit:'g'},{name:'Lait demi-écrémé',qty:250,unit:'ml'},{name:'Cannelle',qty:2,unit:'g'}],
    steps:['Verser le lait froid dans le shaker','Ajouter whey spéculoos + cannelle, shaker 20 secondes'],
    tips:'La cannelle amplifie les notes épicées du spéculoos sans ajouter de calories.' },
  { id:'sm_speculoos_03', name:'Fromage Blanc Épice Dorée', flavors:['speculoos'], goal:['fat_loss','muscle'], timing:'anytime', cal:319, p:43, c:33, f:2, prep:'4min',
    ingredients:[{name:'Whey spéculoos',qty:30,unit:'g'},{name:'Fromage blanc 0%',qty:150,unit:'g'},{name:'Banane',qty:70,unit:'g'},{name:'Miel',qty:10,unit:'g'},{name:'Cannelle',qty:2,unit:'g'}],
    steps:['Couper la banane, placer dans le blender avec fromage blanc + miel','Ajouter whey + cannelle','Mixer 25 secondes jusqu\'à crème homogène'],
    tips:'Texture épaisse — peut se manger à la cuillère comme un bol protéiné.' },

  // === CAPPUCCINO #2-3 ===
  { id:'sm_cappuccino_02', name:'Expresso Lait Flash', flavors:['cappuccino'], goal:['performance','muscle'], timing:'pre', cal:253, p:31, c:13, f:9, prep:'1min',
    ingredients:[{name:'Whey cappuccino',qty:30,unit:'g'},{name:'Café expresso froid',qty:100,unit:'ml'},{name:'Lait entier',qty:200,unit:'ml'}],
    steps:['Préparer un double expresso, laisser refroidir','Verser café + lait dans le shaker, ajouter whey, shaker 20 secondes'],
    tips:'La caféine double l\'effet énergisant avant l\'entraînement.' },
  { id:'sm_cappuccino_03', name:'Frozen Cappuccino Banana', flavors:['cappuccino'], goal:['muscle','recovery'], timing:'post', cal:255, p:35, c:25, f:2, prep:'4min',
    ingredients:[{name:'Whey cappuccino',qty:30,unit:'g'},{name:'Yaourt grec 0%',qty:100,unit:'g'},{name:'Café expresso froid',qty:50,unit:'ml'},{name:'Banane',qty:80,unit:'g'},{name:'Glaçons',qty:100,unit:'g'}],
    steps:['Préparer un expresso simple, laisser refroidir','Couper la banane en rondelles','Mixer tous les ingrédients + glaçons 40 secondes'],
    tips:'Banane bien mûre pour équilibrer l\'amertume du café.' },

  // === PAIN D'ÉPICES #2-3 ===
  { id:'sm_gingerbread_02', name:"Shaker Pain d'Épices Lacté", flavors:['gingerbread'], goal:['muscle','recovery'], timing:'post', cal:233, p:32, c:15, f:5, prep:'1min',
    ingredients:[{name:"Whey pain d'épices",qty:30,unit:'g'},{name:'Lait demi-écrémé',qty:250,unit:'ml'},{name:'Gingembre râpé',qty:5,unit:'g'}],
    steps:['Verser le lait froid dans le shaker','Ajouter whey + gingembre râpé, shaker 25 secondes'],
    tips:'Le gingembre frais râpé donne un piquant naturel qui réveille les saveurs du pain d\'épices.' },
  { id:'sm_gingerbread_03', name:'Bol Épicé Fromage Banane', flavors:['gingerbread'], goal:['fat_loss','muscle'], timing:'anytime', cal:315, p:43, c:32, f:2, prep:'4min',
    ingredients:[{name:"Whey pain d'épices",qty:30,unit:'g'},{name:'Fromage blanc 0%',qty:150,unit:'g'},{name:'Banane',qty:70,unit:'g'},{name:'Gingembre râpé',qty:5,unit:'g'},{name:'Miel',qty:10,unit:'g'}],
    steps:['Couper la banane en morceaux','Placer fromage blanc + banane + miel dans le blender','Ajouter whey + gingembre râpé, mixer 30 secondes'],
    tips:'Râper le gingembre très finement pour éviter les morceaux fibreux dans la texture.' },

  // === CHOCOLAT #5-11 ===
  { id:'sm_choco_05', name:'Forêt Noire Express', flavors:['chocolate'], goal:['fat_loss'], timing:'post', cal:234, p:36, c:18, f:2, prep:'1min',
    ingredients:[{name:'Whey chocolat',qty:30,unit:'g'},{name:'Fraises congelées',qty:150,unit:'g'},{name:'Yaourt grec 0%',qty:100,unit:'g'},{name:'Eau',qty:100,unit:'ml'}],
    steps:['Verser l\'eau + yaourt dans le blender','Ajouter fraises congelées + whey','Mixer 30 secondes'],
    tips:'Les fraises congelées remplacent les glaçons et évitent de diluer les saveurs — idéal post-séance sèche.' },
  { id:'sm_choco_06', name:'Avocat Noir', flavors:['chocolate'], goal:['muscle'], timing:'anytime', cal:419, p:34, c:19, f:23, prep:'3min',
    ingredients:[{name:'Whey chocolat',qty:30,unit:'g'},{name:'Avocat',qty:75,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Cacao pur',qty:10,unit:'g'}],
    steps:['Couper l\'avocat mûr en morceaux, placer dans le blender','Ajouter lait + whey + cacao','Mixer à haute vitesse 60 secondes, servir immédiatement'],
    tips:'L\'avocat apporte des acides gras insaturés de qualité pour une prise de masse propre.' },
  { id:'sm_choco_07', name:'Jaffa Power', flavors:['chocolate'], goal:['performance'], timing:'pre', cal:266, p:26, c:36, f:2, prep:'1min',
    ingredients:[{name:'Whey chocolat',qty:30,unit:'g'},{name:"Jus d'orange",qty:150,unit:'ml'},{name:'Banane',qty:80,unit:'g'},{name:'Eau',qty:50,unit:'ml'}],
    steps:['Peler la banane, couper en rondelles','Verser jus d\'orange + eau + whey dans le blender','Ajouter banane, mixer 45 secondes'],
    tips:'Le duo chocolat-orange façon Jaffa Cake : glucides rapides pour charger le glycogène avant l\'effort.' },
  { id:'sm_choco_08', name:'After Eight Recovery', flavors:['chocolate'], goal:['recovery'], timing:'post', cal:218, p:42, c:8, f:2, prep:'3min',
    ingredients:[{name:'Whey chocolat',qty:30,unit:'g'},{name:'Fromage blanc 0%',qty:150,unit:'g'},{name:'Menthe fraîche',qty:8,unit:'g'},{name:'Glaçons',qty:100,unit:'g'},{name:'Eau',qty:80,unit:'ml'}],
    steps:['Effeuiller la menthe, placer dans le blender avec l\'eau','Ajouter fromage blanc + whey + glaçons','Mixer 90 secondes à puissance max'],
    tips:'Le menthol active une sensation de froid — choisir de la menthe poivrée pour un arôme plus intense.' },
  { id:'sm_choco_09', name:'Dark Espresso Boost', flavors:['chocolate'], goal:['performance'], timing:'pre', cal:277, p:31, c:27, f:5, prep:'1min',
    ingredients:[{name:'Whey chocolat',qty:30,unit:'g'},{name:'Café expresso froid',qty:100,unit:'ml'},{name:'Lait demi-écrémé',qty:200,unit:'ml'},{name:'Banane',qty:60,unit:'g'}],
    steps:['Préparer un double expresso et laisser refroidir','Verser lait + café + whey dans le shaker','Ajouter banane coupée, shaker 60 secondes'],
    tips:'Caféine + glucides banane = pic d\'énergie parfaitement synchronisé avec l\'échauffement (30-45 min avant).' },
  { id:'sm_choco_10', name:'Bounty Shake', flavors:['chocolate'], goal:['muscle'], timing:'anytime', cal:285, p:26, c:34, f:5, prep:'1min',
    ingredients:[{name:'Whey chocolat',qty:30,unit:'g'},{name:'Lait de coco',qty:50,unit:'ml'},{name:'Eau de coco',qty:150,unit:'ml'},{name:'Banane',qty:100,unit:'g'}],
    steps:['Éplucher la banane (idéalement congelée à l\'avance)','Verser eau de coco + lait de coco + whey dans le blender','Ajouter banane, mixer 45 secondes'],
    tips:'L\'eau de coco apporte potassium et électrolytes — avantageuse en période d\'entraînement intense.' },
  { id:'sm_choco_11', name:'Brownie Batter', flavors:['chocolate'], goal:['muscle'], timing:'anytime', cal:415, p:36, c:25, f:19, prep:'1min',
    ingredients:[{name:'Whey chocolat',qty:30,unit:'g'},{name:'Beurre de cacahuète',qty:20,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Miel',qty:10,unit:'g'}],
    steps:['Verser le lait dans le shaker','Ajouter whey + beurre de cacahuète + miel','Shaker 60 secondes — texture façon pâte à brownie liquide'],
    tips:'Une pincée de sel fin fait ressortir les arômes chocolat-cacahuète comme dans un vrai brownie.' },

  // === VANILLE #5-11 ===
  { id:'sm_van_05', name:'Tropical Sunrise', flavors:['vanilla'], goal:['performance'], timing:'post', cal:258, p:25, c:35, f:2, prep:'2min',
    ingredients:[{name:'Whey vanille',qty:30,unit:'g'},{name:'Mangue',qty:150,unit:'g'},{name:'Eau de coco',qty:200,unit:'ml'},{name:'Glaçons',qty:80,unit:'g'}],
    steps:['Verser l\'eau de coco dans le blender','Ajouter mangue + glaçons, mixer 30 secondes','Ajouter la whey, mixer 20 secondes supplémentaires'],
    tips:'Mangue congelée à la place de la fraîche pour un résultat encore plus frais sans glaçons.' },
  { id:'sm_van_06', name:'Zen Matcha Latte', flavors:['vanilla'], goal:['fat_loss'], timing:'pre', cal:250, p:40, c:18, f:2, prep:'3min',
    ingredients:[{name:'Whey vanille',qty:30,unit:'g'},{name:'Yaourt grec 0%',qty:150,unit:'g'},{name:'Matcha',qty:5,unit:'g'},{name:'Miel',qty:10,unit:'g'},{name:'Eau',qty:100,unit:'ml'}],
    steps:['Délayer le matcha dans l\'eau tiède (pas bouillante)','Verser dans le blender avec yaourt + miel','Ajouter la whey, mixer 1 minute'],
    tips:'Matcha grade culinaire pour le goût, cérémonie pour l\'intensité — max 5g pour rester sous la caféine d\'un espresso.' },
  { id:'sm_van_07', name:'Fraise Velvet', flavors:['vanilla'], goal:['recovery'], timing:'anytime', cal:269, p:32, c:24, f:5, prep:'2min',
    ingredients:[{name:'Whey vanille',qty:30,unit:'g'},{name:'Fraises congelées',qty:150,unit:'g'},{name:'Lait demi-écrémé',qty:200,unit:'ml'},{name:'Extrait vanille',qty:3,unit:'ml'}],
    steps:['Verser lait + extrait de vanille dans le blender','Ajouter fraises congelées, mixer 40 secondes','Ajouter la whey, mixer 20 secondes'],
    tips:'Fraises congelées = glaçons + vitamines — pas besoin d\'en ajouter.' },
  { id:'sm_van_08', name:'Espresso Power', flavors:['vanilla'], goal:['performance'], timing:'pre', cal:333, p:31, c:32, f:9, prep:'1min',
    ingredients:[{name:'Whey vanille',qty:30,unit:'g'},{name:'Lait entier',qty:200,unit:'ml'},{name:'Café expresso froid',qty:100,unit:'ml'},{name:'Banane',qty:80,unit:'g'}],
    steps:['Préparer un double expresso à l\'avance, laisser refroidir','Verser lait + café + banane + whey dans le shaker','Shaker 45 secondes, consommer 30-45 min avant l\'effort'],
    tips:'Caféine + glucides banane = focus et énergie parfaitement calibrés pour une séance intense.' },
  { id:'sm_van_09', name:'Blueberry Storm', flavors:['vanilla'], goal:['recovery'], timing:'post', cal:287, p:39, c:26, f:3, prep:'3min',
    ingredients:[{name:'Whey vanille',qty:30,unit:'g'},{name:'Myrtilles congelées',qty:120,unit:'g'},{name:'Yaourt grec 0%',qty:100,unit:'g'},{name:'Lait demi-écrémé',qty:100,unit:'ml'}],
    steps:['Verser lait + yaourt dans le blender','Ajouter myrtilles congelées, mixer 1 minute à pleine puissance','Incorporer la whey, mixer 30 secondes'],
    tips:'Anthocyanes des myrtilles → réduction inflammation musculaire post-effort. Dans les 30 min après la séance.' },
  { id:'sm_van_10', name:'Coco Paradise', flavors:['vanilla'], goal:['muscle'], timing:'anytime', cal:354, p:38, c:37, f:6, prep:'3min',
    ingredients:[{name:'Whey vanille',qty:30,unit:'g'},{name:'Fromage blanc 0%',qty:100,unit:'g'},{name:'Banane',qty:100,unit:'g'},{name:'Eau de coco',qty:150,unit:'ml'},{name:'Lait de coco',qty:60,unit:'ml'}],
    steps:['Verser eau de coco + lait de coco dans le blender','Ajouter fromage blanc + banane coupée, mixer 45 secondes','Incorporer la whey, mixer 30 secondes'],
    tips:'Fromage blanc 0% = densité protéique sans graisses, compensée par le lait de coco pour l\'onctuosité.' },
  { id:'sm_van_11', name:'Vanille Absolue', flavors:['vanilla'], goal:['muscle'], timing:'anytime', cal:512, p:39, c:44, f:20, prep:'1min',
    ingredients:[{name:'Whey vanille',qty:30,unit:'g'},{name:'Lait entier',qty:300,unit:'ml'},{name:'Beurre de cacahuète',qty:15,unit:'g'},{name:'Banane',qty:100,unit:'g'}],
    steps:['Couper la banane en rondelles','Verser lait + beurre de cacahuète + banane + whey dans le shaker ou blender','Mixer 1 minute, consommer immédiatement'],
    tips:'Densité calorique maximale en minimum de temps — idéal prise de masse ou collation entre repas.' }
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

  var overlay = h('div', {
    style: 'position:fixed;inset:0;background:var(--bg,#F4F3EE);z-index:9200;display:flex;flex-direction:column;overflow:hidden'
  });

  // Header
  var hdr = h('div', { style: 'display:flex;align-items:center;gap:10px;padding:16px 16px 12px;background:var(--card,#FFFFFF);box-shadow:0 2px 8px rgba(0,0,0,0.08);flex-shrink:0' });
  hdr.appendChild(h('button', {
    style: 'background:none;border:none;font-size:20px;cursor:pointer;padding:4px 8px',
    onclick: function() { S._recipePicker = null; window.render(); }
  }, '\u2190'));
  hdr.appendChild(h('div', { style: 'font-size:16px;font-weight:700;color:var(--black,#0A0A09);flex:1' }, '\uD83C\uDF7D Choisir une recette — ' + slotLabel));
  overlay.appendChild(hdr);

  // Search box
  var searchWrap = h('div', { style: 'padding:12px 16px;background:var(--card,#FFFFFF);border-top:1px solid var(--border,#E5E4DE);flex-shrink:0' });
  var searchInput = h('input', {
    type: 'text',
    placeholder: 'Rechercher une recette...',
    value: query,
    style: 'width:100%;padding:10px 14px;border:1.5px solid var(--border,#E5E4DE);border-radius:10px;font-size:14px;background:var(--bg,#F4F3EE);box-sizing:border-box',
    oninput: function(e) { S._recipePicker.query = e.target.value; window.render(); }
  });
  searchWrap.appendChild(searchInput);
  overlay.appendChild(searchWrap);

  // Recipe list
  var listWrap = h('div', { style: 'flex:1;overflow-y:auto;padding:12px 16px' });

  var pool = (typeof getPool === 'function') ? getPool(slotKey) : (window.RecipeEngine ? window.RecipeEngine.getPool(slotKey) : []);
  var q = query.toLowerCase().trim();
  var filtered = q ? pool.filter(function(r) { return r.n.toLowerCase().indexOf(q) >= 0; }) : pool;

  if (!filtered.length) {
    listWrap.appendChild(h('div', { style: 'text-align:center;color:#888;padding:40px 16px;font-size:14px' }, 'Aucune recette trouvée.'));
  } else {
    filtered.forEach(function(recipe) {
      var card = h('div', {
        style: 'background:var(--card,#FFFFFF);border-radius:12px;padding:14px 16px;margin-bottom:10px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;box-shadow:0 1px 4px rgba(0,0,0,0.06)',
        onclick: function() {
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
        }
      });
      var left = h('div', { style: 'flex:1;min-width:0' });
      left.appendChild(h('div', { style: 'font-size:14px;font-weight:600;color:var(--black,#0A0A09);white-space:nowrap;overflow:hidden;text-overflow:ellipsis' }, (recipe.f || '') + ' ' + recipe.n));
      left.appendChild(h('div', { style: 'font-size:12px;color:#888;margin-top:2px' }, recipe.k + ' kcal · ' + recipe.p + 'g prot · ' + recipe.g + 'g glu · ' + recipe.l + 'g lip'));
      card.appendChild(left);
      card.appendChild(h('div', { style: 'color:#1A3C5E;font-size:18px;margin-left:10px' }, '\u276F'));
      listWrap.appendChild(card);
    });
  }
  overlay.appendChild(listWrap);
  p.appendChild(overlay);
}

// ─── RENDER SMOOTHIE BAR ───
function renderSmoothieBar(p) {
  var S = window.S;
  p.innerHTML = '';
  var flavors = S.wheyFlavors || [];
  var allergies = (S.allergies || []).filter(function(a) { return a !== 'Aucune'; });
  var intolerances = (S.intolerances || []).filter(function(a) { return a !== 'Aucune'; });
  if (!flavors.length) {
    var flavorTip = h('div', {style:'background:rgba(107,63,160,0.08);border-left:3px solid #6B3FA0;padding:12px 16px;border-radius:0 10px 10px 0;margin-bottom:16px'});
    flavorTip.appendChild(h('div', {style:'font-size:13px;font-weight:700;color:#6B3FA0;margin-bottom:4px'}, '\uD83D\uDCA1 S\u00e9lectionnez vos parfums'));
    flavorTip.appendChild(h('div', {style:'font-size:12px;color:var(--fg2,#666);line-height:1.5'}, 'Vous voyez toutes les recettes car aucun parfum n\'est s\u00e9lectionn\u00e9. Pour filtrer selon ce que vous avez chez vous, allez dans Pr\u00e9f\u00e9rences > Whey & Suppl\u00e9ments et cochez vos parfums.'));
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
    var wheyVegetaleNote = h('div', {style:'background:var(--ivory2,#f8f7f2);border-left:3px solid var(--accent,#1A4A1A);padding:10px 14px;margin-bottom:12px;font-size:12px;color:var(--black,#0A0A09);font-family:"Helvetica Neue",Arial,sans-serif'});
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
      style: 'background:var(--card,#fff);border:1.5px solid var(--border,#E5E4DE);border-radius:14px;padding:14px 16px;margin-bottom:10px;cursor:pointer;transition:box-shadow 0.15s',
      onclick: function() { showSmoothieModal(sm); }
    });

    // Ligne 1 : badge timing + temps préparation
    var topRow = h('div', {style:'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px'});
    topRow.appendChild(h('span', {style:'display:inline-block;background:'+tColors[tKey]+';color:#fff;font-size:10px;font-weight:700;letter-spacing:0.4px;padding:3px 9px;border-radius:20px;text-transform:uppercase'}, tLabels[tKey]));
    if (sm.prep) topRow.appendChild(h('span', {style:'font-size:11px;color:var(--fg2,#888)'}, '⏱ ' + sm.prep));
    card.appendChild(topRow);

    // Ligne 2 : nom + chevron
    var nameRow = h('div', {style:'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px'});
    nameRow.appendChild(h('div', {style:'font-size:15px;font-weight:700;color:var(--text,#0A0A09);flex:1;line-height:1.3'}, sm.name));
    nameRow.appendChild(h('span', {style:'font-size:20px;color:var(--green,#1A4A1A);font-weight:700;margin-left:8px;flex-shrink:0'}, '\u276F'));
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
      macroRow.appendChild(h('span', {style:'font-size:11px;font-weight:600;padding:3px 8px;background:'+mi.bg+';color:'+mi.c+';border-radius:20px'}, mi.v));
    });
    card.appendChild(macroRow);

    // Ligne 4 : tags (parfums + objectifs)
    var allTags = (sm.flavors || []).concat(sm.goal || []);
    if (allTags.length > 0) {
      var tagRow = h('div', {style:'display:flex;flex-wrap:wrap;gap:4px'});
      allTags.slice(0, 5).forEach(function(tag) {
        tagRow.appendChild(h('span', {style:'font-size:10px;color:var(--fg2,#888);background:var(--bg,#F7F6F1);padding:2px 7px;border-radius:10px'}, '#' + tag.replace(/_/g,' ')));
      });
      card.appendChild(tagRow);
    }

    p.appendChild(card);
  });
}

// Modal smoothie détail
function showToast(msg, ms) {
  var toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#0A0A09;color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:600;z-index:99999;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,0.3)';
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
  var ov = h('div', {id:'_smoothie_modal_ov', style:'position:fixed;inset:0;background:rgba(10,10,9,0.55);z-index:99999;display:flex;align-items:flex-end;justify-content:center;padding:0',
    onclick:function(e){ if(e.target===ov){ var el=document.getElementById('_smoothie_modal_ov'); if(el&&el.parentNode) el.parentNode.removeChild(el); } }});

  // Sheet bottom-up (style bottom sheet mobile)
  var box = h('div', {style:'background:var(--card,#fff);border-radius:20px 20px 0 0;width:100%;max-width:480px;max-height:88vh;display:flex;flex-direction:column;overflow:hidden'});

  // ── HEADER ──
  var timingColors = {pre:'#E07B00', post:'#1A6B2A', other:'#4A4A8A'};
  var timingLabels = {pre:'⚡ Pré-workout', post:'💪 Post-workout', other:'🕐 Libre'};
  var tKey = sm.timing === 'pre' ? 'pre' : sm.timing === 'post' ? 'post' : 'other';
  var tColor = timingColors[tKey];

  var header = h('div', {style:'background:var(--green,#1A4A1A);padding:20px 20px 16px;position:relative;flex-shrink:0'});

  // Badge timing
  header.appendChild(h('span', {style:'display:inline-block;background:'+tColor+';color:#fff;font-size:10px;font-weight:700;letter-spacing:0.5px;padding:3px 10px;border-radius:20px;text-transform:uppercase;margin-bottom:10px'}, timingLabels[tKey]));

  // Titre
  var titleRow = h('div', {style:'display:flex;align-items:flex-start;justify-content:space-between;gap:12px'});
  titleRow.appendChild(h('div', {style:'font-size:20px;font-weight:800;color:#fff;line-height:1.2;flex:1'}, sm.name));
  titleRow.appendChild(h('button', {
    style:'flex-shrink:0;width:32px;height:32px;background:rgba(255,255,255,0.18);border:none;color:#fff;font-size:20px;cursor:pointer;border-radius:50%;display:flex;align-items:center;justify-content:center;line-height:1;margin-top:-2px',
    onclick:function(){ var el=document.getElementById('_smoothie_modal_ov'); if(el&&el.parentNode) el.parentNode.removeChild(el); }
  }, '×'));
  header.appendChild(titleRow);

  // Macros row
  var macrosRow = h('div', {style:'display:flex;gap:0;margin-top:12px;background:rgba(255,255,255,0.1);border-radius:10px;overflow:hidden'});
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
  if (sm.prep) {
    header.appendChild(h('div', {style:'font-size:11px;color:rgba(255,255,255,0.65);margin-top:8px'}, '⏱ Préparation : '+sm.prep));
  }
  box.appendChild(header);

  // ── BODY (scrollable) ──
  var body = h('div', {style:'flex:1;overflow-y:auto;padding:0 0 4px'});

  // Section Ingrédients
  var ingSection = h('div', {style:'padding:16px 20px 0'});
  ingSection.appendChild(h('div', {style:'font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--fg2,#888);margin-bottom:10px'}, 'Ingrédients'));

  if (sm.ingredients && sm.ingredients.length > 0) {
    sm.ingredients.forEach(function(ing, idx) {
      var row = h('div', {style:'display:flex;align-items:center;gap:10px;padding:9px 0;'+(idx < sm.ingredients.length-1 ? 'border-bottom:1px solid var(--border,#F0EFEA)':'')});
      // Quantité pill
      var qtyPill = h('div', {style:'flex-shrink:0;min-width:52px;background:rgba(26,74,26,0.07);border-radius:8px;padding:4px 8px;text-align:center'});
      qtyPill.appendChild(h('div', {style:'font-size:13px;font-weight:700;color:var(--green,#1A4A1A);line-height:1.2'}, String(ing.qty)));
      qtyPill.appendChild(h('div', {style:'font-size:9px;color:var(--fg2,#888);line-height:1.1'}, ing.unit));
      row.appendChild(qtyPill);
      row.appendChild(h('div', {style:'font-size:14px;color:var(--text,#0A0A09);font-weight:500;flex:1'}, ing.name));
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
  stepsSection.appendChild(h('div', {style:'font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--fg2,#888);margin-bottom:10px'}, 'Préparation'));

  if (sm.steps && sm.steps.length > 0) {
    sm.steps.forEach(function(step, i) {
      var row = h('div', {style:'display:flex;gap:12px;padding:0 0 12px'});
      // Numéro pastille
      var num = h('div', {style:'flex-shrink:0;width:24px;height:24px;background:var(--green,#1A4A1A);color:#fff;border-radius:50%;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px'}, String(i+1));
      row.appendChild(num);
      row.appendChild(h('div', {style:'font-size:14px;color:var(--text,#0A0A09);line-height:1.55;flex:1;padding-top:2px'}, step));
      stepsSection.appendChild(row);
    });
  } else {
    stepsSection.appendChild(h('div', {style:'font-size:13px;color:var(--fg2,#888);font-style:italic'}, 'Étapes non disponibles.'));
  }
  body.appendChild(stepsSection);

  // Tips
  if (sm.tips) {
    var tipDiv = h('div', {style:'margin:12px 20px 0;background:rgba(26,74,26,0.06);border-left:3px solid var(--green,#1A4A1A);padding:10px 12px;border-radius:0 8px 8px 0;font-size:13px;color:var(--text,#0A0A09);line-height:1.5'}, '💡 ' + sm.tips);
    body.appendChild(tipDiv);
  }
  body.appendChild(h('div', {style:'height:12px'}));
  box.appendChild(body);

  // ── FOOTER ──
  var dayNames = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  var dayLabel = dayNames[typeof S.selectedDay === 'number' ? S.selectedDay : 0] || 'Lun';
  var footer = h('div', {style:'padding:12px 20px 20px;border-top:1px solid var(--border,#E5E4DE);flex-shrink:0;background:var(--card,#fff)'});

  var addBtn = h('button', {
    style:'width:100%;padding:16px;background:linear-gradient(135deg,#7B4FC0,#5C2FA0);color:#fff;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:0.2px;box-shadow:0 4px 14px rgba(107,63,160,0.3)',
    onclick: function() {
      if (!S.weekPlan || !S.weekPlan[S.selectedDay]) {
        addBtn.textContent = 'Générez d\'abord votre plan semaine';
        addBtn.style.background = '#888';
        return;
      }
      var smoothieAsRecipe = {
        n: sm.name, f: '🥛', k: sm.cal, p: sm.p, g: sm.c, l: sm.f,
        i: sm.ingredients.map(function(ing){ return ing.qty+' '+ing.unit+' '+ing.name; }).join(', '),
        ingredients: sm.ingredients, st: sm.steps, w: true,
        tags: ['whey','smoothie'].concat(sm.goal || []),
        lv: 1, _id: sm.id, _smoothie: true
      };
      var split = window.getMealSplit ? window.getMealSplit() : null;
      var totalTarget = typeof calcTarget === 'function' ? calcTarget() : (window.S.caloriesTarget || 2000);
      var snackTargetBefore = split ? Math.round(totalTarget * split.pctSnack) : Math.round(totalTarget * 0.15);
      var delta = sm.cal - snackTargetBefore;
      var dayPlan = S.weekPlan[S.selectedDay];
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
      var el = document.getElementById('_smoothie_modal_ov');
      if (el && el.parentNode) el.parentNode.removeChild(el);
      S.smoothieBarOpen = false;
      S.nStep = 9;
      showToast('✅ Smoothie ajouté en collation — Plan recalculé', 2500);
      if (typeof window.render === 'function') window.render();
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

  var list = window.RecipeEngine.generateShoppingList(s.weekPlan, {shopFreq: s.shopFreq}) || [];
  if (!s.shopChecked) s.shopChecked = {};
  cleanShopChecked(list);

  if (!list.length) {
    p.appendChild(h('div', {style:'padding:20px;text-align:center;color:var(--text-secondary)'}, arUI('no_items', 'Aucun ingrédient détecté dans le plan.')));
    return;
  }

  // ── Label fréquence de courses ──
  var freqLabel = list._freqLabel || '7 jours';
  var freqBanner = h('div', {style:'margin:0 16px 12px;padding:10px 14px;background:var(--card);border-radius:10px;display:flex;align-items:center;gap:8px;font-size:13px'});
  freqBanner.appendChild(h('span', {style:'font-size:16px'}, '\uD83D\uDED2'));
  freqBanner.appendChild(h('div', {}, [
    h('div', {style:'font-weight:600;color:var(--text)'}, 'Liste pour ' + freqLabel),
    h('div', {style:'font-size:11px;color:var(--text-secondary)'}, s.shopFreq === '2x_week' ? 'Faites 2 courses par semaine — renouvelez dans 4 jours' : s.shopFreq === 'daily' ? 'Courses pour aujourd\'hui uniquement' : s.shopFreq === 'biweekly' ? 'Quantités déjà doublées pour 14 jours — stock et surgelés recommandés' : 'Courses pour toute la semaine')
  ]));
  p.appendChild(freqBanner);

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

// ─── SALADE COMPOSER (modal fullscreen) ───
window.openSaladComposer = function openSaladComposer(slotKey) {
  var S = window.S;
  if (!S) return;

  // Ensure saladBar state is initialised
  if (!S.saladBar) {
    S.saladBar = { open: false, base: null, proteins: [], veggies: [], fats: [], sauce: null, mealTarget: 'lunch' };
  }
  // Align mealTarget with the requested slot
  if (slotKey === 'breakfast' || slotKey === 'lunch' || slotKey === 'snack' || slotKey === 'dinner') {
    S.saladBar.mealTarget = slotKey;
  }

  // ── Compute calorie target for this slot ──
  function getSlotTargetCals(slot) {
    var totalCals = window.calcTarget ? window.calcTarget() : 0;
    if (!totalCals) totalCals = (S._nm && S._nm.calories) ? S._nm.calories : 2000;
    var split = window.getMealSplit ? window.getMealSplit() : null;
    var pct;
    if (split) {
      if (slot === 'breakfast')    pct = split.pctBreak;
      else if (slot === 'lunch')   pct = split.pctLunch;
      else if (slot === 'snack')   pct = split.pctSnack || 0.10;
      else                         pct = split.pctDinner;
    } else {
      var defaults = { breakfast: 0.25, lunch: 0.40, snack: 0.10, dinner: 0.30 };
      pct = defaults[slot] || 0.30;
    }
    return Math.round(totalCals * pct);
  }

  var targetCals = getSlotTargetCals(slotKey);

  // ── Build fullscreen overlay ──
  var root = document.getElementById('app') || document.body;

  // Remove any existing composer overlay to avoid duplicates
  var existing = document.getElementById('salad-composer-overlay');
  if (existing) existing.parentNode.removeChild(existing);

  var overlay = document.createElement('div');
  overlay.id = 'salad-composer-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9000;background:var(--bg,#FAFAF7);display:flex;flex-direction:column;overflow:hidden';

  // Scrollable content zone — renderSaladBar will populate this
  var contentZone = document.createElement('div');
  contentZone.style.cssText = 'flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;';

  // Render the saladBar composer into the content zone
  renderSaladBar(contentZone);

  // Patch the "← Retour" button inserted by renderSaladBar to close our overlay instead
  var backBtn = contentZone.querySelector('button');
  if (backBtn) {
    backBtn.onclick = function() {
      overlay.parentNode && overlay.parentNode.removeChild(overlay);
    };
  }

  // ── Slot label ──
  var slotLabels = { breakfast: 'Petit-déjeuner', lunch: 'Déjeuner', snack: 'Collation', dinner: 'Dîner' };
  var slotLabel = slotLabels[slotKey] || slotKey;

  // ── Sticky "Insérer" button bar ──
  var insertBar = document.createElement('div');
  insertBar.style.cssText = 'flex-shrink:0;padding:12px 16px 24px;background:var(--bg,#FAFAF7);border-top:1px solid var(--border,#D8D8D0);';

  var insertBtn = document.createElement('button');
  insertBtn.style.cssText = 'width:100%;padding:15px;border:none;border-radius:14px;background:var(--black,#0A0A09);color:var(--ivory,#FAFAF7);font-size:14px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;';
  insertBtn.textContent = '\u2705 Insérer dans mon repas — ' + slotLabel;

  insertBtn.onclick = function() {
    var sb = S.saladBar;

    // a. Collect selected ingredients
    var allItems = [];
    if (sb.base) allItems.push(sb.base);
    (sb.proteins || []).forEach(function(x) { allItems.push(x); });
    (sb.veggies  || []).forEach(function(x) { allItems.push(x); });
    (sb.fats     || []).forEach(function(x) { allItems.push(x); });
    if (sb.sauce) allItems.push(sb.sauce);

    if (allItems.length === 0) {
      alert('Veuillez sélectionner au moins un ingrédient.');
      return;
    }

    // b. Calculate current macros
    var macros = calcSaladMacros(sb);
    var saladCals = macros.k || 1; // avoid division by zero

    // c. Scale to target calories
    var ratio = targetCals > 0 ? targetCals / saladCals : 1;
    var scaledCals    = Math.round(macros.k * ratio);
    var scaledProtein = Math.round(macros.p * ratio);
    var scaledCarbs   = Math.round(macros.g * ratio);
    var scaledFat     = Math.round(macros.l * ratio);

    // Scale each ingredient qty
    var scaledItems = allItems.map(function(x) {
      return { name: x.name, qty: Math.round((x.qty || 0) * ratio), unit: x.unit || 'g' };
    });

    // d. Ingredients string
    var ingredientsList = scaledItems.map(function(x) {
      return x.name + ' ' + x.qty + (x.unit || 'g');
    }).join(', ');

    // e. Build virtual recipe object
    var saladRecipe = {
      _id: 'custom_salad_' + Date.now(),
      n: 'Ma Salade Personnalisée',
      type: slotKey,
      cal: scaledCals,
      k: scaledCals,
      p: scaledProtein,
      g: scaledCarbs,
      f: scaledFat,
      l: scaledFat,
      i: ingredientsList,
      _scaledIngredients: scaledItems,
      _scalingRatio: ratio,
      st: [
        'Composer votre salade selon les ingrédients sélectionnés',
        'Mélanger tous les ingrédients',
        'Assaisonner selon vos goûts'
      ],
      tags: ['salade', 'custom', 'composer'],
      custom: true
    };

    // f. Insert into weekPlan and close
    if (!S.weekPlan) S.weekPlan = [];
    if (!S.weekPlan[S.selectedDay]) S.weekPlan[S.selectedDay] = {};
    S.weekPlan[S.selectedDay][slotKey] = saladRecipe;

    overlay.parentNode && overlay.parentNode.removeChild(overlay);
    if (window.render) window.render();
  };

  insertBar.appendChild(insertBtn);
  overlay.appendChild(contentZone);
  overlay.appendChild(insertBar);
  root.appendChild(overlay);
};

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
