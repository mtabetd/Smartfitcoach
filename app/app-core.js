/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
// app-core.js — Smart Fit Coach: Core State, Constants, Helpers, Formulas
(function(){
'use strict';

// ─── DOM HELPERS ───
// ─── TRUSTED STATIC HTML ALLOWLIST ───
// The 'html' key in h() is ONLY for static strings authored in this codebase.
// Never pass user-controlled data via the 'html' key. Use child text nodes instead.
// All callers verified: only hardcoded SVG/HTML literals, no user data.
function h(tag,attrs,ch){var el=document.createElement(tag);var _hasClick=false;if(attrs)for(var k in attrs){if(attrs[k]===null||attrs[k]===undefined)continue;if(k==='class')el.className=attrs[k];else if(k==='html'){var _hv=String(attrs[k]);el.innerHTML=(typeof _sfcSanitize==='function')?_sfcSanitize(_hv):_hv}else if(k==='disabled'){if(attrs[k]===true)el.setAttribute('disabled','');else el.removeAttribute('disabled')}else if(k.indexOf('on')===0){el.addEventListener(k.slice(2),attrs[k]);if(k==='onclick')_hasClick=true}else el.setAttribute(k,attrs[k])}/* FIX A11Y 2026-04-16: div/span avec onclick → role=button + tabindex + keydown Enter/Space */if(_hasClick&&(tag==='div'||tag==='span')&&!el.getAttribute('role')){el.setAttribute('role','button');el.setAttribute('tabindex','0');el.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click()}})}if(ch!=null){if(typeof ch==='string'||typeof ch==='number')el.textContent=ch;else if(Array.isArray(ch))for(var i=0;i<ch.length;i++){if(ch[i])el.appendChild(ch[i])}else if(ch.nodeType)el.appendChild(ch)}return el}
function txt(s){return document.createTextNode(s)}

// ─── TOAST NOTIFICATION SYSTEM 2026-04-19 ───
// Usage: window.showToast('Message', 'success' | 'warning' | 'error', 3000ms)
window.showToast = function(msg, type, duration) {
  if (!msg) return;
  type = type || 'success';
  duration = duration || 3000;
  var colors = { success: 'var(--success,#3E5C3A)', warning: 'var(--warning,#B07A2A)', error: 'var(--error,#7A1F1F)' };
  var bg = colors[type] || colors.success;
  var existing = document.querySelectorAll('.sfc-toast');
  // Stack offset
  var offset = 16 + existing.length * 52;
  var toast = document.createElement('div');
  toast.className = 'sfc-toast';
  toast.style.cssText = 'position:fixed;bottom:' + offset + 'px;left:50%;transform:translateX(-50%);z-index:9999;' +
    'background:' + bg + ';color:#FAF9F6;padding:10px 20px;font-family:"Helvetica Neue",Arial,sans-serif;' +
    'font-size:9px;letter-spacing:3px;border-radius:0;text-transform:uppercase;' +
    'max-width:calc(100vw - 32px);text-align:center;pointer-events:none;' +
    'animation:sfcToastIn .2s ease forwards;';
  toast.textContent = msg;
  document.body.appendChild(toast);
  // Auto-remove
  setTimeout(function() {
    toast.style.animation = 'sfcToastOut .2s ease forwards';
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 200);
  }, duration);
};
// Inject toast CSS once
(function() {
  if (document.getElementById('sfc-toast-style')) return;
  var s = document.createElement('style');
  s.id = 'sfc-toast-style';
  s.textContent = '@keyframes sfcToastIn{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}' +
    '@keyframes sfcToastOut{from{opacity:1;transform:translate(-50%,0)}to{opacity:0;transform:translate(-50%,12px)}}';
  document.head.appendChild(s);
})();

// ═══════════════════════════════════════════════════════════════════════════
// FIX SPRINT P2.3 — Mapping bidirectionnel CF ↔ muscu 1RM (audit symbiose).
// Avant : crossfit1RM (back_squat, deadlift, bench_press) et muscuStrengthProfile
// (squat, deadlift, bench_press) étaient des stores SÉPARÉS. User CF→muscu devait
// re-saisir ses 1RM. Maintenant : sync automatique des lifts communs.
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// FIX SPRINT P2.6 — Auto-deload muscu RPE-based (audit symbiose).
// Avant : S.cfDeloadRecommended ne fonctionnait QUE pour CrossFit.
// Maintenant : muscu détecte le besoin de deload basé sur 4-5 dernières séances
// avec RPE moyen ≥ 8.5 OU 3 séances consécutives ratées (rpe ≥ 9 + targetReps non atteints).
// ═══════════════════════════════════════════════════════════════════════════
function shouldRecommendMuscuDeload() {
  var S = window.S;
  if (!S || !S.sessionFeedback) return false;
  var keys = Object.keys(S.sessionFeedback).sort();
  if (keys.length < 4) return false;
  var recent = keys.slice(-5).map(function(k) { return S.sessionFeedback[k]; });
  // Critère 1 : RPE moyen sur 4-5 dernières séances ≥ 8.5
  var rpeValues = recent.map(function(fb) { return typeof fb.rpe === 'number' ? fb.rpe : null; }).filter(function(v) { return v !== null; });
  if (rpeValues.length >= 4) {
    var avgRpe = rpeValues.reduce(function(a, b) { return a + b; }, 0) / rpeValues.length;
    if (avgRpe >= 8.5) return { reason: 'rpe_high', value: Math.round(avgRpe * 10) / 10 };
  }
  // Critère 2 : 3 séances consécutives RPE ≥ 9
  var consecutiveHard = 0;
  for (var i = recent.length - 1; i >= 0; i--) {
    if (typeof recent[i].rpe === 'number' && recent[i].rpe >= 9) consecutiveHard++;
    else break;
  }
  if (consecutiveHard >= 3) return { reason: 'consecutive_hard', value: consecutiveHard };
  return false;
}
window.shouldRecommendMuscuDeload = shouldRecommendMuscuDeload;

function syncCfMuscuStrength() {
  var S = window.S;
  if (!S) return;
  S.crossfit1RM = S.crossfit1RM || {};
  S.muscuStrengthProfile = S.muscuStrengthProfile || {};
  // Mapping bilateral : CF key → muscu key (Epley unifié, 1 rep)
  var bidiMap = [
    { cf: 'back_squat', muscu: 'squat' },
    { cf: 'deadlift',   muscu: 'deadlift' },
    { cf: 'bench_press', muscu: 'bench_press' },
    { cf: 'overhead_press', muscu: 'overhead_press' },
    { cf: 'press', muscu: 'overhead_press' }  // alias
  ];
  bidiMap.forEach(function(m) {
    var cfVal = S.crossfit1RM[m.cf];
    var muscuVal = S.muscuStrengthProfile[m.muscu];
    if (cfVal && cfVal > 0 && (!muscuVal || muscuVal === 0)) {
      // CF → muscu : diviser par (1+1/30) pour que la reconversion Epley (muscu→CF)
      // redonne exactement cfVal. Sans ça : 180 × 1.033 → 186 (perte ronde-trip 3%).
      S.muscuStrengthProfile[m.muscu] = Math.round(cfVal / (1 + 1 / 30));
      S.muscuStrengthProfile[m.muscu + '_reps'] = 1;
      try { console.log('[syncCfMuscu] ' + m.cf + '→' + m.muscu + ' = ' + cfVal); } catch(_e) {}
    } else if (muscuVal && muscuVal > 0 && (!cfVal || cfVal === 0)) {
      // muscu → CF : si user muscu a saisi squat=140×8, calculer 1RM Epley puis propager.
      var reps = S.muscuStrengthProfile[m.muscu + '_reps'] || 8;
      var epley1RM = Math.round(muscuVal * (1 + reps / 30));
      S.crossfit1RM[m.cf] = epley1RM;
      try { console.log('[syncCfMuscu] ' + m.muscu + '→' + m.cf + ' (Epley) = ' + epley1RM); } catch(_e) {}
    }
  });
}
window.syncCfMuscuStrength = syncCfMuscuStrength;

function svgRing(size,stroke,pct,color,label,value){
  // FIX Bible Hermès §13.9 + audit Data Viz : suppression du cap 100% silencieux.
  // Si dépassement, on affiche un 2ème anneau superposé --orange (Hermès H) qui
  // représente l'overflow, comme Apple Watch. L'œil voit tout de suite la sur-conso.
  var displayPct = Math.min(100, pct);
  var overflowPct = Math.max(0, pct - 100);
  var r=(size-stroke)/2,c=2*Math.PI*r,off=c-(displayPct/100)*c;
  var ns='http://www.w3.org/2000/svg';
  var svg=document.createElementNS(ns,'svg');svg.setAttribute('width',size);svg.setAttribute('height',size);svg.setAttribute('viewBox','0 0 '+size+' '+size);
  var bg=document.createElementNS(ns,'circle');bg.setAttribute('cx',size/2);bg.setAttribute('cy',size/2);bg.setAttribute('r',r);bg.setAttribute('fill','none');bg.setAttribute('stroke','#E5E4DE');bg.setAttribute('stroke-width',stroke);svg.appendChild(bg);
  var fg=document.createElementNS(ns,'circle');fg.setAttribute('cx',size/2);fg.setAttribute('cy',size/2);fg.setAttribute('r',r);fg.setAttribute('fill','none');fg.setAttribute('stroke',color);fg.setAttribute('stroke-width',stroke);fg.setAttribute('stroke-linecap','square');fg.setAttribute('stroke-dasharray',c);fg.setAttribute('stroke-dashoffset',c);fg.setAttribute('transform','rotate(-90 '+size/2+' '+size/2+')');fg.style.transition='stroke-dashoffset 0.7s ease';svg.appendChild(fg);
  // Anneau OVERFLOW superposé (si pct > 100) en orange Hermès
  if (overflowPct > 0) {
    var overflowR = r - stroke - 1; // anneau interne légèrement plus petit
    var oc = 2 * Math.PI * overflowR;
    var ofOff = oc - (Math.min(100, overflowPct)/100) * oc;
    var ov = document.createElementNS(ns,'circle');
    ov.setAttribute('cx', size/2); ov.setAttribute('cy', size/2); ov.setAttribute('r', overflowR);
    ov.setAttribute('fill','none'); ov.setAttribute('stroke', 'var(--orange,#E86F1E)');
    ov.setAttribute('stroke-width', Math.max(2, stroke - 1));
    ov.setAttribute('stroke-linecap','butt');
    ov.setAttribute('stroke-dasharray', oc); ov.setAttribute('stroke-dashoffset', oc);
    ov.setAttribute('transform', 'rotate(-90 ' + size/2 + ' ' + size/2 + ')');
    ov.style.transition = 'stroke-dashoffset 0.7s ease';
    svg.appendChild(ov);
    setTimeout(function(){ ov.setAttribute('stroke-dashoffset', ofOff); }, 80);
  }
  var t=document.createElementNS(ns,'text');t.setAttribute('x',size/2);t.setAttribute('y',size/2+1);t.setAttribute('text-anchor','middle');t.setAttribute('dominant-baseline','middle');t.setAttribute('fill','#0A0A09');t.setAttribute('font-family','Georgia');t.setAttribute('font-weight','normal');t.setAttribute('font-size','16');t.textContent=value;svg.appendChild(t);
  var w=h('div',{'class':'ring-wrap'},[svg,h('div',{'class':'ring-label'},label),h('div',{'class':'ring-val'},value+'g')]);
  setTimeout(function(){fg.setAttribute('stroke-dashoffset',off)},50);
  return w;
}

// ─── Chart instance tracking (prevent "Canvas already in use" errors) ───
// FIX CONTRE-AUDIT 2026-04 : on détruit aussi les charts ORPHELINS (canvas
// détaché du DOM = ancien canvas re-rendu par innerHTML=''). Évite la
// fuite mémoire sur re-render espacés dans le temps (toggle section N×).
window._chartInstances = [];
window.createChart = function(canvas, config) {
  if (typeof Chart === 'undefined') return null;
  // 1) Destroy any existing chart on EXACTLY this canvas ref (même objet DOM)
  // 2) Destroy any orphan chart whose canvas is no longer in the document
  //    OR shares the same canvas.id (re-render cas typique)
  for (var i = window._chartInstances.length - 1; i >= 0; i--) {
    try {
      var inst = window._chartInstances[i];
      if (!inst || !inst.canvas) { window._chartInstances.splice(i, 1); continue; }
      var sameRef = (inst.canvas === canvas);
      var sameId = canvas.id && inst.canvas.id === canvas.id;
      var orphan = !document.body.contains(inst.canvas);
      if (sameRef || sameId || orphan) {
        inst.destroy();
        window._chartInstances.splice(i, 1);
      }
    } catch(e) {
      console.error('[app-core] erreur:', e);
      window._chartInstances.splice(i, 1); // supprimer l'entrée corrompue pour éviter bloc infini
    }
  }
  var chart = new Chart(canvas.getContext('2d'), config);
  window._chartInstances.push(chart);
  // 2026-04 P0 FIX : cap absolu pour prévenir memory leak (filet de sécurité)
  // Si la détection d'orphans échoue (edge case DOM ghosts), on force FIFO après 50 instances.
  var _CHART_CAP = 50;
  while (window._chartInstances.length > _CHART_CAP) {
    var oldChart = window._chartInstances.shift();
    try { if (oldChart && oldChart.destroy) oldChart.destroy(); } catch(e) {}
  }
  return chart;
};
window.destroyAllCharts = function() {
  for (var i = 0; i < window._chartInstances.length; i++) {
    try { window._chartInstances[i].destroy(); } catch(e) {}
  }
  window._chartInstances = [];
};

// ─── Make helpers globally available ───
window.h = h;
window.txt = txt;
window.svgRing = svgRing;

// FIX D8 COHÉRENCE DAY INDEX 2026-04 : helper unifié pour l'index du jour.
// Convention : Lun=0, Mar=1, ..., Dim=6 (utilisée partout dans l'app).
// Avant : mélange getDay()+6%7 duplicaté dans ~20 endroits + certains utilisaient
//         Date.getDay() directement (Sun=0) → bugs silencieux si passage à getDayType.
window.todayIdxMonStart = function() {
  return (new Date().getDay() + 6) % 7;
};

// HARDENING P1 — Local date string (YYYY-MM-DD using device timezone, not UTC).
// toISOString() returns UTC, which is "wrong" for users in UTC+ timezones training
// at 23:xx local time — their session key would be the next UTC day.
// All session writes and "today" lookups must use this function.
window.sfcLocalDateStr = function(d) {
  var t = d instanceof Date ? d : new Date();
  var mm = String(t.getMonth() + 1).padStart(2, '0');
  var dd = String(t.getDate()).padStart(2, '0');
  return t.getFullYear() + '-' + mm + '-' + dd;
};

// HARDENING P2 — Safe numeric conversion: trim → parse → validate.
// Returns the number, or `fallback` (default null) when the value is not numeric.
// Prevents "80 " (trailing space) producing NaN in arithmetic.
window.sfcSafeNum = function(val, fallback) {
  var fb = (fallback !== undefined) ? fallback : null;
  if (val === null || val === undefined || val === '') return fb;
  var n = parseFloat(String(val).trim().replace(',', '.'));
  return isFinite(n) ? n : fb;
};

// HARDENING P4 — State integrity firewall.
// Called at render time to silently repair well-known corruption patterns.
// Returns true if any repair was performed (caller may choose to re-render).
window.sfcRepairState = function(S) {
  if (!S) return false;
  var repaired = false;
  // Ensure log/history fields are plain objects, not arrays or primitives
  ['muscuSessionLog', 'sessionHistory', 'muscuProgressionHistory'].forEach(function(k) {
    if (S[k] !== null && S[k] !== undefined && (typeof S[k] !== 'object' || Array.isArray(S[k]))) {
      S[k] = {};
      repaired = true;
    }
  });
  // Ensure sportProgram is an array or null (never a primitive)
  if (S.sportProgram !== null && S.sportProgram !== undefined && !Array.isArray(S.sportProgram)) {
    S.sportProgram = null;
    repaired = true;
  }
  // Clamp sStep / nStep to valid ranges
  if (typeof S.sStep === 'number' && (S.sStep < 0 || S.sStep > 50)) { S.sStep = 0; repaired = true; }
  if (typeof S.nStep === 'number' && (S.nStep < 0 || S.nStep > 12)) { S.nStep = 0; repaired = true; }
  // Remove the poisoned "undefined" key if it crept into progressionHistory
  if (S.muscuProgressionHistory && 'undefined' in S.muscuProgressionHistory) {
    delete S.muscuProgressionHistory['undefined'];
    repaired = true;
  }
  // Validate symbiosis fields — corrupted values break trainingLoad RANK comparisons
  var _validLoads = ['light', 'moderate', 'heavy', 'rest'];
  if (S.trainingLoad !== null && S.trainingLoad !== undefined &&
      _validLoads.indexOf(String(S.trainingLoad).toLowerCase()) === -1) {
    S.trainingLoad = null; repaired = true;
  }
  if (S.dailyTrainingLoad !== null && S.dailyTrainingLoad !== undefined &&
      _validLoads.indexOf(String(S.dailyTrainingLoad).toLowerCase()) === -1) {
    S.dailyTrainingLoad = null; repaired = true;
  }
  if (typeof S.lastSessionCount !== 'number' || !isFinite(S.lastSessionCount) || S.lastSessionCount < 0) {
    S.lastSessionCount = 0; repaired = true;
  }
  if (S.lastSessionGroups !== null && S.lastSessionGroups !== undefined && !Array.isArray(S.lastSessionGroups)) {
    S.lastSessionGroups = null; repaired = true;
  }
  return repaired;
};

// FIX VALIDATION WEEKPLAN 2026-04 : dévalider le plan sans le supprimer.
// Appelé quand un paramètre critique change (regime, allergies, mealsPerDay, etc.)
// → le plan reste visible mais le bandeau "Revalider" s'affiche à l'user.
// Avant : ces changements faisaient `S.weekPlan = null` → régénération automatique
//         → user voyait son plan changer silencieusement.
window.devalidateWeekPlan = function(reason) {
  try {
    var S = window.S;
    if (!S) return;
    // FIX 2026-04-16 — Ne dévalider QUE si un weekPlan existe.
    // Avant : chaque changement de paramètre (allergies, medical, goal...) dévalidait
    // même pendant l'onboarding (pas de plan). L'user arrivait sur le dashboard et
    // voyait "Valide ton plan" en boucle alors qu'il venait de le valider.
    if (!S.weekPlan || !Array.isArray(S.weekPlan) || S.weekPlan.length < 7) return;
    S.weekPlanValidated = false;
    // Note : on ne touche PAS à S.weekPlan (il reste visible).
    // La bannière en haut du planning affiche "Paramètres modifiés → Revalider".
    if (reason) console.log('[weekPlan] Dévalidé :', reason);
  } catch(e) {}
};

// FIX F6 CONTRE-AUDIT 2026-04 : symétrique pour sportProgram.
// Appelé quand sportLevel / sportDays / sportEquipment / sportGoals / sportFocus change.
// L'user verra son programme actuel (non-null) mais un bandeau "Paramètres changés".
window.devalidateSportProgram = function(reason) {
  try {
    var S = window.S;
    if (!S) return;
    if (!S.sportProgram || !Array.isArray(S.sportProgram) || !S.sportProgram.length) return;
    S.sportProgramValidated = false;
    if (reason) console.log('[sportProgram] Dévalidé :', reason);
  } catch(e) {}
};

// FIX VALIDATION WEEKPLAN 2026-04 : helper pour la semaine ISO courante.
// Format : "2026-W16" (ISO 8601). Utilisé pour savoir si le plan validé est
// toujours valable pour la semaine en cours.
window.currentISOWeek = function(d) {
  var date = d ? new Date(d) : new Date();
  // Clone to avoid mutating input
  var target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  var dayNum = (target.getUTCDay() + 6) % 7; // Lundi=0, Dimanche=6
  target.setUTCDate(target.getUTCDate() - dayNum + 3); // Jeudi de la semaine
  var firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  firstThursday.setUTCDate(firstThursday.getUTCDate() - ((firstThursday.getUTCDay() + 6) % 7) + 3);
  var weekNum = 1 + Math.round((target - firstThursday) / (7 * 24 * 3600 * 1000));
  return target.getUTCFullYear() + '-W' + String(weekNum).padStart(2, '0');
};

// COACH ADAPTATIF 2026-04 (phase A) : helpers pour alimenter buildContext() avec
// les données de feedback séances, performance hebdo, prochaine séance, cycle.
// Tous défensifs — retournent null si données insuffisantes (jamais undefined ni NaN).

// Renvoie le dernier feedback de séance (le plus récent) ou null.
// Structure : { date, sessionId, rpe, feeling, pain, chargeActual, reps, notes }
// FIX BUG-1 : supporte clés YYYY-MM-DD ET YYYY-MM-DD_sessionId (multi-séances/jour).
window.getLastSessionFeedback = function() {
  try {
    var S = window.S;
    if (!S || !S.sessionFeedback || typeof S.sessionFeedback !== 'object') return null;
    var keys = Object.keys(S.sessionFeedback).filter(function(k) {
      // Accepte YYYY-MM-DD ou YYYY-MM-DD_<sessionId>
      return /^\d{4}-\d{2}-\d{2}(_.+)?$/.test(k);
    });
    if (!keys.length) return null;
    // Tri par savedAt timestamp si dispo, sinon fallback lexicographique
    keys.sort(function(a, b) {
      var fa = S.sessionFeedback[a], fb2 = S.sessionFeedback[b];
      var ta = (fa && fa.savedAt) ? fa.savedAt : a;
      var tb = (fb2 && fb2.savedAt) ? fb2.savedAt : b;
      return ta < tb ? -1 : (ta > tb ? 1 : 0);
    });
    var lastKey = keys[keys.length - 1];
    var fb = S.sessionFeedback[lastKey];
    if (!fb || typeof fb !== 'object') return null;
    // Extraire juste la partie date (avant _) pour exposition propre
    var datePart = lastKey.split('_')[0];
    var out = { date: datePart };
    if (fb.sessionId) out.sessionId = String(fb.sessionId);
    if (typeof fb.rpe === 'number' && fb.rpe >= 1 && fb.rpe <= 10) out.rpe = fb.rpe;
    if (fb.feeling) out.feeling = String(fb.feeling);
    if (fb.pain) out.pain = String(fb.pain);
    if (fb.chargeActual && typeof fb.chargeActual === 'object') out.chargeActual = fb.chargeActual;
    if (fb.reps && typeof fb.reps === 'object') out.reps = fb.reps;
    if (fb.notes) out.notes = String(fb.notes).slice(0, 200);
    return out;
  } catch(e) { return null; }
};

// Renvoie un résumé de la semaine écoulée (7 derniers jours glissants) ou null.
// { sessionsCount, rpeAvg, chargeProgressionPct, lastPain }
// chargeProgressionPct = variation moyenne des charges vs semaine précédente (7-14j).
window.getWeekPerformanceSummary = function() {
  try {
    var S = window.S;
    if (!S || !S.sessionFeedback || typeof S.sessionFeedback !== 'object') return null;
    var now = new Date();
    var day = 24 * 3600 * 1000;
    var t0 = now.getTime();
    var keys = Object.keys(S.sessionFeedback).filter(function(k) {
      // Accepte YYYY-MM-DD ou YYYY-MM-DD_<sessionId>
      return /^\d{4}-\d{2}-\d{2}(_.+)?$/.test(k);
    });
    if (!keys.length) return null;
    var thisWeek = [];
    var prevWeek = [];
    keys.forEach(function(k) {
      // Extraire partie date (avant _) pour parser
      var datePart = k.split('_')[0];
      var dt = new Date(datePart + 'T00:00:00Z').getTime();
      if (isNaN(dt)) return;
      var diff = t0 - dt;
      if (diff < 7 * day) thisWeek.push({ key: k, fb: S.sessionFeedback[k] });
      else if (diff < 14 * day) prevWeek.push({ key: k, fb: S.sessionFeedback[k] });
    });
    if (!thisWeek.length) return null;
    var rpeVals = thisWeek.map(function(x) { return x.fb && typeof x.fb.rpe === 'number' ? x.fb.rpe : null; })
                          .filter(function(v) { return v !== null; });
    var rpeAvg = rpeVals.length ? rpeVals.reduce(function(a,b){return a+b;}, 0) / rpeVals.length : null;
    // Progression charges : compare moyenne des charges (exos communs) this vs prev week
    var progPct = null;
    if (prevWeek.length) {
      var thisCh = {};
      var prevCh = {};
      function gather(arr, bag) {
        arr.forEach(function(x) {
          var ch = x.fb && x.fb.chargeActual;
          if (!ch || typeof ch !== 'object') return;
          Object.keys(ch).forEach(function(exo) {
            var n = parseFloat(ch[exo]);
            if (!isNaN(n) && isFinite(n)) {
              if (!bag[exo]) bag[exo] = [];
              bag[exo].push(n);
            }
          });
        });
      }
      gather(thisWeek, thisCh);
      gather(prevWeek, prevCh);
      var commonExos = Object.keys(thisCh).filter(function(e) { return prevCh[e]; });
      if (commonExos.length) {
        var deltaSum = 0;
        commonExos.forEach(function(e) {
          var thisAvg = thisCh[e].reduce(function(a,b){return a+b;},0) / thisCh[e].length;
          var prevAvg = prevCh[e].reduce(function(a,b){return a+b;},0) / prevCh[e].length;
          if (prevAvg > 0) deltaSum += ((thisAvg - prevAvg) / prevAvg) * 100;
        });
        progPct = deltaSum / commonExos.length;
      }
    }
    // Dernière douleur signalée
    var lastPain = null;
    thisWeek.slice().reverse().forEach(function(x) {
      if (!lastPain && x.fb && x.fb.pain) lastPain = String(x.fb.pain);
    });
    var out = { sessionsCount: thisWeek.length };
    if (rpeAvg !== null) out.rpeAvg = Math.round(rpeAvg * 10) / 10;
    if (progPct !== null) out.chargeProgressionPct = Math.round(progPct * 10) / 10;
    if (lastPain) out.lastPain = lastPain;
    return out;
  } catch(e) { return null; }
};

// Renvoie la prochaine séance planifiée selon trainingDaysSelected ou null.
// { date: 'YYYY-MM-DD', dayLabel: 'Jeudi', type: 'Musculation Jour 3' }
window.getNextScheduledSession = function() {
  try {
    var S = window.S;
    if (!S) return null;
    var _isEN = window.isEnglish && window.isEnglish();
    var dayNames = _isEN
      ? ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
      : ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
    // trainingDaysSelected = array de 0-6 (Lun=0, Dim=6)
    var days = Array.isArray(S.trainingDaysSelected) ? S.trainingDaysSelected : null;
    if (!days || !days.length) return null;
    var today = new Date();
    for (var i = 0; i < 7; i++) {
      var d = new Date(today.getTime() + i * 24 * 3600 * 1000);
      // JS: 0=dim, 1=lun... app: 0=lun, 6=dim → convert
      var appDay = (d.getDay() + 6) % 7;
      if (days.indexOf(appDay) !== -1) {
        var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
        var dateStr = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
        var out = { date: dateStr, dayLabel: dayNames[d.getDay()] };
        if (S.sportType) {
          var typeLabels = { muscu:'Musculation', crossfit:'CrossFit', running:'Running', cycling:'Vélo', triathlon:'Triathlon', hyrox:'Hyrox', calisthenics:'Calisthenics', padel:'Padel', golf:'Golf', yoga:'Yoga' };
          out.type = typeLabels[S.sportType] || String(S.sportType);
        }
        return out;
      }
    }
    return null;
  } catch(e) { return null; }
};

// Wrapper défensif autour de window.getCurrentCyclePhase() (existant dans app-core).
// Renvoie { phase, dayInCycle, intensityFactor } pour le prompt IA ou null.
window.getCyclePhaseForAI = function() {
  try {
    var S = window.S;
    if (!S || !S.cycleTracking || !S.lastPeriodDate) return null;
    if (typeof window.getCurrentCyclePhase !== 'function') return null;
    var cp = window.getCurrentCyclePhase();
    if (!cp || !cp.phase) return null;
    var out = { phase: String(cp.phase) };
    if (typeof cp.dayInCycle === 'number') out.dayInCycle = cp.dayInCycle;
    // Retrouver intensityFactor depuis CYCLE_PHASES si dispo
    if (window.CYCLE_PHASES && typeof window.CYCLE_PHASES === 'object') {
      var phaseDef = window.CYCLE_PHASES[cp.phase];
      if (phaseDef && typeof phaseDef.intensityFactor === 'number') {
        out.intensityFactor = phaseDef.intensityFactor;
      }
    }
    return out;
  } catch(e) { return null; }
};

// Enregistre un feedback de séance (appelé par le modal post-séance).
// data : { rpe, feeling, pain, chargeActual, reps, notes, sessionId }
// Retourne la clé utilisée (YYYY-MM-DD ou YYYY-MM-DD_<sessionId> si multi-séances/jour).
// FIX BUG-1 contre-audit phase A : clé enrichie avec sessionId pour éviter écrasement
// quand user fait muscu matin + cardio soir le même jour (2 séances distinctes).
window.recordSessionFeedback = function(data) {
  try {
    var S = window.S;
    if (!S) return null;
    if (!S.sessionFeedback || typeof S.sessionFeedback !== 'object' || Array.isArray(S.sessionFeedback)) {
      S.sessionFeedback = {};
    }
    var d = new Date();
    var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
    var dateStr = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
    // Clé : dateStr seule si pas de sessionId, sinon dateStr_sessionId pour multi-séances/jour.
    var sessionId = data && data.sessionId ? String(data.sessionId).slice(0, 40) : null;
    var key = sessionId ? (dateStr + '_' + sessionId) : dateStr;
    var entry = { savedAt: d.toISOString() }; // timestamp précis pour trier par heure réelle
    if (data) {
      if (sessionId) entry.sessionId = sessionId;
      // FIX BUG-6 : Math.round pour RPE (slider envoie entier, mais pre-caution API).
      var rpeN = parseFloat(data.rpe);
      if (!isNaN(rpeN) && isFinite(rpeN)) {
        rpeN = Math.round(rpeN);
        if (rpeN >= 1 && rpeN <= 10) entry.rpe = rpeN;
      }
      if (data.feeling) entry.feeling = String(data.feeling).slice(0, 20);
      if (data.pain) entry.pain = String(data.pain).slice(0, 30);
      if (data.notes) entry.notes = String(data.notes).slice(0, 200);
      if (data.chargeActual && typeof data.chargeActual === 'object' && !Array.isArray(data.chargeActual)) {
        var ch = {};
        Object.keys(data.chargeActual).slice(0, 15).forEach(function(k) {
          var n = parseFloat(data.chargeActual[k]);
          if (!isNaN(n) && isFinite(n) && n > 0) ch[String(k).slice(0, 40)] = n;
        });
        if (Object.keys(ch).length) entry.chargeActual = ch;
      }
      if (data.reps && typeof data.reps === 'object' && !Array.isArray(data.reps)) {
        var rp = {};
        Object.keys(data.reps).slice(0, 15).forEach(function(k) {
          var n = parseFloat(data.reps[k]);
          if (!isNaN(n) && isFinite(n) && n > 0) rp[String(k).slice(0, 40)] = n;
        });
        if (Object.keys(rp).length) entry.reps = rp;
      }
    }
    S.sessionFeedback[key] = entry;
    // Garde uniquement les 60 dernières entrées pour éviter gonflement localStorage
    // (accepte aussi clés avec sessionId pour multi-séances/jour)
    var keys = Object.keys(S.sessionFeedback).filter(function(k) { return /^\d{4}-\d{2}-\d{2}(_.+)?$/.test(k); }).sort();
    if (keys.length > 60) {
      keys.slice(0, keys.length - 60).forEach(function(oldK) { delete S.sessionFeedback[oldK]; });
    }
    if (typeof window.saveProfile === 'function') window.saveProfile();
    return key;
  } catch(e) { return null; }
};

// POLISH 2026-04 (OBJECTIFS SEMAINE) : progression vs objectifs hebdo.
// Retourne { sessions:{done,planned,pct}, kcalAvg:{current,target,pct},
//            proteinAvg:{current,target,pct}, wellnessLogged:{count,target=7,pct} } ou null.
// Chaque métrique est null si la data manque → widget gère visuellement.
window.getWeeklyGoalsProgress = function() {
  try {
    var S = window.S;
    if (!S) return null;
    var result = {};

    // 1) SÉANCES
    try {
      var planned = 0;
      if (Array.isArray(S.trainingDaysSelected) && S.trainingDaysSelected.length > 0) {
        planned = S.trainingDaysSelected.length;
      } else if (typeof S.sportDays === 'number' && S.sportDays > 0) {
        planned = S.sportDays;
      }
      var done = 0;
      if (typeof window.getWeekSessionsSummary === 'function') {
        var ws = window.getWeekSessionsSummary();
        if (ws && typeof ws.sessions === 'number') done = ws.sessions;
      }
      if (planned > 0 || done > 0) {
        result.sessions = {
          done: done,
          planned: planned || null,
          pct: planned > 0 ? Math.min(100, Math.round((done / planned) * 100)) : null
        };
      }
    } catch(_e1) {}

    // 2-3) KCAL + PROTÉINES MOYENNES (vs cibles) — via 1 SEUL appel getNutritionTrend(7)
    // FIX CONTRE-AUDIT : factoriser pour éviter parse JSON localStorage 2× + boucle 7j 2×.
    try {
      var ntrend = (typeof window.getNutritionTrend === 'function') ? window.getNutritionTrend(7) : null;
      if (ntrend && ntrend.loggedDays > 0) {
        // kcal
        var kcalVals = ntrend.kcal.filter(function(v) { return typeof v === 'number'; });
        if (kcalVals.length > 0) {
          var avg = Math.round(kcalVals.reduce(function(a,b){return a+b;},0) / kcalVals.length);
          var tgt = (ntrend.targets && typeof ntrend.targets.kcal === 'number') ? ntrend.targets.kcal : null;
          result.kcalAvg = {
            current: avg,
            target: tgt,
            pct: (tgt && tgt > 0) ? Math.min(150, Math.round((avg / tgt) * 100)) : null
          };
        }
        // protéines
        var pVals = ntrend.protein.filter(function(v) { return typeof v === 'number'; });
        if (pVals.length > 0) {
          var pAvg = Math.round(pVals.reduce(function(a,b){return a+b;},0) / pVals.length);
          var pTgt = (ntrend.targets && typeof ntrend.targets.p === 'number') ? ntrend.targets.p : null;
          result.proteinAvg = {
            current: pAvg,
            target: pTgt,
            pct: (pTgt && pTgt > 0) ? Math.min(150, Math.round((pAvg / pTgt) * 100)) : null
          };
        }
      }
    } catch(_e2) {}

    // 4) WELLNESS LOGGÉS (cible : 7 jours / semaine)
    // FIX CONTRE-AUDIT : capper count à 7 pour cohérence "8/7 j (100%)" → "7/7 j (100%)"
    // (multi-logs/jour possibles en théorie → cognitive dissonance sinon)
    try {
      if (typeof window.getWellnessHistory === 'function') {
        var last7 = window.getWellnessHistory(7);
        var raw = Array.isArray(last7) ? last7.length : 0;
        var count = Math.min(raw, 7); // cap visuel
        result.wellnessLogged = {
          count: count,
          target: 7,
          pct: Math.min(100, Math.round((count / 7) * 100))
        };
      }
    } catch(_e4) {}

    if (Object.keys(result).length === 0) return null;
    return result;
  } catch(e) { return null; }
};

// POLISH 2026-04 (GRAPH NUTRITION) : série calories + macros sur N derniers jours.
// Retourne { labels[N], kcal[num|null], protein[num|null], carbs[num|null],
//            fat[num|null], targets:{kcal,p,g,l}, loggedDays } ou null.
// Lit mtd_food_journal_<uid> DIRECTEMENT (FOOD_JOURNAL.getDayTotal ne lit que today).
window.getNutritionTrend = function(days) {
  try {
    days = (typeof days === 'number' && days > 0) ? days : 30;
    var user = (window.AUTH && window.AUTH.getUser) ? window.AUTH.getUser() : null;
    var uid = user && user.id ? user.id : 'anon';
    var journal = {};
    try {
      var raw = localStorage.getItem('mtd_food_journal_' + uid);
      if (raw) { var parsed = JSON.parse(raw); if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) journal = parsed; }
    } catch(_je) {}

    var labels = [], kcal = [], protein = [], carbs = [], fat = [];
    var now = new Date();
    var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
    var loggedDays = 0;

    for (var i = days - 1; i >= 0; i--) {
      var d = new Date(now.getTime() - i * 86400000);
      var key = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
      labels.push(key);
      var entries = Array.isArray(journal[key]) ? journal[key] : [];
      if (entries.length > 0) {
        var agg = entries.reduce(function(acc, e) {
          acc.kcal += (Number(e.kcal) || 0);
          acc.p += (Number(e.p) || 0);
          acc.g += (Number(e.g) || 0);
          acc.l += (Number(e.l) || 0);
          return acc;
        }, { kcal: 0, p: 0, g: 0, l: 0 });
        kcal.push(Math.round(agg.kcal));
        protein.push(Math.round(agg.p));
        carbs.push(Math.round(agg.g));
        fat.push(Math.round(agg.l));
        loggedDays++;
      } else {
        kcal.push(null); protein.push(null); carbs.push(null); fat.push(null);
      }
    }

    // Targets (via helpers déjà exposés)
    var targets = null;
    try {
      if (typeof window.getCalorieTarget === 'function' && typeof window.getMacroTargets === 'function') {
        var t = window.getCalorieTarget();
        var m = window.getMacroTargets();
        if (typeof t === 'number' && m && typeof m === 'object') {
          targets = { kcal: t, p: m.p || null, g: m.g || null, l: m.l || null };
        }
      }
    } catch(_te) {}

    if (loggedDays === 0) return null; // rien à tracer
    return {
      labels: labels, kcal: kcal, protein: protein, carbs: carbs, fat: fat,
      targets: targets, loggedDays: loggedDays
    };
  } catch(e) { return null; }
};

// POLISH 2026-04 (NOTIFS) : date de la dernière séance loggée (YYYY-MM-DD) ou null.
// Utilisé par push-manager pour détecter l'inactivité + déclencher un rappel "comeback".
// Lit S.sessionHistory dont les clés sont du format 'dayIdx_YYYY-MM-DD'.
window.getLastSessionDate = function() {
  try {
    var S = window.S;
    if (!S || !S.sessionHistory || typeof S.sessionHistory !== 'object') return null;
    var dates = Object.keys(S.sessionHistory)
      .map(function(k) { var m = String(k).match(/(\d{4}-\d{2}-\d{2})$/); return m ? m[1] : null; })
      .filter(function(x) { return !!x; })
      .sort();
    return dates.length > 0 ? dates[dates.length - 1] : null;
  } catch(e) { return null; }
};

// Renvoie le nombre de jours depuis la dernière séance (ou null).
window.getDaysSinceLastSession = function() {
  try {
    var last = window.getLastSessionDate();
    if (!last) return null;
    var lastMs = new Date(last + 'T00:00:00').getTime();
    if (isNaN(lastMs)) return null;
    var diff = Date.now() - lastMs;
    return Math.floor(diff / 86400000);
  } catch(e) { return null; }
};

// POLISH 2026-04 (RECORDS) : calcule les meilleurs résultats historiques de l'user.
// Retourne { maxLifts:[...], weightMilestone, longestSession, maxStreak } ou null.
// 100% défensif : tous les champs optionnels, retourne null si aucune donnée.
window.getPersonalRecords = function() {
  try {
    var S = window.S;
    if (!S) return null;
    var records = {};
    // Formule Epley 1RM = weight × (1 + reps/30) — standard fitness literature
    function epley1RM(weight, reps) {
      var w = parseFloat(weight), r = parseFloat(reps);
      if (isNaN(w) || !isFinite(w) || w <= 0) return null;
      if (isNaN(r) || !isFinite(r) || r <= 0) return null;
      return Math.round(w * (1 + r / 30) * 10) / 10;
    }

    // 1) CHARGES MAX : top 3 exos compound avec leur max historique + 1RM estimé
    if (S.muscuProgressionHistory && typeof S.muscuProgressionHistory === 'object') {
      var compoundExos = [
        'Développé couché', 'Squat', 'Soulevé de terre', 'Développé militaire',
        'Rowing barre', 'Hip Thrust', 'Presse à cuisses'
      ];
      function normalize(s) {
        return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      }
      var histKeys = Object.keys(S.muscuProgressionHistory);
      var maxLifts = [];
      compoundExos.forEach(function(target) {
        var normTarget = normalize(target);
        var realKey = null;
        for (var i = 0; i < histKeys.length; i++) {
          if (normalize(histKeys[i]) === normTarget) { realKey = histKeys[i]; break; }
        }
        if (!realKey) return;
        var entries = S.muscuProgressionHistory[realKey];
        if (!Array.isArray(entries) || !entries.length) return;
        // Trouver l'entrée avec la plus grande charge (weight)
        var bestW = 0, bestEntry = null;
        entries.forEach(function(e) {
          if (!e) return;
          var w = parseFloat(e.weight);
          if (!isNaN(w) && isFinite(w) && w > bestW) {
            bestW = w;
            bestEntry = e;
          }
        });
        if (bestEntry) {
          maxLifts.push({
            exercise: target,
            weight: bestW,
            reps: parseFloat(bestEntry.reps) || null,
            date: bestEntry.date || null,
            oneRepMax: epley1RM(bestEntry.weight, bestEntry.reps)
          });
        }
      });
      // Trier par 1RM (ou charge brute) décroissant + top 3
      maxLifts.sort(function(a, b) {
        var aScore = a.oneRepMax || a.weight;
        var bScore = b.oneRepMax || b.weight;
        return bScore - aScore;
      });
      if (maxLifts.length > 0) records.maxLifts = maxLifts.slice(0, 3);
    }

    // 2) POIDS MILESTONE : selon goal (bulk → max, cut/shred → min)
    if (Array.isArray(S.weightHistory) && S.weightHistory.length >= 2) {
      var cleanHistory = S.weightHistory
        .filter(function(e) {
          if (!e) return false;
          var w = parseFloat(e.weight || e.w || e);
          return !isNaN(w) && isFinite(w) && w > 0;
        })
        .map(function(e) {
          return { weight: parseFloat(e.weight || e.w || e), date: e.date || null };
        });
      if (cleanHistory.length >= 2) {
        var goalKey = null;
        if (window.GOALS && typeof S.goal === 'number' && window.GOALS[S.goal]) {
          goalKey = window.GOALS[S.goal].key;
        }
        // Déterminer la direction souhaitée selon le goal
        var direction = null;
        if (goalKey === 'bulk' || goalKey === 'lean_bulk') direction = 'max';
        else if (goalKey === 'cut' || goalKey === 'shred') direction = 'min';
        // Sinon (maintain ou inconnu) on affiche les 2 extrêmes
        if (direction === 'max' || direction === 'min') {
          var best = cleanHistory[0];
          cleanHistory.forEach(function(e) {
            if (direction === 'max' && e.weight > best.weight) best = e;
            else if (direction === 'min' && e.weight < best.weight) best = e;
          });
          records.weightMilestone = {
            direction: direction,
            weight: Math.round(best.weight * 10) / 10,
            date: best.date,
            goalLabel: direction === 'max' ? 'Max atteint' : 'Min atteint'
          };
        } else {
          // Maintain : afficher la plage (min-max)
          var minW = cleanHistory[0].weight, maxW = cleanHistory[0].weight;
          cleanHistory.forEach(function(e) {
            if (e.weight < minW) minW = e.weight;
            if (e.weight > maxW) maxW = e.weight;
          });
          records.weightRange = {
            min: Math.round(minW * 10) / 10,
            max: Math.round(maxW * 10) / 10,
            goalLabel: 'Plage'
          };
        }
      }
    }

    // 3) SÉANCE LA PLUS LONGUE
    if (S.sessionHistory && typeof S.sessionHistory === 'object') {
      var keys = Object.keys(S.sessionHistory);
      var longest = null;
      keys.forEach(function(k) {
        var s = S.sessionHistory[k];
        if (!s) return;
        var dur = parseFloat(s.duration);
        if (!isNaN(dur) && isFinite(dur) && dur > 0) {
          if (!longest || dur > longest.duration) {
            longest = {
              duration: Math.round(dur),
              kcalTotal: parseFloat(s.kcalTotal) || 0,
              date: (s.date && typeof s.date === 'string') ? s.date.slice(0, 10) : null
            };
          }
        }
      });
      if (longest) records.longestSession = longest;
    }

    // 4) STREAK MAX (depuis mtd_streak_<uid>)
    try {
      var user = (window.AUTH && window.AUTH.getUser) ? window.AUTH.getUser() : null;
      var uid = user && user.id ? user.id : 'anon';
      var streakRaw = localStorage.getItem('mtd_streak_' + uid);
      if (streakRaw) {
        var streakObj = JSON.parse(streakRaw);
        if (streakObj && typeof streakObj.max === 'number' && streakObj.max > 0) {
          records.maxStreak = streakObj.max;
        }
      }
    } catch(_e) {}

    // Retourne null si aucun record collecté (évite widget vide)
    if (Object.keys(records).length === 0) return null;
    return records;
  } catch(e) { return null; }
};

// POLISH 2026-04 (GRAPH CHARGES) : progression charges sur N derniers jours.
// Retourne { labels:['YYYY-MM-DD' × N], datasets: [{name, data:[num|null × N]}, ...] }
// Sélectionne jusqu'à 3 exos "compound" (Squat, DC, SDT, OHP) qui ont
// au moins 2 entrées dans la fenêtre → pertinent pour tracer une courbe.
window.getStrengthTrend = function(days) {
  try {
    days = (typeof days === 'number' && days > 0) ? days : 30;
    var S = window.S;
    if (!S || !S.muscuProgressionHistory || typeof S.muscuProgressionHistory !== 'object') return null;
    // Exos compound cibles (noms FR tels qu'utilisés dans muscuProgressionHistory)
    var targetExos = [
      'Développé couché', 'Squat', 'Soulevé de terre', 'Développé militaire',
      'Rowing barre', 'Hip Thrust', 'Presse à cuisses', 'Curl barre'
    ];
    // Matching case/accent-insensitive pour tolérer les variations de saisie
    function normalize(s) {
      return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    }
    var histKeys = Object.keys(S.muscuProgressionHistory);
    // Construire une map { targetExo: vraie_cle } pour retrouver l'entrée réelle
    var matched = {};
    targetExos.forEach(function(target) {
      var normTarget = normalize(target);
      for (var i = 0; i < histKeys.length; i++) {
        if (normalize(histKeys[i]) === normTarget && !matched[target]) {
          matched[target] = histKeys[i];
          break;
        }
      }
    });
    var now = new Date();
    var cutoffMs = now.getTime() - (days - 1) * 86400000;
    var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
    // Labels (N jours glissants)
    var labels = [];
    for (var d2 = days - 1; d2 >= 0; d2--) {
      var dd = new Date(now.getTime() - d2 * 86400000);
      labels.push(dd.getFullYear() + '-' + pad(dd.getMonth()+1) + '-' + pad(dd.getDate()));
    }
    // Pour chaque exo matché, extraire la série (max weight par jour dans la fenêtre)
    var datasets = [];
    Object.keys(matched).forEach(function(name) {
      var realKey = matched[name];
      var entries = S.muscuProgressionHistory[realKey] || [];
      if (!Array.isArray(entries)) return;
      // Index par date (dernier poids gagne si plusieurs entries same day)
      var byDate = {};
      entries.forEach(function(e) {
        if (!e || !e.date) return;
        var dt = new Date(e.date + 'T00:00:00').getTime();
        if (isNaN(dt) || dt < cutoffMs) return;
        var w = parseFloat(e.weight);
        if (!isNaN(w) && isFinite(w) && w > 0) {
          // Prendre le max du jour (si plusieurs séries, on garde la plus lourde)
          if (!byDate[e.date] || w > byDate[e.date]) byDate[e.date] = w;
        }
      });
      // Construire la série alignée sur labels
      var data = labels.map(function(lbl) { return typeof byDate[lbl] === 'number' ? byDate[lbl] : null; });
      var nonNull = data.filter(function(v) { return v !== null; }).length;
      // Seuil : exo doit avoir au moins 2 points pour tracer une courbe pertinente
      if (nonNull >= 2) {
        datasets.push({
          name: name,
          data: data,
          lastValue: data.filter(function(v){ return v !== null; }).slice(-1)[0] || null,
          firstValue: data.filter(function(v){ return v !== null; })[0] || null,
          dataPoints: nonNull
        });
      }
    });
    // Trier par nombre de points (le plus régulier en premier) puis garder top 3
    datasets.sort(function(a, b) { return b.dataPoints - a.dataPoints; });
    datasets = datasets.slice(0, 3);
    if (datasets.length === 0) return null;
    return { labels: labels, datasets: datasets };
  } catch(e) { return null; }
};

// POLISH 2026-04 (GRAPHES) : série wellness sur N derniers jours pour Chart.js.
// Retourne { labels:['YYYY-MM-DD',...], sleep:[num/null,...], energyScore:[num/null,...] }
// Jours sans log → null (Chart.js skip gracefully avec spanGaps:true).
// Score énergie : bas=1, moyen=2, haut=3 (numérisé pour visualisation).
window.getSleepEnergyTrend = function(days) {
  try {
    days = (typeof days === 'number' && days > 0) ? days : 30;
    if (typeof window.getWellnessHistory !== 'function') return null;
    var history = window.getWellnessHistory(days);
    if (!Array.isArray(history)) return null;
    // Index historique par date pour lookup O(1)
    var byDate = {};
    history.forEach(function(h) { if (h && h.date) byDate[h.date] = h; });
    // Générer les N derniers jours (avec null pour jours manquants)
    var labels = [], sleep = [], energyScore = [];
    var energyMap = { bas: 1, moyen: 2, haut: 3 };
    var now = new Date();
    var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
    for (var i = days - 1; i >= 0; i--) {
      var d = new Date(now.getTime() - i * 86400000);
      var key = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
      labels.push(key);
      var h = byDate[key];
      // FIX CONTRE-AUDIT : parseFloat tolérant (accepte "4" ou 4) + bornes 1-5
      if (h && h.sleep != null) {
        var sv = parseFloat(h.sleep);
        if (!isNaN(sv) && isFinite(sv) && sv >= 1 && sv <= 5) sleep.push(sv);
        else sleep.push(null);
      } else {
        sleep.push(null);
      }
      if (h && h.energy && typeof energyMap[h.energy] === 'number') {
        energyScore.push(energyMap[h.energy]);
      } else {
        energyScore.push(null);
      }
    }
    var loggedDays = sleep.filter(function(s) { return s !== null; }).length;
    return { labels: labels, sleep: sleep, energyScore: energyScore, loggedDays: loggedDays };
  } catch(e) { return null; }
};

// POLISH 2026-04 (INSIGHTS) : moyenne wellness sur N derniers jours.
// Retourne { sleepAvg, energyStats, muscleStats, daysLogged } ou null.
// sleepAvg = moyenne numérique 1-5, energyStats/muscleStats = répartition par token.
window.getWellnessAvg = function(days) {
  try {
    if (typeof window.getWellnessHistory !== 'function') return null;
    var history = window.getWellnessHistory(days || 7);
    if (!Array.isArray(history) || !history.length) return null;
    var sleepSum = 0, sleepCount = 0;
    var energyStats = {}, muscleStats = {};
    history.forEach(function(h) {
      if (!h) return;
      if (typeof h.sleep === 'number' && h.sleep >= 1 && h.sleep <= 5) {
        sleepSum += h.sleep; sleepCount++;
      }
      if (h.energy) energyStats[h.energy] = (energyStats[h.energy] || 0) + 1;
      if (h.muscles) muscleStats[h.muscles] = (muscleStats[h.muscles] || 0) + 1;
    });
    return {
      sleepAvg: sleepCount > 0 ? Math.round((sleepSum / sleepCount) * 10) / 10 : null,
      energyStats: energyStats,
      muscleStats: muscleStats,
      daysLogged: history.length
    };
  } catch(e) { return null; }
};

// POLISH 2026-04 (INSIGHTS) : détection de patterns sur 7/14 jours glissants.
// Retourne un array de patterns [{ id, severity, label, advice }] ou [].
// Règles simples (sans faux positifs dangereux — pas d'alerte médicale directe).
// Sévérité : 'info' (neutre), 'warning' (attention), 'alert' (action recommandée).
window.detectWeekPatterns = function() {
  try {
    var patterns = [];
    var S = window.S;
    if (!S) return patterns;

    // Données d'entrée
    var sessionsSummary = (typeof window.getWeekSessionsSummary === 'function')
      ? window.getWeekSessionsSummary() : null;
    var wellnessAvg = (typeof window.getWellnessAvg === 'function')
      ? window.getWellnessAvg(7) : null;
    var weekPerf = (typeof window.getWeekPerformanceSummary === 'function')
      ? window.getWeekPerformanceSummary() : null;

    // PATTERN 1 : fatigue chronique — sommeil moyen < 3/5 sur 7j avec ≥ 3 jours loggés.
    // Évite faux positif si 1 seul jour logué.
    if (wellnessAvg && wellnessAvg.sleepAvg !== null && wellnessAvg.daysLogged >= 3 && wellnessAvg.sleepAvg < 3) {
      patterns.push({
        id: 'sleep_low_avg',
        severity: 'warning',
        label: 'Sommeil moyen bas (' + wellnessAvg.sleepAvg + '/5 sur ' + wellnessAvg.daysLogged + 'j)',
        advice: 'Privilégie récupération active, coucher avant 23h, évite écran 1h avant dodo.'
      });
    }

    // PATTERN 2 : douleurs récurrentes — muscles='douleurs' sur ≥ 2 jours dans les 7 derniers.
    if (wellnessAvg && wellnessAvg.muscleStats && wellnessAvg.muscleStats['douleurs'] >= 2) {
      patterns.push({
        id: 'pain_recurrent',
        severity: 'alert',
        label: wellnessAvg.muscleStats['douleurs'] + ' jours de douleurs sur 7',
        advice: 'Envisager un dé-load cette semaine. Consulter un pro si persiste.'
      });
    }

    // PATTERN 3 : sous-entraînement — 0 séance sur 7j glissants AVEC un programme sport actif.
    // FIX CONTRE-AUDIT : .length > 0 car [] est truthy en JS (array vide passait ce check).
    var _hasActiveProgram = S.sportType && Array.isArray(S.sportProgram) && S.sportProgram.length > 0;
    if (sessionsSummary && sessionsSummary.sessions === 0 && _hasActiveProgram) {
      patterns.push({
        id: 'undertraining',
        severity: 'info',
        label: 'Aucune séance cette semaine',
        advice: 'Reprise en douceur recommandée. Commence par 1 séance courte (30 min).'
      });
    }

    // PATTERN 4a : volume élevé — 7+ séances DANS LA SEMAINE (alerte info même sans douleur).
    // FIX CONTRE-AUDIT : avant, il fallait ABSOLUMENT une douleur pour alerter → users
    // qui minimisent les signaux passaient entre les mailles. Maintenant, volume seul suffit
    // à lever un warning informatif (7+ séances/sem = dépassement ACSM pour 99% des user).
    if (sessionsSummary && sessionsSummary.sessions >= 7) {
      var overSev = (weekPerf && weekPerf.lastPain) ? 'alert' : 'warning';
      var overId = (weekPerf && weekPerf.lastPain) ? 'overtraining' : 'high_volume';
      var overLabel = (weekPerf && weekPerf.lastPain)
        ? sessionsSummary.sessions + ' séances + douleur ' + weekPerf.lastPain
        : sessionsSummary.sessions + ' séances cette semaine (volume élevé)';
      var overAdvice = (weekPerf && weekPerf.lastPain)
        ? 'Dé-load -20% volume cette semaine. 1-2 jours repos complet conseillés.'
        : 'Au-delà de 6 séances/sem, le risque de blessure augmente. Pense à caser 1-2 jours repos complet.';
      patterns.push({ id: overId, severity: overSev, label: overLabel, advice: overAdvice });
    }

    // PATTERN 5 : progression positive — RPE moyen 6-8 ET charges en hausse.
    if (weekPerf && typeof weekPerf.rpeAvg === 'number' &&
        weekPerf.rpeAvg >= 6 && weekPerf.rpeAvg <= 8 &&
        typeof weekPerf.chargeProgressionPct === 'number' &&
        weekPerf.chargeProgressionPct > 0) {
      patterns.push({
        id: 'progress_positive',
        severity: 'info',
        label: 'Progression +' + weekPerf.chargeProgressionPct.toFixed(1) + '% charges, RPE moyen ' + weekPerf.rpeAvg + '/10',
        advice: 'Continue sur cette lancée. Respect du volume recommandé ISSN.'
      });
    }

    // PATTERN 6 : RPE en chute — RPE moyen semaine < RPE des séances individuelles précédentes.
    // Détectable uniquement si chargeProgressionPct < -5% (charges qui baissent).
    if (weekPerf && typeof weekPerf.chargeProgressionPct === 'number' &&
        weekPerf.chargeProgressionPct < -5) {
      patterns.push({
        id: 'charges_drop',
        severity: 'warning',
        label: 'Charges en baisse (' + weekPerf.chargeProgressionPct.toFixed(1) + '% vs sem précédente)',
        advice: 'Fatigue ? Deload voulu ? Vérifier sommeil + alimentation.'
      });
    }

    // PATTERN 7 : sommeil excellent — sleepAvg >= 4 sur ≥ 5j → encouragement.
    if (wellnessAvg && wellnessAvg.sleepAvg !== null && wellnessAvg.daysLogged >= 5 && wellnessAvg.sleepAvg >= 4) {
      patterns.push({
        id: 'sleep_excellent',
        severity: 'info',
        label: 'Sommeil excellent (' + wellnessAvg.sleepAvg + '/5 sur ' + wellnessAvg.daysLogged + 'j)',
        advice: 'Bases solides de récupération. Idéal pour pousser la progression.'
      });
    }

    return patterns;
  } catch(e) { return []; }
};

// POLISH 2026-04 (INSIGHTS) : agrégat COMPLET 7 jours pour widget dashboard + coach IA.
// { sessions, kcal, duration, daysActive, byDay, sleepAvg, muscleStats,
//   energyStats, rpeAvg, chargeProgressionPct, patterns[] }
// Tous les sous-helpers sont défensifs (null ok).
window.getWeekInsights = function() {
  try {
    var out = {};
    var sessions = (typeof window.getWeekSessionsSummary === 'function')
      ? window.getWeekSessionsSummary() : null;
    var wellness = (typeof window.getWellnessAvg === 'function')
      ? window.getWellnessAvg(7) : null;
    var perf = (typeof window.getWeekPerformanceSummary === 'function')
      ? window.getWeekPerformanceSummary() : null;
    var patterns = (typeof window.detectWeekPatterns === 'function')
      ? window.detectWeekPatterns() : [];

    if (sessions) {
      out.sessions = sessions.sessions;
      out.kcalTotal = sessions.kcalTotal;
      out.durationTotal = sessions.durationTotal;
      out.daysActive = sessions.daysActive;
      out.byDay = sessions.byDay;
    }
    if (wellness) {
      if (wellness.sleepAvg !== null) out.sleepAvg = wellness.sleepAvg;
      out.wellnessDaysLogged = wellness.daysLogged;
      if (wellness.muscleStats) out.muscleStats = wellness.muscleStats;
      if (wellness.energyStats) out.energyStats = wellness.energyStats;
    }
    if (perf) {
      if (typeof perf.rpeAvg === 'number') out.rpeAvg = perf.rpeAvg;
      if (typeof perf.chargeProgressionPct === 'number') out.chargeProgressionPct = perf.chargeProgressionPct;
      if (perf.lastPain) out.lastPain = perf.lastPain;
    }
    out.patterns = patterns || [];
    return out;
  } catch(e) { return { patterns: [] }; }
};

// POLISH 2026-04 : agrégat rollup sessions cette semaine (lundi → dimanche ISO).
// Lit S.sessionHistory (format { 'dayIdx_YYYY-MM-DD': {duration, kcalTotal, date, ... }})
// Retourne { sessions, kcalTotal, durationTotal, daysActive, byDay[0..6] } ou null.
// Utilisable par dashboard, coach IA, widgets divers (source de vérité unique).
window.getWeekSessionsSummary = function() {
  try {
    var S = window.S;
    if (!S || !S.sessionHistory || typeof S.sessionHistory !== 'object') {
      return { sessions: 0, kcalTotal: 0, durationTotal: 0, daysActive: 0, byDay: [0,0,0,0,0,0,0] };
    }
    // Calcul du lundi 00:00 de la semaine courante (ISO 8601)
    var now = new Date();
    var jsDay = now.getDay(); // 0=dim, 1=lun, ..., 6=sam
    var daysSinceMonday = (jsDay + 6) % 7; // Lun=0, Dim=6
    var monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday, 0, 0, 0, 0);
    var sessions = 0, kcalTotal = 0, durationTotal = 0;
    var byDay = [0, 0, 0, 0, 0, 0, 0]; // index 0 = lundi, 6 = dimanche
    Object.keys(S.sessionHistory).forEach(function(k) {
      var entry = S.sessionHistory[k];
      if (!entry || typeof entry !== 'object') return;
      // Parse la date : soit entry.date (ISO), soit via le suffixe clé 'dayIdx_YYYY-MM-DD'
      var dateStr = null;
      if (entry.date) {
        dateStr = String(entry.date).slice(0, 10);
      } else {
        var m = k.match(/(\d{4}-\d{2}-\d{2})$/);
        if (m) dateStr = m[1];
      }
      if (!dateStr) return;
      var entryDate = new Date(dateStr + 'T00:00:00');
      if (isNaN(entryDate.getTime())) return;
      if (entryDate < monday) return; // plus ancien que cette semaine
      if (entryDate > now) return; // futur (invalide)
      sessions += 1;
      var kcal = parseFloat(entry.kcalTotal);
      if (!isNaN(kcal) && isFinite(kcal) && kcal > 0) kcalTotal += kcal;
      var dur = parseFloat(entry.duration);
      if (!isNaN(dur) && isFinite(dur) && dur > 0) durationTotal += dur;
      // Slot jour (0=lundi)
      var diffDays = Math.floor((entryDate.getTime() - monday.getTime()) / (24 * 3600 * 1000));
      if (diffDays >= 0 && diffDays < 7) byDay[diffDays] += 1;
    });
    var daysActive = byDay.filter(function(v) { return v > 0; }).length;
    return {
      sessions: sessions,
      kcalTotal: Math.round(kcalTotal),
      durationTotal: Math.round(durationTotal),
      daysActive: daysActive,
      byDay: byDay
    };
  } catch(e) { return null; }
};

// POLISH 2026-04 : wellness history multi-jours — jusqu'ici S.todayWellness
// stockait 1 seul jour, impossible donc de corréler sleep↓ vs RPE↑ sur la durée.
// Maintenant : mtd_wellness_history_<uid> stocke jusqu'à 90 jours glissants.
// Schema : [{ date:'YYYY-MM-DD', sleep, muscles, energy, dismissed:false, savedAt:ISO }]
window.pushWellnessHistory = function(entry) {
  try {
    if (!entry || !entry.date) return false;
    var user = (window.AUTH && window.AUTH.getUser) ? window.AUTH.getUser() : null;
    var uid = user && user.id ? user.id : 'anon';
    var key = 'mtd_wellness_history_' + uid;
    var arr = [];
    try {
      var raw = localStorage.getItem(key);
      if (raw) { var parsed = JSON.parse(raw); if (Array.isArray(parsed)) arr = parsed; }
    } catch(e) {}
    // Dédupe : si on a déjà une entry pour cette date, on remplace (dernier gagne)
    arr = arr.filter(function(x) { return x && x.date !== entry.date; });
    var clean = { date: String(entry.date), savedAt: new Date().toISOString() };
    if (entry.sleep !== undefined) clean.sleep = entry.sleep;
    if (entry.muscles) clean.muscles = String(entry.muscles).slice(0, 40);
    if (entry.energy) clean.energy = String(entry.energy).slice(0, 40);
    if (entry.dismissed) clean.dismissed = true;
    arr.push(clean);
    // Tri chronologique + purge > 90 jours (glissant)
    arr.sort(function(a, b) { return (a.date < b.date) ? -1 : (a.date > b.date ? 1 : 0); });
    if (arr.length > 90) arr = arr.slice(-90);
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch(e) {
      console.warn('[wellnessHistory] localStorage full:', e);
    }
    return true;
  } catch(e) { return false; }
};

// Lit l'historique wellness (N derniers jours). Retourne array (vide si rien).
window.getWellnessHistory = function(days) {
  try {
    var user = (window.AUTH && window.AUTH.getUser) ? window.AUTH.getUser() : null;
    var uid = user && user.id ? user.id : 'anon';
    var raw = localStorage.getItem('mtd_wellness_history_' + uid);
    if (!raw) return [];
    var arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    if (typeof days !== 'number' || days <= 0) return arr;
    var cutoff = new Date(Date.now() - days * 24 * 3600 * 1000);
    var cutoffStr = cutoff.toISOString().slice(0, 10);
    return arr.filter(function(x) { return x && x.date && x.date >= cutoffStr; });
  } catch(e) { return []; }
};

// POLISH 2026-04 (VX) : Disclaimer médical au premier login — obligatoire pour
// protection légale (CGU promettent que user a "lu et compris"). Modal bloquant
// non-dismissible sauf validation explicite. Flag persisté en localStorage par uid.
window.showMedicalDisclaimerIfNeeded = function() {
  try {
    var user = (window.AUTH && window.AUTH.getUser) ? window.AUTH.getUser() : null;
    if (!user || !user.id) return false; // ne s'affiche qu'une fois loggé
    var uid = user.id;
    var storageKey = 'mtd_disclaimer_accepted_' + uid;
    if (localStorage.getItem(storageKey) === '1') return false; // déjà accepté
    if (document.getElementById('mtd-medical-disclaimer')) return true; // déjà affiché
    var overlay = document.createElement('div');
    overlay.id = 'mtd-medical-disclaimer';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'mtd-disclaimer-title');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(10,10,9,0.82);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
    var sheet = document.createElement('div');
    sheet.style.cssText = 'background:var(--ivory,#FAF9F6);max-width:460px;width:100%;max-height:90vh;overflow-y:auto;border:1px solid var(--black,#0A0A09);border-radius:0;padding:28px 26px;';
    var eyebrow = document.createElement('div');
    eyebrow.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--error,#7A1F1F);font-weight:400;margin-bottom:10px;';
    eyebrow.textContent = '\u26A0 Avertissement important';
    var title = document.createElement('h2');
    title.id = 'mtd-disclaimer-title';
    title.style.cssText = 'font-family:Georgia,serif;font-size:22px;line-height:1.3;margin:0 0 16px;color:var(--black,#0A0A09);font-weight:normal;';
    title.textContent = 'SmartFitCoach n\'est pas un dispositif m\u00e9dical';
    var body = document.createElement('div');
    body.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;line-height:1.65;color:var(--black,#0A0A09);margin-bottom:20px;';
    body.innerHTML = [
      '<p style="margin:0 0 12px">Les informations et recommandations fournies par SmartFitCoach (coach IA, plans nutrition et sport, analyses) sont proposées \u00e0 titre <strong>informatif et p\u00e9dagogique</strong>.</p>',
      '<p style="margin:0 0 12px">Elles ne remplacent en aucun cas l\'avis d\'un <strong>m\u00e9decin, nutritionniste, kin\u00e9sith\u00e9rapeute ou coach sportif qualifi\u00e9</strong>.</p>',
      '<p style="margin:0 0 12px">Avant de d\u00e9buter un programme, consulte un professionnel de sant\u00e9 si tu es enceinte, allaitantes, as une pathologie chronique (cardiaque, diab\u00e8te, TCA, etc.), prends un traitement ou as des douleurs non diagnostiqu\u00e9es.</p>',
      '<p style="margin:0">En cas de doute, de douleur persistante ou de malaise : <strong>arr\u00eate ton entra\u00eenement et consulte un m\u00e9decin</strong>.</p>'
    ].join('');
    var cguLink = document.createElement('a');
    cguLink.href = 'cgu.html';
    cguLink.target = '_blank';
    cguLink.rel = 'noopener';
    cguLink.textContent = 'Lire les CGU complètes →';
    cguLink.style.cssText = 'display:inline-block;margin-bottom:16px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:1px;color:var(--grey,#6B6B65);text-decoration:underline;';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.style.cssText = 'width:100%;padding:14px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;';
    btn.textContent = 'J\'ai lu et compris';
    btn.addEventListener('click', function() {
      try { localStorage.setItem(storageKey, '1'); } catch(e) {}
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    });
    sheet.appendChild(eyebrow);
    sheet.appendChild(title);
    sheet.appendChild(body);
    sheet.appendChild(cguLink);
    sheet.appendChild(btn);
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
    // FIX CONTRE-AUDIT : focus trap WCAG AA. Tab/Shift+Tab rebouclent DANS le modal,
    // empêchant l'user de sortir vers l'app derrière (garanti lecture effective).
    var focusables = [cguLink, btn];
    overlay.addEventListener('keydown', function(e) {
      if (e.key === 'Tab') {
        var idx = focusables.indexOf(document.activeElement);
        if (e.shiftKey) {
          if (idx <= 0) { e.preventDefault(); focusables[focusables.length - 1].focus(); }
        } else {
          if (idx === focusables.length - 1 || idx === -1) { e.preventDefault(); focusables[0].focus(); }
        }
      }
    });
    // Bloque aussi le body scroll pendant que le modal est ouvert
    var _prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    btn.addEventListener('click', function _restoreOnClose() {
      document.body.style.overflow = _prevBodyOverflow || '';
    }, { once: true });
    // Accessibilité : focus initial sur le bouton de validation
    setTimeout(function() { try { btn.focus(); } catch(e) {} }, 100);
    return true;
  } catch(e) { return false; }
};

// FIX D5 COHÉRENCE PRÉNOM 2026-04 : helper unifié pour afficher le prénom.
// Avant : today-dashboard, ai-coach et push-manager utilisaient 3 priorités différentes
//         → user pouvait voir "Tom" sur le dashboard, "Thomas" dans ai-coach, "" dans push.
// Maintenant : priorité unique S.prenom > user.name first part > '' (défaut).
window.getDisplayFirstName = function() {
  try {
    var S = window.S || {};
    if (S.prenom && typeof S.prenom === 'string' && S.prenom.trim()) return S.prenom.trim();
    var user = (window.AUTH && window.AUTH.getUser) ? window.AUTH.getUser() : null;
    if (user && user.name && typeof user.name === 'string') {
      var first = user.name.trim().split(/\s+/)[0];
      if (first) return first;
    }
  } catch(e) {}
  return '';
};

// ─── SECURITY: Input Sanitization ───
window.sanitizeHTML = function(str) {
  if (typeof str !== 'string') return '';
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

// ─── PROFILE VALIDATION ───
window.validateProfile = function validateProfile(data) {
  var errors = [];
  if (data.age !== undefined && (isNaN(data.age) || data.age < 10 || data.age > 120))
    errors.push('Âge invalide (10-120 ans)');
  if (data.weight !== undefined && (isNaN(data.weight) || data.weight < 30 || data.weight > 300))
    errors.push('Poids invalide (30-300 kg)');
  if (data.height !== undefined && (isNaN(data.height) || data.height < 100 || data.height > 250))
    errors.push('Taille invalide (100-250 cm)');
  return errors;
};

// ─── LOCALSTORAGE HELPERS (versioning + corruption recovery) ───
var LS_VERSION = 1;
window.LS_VERSION = LS_VERSION;

// In-memory fallback for Safari private browsing / storage blocked / quota exceeded.
// Data survives the session but not page reloads — better than silent loss.
var _sfcMemFallback = {};

window.lsGet = function lsGet(key, defaultVal) {
  try {
    var raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) {
      // Check memory fallback (set when localStorage was unavailable)
      return Object.prototype.hasOwnProperty.call(_sfcMemFallback, key) ? _sfcMemFallback[key] : defaultVal;
    }
    return JSON.parse(raw);
  } catch(e) {
    // Corrupted JSON — try memory fallback before giving up
    if (Object.prototype.hasOwnProperty.call(_sfcMemFallback, key)) return _sfcMemFallback[key];
    try { localStorage.removeItem(key); } catch(_) {}
    return defaultVal;
  }
};

window.lsSet = function lsSet(key, value) {
  // Keep memory store in sync regardless — ensures reads are consistent after a write failure
  _sfcMemFallback[key] = value;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch(e) {
    // Private browsing or quota exceeded: memory fallback already set above
    if (e.name === 'QuotaExceededError') {
      console.warn('[storage] Quota dépassé, sauvegarde mémoire uniquement pour', key);
    }
  }
};

// ─── CONSTANTS ───
var STEPS=['Accueil','Identité','Morphologie','Activité','Santé','Objectif','Préférences','Résultats','Planning'];
// FIX Hermès : icônes sobres unicode (◯ ● chiffres romains) — remplace emojis colorés.
var ACTIVITIES=[
  {icon:'\u25CB',name:'Sédentaire',desc:'Pas d\'exercice',factor:1.2},
  {icon:'I',name:'Légèrement actif',desc:'1-2x / semaine',factor:1.375},
  {icon:'II',name:'Modérément actif',desc:'3-4x / semaine',factor:1.55},
  {icon:'III',name:'Très actif',desc:'5-6x / semaine',factor:1.725},
  {icon:'IV',name:'Athlète',desc:'6-7 séances / semaine',factor:1.9},
  {icon:'V',name:'Athlète élite',desc:'>10h / semaine (IRONMAN, pro)',factor:2.1}
];
var TRAINS=[{icon:'\u25A0',name:'Musculation'},{icon:'\u25B2',name:'Cardio'},{icon:'\u25C6',name:'Mixte'},{icon:'\u25CF',name:'Sport co.'},{icon:'\u2192',name:'Running'}];
var SLEEPS=['< 6h','6-7h','7-8h','8h+'];
var GOALS=[
  {icon:'↗',name:'Prise de muscle',desc:'+15% calories',mult:1.15,key:'bulk'},
  {icon:'↗',name:'Prise de muscle progressive',desc:'+10% calories',mult:1.10,key:'lean_bulk'},
  {icon:'=',name:'Maintien',desc:'= TDEE',mult:1.0,key:'maintain'},
  {icon:'↘',name:'Perte de poids',desc:'-15% calories',mult:0.85,key:'cut'},
  {icon:'↓',name:'Définition & sèche',desc:'-20% calories (plafonn\u00e9 \u00e0 \u22125\u200900 kcal/j max — Helms 2014)',mult:0.80,key:'shred'},
  {icon:'=',name:'Recomposition corporelle',desc:'Maintien calories, optimisation macros',mult:1.00,key:'recomposition'}
];
// RATIOS : distribution calorique indicative par objectif (pour affichage uniquement)
// ATTENTION : calcMacros() utilise la méthode g/kg (ISSN 2017), pas ces ratios
// Ces valeurs ne sont PAS utilisées pour le calcul des macros — elles servent uniquement à l'affichage indicatif
// Note : l'approche g/kg est cliniquement supérieure aux % de calories (ISSN 2017, Helms 2014)
var RATIOS={bulk:{g:.55,p:.25,l:.20},maintain:{g:.50,p:.30,l:.20},cut:{g:.40,p:.35,l:.25},shred:{g:.30,p:.40,l:.30},recomposition:{g:.40,p:.35,l:.25}};
var COOK_LEVELS=[{name:'Facile',desc:'5-10 min',val:1},{name:'Moyen',desc:'15-20 min',val:2},{name:'Avancé',desc:'30 min',val:3},{name:'Chef',desc:'45+ min',val:4}];
var ALLERGIES=['Aucune','Fruits à coque','Arachides','Œufs','Poisson','Crustacés','Soja','Lait/Produits laitiers','Gluten/Blé','Sésame','Moutarde'];
var INTOLERANCES=['Aucune','Lactose','Gluten','Fructose','Histamine'];
var REGIMES=[{icon:'♦',name:'Omnivore'},{icon:'♦',name:'Pescétarien'},{icon:'♦',name:'Végétarien'},{icon:'♦',name:'Végan'}];
var CUISINES=[{f:'🌍',name:'Toutes'},{f:'🇫🇷',name:'Française'},{f:'🇺🇸',name:'Américaine'},{f:'🇯🇵',name:'Japonaise'},{f:'🇲🇦',name:'Marocaine'},{f:'🇮🇹',name:'Italienne'},{f:'🇹🇭',name:'Thaïlandaise'},{f:'🇮🇳',name:'Indienne'},{f:'🇰🇷',name:'Coréenne'},{f:'🇲🇽',name:'Mexicaine'},{f:'🇱🇧',name:'Libanaise'},{f:'🇻🇳',name:'Vietnamienne'}];
var CUISINE_FLAGS={'Toutes':null,'Française':'🇫🇷','Américaine':'🇺🇸','Japonaise':'🇯🇵','Marocaine':'🇲🇦','Italienne':'🇮🇹','Thaïlandaise':'🇹🇭','Indienne':'🇮🇳','Coréenne':'🇰🇷','Mexicaine':'🇲🇽','Libanaise':'🇱🇧','Vietnamienne':'🇻🇳'};
var MEDICAL=[
  {cat:'MÉTABOLIQUES',items:[
    {id:'diabete_t2',name:'Diabète type 2',desc:'Réduction glucides simples, IG bas',icon:'◆'},
    {id:'diabete_t1',name:'Diabète type 1',desc:'Comptage glucides précis',icon:'◆'},
    {id:'prediabete',name:'Pré-diabète / Résistance insuline',desc:'Limiter sucres rapides, favoriser fibres',icon:'◆'},
    {id:'cholesterol',name:'Hypercholestérolémie',desc:'Réduction graisses saturées',icon:'◆'},
    {id:'triglycerides',name:'Hypertriglycéridémie',desc:'Limiter sucres et alcool',icon:'◆'},
    {id:'goutte',name:'Goutte / Hyper-uricémie',desc:'Éviter purines (abats, sardines)',icon:'◆'}
  ]},
  {cat:'CARDIOVASCULAIRES',items:[
    {id:'hta',name:'Hypertension artérielle',desc:'Régime hyposodé, DASH',icon:'◇'},
    {id:'hta_severe',name:'HTA sévère (≥180/110 mmHg)',desc:'Contre-indique HIIT/CrossFit — avis cardiologue obligatoire',icon:'◇'},
    {id:'cardio',name:'Maladie cardiovasculaire',desc:'Réduction sodium et graisses saturées',icon:'◇'},
    {id:'insuffisance_card',name:'Insuffisance cardiaque',desc:'Restriction sodique stricte',icon:'◇'}
  ]},
  {cat:'RÉNALES',items:[
    {id:'irc',name:'Insuffisance rénale chronique',desc:'Contrôle protéines, potassium, phosphore',icon:'○'},
    {id:'calculs',name:'Calculs rénaux',desc:'Hydratation, limiter oxalates et sodium',icon:'○'}
  ]},
  {cat:'DIGESTIVES',items:[
    {id:'rgo',name:'Reflux gastro-œsophagien (RGO)',desc:'Éviter acides, café, épices fortes',icon:'□'},
    {id:'sii',name:'Syndrome intestin irritable (SII)',desc:'Régime pauvre en FODMAP',icon:'□'},
    {id:'crohn',name:'Maladie de Crohn',desc:'Fibres adaptées, éviter irritants',icon:'□'},
    {id:'rch',name:'Rectocolite hémorragique',desc:'Alimentation anti-inflammatoire',icon:'□'},
    {id:'coeliaque',name:'Maladie cœliaque',desc:'Zéro gluten strict',icon:'□'},
    {id:'nash',name:'Stéatose hépatique (NASH)',desc:'Réduction sucres et graisses',icon:'□'}
  ]},
  {cat:'HORMONALES & AUTO-IMMUNES',items:[
    {id:'hypothyroidie',name:'Hypothyroïdie',desc:'Iode, sélénium, éviter excès soja',icon:'△'},
    {id:'hyperthyroidie',name:'Hyperthyroïdie',desc:'Apport calorique adapté, calcium',icon:'△'},
    {id:'sopk',name:'SOPK',desc:'IG bas, anti-inflammatoire',icon:'△'},
    {id:'menopause',name:'Ménopause / Post-ménopause',desc:'Calcium, vit D, protéines + , kcal réduits',icon:'△'},
    {id:'hashimoto',name:'Thyroïdite de Hashimoto',desc:'Anti-inflammatoire, sans gluten optionnel',icon:'△'}
  ]},
  {cat:'OS & ARTICULATIONS',items:[
    {id:'osteoporose',name:'Ostéoporose',desc:'Calcium, vitamine D, protéines',icon:'▽'},
    {id:'polyarthrite',name:'Polyarthrite rhumatoïde',desc:'Oméga-3, anti-inflammatoire',icon:'▽'},
    {id:'spondylarthrite',name:'Spondylarthrite ankylosante',desc:'Anti-inflammatoire, mobilité, natation/yoga recommandés',icon:'▽'}
  ]},
  {cat:'CARENCES & AUTRES',items:[
    {id:'anemie',name:'Anémie ferriprive',desc:'Fer héminique, vitamine C',icon:'●'},
    {id:'anemie_b12',name:'Carence B12 / Folates',desc:'Sources animales ou supplémentation',icon:'●'},
    {id:'obesity',name:'Obésité (IMC > 30)',desc:'Déficit calorique contrôlé',icon:'●'},
    {id:'tca',name:'Troubles du comportement alimentaire',desc:'Suivi médical recommandé',icon:'●'},
    {id:'grossesse',name:'Grossesse',desc:'Folates, fer, calcium, protéines +',icon:'●'},
    {id:'allaitement',name:'Allaitement',desc:'+500 kcal/j, calcium, vitamine D, iode',icon:'●'},
    {id:'insomnia',name:'Troubles du sommeil',desc:'Magnésium, tryptophane, éviter excitants',icon:'●'}
  ]}
];
var MEDICAL_ADVICE={
  diabete_t2:{warn:'Glucides simples limités. Privilégiez les céréales complètes et légumineuses.',macroAdj:{g:-.10,p:.05,l:.05}},
  diabete_t1:{warn:'Comptage glucidique essentiel. Consultez votre diabétologue.',macroAdj:{g:-.05,p:.03,l:.02}},
  prediabete:{warn:'Favorisez les aliments à index glycémique bas et les fibres.',macroAdj:{g:-.08,p:.04,l:.04}},
  // AHA/ESC 2019 : hypercholestérolémie → réduire graisses SATURÉES (qualité, pas quantité totale)
  // Ne PAS réduire les lipides totaux : MUFA (olive) et PUFA (oméga-3) sont cardioprotecteurs
  // macroAdj.l supprimé (réduire lipides totaux = contre-productif si on supprime les bons)
  cholesterol:{warn:'Réduisez les graisses saturées (charcuteries, beurre, fromages gras). Privilégiez MUFA (huile d\'olive) et oméga-3 (poisson gras, noix, lin). Fibres solubles (avoine, psyllium) réduisent LDL de 5-10% (AHA 2019).',macroAdj:{g:.02,p:.02,l:0}},
  // ESC/EAS 2016 : hypertriglycéridémie → réduire glucides ET alcool (principal levier)
  // Les oméga-3 EPA/DHA à 2-4g/j réduisent TG de 20-50% (ESC 2016) → pas d'augmentation lipides totaux
  // macroAdj.l corrigé à 0 (les lipides omega-3 sont déjà recommandés via suppléments)
  triglycerides:{warn:'Réduisez les glucides rapides et l\'alcool — premier levier. Oméga-3 (EPA+DHA 2-4g/j) réduisent les TG de 20-50% (ESC 2016). Évitez jus de fruits, sodas, miel, sirop d\'agave.',macroAdj:{g:-.10,p:.03,l:0}},
  goutte:{warn:'Évitez les abats, sardines, anchois. Buvez 2L+ d\'eau/jour.',macroAdj:null},
  // DASH + OMS : sodium ≤ 2.3 g/j (idéal ≤1.5 g/j) = sel ≤ 5-6 g/j.
  // Potassium 4700mg/j (DASH), magnésium 320-420mg, calcium 1000-1300mg → -6/-10 mmHg PAS.
  // Alcool ≤2U/j homme, ≤1U/j femme (OMS 2023). Réduction 10% poids → -5 à -20 mmHg.
  hta:{warn:'Régime DASH : sodium ≤ 2,3 g/j (sel ≤ 5-6 g/j — OMS 2023). Augmentez potassium (banane, épinards, légumineuses : 4700 mg/j), magnésium et calcium. Alcool ≤ 2 verres/j (homme) ou ≤ 1 (femme). Activité aérobie 30 min/j réduit la PA de 5-8 mmHg.',macroAdj:null},
  hta_severe:{warn:'HTA sévère (≥180/110) : régime hyposodé strict (sodium ≤ 1,5 g/j = sel ≤ 3 g/j — AHA 2021). Évitez Valsalva et efforts maximaux. Avis cardiologue obligatoire avant reprise.',macroAdj:null},
  // ESC 2021 : cardiopathie → ne PAS réduire lipides totaux (MUFA/PUFA cardioprotecteurs) — qualité graisses, pas quantité
  cardio:{warn:'Réduisez sodium et graisses saturées. Plus d\'oméga-3.',macroAdj:{g:.03,p:.02,l:0}},
  insuffisance_card:{warn:'Restriction sodique stricte. Consultez votre cardiologue pour les apports hydriques.',macroAdj:null},
  irc:{warn:'Contrôlez les protéines (0.55-0.60g/kg — KDOQI 2020). Limitez potassium et phosphore. Glucides complexes pour compenser l\'énergie.',macroAdj:{g:.08,p:0,l:.02}},
  calculs:{warn:'Buvez 2.5L+ d\'eau/jour. Limitez les oxalates (épinards, chocolat).',macroAdj:null},
  rgo:{warn:'Évitez café, chocolat, tomates, épices fortes. Repas fractionnez.',macroAdj:null},
  sii:{warn:'Régime pauvre en FODMAP en phase d\'exclusion. Réintroduction progressive.',macroAdj:null},
  crohn:{warn:'Fibres solubles préférées. Évitez les aliments irritants en poussée.',macroAdj:null},
  rch:{warn:'Alimentation anti-inflammatoire. Oméga-3, curcuma.',macroAdj:null},
  coeliaque:{warn:'Exclusion totale du gluten (blé, orge, seigle, avoine contaminée).',macroAdj:null},
  // ESPEN 2016 / NAFLD : NASH → réduire sucres et glucides à IG élevé, lipides neutres (ne pas augmenter)
  nash:{warn:'Réduction des sucres ajoutés et graisses saturées. Perte de poids progressive.',macroAdj:{g:-.08,p:.03,l:0}},
  hypothyroidie:{warn:'Assurez iode et sélénium. Évitez excès de soja et crucifères crus.',macroAdj:null},
  hyperthyroidie:{warn:'Apport calorique augmenté. Calcium et vitamine D importants.',macroAdj:null},
  sopk:{warn:'Index glycémique bas, anti-inflammatoire. Oméga-3 et magnésium.',macroAdj:{g:-.08,p:.04,l:.04}},
  // NAMS 2022 + ESPEN 2019 : ménopause → +10% protéines (résistance anabolique + perte musculaire)
  // Lipides : pas de réduction totale — oméga-3 protecteurs cardiovasculaires (ESC 2021)
  // macroAdj.p corrigé à +0.10 (cohérence avec description "+10%") | macroAdj.l corrigé à 0
  // FIX P2 audit user Marie : advice ménopause enrichi — bouffées de chaleur + sommeil
  // (items majeurs du vécu ménopausique manquants, NAMS 2023 / Menopause 2022).
  menopause:{warn:'Ménopause : métabolisme réduit ~100-150 kcal/j (NAMS 2022). Calcium 1200 mg/j + Vitamine D 800-2000 UI. Protéines +10% pour préserver le muscle (ESPEN 2019). Oméga-3 cardio/os. Bouffées de chaleur : évitez alcool, caféine, épices, repas très chauds — privilégiez phytoœstrogènes (soja, lin) et vêtements légers. Sommeil perturbé : tisanes valériane/passiflore, chambre fraîche (<18°C), pas d\'écran 1h avant coucher. Ne prenez aucune hormonothérapie sans avis gynécologue.',macroAdj:{g:-.05,p:.10,l:0}},
  hashimoto:{warn:'Anti-inflammatoire. Certains patients bénéficient du sans gluten.',macroAdj:null},
  // Ostéoporose : calcium 1200mg/j + vitamine D 800-2000 UI/j + protéines ≥1.2g/kg (NOF 2022, ESCEO 2019)
  // Exercice en charge (marche, muscu légère ≤70% 1RM) réduit le risque fracturaire (Kohrt et al. MSSE 2004)
  // NOF 2022 / ESCEO 2019 : ostéoporose → pas de restriction lipidique (vit D liposoluble, nécessite graisses)
  osteoporose:{warn:'Calcium 1200 mg/j + Vitamine D 800-2000 UI/j (NOF 2022). Protéines ≥ 1.2 g/kg pour maintien osseux (ESCEO 2019). Exercice en charge recommandé (marche, muscu légère ≤70% 1RM). Évitez alcool et tabac.',macroAdj:{g:-.03,p:.05,l:0}},
  // Polyarthrite rhumatoïde : oméga-3 3-5g/j EPA+DHA (Calder, AJCN 2015), réduction TNF-alpha
  polyarthrite:{warn:'Oméga-3 EPA+DHA 3-5g/j — réduction inflammation (Calder, AJCN 2015). Réduisez oméga-6 (huiles végétales raffinées) et aliments ultra-transformés (pro-inflammatoires). Alimentation méditerranéenne recommandée (Sköldstam et al. Scand J Rheumatol 2003). Curcuma (curcumine) : anti-inflammatoire adjuvant.',macroAdj:null},
  // Spondylarthrite ankylosante : Sieper & Poddubnyy, Lancet 2017
  // Exercice recommandé : natation, yoga, étirements quotidiens maintiennent mobilité rachidienne
  // Charges axiales lourdes (soulevé de terre, squat lourd) : déconseillées (contrainte sur enthèses)
  spondylarthrite:{warn:'Alimentation anti-inflammatoire (oméga-3, méditerranéenne). Certains patients bénéficient d\'une réduction des glucides fermentescibles (FODMAP). Vitamine D importante (déficit fréquent dans la SA — Braun & Sieper 2011). Exercice quotidien maintient la mobilité rachidienne (Sieper & Poddubnyy, Lancet 2017).',macroAdj:{g:-.03,p:.02,l:.01}},
  // Besoins en fer : femme en âge de procréer 18 mg/j, homme/postménopause 8 mg/j (ANSES 2021)
  // Sportive : +30-70% par rapport aux besoins standards (hémoscopie, hémolyse du pied — Schumacher et al. BJSM 2002)
  anemie:{warn:'Fer héminique (viande rouge, foie, huîtres) + vitamine C pour l\'absorption. Évitez thé/café aux repas (réduction absorption -60%). Femme sportive : besoins 18-27 mg/j (Schumacher et al. BJSM 2002 — hémolyse à l\'impact, pertes menstruelles). Prise de sang ferritine recommandée.',macroAdj:null},
  anemie_b12:{warn:'Sources B12 : viande, poisson, œufs. Supplémentation si végétalien.',macroAdj:null},
  obesity:{warn:'Déficit calorique modéré (-500 kcal/j max). Protéines hautes pour préserver la masse maigre.',macroAdj:{g:-.08,p:.10,l:-.02}},
  tca:{warn:'Un suivi médical et psychologique est fortement recommandé.',macroAdj:null},
  // ACOG 2018 / OMS : +340 kcal/j T2, +450 kcal/j T3 (corrigé de l'erreur "+300 T2")
  grossesse:{warn:'Acide folique 400µg, fer 27mg, calcium. +340 kcal/j au 2e trimestre, +450 kcal/j au 3e (ACOG 2018 / OMS).',macroAdj:{g:.02,p:.05,l:.02}},
  allaitement:{warn:'Allaitement : +500 kcal/j (ACOG 2022). Calcium 1200mg/j, iode 290µg/j, vitamine D 600 UI. Évitez caféine >200mg/j et alcool.',macroAdj:{g:.03,p:.07,l:.01}},
  insomnia:{warn:'Magnésium, tryptophane (dinde, banane). Évitez caféine après 14h.',macroAdj:null}
};
var MEAL_SPLIT={pctBreak:.25,pctLunch:.45,pctSnack:0,pctDinner:.30}; // défaut 3 repas — pctSnack=0 car generateWeek ne génère pas de collation pour meals<4
// getMealSplit() : distribution dynamique selon activité et nombre de repas (vs MEAL_SPLIT fixe)
// Base : ADA 2023, ISSN 2017, Ivy 2004 (post-workout nutrition window)
// INVARIANT : pctSnack doit être 0 quand meals<4, car generateWeek n'alloue le slot snack que si meals>=4.
// Un pctSnack>0 avec meals=3 crée un déficit calorique silencieux égal à pctSnack×TDEE (ex: 5%×1800=90kcal/j).
function _getMealSplitBase(){
  var s=window.S;
  var meals=s.mealsPerDay||3;
  var actFactor=s.activity!==null&&ACTIVITIES[s.activity]?ACTIVITIES[s.activity].factor:1.2;
  var isAthlete=actFactor>=1.725; // Très actif ou Athlète
  if(meals<=2){
    // Jeûne intermittent : 2 repas principaux, pas de collation
    return{pctBreak:.40,pctLunch:.60,pctSnack:0,pctDinner:0,
      note:'Jeûne intermittent : 2 repas — assurez un apport protéique suffisant à chaque repas (≥0.4g/kg/repas — Norton 2012)'};
  }
  if(meals===3){
    if(isAthlete){
      return{pctBreak:.25,pctLunch:.43,pctSnack:0,pctDinner:.32,
        note:'Athlète 3 repas : collation post-entraînement recommandée (+glucides/protéines dans les 30-45min — Ivy 2004). Ajoutez 150-250kcal (banane + whey ou fruit + yaourt grec) après séance.'};
    }
    return{pctBreak:.25,pctLunch:.45,pctSnack:0,pctDinner:.30}; // clone de MEAL_SPLIT
  }
  if(meals===4){
    if(isAthlete){
      return{pctBreak:.25,pctLunch:.35,pctSnack:.10,pctDinner:.30,
        note:'4 repas athlète : collation post-entraînement 10% des calories — mix glucides:protéines 3:1 optimal (Ivy 2004, ISSN 2017)'};
    }
    return{pctBreak:.25,pctLunch:.38,pctSnack:.07,pctDinner:.30,
      note:'4 repas : petite collation équilibrée en milieu d\'après-midi'};
  }
  if(meals>=5){
    if(isAthlete){
      // 0.20+0.30+0.20+0.30 = 1.00 ✓
      return{pctBreak:.20,pctLunch:.30,pctSnack:.20,pctDinner:.30,
        note:'5 repas athlète : collation étendue pré+post entraînement — fractionner l\'apport protéique toutes les 3-4h pour maximiser la synthèse protéique (Moore 2012, Churchward-Venne 2016)'};
    }
    // 0.22+0.33+0.13+0.32 = 1.00 ✓
    return{pctBreak:.22,pctLunch:.33,pctSnack:.13,pctDinner:.32,
      note:'5 repas : fractionnement modéré — améliore satiété et glycémie'};
  }
  return{pctBreak:.25,pctLunch:.45,pctSnack:0,pctDinner:.30};
}
// Nutrient timing : ajuste la distribution selon l'heure d'entraînement (±5% max)
// Source : Ivy 2004, ISSN Position Stand 2017, Aragon & Schoenfeld 2013
// INVARIANT : la somme des pct reste toujours 1.00 (vérifié manuellement pour chaque cas)
function _applyTrainTiming(sp, trainTime){
  if(!trainTime) return sp; // pas d'entraînement renseigné → comportement identique
  var SHIFT=0.05; // 5% redistribué — modeste, conforme à la littérature (Aragon 2013 : timing < total journalier)
  var r=function(x){return Math.round(x*100)/100;}; // arrondi 2 décimales
  var b=sp.pctBreak, l=sp.pctLunch, sn=sp.pctSnack, d=sp.pctDinner;
  var timing='';
  if(trainTime==='morning'){
    // Matin : petit-déj = post-séance (fenêtre anabolique) → +5%, dîner allégé → -5%
    // Guard : pctDinner doit rester ≥ 0.15 après shift
    if(d>=SHIFT+0.15){b=r(b+SHIFT);d=r(d-SHIFT);timing='\uD83D\uDCAA Post-séance matin';}
  } else if(trainTime==='noon'){
    // Midi : déjeuner = post-séance → +5%, petit-déj allégé → -5%
    // Guard : pctBreak doit rester ≥ 0.15 après shift
    if(b>=SHIFT+0.15){l=r(l+SHIFT);b=r(b-SHIFT);timing='\u26A1 Pré-séance midi';}
  } else if(trainTime==='evening'){
    // Soir : dîner = post-séance → +5%, petit-déj allégé → -5%
    // Guard : pctBreak doit rester ≥ 0.15 après shift
    if(b>=SHIFT+0.15&&d>0){d=r(d+SHIFT);b=r(b-SHIFT);timing='\uD83C\uDF19 Post-séance soir';}
  }
  return{pctBreak:b,pctLunch:l,pctSnack:sn,pctDinner:d,note:sp.note,trainTimingNote:timing};
}
function getMealSplit(){
  return _applyTrainTiming(_getMealSplitBase(), window.S && window.S.trainTime);
}
window.getMealSplit=getMealSplit;

// ─── TRAINING DAY DETECTION ────────────────────────────────────────────────
// getDayType(dayIndex) — détermine si un jour de la semaine (0=Lun..6=Dim)
// est un jour d'entraînement ou de repos.
// Source de vérité #1 : weeklyCalendar (Calendrier Intelligent — choix explicite utilisateur)
// Source de vérité #2 : trainingDaysSelected (jours sélectionnés en onboarding)
// Source de vérité #3 : sportDays (distribution standard N jours/semaine, fallback)
// Retourne {isTraining, trainSlot, preSlot, postSlot}
function getDayType(dayIndex) {
  var s = window.S;
  if (!s) return { isTraining: false, trainSlot: null, preSlot: null, postSlot: null };

  var isTraining;

  // Source de vérité #1 — Calendrier intelligent (weeklyCalendar)
  // L'utilisateur a explicitement planifié ses sports → priorité maximale
  if (s.weeklyCalendar && typeof s.weeklyCalendar === 'object' &&
      s.weeklyCalendar[String(dayIndex)] !== undefined) {
    isTraining = (s.weeklyCalendar[String(dayIndex)] !== 'repos' && s.weeklyCalendar[String(dayIndex)] !== 'autre');
  }
  // Source de vérité #2 — Jours spécifiques sélectionnés en onboarding
  else if (Array.isArray(s.trainingDaysSelected) && s.trainingDaysSelected.length > 0) {
    isTraining = s.trainingDaysSelected.indexOf(dayIndex) !== -1;
  }
  // Source de vérité #3 — Distribution standard N jours/semaine (fallback)
  else {
    var nDays = s.sportDays || 0;
    if (nDays <= 0) return { isTraining: false, trainSlot: null, preSlot: null, postSlot: null };
    var LAYOUTS = {
      1: [0],              // Lun
      2: [0, 3],           // Lun, Jeu
      3: [0, 2, 4],        // Lun, Mer, Ven
      4: [0, 1, 3, 4],     // Lun, Mar, Jeu, Ven
      5: [0, 1, 2, 3, 4],  // Lun-Ven
      6: [0, 1, 2, 3, 4, 5] // Lun-Sam
    };
    var trainingDays = LAYOUTS[Math.min(nDays, 6)] || LAYOUTS[3];
    isTraining = trainingDays.indexOf(dayIndex) >= 0;
  }

  if (!isTraining) {
    return { isTraining: false, trainSlot: null, preSlot: null, postSlot: null };
  }

  // Calculer trainSlot/preSlot/postSlot selon nombre de repas et horaire d'entraînement
  var meals = s.mealsPerDay || 3;
  var trainTime = s.trainTime || 'afternoon';
  var trainSlot, preSlot, postSlot;

  if (meals >= 4) {
    // slots: 0=breakfast, 1=lunch, 2=snack, 3=dinner
    switch (trainTime) {
      case 'morning':   trainSlot = 0; preSlot = null; postSlot = 1; break;
      case 'noon':      trainSlot = 1; preSlot = 0;    postSlot = 2; break;
      case 'afternoon': trainSlot = 2; preSlot = 1;    postSlot = 3; break;
      case 'evening':
      default:          trainSlot = 3; preSlot = 2;    postSlot = null; break;
    }
  } else {
    // 2-3 repas : slots 0=breakfast, 1=lunch, 2=dinner
    switch (trainTime) {
      case 'morning':   trainSlot = 0; preSlot = null; postSlot = 1; break;
      case 'noon':
      case 'afternoon': trainSlot = 1; preSlot = 0;    postSlot = 2; break;
      case 'evening':
      default:          trainSlot = 2; preSlot = 1;    postSlot = null; break;
    }
  }
  return { isTraining: true, trainSlot: trainSlot, preSlot: preSlot, postSlot: postSlot };
}
window.getDayType = getDayType;

// ─── ADAPTIVE MEAL SPLIT PER DAY ──────────────────────────────────────────
// getAdaptedMealSplit(dayIndex) — adapte la répartition calorique selon
// le type de jour (entraînement vs repos).
// Jour d'entraînement : boost pré/post séance, calMultiplier=1.0
// Jour de repos : répartition équilibrée, calMultiplier=0.90 (−10%)
function getAdaptedMealSplit(dayIndex) {
  var dayInfo = getDayType(dayIndex);
  var baseSplit = getMealSplit();

  if (!dayInfo.isTraining) {
    // Jour de repos : réduction adaptée à l'objectif
    // Bulk/lean_bulk : −5% seulement (préserver le surplus anabolique — ISSN 2017)
    // Cut/shred/maintain/recomp : −10% (Helms 2014 calorie cycling)
    var _gk = (window.S.goal !== null && window.GOALS && window.GOALS[window.S.goal]) ? window.GOALS[window.S.goal].key : '';
    var _restMult = (_gk === 'bulk' || _gk === 'lean_bulk') ? 0.95 : 0.90;
    var meals = window.S.mealsPerDay || 3;
    if (meals >= 4) {
      return { pctBreak: 0.25, pctLunch: 0.30, pctSnack: 0.15, pctDinner: 0.30,
               restDay: true, calMultiplier: _restMult, dayInfo: dayInfo };
    }
    if (meals <= 2) {
      return { pctBreak: 0.40, pctLunch: 0.60, pctSnack: 0, pctDinner: 0,
               restDay: true, calMultiplier: _restMult, dayInfo: dayInfo };
    }
    return { pctBreak: 0.30, pctLunch: 0.40, pctSnack: 0, pctDinner: 0.30,
             restDay: true, calMultiplier: _restMult, dayInfo: dayInfo };
  }

  // Jour d'entraînement : utilise la base + timing déjà calculé par getMealSplit()
  // SFC Symbiosis : si SFCSymbiosis chargé et S.trainingLoad défini, on applique
  // le calMultiplier par charge (heavy=1.10 / moderate=1.07 / light=1.03).
  // Guard : activé UNIQUEMENT si le module symbiose est présent ET trainingLoad connu.
  // Sans SFCSymbiosis ou sans trainingLoad → calMultiplier=1.0 (comportement inchangé).
  var _trainMult  = 1.0;
  var _carbBoost  = 1.0;
  var _tl4mults = window.S && (window.S.dailyTrainingLoad || window.S.trainingLoad);
  if (window.SFCSymbiosis && _tl4mults) {
    var _mults = window.SFCSymbiosis.getLoadMultipliers(true, _tl4mults);
    _trainMult = _mults.cal;
    _carbBoost = _mults.carbBoost;
    // Feedback loop (optionnel) — ajustements fatigue / récupération
    var _fb = window.SFCSymbiosis.getFeedbackAdjustment();
    if (_fb.calAdjust) _trainMult = Math.round(_trainMult * (1 + _fb.calAdjust) * 1000) / 1000;
  }
  return { pctBreak: baseSplit.pctBreak, pctLunch: baseSplit.pctLunch,
           pctSnack: baseSplit.pctSnack, pctDinner: baseSplit.pctDinner,
           restDay: false, calMultiplier: _trainMult, carbBoost: _carbBoost,
           dayInfo: dayInfo, note: baseSplit.note, trainTimingNote: baseSplit.trainTimingNote };
}
window.getAdaptedMealSplit = getAdaptedMealSplit;
var DAY_NAMES = (window.isEnglish && window.isEnglish())
  ? ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
  : ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
var SHOPPING=[
  {cat:'FRÉQUENCE',items:[
    {id:'daily',name:'Tous les jours',desc:'Produits frais quotidiens'},
    {id:'2x_week',name:'2-3x par semaine',desc:'Mix frais et conservation'},
    {id:'weekly',name:'1x par semaine',desc:'Courses groupées'},
    {id:'biweekly',name:'Toutes les 2 semaines',desc:'Stock et surgelés'}
  ]},
  {cat:'MAGASINS HABITUELS',items:[
    {id:'supermarket',name:'Supermarché',desc:'Carrefour, Marjane, Auchan...'},
    {id:'market',name:'Marché / Souk',desc:'Fruits, légumes, viande fraîche'},
    {id:'organic',name:'Bio / Spécialisé',desc:'Magasin bio, diététique'},
    {id:'online',name:'En ligne',desc:'Livraison à domicile'},
    {id:'bulk',name:'Grossiste',desc:'Costco, Atacadao, gros volumes'}
  ]},
  {cat:'BUDGET ALIMENTAIRE',items:[
    {id:'budget_low',name:'Économique',desc:'Je fais attention au budget'},
    {id:'budget_mid',name:'Moyen',desc:'Bon rapport qualité-prix'},
    {id:'budget_high',name:'Confort',desc:'Qualité sans restriction'}
  ]},
  {cat:'PRÉFÉRENCES PRODUITS',items:[
    {id:'pref_fresh',name:'Produits frais',desc:'Viande, poisson, légumes frais'},
    {id:'pref_frozen',name:'Surgelés acceptés',desc:'Légumes, poisson, fruits surgelés'},
    {id:'pref_canned',name:'Conserves acceptées',desc:'Légumineuses, thon, tomates'},
    {id:'pref_batch',name:'Batch cooking',desc:'Je prépare en avance pour la semaine'},
    {id:'pref_quick',name:'Repas rapides',desc:'Moins de 15 min de préparation'}
  ]}
];
var STAPLES=[
  {cat:'PROTÉINES',items:['Blancs de poulet','Œufs (x30)','Thon en conserve','Bœuf haché 5%','Saumon / Pavés poisson','Lentilles corail','Pois chiches','Escalopes de dinde','Fromage blanc 0%','Whey protéine']},
  {cat:'GLUCIDES',items:['Riz basmati','Flocons d\'avoine','Pain complet','Patate douce','Pâtes complètes','Semoule','Quinoa','Bananes','Dattes']},
  {cat:'LIPIDES',items:['Huile d\'olive extra vierge','Avocat','Amandes / Noix','Beurre de cacahuète','Graines de chia','Graines de lin']},
  {cat:'LÉGUMES',items:['Brocoli','Courgettes','Épinards','Tomates','Oignon','Ail','Poivrons','Carottes','Salade verte','Concombre']},
  {cat:'ESSENTIELS',items:['Sel, poivre, cumin, paprika','Citrons','Miel','Sauce soja','Vinaigre balsamique','Yaourt nature','Lait (vache/amande)','Café / Thé vert']}
];

// ─── Make constants globally available ───
window.STEPS = STEPS;
window.ACTIVITIES = ACTIVITIES;
window.TRAINS = TRAINS;
window.SLEEPS = SLEEPS;
window.GOALS = GOALS;
window.RATIOS = RATIOS;
window.COOK_LEVELS = COOK_LEVELS;
window.ALLERGIES = ALLERGIES;
window.INTOLERANCES = INTOLERANCES;
window.REGIMES = REGIMES;
window.CUISINES = CUISINES;
window.CUISINE_FLAGS = CUISINE_FLAGS;
window.MEDICAL = MEDICAL;
window.MEDICAL_ADVICE = MEDICAL_ADVICE;
window.MEAL_SPLIT = MEAL_SPLIT;
window.DAY_NAMES = DAY_NAMES;
window.SHOPPING = SHOPPING;
window.STAPLES = STAPLES;

// ─── NEW CONSTANTS ───
var ALCOHOL_DB = [
  {name:'Bière (33cl)', kcal:150, gl:13, alc:5},
  {name:'Bière forte (33cl)', kcal:200, gl:16, alc:8},
  {name:'Vin rouge (15cl)', kcal:125, gl:4, alc:13},
  {name:'Vin blanc (15cl)', kcal:120, gl:4, alc:12},
  {name:'Vin rosé (15cl)', kcal:115, gl:4, alc:11},
  {name:'Champagne (15cl)', kcal:120, gl:5, alc:12},
  {name:'Vodka (4cl)', kcal:95, gl:0, alc:40},
  {name:'Whisky (4cl)', kcal:105, gl:0, alc:40},
  {name:'Rhum (4cl)', kcal:100, gl:0, alc:40},
  {name:'Gin (4cl)', kcal:95, gl:0, alc:40},
  {name:'Tequila (4cl)', kcal:100, gl:0, alc:40},
  {name:'Mojito (25cl)', kcal:220, gl:26, alc:10},
  {name:'Margarita (25cl)', kcal:280, gl:18, alc:13},
  {name:'Piña Colada (25cl)', kcal:320, gl:40, alc:10},
  {name:'Spritz (20cl)', kcal:170, gl:12, alc:8},
  {name:'Cidre (25cl)', kcal:120, gl:15, alc:5},
  {name:'Pastis (2cl+eau)', kcal:60, gl:2, alc:45},
  {name:'Sangria (25cl)', kcal:200, gl:24, alc:8}
];
window.ALCOHOL_DB = ALCOHOL_DB;

var ALCOHOL_FREQS = [
  {id:'never', name:'Jamais', icon:'🚫', desc:'0 verre/semaine'},
  {id:'rarely', name:'Rarement', icon:'🍷', desc:'1-2 verres/semaine'},
  {id:'weekly', name:'Régulièrement', icon:'🍺', desc:'3-7 verres/semaine'},
  {id:'daily', name:'Quotidien', icon:'⚠', desc:'7+ verres/semaine'}
];
window.ALCOHOL_FREQS = ALCOHOL_FREQS;

var FOOD_HABITS_MEALS = [
  {val:2, name:'2 repas', desc:'Jeûne intermittent'},
  {val:3, name:'3 repas', desc:'PDJ, déjeuner, dîner'},
  {val:4, name:'4 repas', desc:'3 repas + 1 collation'},
  {val:5, name:'5 repas', desc:'3 repas + 2 collations'}
];
window.FOOD_HABITS_MEALS = FOOD_HABITS_MEALS;

var EATING_LOCATIONS = [
  {id:'home', name:'Maison', desc:'Je cuisine chez moi', icon:'🏠'},
  {id:'office', name:'Bureau', desc:'Je mange au travail', icon:'🏢'},
  {id:'mix', name:'Mix', desc:'Moitié-moitié', icon:'🔄'}
];
window.EATING_LOCATIONS = EATING_LOCATIONS;

var BODY_ZONES = ['Poitrine','Dos','Épaules','Trapèzes','Bras','Avant-bras','Abdominaux','Jambes','Mollets','Fessiers','Cardio'];
window.BODY_ZONES = BODY_ZONES;

// FIX Hermès : icônes sobres unicode (tonal-on-tonal). Emojis 💪🫀🧘🔥⚡ retirés.
var SPORT_GOALS = [
  {id:'muscle',      name:'Prise de muscle',  desc:'Prendre du volume — programme de force et hypertrophie',        icon:'\u25A0'},
  {id:'endurance',   name:'Endurance',        desc:'Améliorer le souffle — cardio, longue distance, stamina',       icon:'\u25CF'},
  {id:'flexibility', name:'Souplesse',        desc:'Gagner en souplesse — mobilité, stretching et amplitude',       icon:'\u25CB'},
  {id:'weightloss',  name:'Perte de poids',   desc:'Perdre du poids — déficit calorique et cardio brûle-graisses', icon:'\u2193'},
  {id:'general',     name:'Forme générale',   desc:'Se sentir mieux — mélange force, cardio et mobilité',           icon:'\u25C6'},
  {id:'shred',       name:'Sèche',            desc:'Garder le muscle, perdre le gras — sèche progressive',         icon:'\u25BC'}
];
window.SPORT_GOALS = SPORT_GOALS;

var SPORT_LEVELS = [
  {id:'beginner', name:'Débutant', desc:'< 6 mois', factor:0.7},
  {id:'intermediate', name:'Intermédiaire', desc:'6 mois - 2 ans', factor:1.0},
  {id:'advanced', name:'Avancé', desc:'2+ ans', factor:1.3}
];
window.SPORT_LEVELS = SPORT_LEVELS;

// ─── CROSSFIT CONSTANTS ───
// FIX Hermès : cercles gradés ○◔◑● (remplacement emojis couleur 🟢🟡🔴⚫).
var CROSSFIT_LEVELS = [
  {id: 'scaled', name: 'Scaled', desc: 'Débutant / Adapté — Mouvements simplifiés, charges légères', icon: '\u25CB'},
  {id: 'inter', name: 'Intermédiaire', desc: 'Mouvements maîtrisés — Charges modérées', icon: '\u25D4'},
  {id: 'rx', name: 'RX (Prescrit)', desc: 'Standards compétition — Charges et mouvements avancés', icon: '\u25D1'},
  {id: 'rx_plus', name: 'RX+ (Élite)', desc: 'Athlète élite Games / Compétiteur — Charges maximales, mouvements avancés', icon: '\u25CF'}
];
window.CROSSFIT_LEVELS = CROSSFIT_LEVELS;

var CF_STANDARDS = {
  // Numeric standards: [scaled, inter, rx, rx_plus] — 4 values for 4 levels
  clean: { m: [40, 60, 80, 100], f: [25, 40, 55, 70] },
  snatch: { m: [30, 50, 70, 90], f: [20, 35, 50, 65] },
  deadlift: { m: [60, 90, 110, 140], f: [40, 60, 80, 100] },
  squat_clean: { m: [40, 60, 80, 100], f: [25, 40, 55, 70] },
  thruster: { m: [30, 43, 60, 75], f: [20, 30, 43, 55] },
  front_squat: { m: [40, 60, 80, 100], f: [25, 40, 55, 70] },
  overhead_squat: { m: [25, 40, 60, 80], f: [15, 25, 40, 55] },
  push_press: { m: [30, 43, 60, 75], f: [20, 30, 43, 55] },
  power_clean: { m: [40, 60, 80, 100], f: [25, 40, 55, 70] },
  hang_clean: { m: [35, 55, 75, 95], f: [20, 35, 50, 65] },
  shoulder_to_oh: { m: [30, 43, 60, 75], f: [20, 30, 43, 55] },
  back_squat: { m: [50, 70, 100, 130], f: [30, 50, 70, 90] },
  sumo_dl_hp: { m: [35, 50, 70, 85], f: [20, 35, 50, 65] },
  // Gymnastics standards: [scaled, inter, rx, rx_plus]
  c2b_pullups: { scaled: 'Pull-ups assistés (élastique)', inter: 'Chest-to-bar kipping', rx: 'Chest-to-bar kipping', rx_plus: 'Chest-to-bar strict' },
  pullups: { scaled: 'Ring Rows', inter: 'Pull-ups', rx: 'Chest-to-bar', rx_plus: 'Chest-to-bar + Bar Muscle-ups' },
  muscle_ups_bar: { scaled: 'Pull-ups + Dips', inter: 'Bar Muscle-ups (tentatives)', rx: 'Bar Muscle-ups', rx_plus: 'Strict Bar Muscle-ups' },
  muscle_ups_ring: { scaled: 'Ring Rows + Ring Dips', inter: 'Ring Muscle-ups (tentatives)', rx: 'Ring Muscle-ups', rx_plus: 'Strict Ring Muscle-ups' },
  hspu: { scaled: 'Pike Push-ups', inter: 'HSPU (abmat)', rx: 'Strict/Kipping HSPU', rx_plus: 'Strict HSPU (no abmat)' },
  handstand_walk: { scaled: 'Bear Crawl 2x distance', inter: 'Wall Walk', rx: 'Handstand Walk', rx_plus: 'Handstand Walk (obstacles)' },
  pistols: { scaled: 'Air Squats', inter: 'Pistols (assistés)', rx: 'Pistols', rx_plus: 'Pistols (lesté)' },
  toes_to_bar: { scaled: 'Hanging Knee Raises', inter: 'Toes-to-bar (kipping)', rx: 'Toes-to-bar (strict ou kipping)', rx_plus: 'Toes-to-bar strict' },
  rope_climb: { scaled: 'Rope Pull (allongé)', inter: '1 Rope Climb', rx: 'Legless Rope Climb', rx_plus: 'Legless Rope Climb (15ft)' },
  double_unders: { scaled: 'Single Unders (x3)', inter: 'Double Unders', rx: 'Double Unders', rx_plus: 'Double Unders (volume +25%)' },
  box_jump: { scaled: 'Step-ups 50cm', inter: 'Box Jump 50/60cm', rx: 'Box Jump 60/75cm', rx_plus: 'Box Jump 75/90cm' },
  wall_ball: { scaled: '4/6kg → 2.7/3m', inter: '6/9kg → 2.7/3m', rx: '9/14kg → 3/3.5m', rx_plus: '9/14kg → 3.5m (cible Games)' },
  kb_swing: { scaled: '12/16kg', inter: '16/24kg', rx: '24/32kg', rx_plus: '32/40kg' },
  burpee: { scaled: 'Burpees (step)', inter: 'Burpees', rx: 'Burpees over bar / Burpee Box Jump Over', rx_plus: 'Burpee Box Jump Over (75cm)' },
  row_cal: { cal: [12, 15, 20, 25] },
  assault_bike: { cal: [8, 12, 15, 20] }
};
window.CF_STANDARDS = CF_STANDARDS;

// FIX P0 audit user Karim : ajout bench_press (Développé couché) + squat (alias back_squat)
// Avant : impossible de saisir DC/Squat en mode CF → perte de données pour athlètes complets.
// FIX Hermès : icônes sobres (◆ carré, ▲ triangle) — remplace 🏋🦬🦵💪🔥.
var CF_1RM_LIFTS = [
  {key: 'clean',          name: 'Clean (Épaulé)',               icon: '\u25A0', placeholder: 'kg', desc: 'Votre meilleur clean à 1 rep'},
  {key: 'snatch',         name: 'Snatch (Arraché)',             icon: '\u25B2', placeholder: 'kg', desc: 'Votre meilleur snatch à 1 rep'},
  {key: 'deadlift',       name: 'Deadlift (Soulevé de terre)',  icon: '\u25A0', placeholder: 'kg', desc: 'Votre meilleur deadlift'},
  {key: 'front_squat',    name: 'Front Squat',                   icon: '\u25CF', placeholder: 'kg', desc: 'Votre meilleur front squat'},
  {key: 'back_squat',     name: 'Back Squat',                    icon: '\u25CF', placeholder: 'kg', desc: 'Votre meilleur back squat'},
  {key: 'bench_press',    name: 'Développé couché (Bench Press)',icon: '\u25A0', placeholder: 'kg', desc: 'Votre meilleur DC à 1 rep'},
  {key: 'push_press',     name: 'Push Press / Shoulder to OH',   icon: '\u25B2', placeholder: 'kg', desc: 'Votre meilleur push press'},
  {key: 'overhead_squat', name: 'Overhead Squat',                icon: '\u25B2', placeholder: 'kg', desc: 'Votre meilleur OHS'},
  {key: 'thruster',       name: 'Thruster',                      icon: '\u25C6', placeholder: 'kg', desc: 'Votre meilleur thruster'}
];
window.CF_1RM_LIFTS = CF_1RM_LIFTS;

// Scaling factors relative to Back Squat 1RM for deriving missing lift maxes
// References: Haff & Triplett 2016, Symmetry Strength, ExRx standards
var CF_LIFT_SCALING_FACTORS = {
  back_squat:    1.00,
  front_squat:   0.85,
  overhead_squat: 0.60, // OHS — overhead stability + mobility demand; ~60% BS (ExRx, Symmetry Strength); corrected from erroneous 0.88 which exceeded front_squat (0.85)
  squat_clean:   0.75,
  clean:         0.75,
  power_clean:   0.70,
  hang_clean:    0.70,
  snatch:        0.60,
  deadlift:      1.25,
  bench_press:   0.85,
  push_press:    0.65,
  shoulder_to_oh: 0.65,
  thruster:      0.70, // Front squat + overhead press pattern; corrected from 0.55 (Haff & Triplett 2016)
  jerk:          0.80, // Split/push jerk — overhead strength from back squat base (Haff & Triplett 2016)
  sumo_dl_hp:    0.50
};
window.CF_LIFT_SCALING_FACTORS = CF_LIFT_SCALING_FACTORS;

// FIX P0 audit user Karim : CF_LIFT_ALIASES résout les clés équivalentes côté lookup.
// Avant : WOD avec standards_key='squat_clean' ne trouvait PAS crossfit1RM.clean (Karim avait saisi clean=110kg, ignoré 2/10 jours).
// Maintenant : getCFWorkingWeight('squat_clean') → essaie 'squat_clean' puis alias 'clean' avant fallback.
var CF_LIFT_ALIASES = {
  squat_clean: ['clean'],
  clean:       ['squat_clean', 'power_clean', 'hang_clean'],
  power_clean: ['clean'],
  hang_clean:  ['clean'],
  back_squat:  ['squat'],
  squat:       ['back_squat'],
  bench_press: ['bench', 'dc'],
  shoulder_to_oh: ['push_press', 'jerk'],
  jerk:        ['shoulder_to_oh', 'push_press']
};
window.CF_LIFT_ALIASES = CF_LIFT_ALIASES;

// Returns the working weight for a given movement
// Priority 1: user's direct 1RM for that lift (or alias)
// Priority 2: derive from back_squat 1RM using scaling factors
// Priority 3: fall back to CF_STANDARDS (level/sex tables)
function getCFWorkingWeight(standardsKey, percentage) {
  var s = window.S;
  if (!s) return '?';
  var sexKey = window.isMale(s) ? 'm' : 'f';
  // FIX P2 audit user Karim : si crossfitLevel non set, inférer depuis sportLevel
  // (avancé → rx, pro → rx_plus). Évite de bloquer tous les users à 65% faute de config.
  var cfLvl = s.crossfitLevel;
  if (!cfLvl) {
    if (s.sportLevel === 'pro' || s.sportLevel === 'expert') cfLvl = 'rx_plus';
    else if (s.sportLevel === 'advanced') cfLvl = 'rx';
    else if (s.sportLevel === 'intermediate') cfLvl = 'inter';
    else if (s.sportLevel === 'beginner') cfLvl = 'scaled';
    else cfLvl = 'inter';
  }
  var lvlIdx = cfLvl === 'scaled' ? 0 : cfLvl === 'inter' ? 1 : cfLvl === 'rx' ? 2 : cfLvl === 'rx_plus' ? 3 : 1;
  // WOD working weight percentages by level (% of 1RM) — rx_plus uses 80% (Games athlete intensity — NSCA 2016)
  var wodPct = lvlIdx === 0 ? 0.55 : lvlIdx === 1 ? 0.65 : lvlIdx === 2 ? 0.75 : 0.80;

  // Priority 1: user has a direct 1RM for this specific lift (or alias)
  if (s.crossfit1RM) {
    var rm = s.crossfit1RM[standardsKey];
    if (!rm) {
      // FIX P0 Karim : essayer les alias (squat_clean ↔ clean, back_squat ↔ squat, etc.)
      var aliases = CF_LIFT_ALIASES[standardsKey] || [];
      for (var ai = 0; ai < aliases.length; ai++) {
        if (s.crossfit1RM[aliases[ai]]) { rm = s.crossfit1RM[aliases[ai]]; break; }
      }
    }
    if (rm) {
      if (percentage) return Math.round(rm * percentage / 100);
      return Math.round(rm * wodPct);
    }
  }

  // Priority 2: derive from back_squat 1RM using scaling factors
  if (s.crossfit1RM && s.crossfit1RM['back_squat'] && CF_LIFT_SCALING_FACTORS[standardsKey]) {
    var bsRm = s.crossfit1RM['back_squat'];
    var derived1RM = Math.round(bsRm * CF_LIFT_SCALING_FACTORS[standardsKey]);
    if (percentage) return Math.round(derived1RM * percentage / 100);
    return Math.round(derived1RM * wodPct);
  }

  // Priority 3: fallback to CF_STANDARDS (sex/level tables)
  var standards = window.CF_STANDARDS;
  if (standards && standards[standardsKey] && standards[standardsKey][sexKey]) {
    return standards[standardsKey][sexKey][lvlIdx];
  }
  return '?';
}
window.getCFWorkingWeight = getCFWorkingWeight;

var CF_WODS = [
  {
    day: 1, name: 'FORGE',
    haltero: { name: 'Clean Complex', desc: '1 Power Clean + 1 Hang Clean + 1 Full Clean', scheme: 'E2MOM 12min — Build to heavy complex', weights: 'clean' },
    wod: { name: 'FORGE', type: 'AMRAP 15', movements: [
      {name: 'Thrusters', reps: 10, weight: 'thruster'},
      {name: 'Toes-to-bar', reps: 12, gymnastics: 'toes_to_bar'},
      {name: 'Box Jumps', reps: 14, gymnastics: 'box_jump'},
      {name: 'Cal Row', reps: null, special: 'row_cal'}
    ], notes: 'Score = rounds + reps. Pacing: 70-80% effort.' },
    gym: { name: 'Skill: Kipping / Butterfly Pull-ups', drills: ['3x5 Strict Pull-ups (lesté si possible)', '3x8 Kipping Pull-ups (focus rythme)', '3x Max Butterfly attempts', '2min Hollow Hold accumulation'] }
  },
  {
    day: 2, name: 'THUNDER',
    haltero: { name: 'Snatch Progression', desc: '1 Hang Snatch + 1 Power Snatch + 1 OHS', scheme: 'Every 90s x 10 — Build progressively', weights: 'snatch' },
    wod: { name: 'THUNDER', type: 'For Time (cap 18min)', movements: [
      {name: 'Wall Balls', reps: 50, gymnastics: 'wall_ball'},
      {name: 'Double Unders', reps: 100, gymnastics: 'double_unders'},
      {name: 'Power Snatches', reps: 30, weight: 'snatch'},
      {name: 'Double Unders', reps: 100, gymnastics: 'double_unders'},
      {name: 'Wall Balls', reps: 50, gymnastics: 'wall_ball'}
    ], notes: 'Chipper style. Briser les séries: Walls 25-25 / Snatches 10-10-10.' },
    gym: { name: 'Skill: Handstand', drills: ['5x30s Wall-Facing Handstand Hold', '3x5 Wall Walk (slow control)', '5x3m Handstand Walk attempts (ou Bear Crawl)', 'Finisher: 3x20 Shoulder Taps en position HS'] }
  },
  {
    day: 3, name: 'BLITZ',
    haltero: { name: 'Front Squat', desc: 'Front Squat 5-5-3-3-1-1', scheme: '15min — Build to 1RM or heavy single', weights: 'front_squat' },
    wod: { name: 'BLITZ', type: '5 Rounds For Time (cap 20min)', movements: [
      {name: 'Deadlift', reps: 12, weight: 'deadlift'},
      {name: 'Burpees over bar', reps: 9, gymnastics: 'burpee'},
      {name: 'Pull-ups', reps: 6, gymnastics: 'pullups'},
      {name: 'Assault Bike Cal', reps: null, special: 'assault_bike'}
    ], notes: 'Sprint les burpees, steady sur les deadlifts. Grip management!' },
    gym: { name: 'Skill: Ring Muscle-ups', drills: ['3x5 Strict Ring Dips', '3x3 Kipping Swing to Hip (ring)', '5x1-3 Ring Muscle-up attempts', '3x8 Banded Transitions (si nécessaire)', 'Accumulate 1min L-sit on rings'] }
  },
  {
    day: 4, name: 'STORM',
    haltero: { name: 'Clean & Jerk', desc: '1 Squat Clean + 1 Push Jerk + 1 Split Jerk', scheme: 'E2MOM 14min — Build to heavy', weights: 'squat_clean' },
    wod: { name: 'STORM', type: 'AMRAP 20', movements: [
      {name: 'KB Swings', reps: 15, gymnastics: 'kb_swing'},
      {name: 'Box Jumps', reps: 12, gymnastics: 'box_jump'},
      {name: 'Thrusters', reps: 9, weight: 'thruster'},
      {name: 'Bar Muscle-ups', reps: 3, gymnastics: 'muscle_ups_bar'}
    ], notes: 'Standards Games Athletes. Respirez sur les KB swings, explosive sur les BMU.' },
    gym: { name: 'Skill: HSPU / Pike Push-ups', drills: ['3x5 Strict HSPU (ou pike push-ups)', '3x5 Kipping HSPU (ou abmat)', 'Max unbroken HSPU test', '3x15 DB Strict Press léger (épaule santé)'] }
  },
  {
    day: 5, name: 'INFERNO',
    haltero: { name: 'Overhead Squat', desc: 'OHS 3-3-3-2-2-1', scheme: '15min — Mobilité + force overhead', weights: 'overhead_squat' },
    wod: { name: 'INFERNO', type: 'For Time (cap 25min)', movements: [
      {name: 'Cal Row', reps: null, special: 'row_cal', note: '40/35 cal'},
      {name: 'Power Cleans', reps: 30, weight: 'power_clean'},
      {name: 'Toes-to-bar', reps: 30, gymnastics: 'toes_to_bar'},
      {name: 'Push Press', reps: 30, weight: 'push_press'},
      {name: 'Double Unders', reps: 100, gymnastics: 'double_unders'},
      {name: 'Rope Climbs', reps: 5, gymnastics: 'rope_climb'}
    ], notes: 'Descending energy. Partez contrôlé sur le row, finissez fort.' },
    gym: { name: 'Skill: Rope Climb + Core', drills: ['3x1-2 Rope Climb (legless si RX)', '4x8 Strict Toes-to-bar', '3x15 GHD Sit-ups (ou AbMat)', '3x20 Hollow Rocks'] }
  },
  {
    day: 6, name: 'ENDURE',
    haltero: { name: 'Hang Snatch + Snatch Pull', desc: '1 Hang Snatch + 2 Snatch Pulls', scheme: 'E90s x 8 sets', weights: 'snatch' },
    wod: { name: 'ENDURE', type: '3 Rounds For Time (cap 22min)', movements: [
      {name: 'Assault Bike Cal', reps: null, special: 'assault_bike', note: '20/15 cal'},
      {name: 'Hang Cleans', reps: 10, weight: 'hang_clean'},
      {name: 'HSPU', reps: 8, gymnastics: 'hspu'},
      {name: 'Pistols', reps: 12, gymnastics: 'pistols'}
    ], notes: 'Pacing crucial. Ne partez pas en sprint sur le bike.' },
    gym: { name: 'Skill: Pistol Squat + Balance', drills: ['3x5 Pistols (par jambe, assisté si nécessaire)', '3x10 Bulgarian Split Squats', '3x30s Single Leg Balance (yeux fermés)', '3x8 Box Pistols'] }
  },
  {
    day: 7, name: 'TITAN',
    haltero: { name: 'Back Squat', desc: 'Back Squat 5x5 @75-85%', scheme: 'Every 3min x 5 sets', weights: 'back_squat' },
    wod: { name: 'TITAN', type: 'EMOM 24 (6 rounds)', movements: [
      {name: 'Min 1: Deadlift', reps: 8, weight: 'deadlift'},
      {name: 'Min 2: Burpees', reps: 10, gymnastics: 'burpee'},
      {name: 'Min 3: Wall Balls', reps: 15, gymnastics: 'wall_ball'},
      {name: 'Min 4: Cal Row', reps: null, special: 'row_cal'}
    ], notes: 'EMOM = chaque minute commence un nouveau mouvement. Max effort, max rest.' },
    gym: { name: 'Skill: Bar Muscle-up Progression', drills: ['3x5 Strict Pull-ups (supination)', '3x5 Kipping Pull-ups agressifs', '5x1-3 Bar Muscle-up (ou transitions)', '3x8 Chest-to-bar Pull-ups'] }
  },
  {
    day: 8, name: 'PHOENIX',
    haltero: { name: 'Push Jerk', desc: '1 Push Press + 1 Push Jerk + 1 Split Jerk', scheme: 'E2MOM 12min', weights: 'push_press' },
    wod: { name: 'PHOENIX', type: 'For Time (cap 16min)', movements: [
      {name: 'Thrusters', reps: 21, weight: 'thruster'},
      {name: 'Pull-ups', reps: 21, gymnastics: 'pullups'},
      {name: 'Thrusters', reps: 15, weight: 'thruster'},
      {name: 'Pull-ups', reps: 15, gymnastics: 'pullups'},
      {name: 'Thrusters', reps: 9, weight: 'thruster'},
      {name: 'Pull-ups', reps: 9, gymnastics: 'pullups'}
    ], notes: 'Hommage au FRAN. Format 21-15-9 classique. Allez-y !' },
    gym: { name: 'Skill: Double Unders', drills: ['5x30s Max Double Unders', '3x50 Single-Single-Double drill', '3min unbroken DU attempt', 'Finisher: 3x Tabata DU (20s on / 10s off)'] }
  },
  {
    day: 9, name: 'STORM',
    haltero: { name: 'Snatch Balance + OHS', desc: '3 Snatch Balance + 2 OHS', scheme: 'Every 2:30 x 6 sets', weights: 'overhead_squat' },
    wod: { name: 'STORM', type: 'AMRAP 12', movements: [
      {name: 'Sumo DL High Pull', reps: 8, weight: 'sumo_dl_hp'},
      {name: 'KB Swings', reps: 12, gymnastics: 'kb_swing'},
      {name: 'Box Jumps', reps: 12, gymnastics: 'box_jump'},
      {name: 'Toes-to-bar', reps: 8, gymnastics: 'toes_to_bar'}
    ], notes: 'Pace constant. Objectif: 5-6 rounds minimum.' },
    gym: { name: 'Skill: L-sit + Core Strength', drills: ['5x10s L-sit on Parallettes', '3x12 V-ups', '3x15 GHD Hip Extensions', '3x20s Ring Support Hold', 'Accumulate 2min Plank on Rings'] }
  },
  {
    day: 10, name: 'NEMESIS',
    haltero: { name: 'Squat Clean Complex', desc: '2 Squat Cleans + 1 Front Squat + 1 Jerk', scheme: 'E2:30 x 6 — Heavy intent', weights: 'squat_clean' },
    wod: { name: 'NEMESIS', type: '4 Rounds For Time (cap 20min)', movements: [
      {name: 'Shoulder to Overhead', reps: 10, weight: 'shoulder_to_oh'},
      {name: 'Rope Climb', reps: 2, gymnastics: 'rope_climb'},
      {name: 'Double Unders', reps: 50, gymnastics: 'double_unders'},
      {name: 'Assault Bike Cal', reps: null, special: 'assault_bike'}
    ], notes: 'Mouvement élégant sur le S2OH. Cordes = technique > vitesse.' },
    gym: { name: 'Skill: Ring Dip + Transition', drills: ['3x8 Ring Dips (strict)', '3x5 Ring Dips (kipping)', '5x Transition drills (false grip)', '3x5 Ring Push-ups (deep)', '2x15 Band Pull-aparts (épaule santé)'] }
  },
  {
    day: 11, name: 'VALOR',
    haltero: { name: 'Power Clean + Front Squat', desc: '2 Power Cleans + 3 Front Squats', scheme: 'E2MOM 10min', weights: 'power_clean' },
    wod: { name: 'VALOR', type: 'For Time (cap 15min)', movements: [
      {name: 'Power Cleans', reps: 15, weight: 'power_clean'},
      {name: 'Burpee Box Jump Over', reps: 15, gymnastics: 'burpee'},
      {name: 'Power Cleans', reps: 12, weight: 'power_clean'},
      {name: 'Burpee Box Jump Over', reps: 12, gymnastics: 'burpee'},
      {name: 'Power Cleans', reps: 9, weight: 'power_clean'},
      {name: 'Burpee Box Jump Over', reps: 9, gymnastics: 'burpee'}
    ], notes: 'Format descendant 15-12-9. Explosivité requise.' },
    gym: { name: 'Skill: Toes-to-bar Efficiency', drills: ['3x10 Kipping Toes-to-bar', '3x5 Strict Toes-to-bar', 'Max unbroken TTB test', '3x15 V-ups (transfer de skill)', '3x20 Hollow Rocks'] }
  },
  {
    day: 12, name: 'LEGACY',
    haltero: { name: 'Snatch from Blocks', desc: 'Snatch from knee + 1 OHS', scheme: 'Every 90s x 10', weights: 'snatch' },
    wod: { name: 'LEGACY (Hero WOD style)', type: 'For Time (cap 30min)', movements: [
      {name: 'Run 400m', reps: null, note: '400m Run'},
      {name: 'Wall Balls', reps: 30, gymnastics: 'wall_ball'},
      {name: 'Run 400m', reps: null, note: '400m Run'},
      {name: 'KB Swings', reps: 30, gymnastics: 'kb_swing'},
      {name: 'Run 400m', reps: null, note: '400m Run'},
      {name: 'Thrusters', reps: 20, weight: 'thruster'},
      {name: 'Run 400m', reps: null, note: '400m Run'},
      {name: 'Pull-ups', reps: 30, gymnastics: 'pullups'}
    ], notes: 'Hero WOD. Endurance + mental. Respectez le pacing du run.' },
    gym: { name: 'Skill: Wall Walk + HS Hold', drills: ['5x1 Wall Walk (slow, controlled)', '5x20s HS Hold (wall facing)', '3x5m HS Walk attempts', '3x10 Strict Press léger (shoulder prep)'] }
  },
  {
    day: 13, name: 'APEX',
    haltero: { name: 'Deadlift', desc: 'Deadlift 3-3-3-1-1-1', scheme: '15min — Build to heavy single', weights: 'deadlift' },
    wod: { name: 'APEX', type: 'EMOM 20 (4 rounds)', movements: [
      {name: 'Min 1: Hang Snatch', reps: 5, weight: 'snatch'},
      {name: 'Min 2: HSPU', reps: 8, gymnastics: 'hspu'},
      {name: 'Min 3: Assault Bike Cal', reps: null, special: 'assault_bike'},
      {name: 'Min 4: Toes-to-bar', reps: 12, gymnastics: 'toes_to_bar'},
      {name: 'Min 5: Rest', reps: null, note: 'REST'}
    ], notes: '4 rounds of 5-min blocks. Le rest est votre ami. Sprint chaque minute.' },
    gym: { name: 'Skill: Rope + Gymnastics Combo', drills: ['3x1-2 Rope Climb', '3x3 Ring Muscle-up (ou transitions)', '3x5 Strict Ring Dips', '3x30s Ring Support Hold', 'Accumulate 90s L-sit'] }
  },
  {
    day: 14, name: 'REDEMPTION',
    haltero: { name: 'Hang Clean + Jerk', desc: '1 Hang Clean + 2 Jerks (1 push + 1 split)', scheme: 'E2MOM 12min', weights: 'hang_clean' },
    wod: { name: 'REDEMPTION', type: 'AMRAP 18', movements: [
      {name: 'Deadlift', reps: 8, weight: 'deadlift'},
      {name: 'Bar Muscle-ups', reps: 4, gymnastics: 'muscle_ups_bar'},
      {name: 'Front Squats', reps: 6, weight: 'front_squat'},
      {name: 'Wall Balls', reps: 12, gymnastics: 'wall_ball'},
      {name: 'Cal Row', reps: null, special: 'row_cal'}
    ], notes: 'Dernier WOD du cycle. Tout donner. Games mindset.' },
    gym: { name: 'Skill: Competition Prep', drills: ['2x Max Unbroken Pull-ups', '2x Max Unbroken HSPU', '2x Max Unbroken Double Unders', 'Finisher: 3 min AMRAP Burpees (test yourself)'] }
  }
];
window.CF_WODS = window.CF_WODS_FULL || CF_WODS; // Use 100 WODs if available, fallback to 14 inline

// ═══════════════════════════════════════════════════════════════
// INTERNATIONALISATION — i18n
// ═══════════════════════════════════════════════════════════════
window.I18N = {
  current: 'fr',

  t: function(key) {
    var lang = window.I18N.current;
    var dict = window.I18N.dict[lang] || window.I18N.dict['fr'];
    return dict[key] || window.I18N.dict['fr'][key] || key;
  },

  setLang: function(lang) {
    window.I18N.current = lang;
    if (window.S) window.S.lang = lang;
    // Persister via saveProfile (uid-versioned) plutôt que la clé générique
    if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
    if (window.render) window.render();
  },

  dict: {
    fr: {
      // Navigation
      'nav.dashboard': 'Bilan',
      'nav.nutrition': 'Nutrition',
      'nav.sport': 'Sport',
      'nav.extras': 'Extras',

      // Auth
      'auth.login': 'Connexion',
      'auth.register': 'Créer un compte',
      'auth.email': 'Email',
      'auth.password': 'Mot de passe',
      'auth.confirm_password': 'Confirmer le mot de passe',
      'auth.firstname': 'Prénom',
      'auth.login_btn': 'Se connecter',
      'auth.register_btn': "S'inscrire",
      'auth.logout': 'Déconnexion',
      'auth.no_account': 'Pas encore de compte ?',
      'auth.has_account': 'Déjà un compte ?',
      'auth.error_credentials': 'Email ou mot de passe incorrect',
      'auth.error_email': 'Email invalide',
      'auth.error_password_length': 'Mot de passe : 6 caractères minimum',
      'auth.error_password_rules': 'Le mot de passe doit contenir au moins 6 caractères, une majuscule, un chiffre et un caractère spécial.',
      'auth.error_password_match': 'Les mots de passe ne correspondent pas',
      'auth.rate_limit': 'Trop de tentatives. Réessayez dans 5 minutes.',

      // Onboarding steps
      'onb.title': 'Mon Programme',
      'onb.step': 'Étape',
      'onb.of': 'sur',
      'onb.next': 'Continuer',
      'onb.back': '← Retour',
      'onb.start': 'Commencer',
      'onb.finish': 'Voir mon programme',

      // Step 1 — Profil
      'onb.s1.title': 'Votre profil',
      'onb.s1.sex': 'Sexe biologique',
      'onb.s1.male': 'Homme',
      'onb.s1.female': 'Femme',
      'onb.s1.menstrual': 'Suivi du cycle menstruel',
      'onb.s1.pregnant': 'Grossesse',
      'onb.s1.trimester': 'Trimestre',

      // Step 2 — Mensuration
      'onb.s2.title': 'Mensurations',
      'onb.s2.age': 'Âge',
      'onb.s2.weight': 'Poids',
      'onb.s2.height': 'Taille',
      'onb.s2.bmi': 'IMC',
      'onb.s2.bmi_under': 'Insuffisance pondérale',
      'onb.s2.bmi_normal': 'Poids normal',
      'onb.s2.bmi_over': 'Surpoids',
      'onb.s2.bmi_obese': 'Obésité',

      // Step 3 — Activité
      'onb.s3.title': "Niveau d'activité",
      'onb.s3.sedentary': 'Sédentaire',
      'onb.s3.light': 'Légèrement actif',
      'onb.s3.moderate': 'Modérément actif',
      'onb.s3.active': 'Très actif',
      'onb.s3.very_active': 'Extrêmement actif',
      'onb.s3.elite': 'Athlète élite',
      'onb.s3.training_days': "Jours d'entraînement / semaine",
      'onb.s3.sleep': 'Heures de sommeil / nuit',

      // Step 4 — Médical
      'onb.s4.title': 'Santé & Antécédents',
      'onb.s4.none': 'Aucune condition particulière',

      // Step 5 — Préférences
      'onb.s5.title': 'Préférences alimentaires',
      'onb.s5.diet': 'Régime alimentaire',
      'onb.s5.omnivore': 'Omnivore',
      'onb.s5.vegetarian': 'Végétarien',
      'onb.s5.vegan': 'Végane',
      'onb.s5.pescatarian': 'Pescétarien',
      'onb.s5.allergies': 'Allergies',
      'onb.s5.intolerances': 'Intolérances',
      'onb.s5.whey': 'Je prends de la whey protéine',
      'onb.s5.currency': 'Devise',

      // Step 6 — Objectif
      'onb.s6.title': 'Votre objectif',
      'onb.s6.bulk': 'Prise de masse',
      'onb.s6.lean_bulk': 'Prise de masse douce',
      'onb.s6.maintain': 'Maintien',
      'onb.s6.cut': 'Sèche',
      'onb.s6.shred': 'Shred',
      'onb.s6.recomposition': 'Recomposition',

      // Step 8 — Récap macros
      'onb.s8.title': 'Votre programme nutritionnel',
      'onb.s8.bmr': 'Métabolisme de base',
      'onb.s8.tdee': 'Dépense totale',
      'onb.s8.target': 'Cible calorique',
      'onb.s8.proteins': 'Protéines',
      'onb.s8.carbs': 'Glucides',
      'onb.s8.fats': 'Lipides',

      // Step 9 — Plan
      'onb.s9.title': 'Votre plan semaine',
      'onb.s9.breakfast': 'Petit-déjeuner',
      'onb.s9.lunch': 'Déjeuner',
      'onb.s9.dinner': 'Dîner',
      'onb.s9.snack': 'Collation',
      'onb.s9.total': 'Total',
      'onb.s9.target': 'Cible',
      'onb.s9.generate': 'Générer un nouveau plan',
      'onb.s9.shopping': 'Liste de courses',

      // Nutrition — meal names
      'nutrition.meal_breakfast': 'Petit-déjeuner',
      'nutrition.meal_lunch': 'Déjeuner',
      'nutrition.meal_snack': 'Collation',
      'nutrition.meal_dinner': 'Dîner',
      'nutrition.protein': 'Protéines',
      'nutrition.carbs': 'Glucides',
      'nutrition.fats': 'Lipides',

      // Dashboard
      'dash.greeting_morning': 'Bonjour',
      'dash.greeting_afternoon': 'Bon après-midi',
      'dash.greeting_evening': 'Bonsoir',
      'dash.calories': 'kcal',
      'dash.goal': 'Objectif',
      'dash.weight': 'Poids',
      'dash.progression': 'Progression',
      'dash.no_weight': 'Ajoutez votre premier poids pour voir la courbe de progression',

      // Sport
      'sport.select': 'Choisissez votre sport',
      'sport.level': 'Niveau',
      'sport.beginner': 'Débutant',
      'sport.intermediate': 'Intermédiaire',
      'sport.advanced': 'Avancé',
      'sport.elite': 'Elite',
      'sport.goal': 'Objectif',
      'sport.days': 'Jours / semaine',
      'sport.program': 'Mon programme',
      'sport.week': 'Semaine',

      // Musculation
      'muscu.sets': 'séries',
      'muscu.reps': 'reps',
      'muscu.rest': 'Repos',
      'muscu.weight': 'Charge',
      'muscu.success': 'Série réussie',
      'muscu.fail': 'Série échouée',
      'muscu.session_summary': 'Bilan de séance',
      'muscu.duration': 'Durée',
      'muscu.calories_burned': 'kcal brûlées',

      // Liste de courses
      'shop.title': 'Liste de courses',
      'shop.aisles': 'rayons',
      'shop.items': 'articles',
      'shop.optimized': 'Parcours optimisé',
      'shop.bought': 'articles achetés',
      'shop.reset': 'Réinitialiser',
      'shop.export': 'Exporter PDF',

      // Scanner
      'scan.title': 'Scanner',
      'scan.scan': 'Scanner un produit',
      'scan.manual': 'Saisie manuelle',
      'scan.barcode_placeholder': 'Code-barres (EAN-13)',
      'scan.search': 'Rechercher',
      'scan.history': 'Historique',
      'scan.no_history': "Scannez votre premier produit pour voir l'historique ici",
      'scan.health_score': 'Score santé',

      // Extras
      'extras.water': 'Hydratation',
      'extras.water_glasses': 'verres',
      'extras.timer': 'Minuteur',
      'extras.start': 'Démarrer',
      'extras.stop': 'Arrêter',
      'extras.reset': 'Réinitialiser',
      'extras.measures': 'Mesures corporelles',
      'extras.sleep': 'Sommeil',
      'extras.food_calc': 'Calculateur nutritionnel',

      // Commun
      'common.save': 'Enregistrer',
      'common.cancel': 'Annuler',
      'common.confirm': 'Confirmer',
      'common.delete': 'Supprimer',
      'common.edit': 'Modifier',
      'common.close': 'Fermer',
      'common.loading': 'Chargement...',
      'common.error': 'Une erreur est survenue',
      'common.reload': 'Recharger',
      'common.per_day': '/ jour',
      'common.per_week': '/ semaine',
      'common.per_kg': 'g / kg',
      'common.years': 'ans',
      'common.hours': 'h',
      'common.minutes': 'min',
      'common.seconds': 'sec',
      'common.kg': 'kg',
      'common.cm': 'cm',
      'common.kcal': 'kcal',
      'common.g': 'g',
      'common.ml': 'ml',
      // Dashboard
      'dash.today_overview': "Aperçu du jour",
      'dash.quick_access': "Accès rapide",
      'dash.quote_of_day': "Citation du jour",
      'dash.streak': "Votre série",
      'dash.record_weight': "Enregistrer mon poids",
      'dash.weight': "Poids",
      'dash.measurements': "Mensurations",
      'dash.kitchen_timer': "Timer cuisine",
      'dash.save': "Enregistrer",
      'dash.done': "Terminé !",
      'dash.running': "En cours...",
      'dash.plan_meals': "Planifiez vos repas",
      'dash.your_program': "Votre programme",
      // Scanner
      'scan.alternatives': "Alternatives plus saines",
      'scan.nutriscore': "Nutri-Score",
      'scan.proteins': "PROTÉINES",
      'scan.carbs': "GLUCIDES",
      'scan.fats': "LIPIDES",
      'scan.sugars': "SUCRES",
      'scan.fibers': "FIBRES",
      'scan.salt': "SEL",
      'scan.sat_fat': "GRAS SAT.",
      // Sport
      'sport.start': "Commencer",
      'sport.pain_none': "Aucune",
      'sport.pain_mild': "Légère",
      'sport.pain_moderate': "Modérée",
      'sport.pain_severe': "Sévère",
      'sport.zone_shoulders': "Épaules",
      'sport.zone_elbows': "Coudes",
      'sport.zone_wrists': "Poignets",
      'sport.zone_neck': "Nuque / Cou",
      'sport.zone_upper_back': "Haut du dos",
      'sport.zone_lower_back': "Bas du dos",
      'sport.zone_hips': "Hanches",
      'sport.zone_knees': "Genoux",
      'sport.zone_ankles': "Chevilles",
      'common.minor_warning': "Pour les moins de 18 ans, ce programme doit être suivi avec l'accompagnement d'un professionnel de santé.",
      'Langue / Language': 'Langue / Language',
      // POLISH 2026-04 (i18n) : coach IA panel + actions
      'coach.placeholder': 'Pose ta question...',
      'coach.send': 'Envoyer',
      'coach.welcome': "La performance se construit dans les détails. Sur quoi veux-tu affiner ta préparation aujourd'hui",
      'coach.typing_label': 'Analyse en cours',
      'coach.action_copy': 'Copier',
      'coach.action_regenerate': 'Régénérer',
      'coach.action_useful': 'Utile',
      'coach.action_not_useful': 'Peu utile',
      'coach.action_voice': 'Dictée vocale',
      'coach.toast_copied': 'Copié',
      'coach.toast_copy_fail': 'Échec copie',
      'coach.toast_thanks': 'Merci pour ton retour',
      'coach.toast_feedback_saved': 'Retour enregistré',
      'coach.toast_regenerating': 'Régénération…',
      'coach.toast_voice_unsupported': 'Dictée vocale non supportée',
      'coach.toast_voice_denied': 'Micro refusé. Vérifie les paramètres du navigateur',
      'coach.toast_voice_no_mic': 'Aucun micro détecté',
      'coach.toast_voice_network': 'Réseau requis pour la dictée',
      'coach.toast_voice_start_error': 'Erreur démarrage micro',
      'coach.error_too_long': 'Le coach met trop de temps à répondre. Réessaie dans quelques instants.',
      'coach.error_rate_limit': 'Trop de messages envoyés. Attends quelques minutes avant de réessayer.',
      'coach.error_offline': 'Impossible de joindre le coach. Vérifiez votre connexion.',
      'coach.new_messages_pill': '↓ Nouveaux messages'
    },

    en: {
      // Navigation
      // Dashboard
      'dash.today_overview': "Today's Overview",
      'dash.quick_access': "Quick Access",
      'dash.quote_of_day': "Quote of the Day",
      'dash.streak': "Your Streak",
      'dash.record_weight': "Log My Weight",
      'dash.weight': "Weight",
      'dash.measurements': "Measurements",
      'dash.kitchen_timer': "Kitchen Timer",
      'dash.save': "Save",
      'dash.done': "Done!",
      'dash.running': "Running...",
      'dash.plan_meals': "Plan your meals",
      'dash.your_program': "Your program",
      // Scanner
      'scan.alternatives': "Healthier Alternatives",
      'scan.nutriscore': "Nutri-Score",
      'scan.proteins': "PROTEIN",
      'scan.carbs': "CARBS",
      'scan.fats': "FATS",
      'scan.sugars': "SUGARS",
      'scan.fibers': "FIBER",
      'scan.salt': "SALT",
      'scan.sat_fat': "SAT. FAT",
      // Sport
      'sport.start': "Start",
      'sport.pain_none': "None",
      'sport.pain_mild': "Mild",
      'sport.pain_moderate': "Moderate",
      'sport.pain_severe': "Severe",
      'sport.zone_shoulders': "Shoulders",
      'sport.zone_elbows': "Elbows",
      'sport.zone_wrists': "Wrists",
      'sport.zone_neck': "Neck",
      'sport.zone_upper_back': "Upper Back",
      'sport.zone_lower_back': "Lower Back",
      'sport.zone_hips': "Hips",
      'sport.zone_knees': "Knees",
      'sport.zone_ankles': "Ankles",
      'nav.dashboard': 'Dashboard',
      'nav.nutrition': 'Nutrition',
      'nav.sport': 'Workout',
      'nav.extras': 'Extras',

      // Auth
      'auth.login': 'Sign In',
      'auth.register': 'Create Account',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.confirm_password': 'Confirm Password',
      'auth.firstname': 'First Name',
      'auth.login_btn': 'Sign In',
      'auth.register_btn': 'Sign Up',
      'auth.logout': 'Sign Out',
      'auth.no_account': "Don't have an account?",
      'auth.has_account': 'Already have an account?',
      'auth.error_credentials': 'Incorrect email or password',
      'auth.error_email': 'Invalid email address',
      'auth.error_password_length': 'Password must be at least 6 characters',
      'auth.error_password_rules': 'Password must contain at least 6 characters, one uppercase letter, one number and one special character.',
      'auth.error_password_match': 'Passwords do not match',
      'auth.rate_limit': 'Too many attempts. Please try again in 5 minutes.',

      // Onboarding
      'onb.title': 'My Program',
      'onb.step': 'Step',
      'onb.of': 'of',
      'onb.next': 'Continue',
      'onb.back': '← Back',
      'onb.start': 'Get Started',
      'onb.finish': 'View My Program',

      // Step 1
      'onb.s1.title': 'Your Profile',
      'onb.s1.sex': 'Biological Sex',
      'onb.s1.male': 'Male',
      'onb.s1.female': 'Female',
      'onb.s1.menstrual': 'Menstrual Cycle Tracking',
      'onb.s1.pregnant': 'Pregnancy',
      'onb.s1.trimester': 'Trimester',

      // Step 2
      'onb.s2.title': 'Body Measurements',
      'onb.s2.age': 'Age',
      'onb.s2.weight': 'Weight',
      'onb.s2.height': 'Height',
      'onb.s2.bmi': 'BMI',
      'onb.s2.bmi_under': 'Underweight',
      'onb.s2.bmi_normal': 'Normal Weight',
      'onb.s2.bmi_over': 'Overweight',
      'onb.s2.bmi_obese': 'Obese',

      // Step 3
      'onb.s3.title': 'Activity Level',
      'onb.s3.sedentary': 'Sedentary',
      'onb.s3.light': 'Lightly Active',
      'onb.s3.moderate': 'Moderately Active',
      'onb.s3.active': 'Very Active',
      'onb.s3.very_active': 'Extremely Active',
      'onb.s3.elite': 'Elite Athlete',
      'onb.s3.training_days': 'Training Days / Week',
      'onb.s3.sleep': 'Hours of Sleep / Night',

      // Step 4
      'onb.s4.title': 'Health & Medical History',
      'onb.s4.none': 'No specific conditions',

      // Step 5
      'onb.s5.title': 'Food Preferences',
      'onb.s5.diet': 'Diet Type',
      'onb.s5.omnivore': 'Omnivore',
      'onb.s5.vegetarian': 'Vegetarian',
      'onb.s5.vegan': 'Vegan',
      'onb.s5.pescatarian': 'Pescatarian',
      'onb.s5.allergies': 'Allergies',
      'onb.s5.intolerances': 'Intolerances',
      'onb.s5.whey': 'I take whey protein',
      'onb.s5.currency': 'Currency',

      // Step 6
      'onb.s6.title': 'Your Goal',
      'onb.s6.bulk': 'Muscle Gain',
      'onb.s6.lean_bulk': 'Lean Bulk',
      'onb.s6.maintain': 'Maintenance',
      'onb.s6.cut': 'Cut',
      'onb.s6.shred': 'Shred',
      'onb.s6.recomposition': 'Recomposition',

      // Step 8
      'onb.s8.title': 'Your Nutrition Plan',
      'onb.s8.bmr': 'Basal Metabolic Rate',
      'onb.s8.tdee': 'Total Daily Energy',
      'onb.s8.target': 'Calorie Target',
      'onb.s8.proteins': 'Protein',
      'onb.s8.carbs': 'Carbohydrates',
      'onb.s8.fats': 'Fat',

      // Step 9
      'onb.s9.title': 'Your Weekly Plan',
      'onb.s9.breakfast': 'Breakfast',
      'onb.s9.lunch': 'Lunch',
      'onb.s9.dinner': 'Dinner',
      'onb.s9.snack': 'Snack',
      'onb.s9.total': 'Total',
      'onb.s9.target': 'Target',
      'onb.s9.generate': 'Generate New Plan',
      'onb.s9.shopping': 'Shopping List',

      // Nutrition — meal names
      'nutrition.meal_breakfast': 'Breakfast',
      'nutrition.meal_lunch': 'Lunch',
      'nutrition.meal_snack': 'Snack',
      'nutrition.meal_dinner': 'Dinner',
      'nutrition.protein': 'Protein',
      'nutrition.carbs': 'Carbs',
      'nutrition.fats': 'Fat',

      // Dashboard
      'dash.greeting_morning': 'Good morning',
      'dash.greeting_afternoon': 'Good afternoon',
      'dash.greeting_evening': 'Good evening',
      'dash.calories': 'kcal',
      'dash.goal': 'Goal',
      'dash.weight': 'Weight',
      'dash.progression': 'Progress',
      'dash.no_weight': 'Add your first weight entry to see your progress chart.',

      // Sport
      'sport.select': 'Choose Your Sport',
      'sport.level': 'Level',
      'sport.beginner': 'Beginner',
      'sport.intermediate': 'Intermediate',
      'sport.advanced': 'Advanced',
      'sport.elite': 'Elite',
      'sport.goal': 'Goal',
      'sport.days': 'Days / Week',
      'sport.program': 'My Program',
      'sport.week': 'Week',

      // Musculation
      'muscu.sets': 'sets',
      'muscu.reps': 'reps',
      'muscu.rest': 'Rest',
      'muscu.weight': 'Load',
      'muscu.success': 'Set completed',
      'muscu.fail': 'Set failed',
      'muscu.session_summary': 'Session Summary',
      'muscu.duration': 'Duration',
      'muscu.calories_burned': 'kcal burned',

      // Shopping
      'shop.title': 'Shopping List',
      'shop.aisles': 'aisles',
      'shop.items': 'items',
      'shop.optimized': 'Optimized route',
      'shop.bought': 'items purchased',
      'shop.reset': 'Reset',
      'shop.export': 'Export PDF',

      // Scanner
      'scan.title': 'Scanner',
      'scan.scan': 'Scan a Product',
      'scan.manual': 'Manual Entry',
      'scan.barcode_placeholder': 'Barcode (EAN-13)',
      'scan.search': 'Search',
      'scan.history': 'History',
      'scan.no_history': 'Scan your first product to see history here.',
      'scan.health_score': 'Health Score',

      // Extras
      'extras.water': 'Hydration',
      'extras.water_glasses': 'glasses',
      'extras.timer': 'Timer',
      'extras.start': 'Start',
      'extras.stop': 'Stop',
      'extras.reset': 'Reset',
      'extras.measures': 'Body Measurements',
      'extras.sleep': 'Sleep',
      'extras.food_calc': 'Nutrition Calculator',

      // Common
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.confirm': 'Confirm',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.close': 'Close',
      'common.loading': 'Loading...',
      'common.error': 'An error occurred',
      'common.reload': 'Reload',
      'common.per_day': '/ day',
      'common.per_week': '/ week',
      'common.per_kg': 'g / kg',
      'common.years': 'yrs',
      'common.hours': 'h',
      'common.minutes': 'min',
      'common.seconds': 'sec',
      'common.kg': 'kg',
      'common.cm': 'cm',
      'common.kcal': 'kcal',
      'common.g': 'g',
      'common.ml': 'ml',
      'common.minor_warning': 'For users under 18, this program should be followed under the supervision of a healthcare professional.',
      'Langue / Language': 'Language',
      // POLISH 2026-04 (i18n) : coach IA panel + actions (EN)
      'coach.placeholder': 'Ask your question...',
      'coach.send': 'Send',
      'coach.welcome': "Performance is built in the details. What would you like to refine in your training today",
      'coach.typing_label': 'Analyzing',
      'coach.action_copy': 'Copy',
      'coach.action_regenerate': 'Regenerate',
      'coach.action_useful': 'Useful',
      'coach.action_not_useful': 'Not useful',
      'coach.action_voice': 'Voice input',
      'coach.toast_copied': 'Copied',
      'coach.toast_copy_fail': 'Copy failed',
      'coach.toast_thanks': 'Thanks for your feedback',
      'coach.toast_feedback_saved': 'Feedback saved',
      'coach.toast_regenerating': 'Regenerating…',
      'coach.toast_voice_unsupported': 'Voice input not supported',
      'coach.toast_voice_denied': 'Microphone denied. Check your browser settings',
      'coach.toast_voice_no_mic': 'No microphone detected',
      'coach.toast_voice_network': 'Network required for voice input',
      'coach.toast_voice_start_error': 'Microphone start error',
      'coach.error_too_long': 'Coach is taking too long to reply. Please try again in a moment.',
      'coach.error_rate_limit': 'Too many messages. Please wait a few minutes before retrying.',
      'coach.error_offline': 'Cannot reach the coach. Check your connection.',
      'coach.new_messages_pill': '↓ New messages'
    }
  }
};

// Raccourci global
window.t = function(key) { return window.I18N.t(key); };

// ─── DOM TRANSLATOR (post-render, EN only) ───
window.I18N._frToEn = null; // lazy init

window.I18N.buildMap = function() {
  if (window.I18N._frToEn) return;
  window.I18N._frToEn = new Map([
    // Navigation & Structure
    ['Tableau de bord', 'Dashboard'],
    ['Connexion', 'Sign In'],
    ['Déconnexion', 'Sign Out'],
    ['Créer un compte', 'Create Account'],
    ['Continuer', 'Continue'],
    ['Retour', 'Back'],
    ['Commencer', 'Get Started'],
    ['Voir mon programme', 'View My Program'],
    ['Enregistrer', 'Save'],
    ['Annuler', 'Cancel'],
    ['Fermer', 'Close'],
    ['Chargement...', 'Loading...'],
    ['Modifier', 'Edit'],
    ['Supprimer', 'Delete'],
    ['Confirmer', 'Confirm'],
    // Wizard step titles & subtitles
    ['Votre identité', 'Your Identity'],
    ['Votre morphologie', 'Your Morphology'],
    ['Votre activité', 'Your Activity'],
    ['Votre santé', 'Your Health'],
    ['Vos habitudes alimentaires', 'Your Eating Habits'],
    ['Votre objectif', 'Your Goal'],
    ['Vos préférences', 'Your Preferences'],
    ['Votre semaine', 'Your Week'],
    ['Les bases pour un programme calibré sur mesure.', 'The basics for a tailor-made program.'],
    ['Poids et taille pour un calibrage précis de vos besoins.', 'Weight and height for precise calibration.'],
    ['Décrivez votre rythme pour adapter votre programme.', 'Describe your routine to tailor your program.'],
    ['Vos conditions de santé pour des recommandations sûres.', 'Your health conditions for safe recommendations.'],
    ['Vos habitudes au quotidien pour un plan réaliste.', 'Your daily habits for a realistic plan.'],
    ["Allergies, cuisine et goûts pour des recettes qui vous ressemblent.", 'Allergies, cuisine and taste for recipes that suit you.'],
    // Wizard labels
    ['Sexe biologique', 'Biological Sex'],
    ['Homme', 'Male'],
    ['Femme', 'Female'],
    ['Poids', 'Weight'],
    ['Taille', 'Height'],
    ['Âge', 'Age'],
    ['Date de naissance', 'Date of Birth'],
    ['Fréquence sport', 'Training Frequency'],
    ["Type d'entraînement", 'Training Type'],
    ['Heures de sommeil / nuit', 'Hours of Sleep / Night'],
    ['Aucune condition particulière', 'No specific conditions'],
    ['Nombre de repas par jour', 'Meals per Day'],
    ['Budget alimentaire', 'Food Budget'],
    ['Niveau cuisine', 'Cooking Level'],
    ['Allergies alimentaires', 'Food Allergies'],
    ['Régime alimentaire', 'Diet Type'],
    ['Cuisines préférées', 'Preferred Cuisines'],
    ['Poids cible', 'Target Weight'],
    ['Photo de profil', 'Profile Photo'],
    ['Ajouter une photo', 'Add Photo'],
    ['AJOUTER UNE PHOTO', 'ADD PHOTO'],
    ['CHANGER LA PHOTO', 'CHANGE PHOTO'],
    ['SUPPRIMER', 'DELETE'],
    ['Mode sombre', 'Dark Mode'],
    // Meal types
    ['Petit-déjeuner', 'Breakfast'],
    ['Déjeuner', 'Lunch'],
    ['Dîner', 'Dinner'],
    ['Collation', 'Snack'],
    // Dashboard
    ['Bonjour', 'Good morning'],
    ['Bon après-midi', 'Good afternoon'],
    ['Bonsoir', 'Good evening'],
    ['Citation du jour', 'Quote of the Day'],
    ['Votre série', 'Your Streak'],
    ["Aperçu du jour", "Today's Overview"],
    ['Accès rapide', 'Quick Access'],
    ['Enregistrer mon poids', 'Log My Weight'],
    ['Mensurations', 'Measurements'],
    ['Planifiez vos repas', 'Plan your meals'],
    ['Votre programme', 'Your program'],
    ['Bienvenue sur SmartFitCoach', 'Welcome to SmartFitCoach'],
    ['Commencer mon programme', 'Start my program'],
    ['Résultats personnalisés', 'Personalized Results'],
    ['Vos macros', 'Your Macros'],
    // Macros & Nutrition labels
    ['Protéines', 'Protein'],
    ['Glucides', 'Carbs'],
    ['Lipides', 'Fat'],
    ['Calories', 'Calories'],
    ['Métabolisme de base', 'Basal Metabolic Rate'],
    ['Dépense totale', 'Total Daily Energy'],
    ['Cible calorique', 'Calorie Target'],
    ['Objectif', 'Goal'],
    ['Hydratation', 'Hydration'],
    ['Fibres', 'Fiber'],
    ['Suppléments', 'Supplements'],
    // Sport
    ['Choisissez votre sport', 'Choose Your Sport'],
    ['Musculation', 'Strength Training'],
    ['Course à pied', 'Running'],
    ['Cyclisme', 'Cycling'],
    ['Natation', 'Swimming'],
    ['CrossFit', 'CrossFit'],
    ['Yoga', 'Yoga'],
    ['Triathlon', 'Triathlon'],
    ['Calisthenics', 'Calisthenics'],
    ['Padel', 'Padel'],
    ['Golf', 'Golf'],
    ['Niveau', 'Level'],
    ['Débutant', 'Beginner'],
    ['Intermédiaire', 'Intermediate'],
    ['Avancé', 'Advanced'],
    ['Élite', 'Elite'],
    ['Jours / semaine', 'Days / week'],
    ['Mon programme', 'My Program'],
    ['Semaine', 'Week'],
    ['Séries', 'Sets'],
    ['Répétitions', 'Reps'],
    ['Repos', 'Rest'],
    ['Charge', 'Load'],
    ['Bilan de séance', 'Session Summary'],
    ['Durée', 'Duration'],
    // Shopping
    ['Liste de courses', 'Shopping List'],
    ['Réinitialiser', 'Reset'],
    ['Exporter PDF', 'Export PDF'],
    ['articles', 'items'],
    ['rayons', 'aisles'],
    // Scanner
    ['Scanner un produit', 'Scan a Product'],
    ['Saisie manuelle', 'Manual Entry'],
    ['Rechercher', 'Search'],
    ['Historique', 'History'],
    ['Score santé', 'Health Score'],
    // Common
    ['Voir le profil', 'View Profile'],
    ['Générer un nouveau plan', 'Generate New Plan'],
    ['Planning', 'Weekly Plan'],
    // Supplements timing
    ['matin', 'morning'],
    ['soir', 'evening'],
    ['avec les repas', 'with meals'],
    ["avant l'entraînement", 'before training'],
    ["après l'entraînement", 'after training'],
    // Medical
    ['Diabète', 'Diabetes'],
    ['Hypertension', 'Hypertension'],
    ['Hypothyroïdie', 'Hypothyroidism'],
    ['Hyperthyroïdie', 'Hyperthyroidism'],
    ['Cholestérol élevé', 'High Cholesterol'],
    ['Végétarien', 'Vegetarian'],
    ['Végane', 'Vegan'],
    ['Pescétarien', 'Pescatarian'],
    ['Omnivore', 'Omnivore'],
    // Goals
    ['Prise de masse', 'Muscle Gain'],
    ['Prise de masse douce', 'Lean Bulk'],
    ['Maintien', 'Maintenance'],
    ['Sèche', 'Cut'],
    ['Recomposition', 'Recomposition'],
    // IMC
    ['IMC', 'BMI'],
    ['Poids normal', 'Normal Weight'],
    ['Surpoids', 'Overweight'],
    ['Obésité', 'Obesity'],
    ['Insuffisance pondérale', 'Underweight'],
    // Misc
    ['Étape', 'Step'],
    ['sur', 'of'],
    ['ans', 'years old'],
    ['kcal brûlées', 'kcal burned'],
    ['/ jour', '/ day'],
    ['/ semaine', '/ week'],
    ['g / kg', 'g / kg'],
    ['Série réussie', 'Set completed'],
    ['Série échouée', 'Set failed'],
    // Step labels not yet covered
    ['Votre profil', 'Your Profile'],
    ['Mensurations', 'Measurements'],
    ["Niveau d'activité", 'Activity Level'],
    ['Santé & Antécédents', 'Health & Medical History'],
    ['Préférences alimentaires', 'Food Preferences'],
    ['Votre programme nutritionnel', 'Your Nutrition Plan'],
    ['Votre plan semaine', 'Your Weekly Plan'],
    ['Cible', 'Target'],
    ['Total', 'Total'],
    ['Générer un nouveau plan', 'Generate New Plan'],
    ['Liste de courses', 'Shopping List'],
    // Activity levels
    ['Sédentaire', 'Sedentary'],
    ['Légèrement actif', 'Lightly Active'],
    ['Modérément actif', 'Moderately Active'],
    ['Très actif', 'Very Active'],
    ['Extrêmement actif', 'Extremely Active'],
    ['Athlète élite', 'Elite Athlete'],
    // Body zones
    ['Épaules', 'Shoulders'],
    ['Coudes', 'Elbows'],
    ['Poignets', 'Wrists'],
    ['Nuque / Cou', 'Neck'],
    ['Haut du dos', 'Upper Back'],
    ['Bas du dos', 'Lower Back'],
    ['Hanches', 'Hips'],
    ['Genoux', 'Knees'],
    ['Chevilles', 'Ankles'],
    // Pain levels
    ['Aucune', 'None'],
    ['Légère', 'Mild'],
    ['Modérée', 'Moderate'],
    ['Sévère', 'Severe'],
    // Scan labels
    ['Alternatives plus saines', 'Healthier Alternatives'],
    ['PROTÉINES', 'PROTEIN'],
    ['GLUCIDES', 'CARBS'],
    ['LIPIDES', 'FATS'],
    ['SUCRES', 'SUGARS'],
    ['FIBRES', 'FIBER'],
    ['SEL', 'SALT'],
    ['GRAS SAT.', 'SAT. FAT'],
    // Extras
    ['Calculateur nutritionnel', 'Nutrition Calculator'],
    ['Mesures corporelles', 'Body Measurements'],
    ['Minuteur', 'Timer'],
    ['Démarrer', 'Start'],
    ['Arrêter', 'Stop'],
    ['Sommeil', 'Sleep'],
    ['verres', 'glasses'],
    // Minor warning
    ["Pour les moins de 18 ans, ce programme doit être suivi avec l'accompagnement d'un professionnel de santé.", 'For users under 18, this program should be followed under the supervision of a healthcare professional.'],
    // Dashboard — additional labels
    ['Explorer les programmes', 'Browse Programs'],
    ['Macros du jour', "Today's Macros"],
    ['Suivi hydratation', 'Hydration Tracker'],
    ['Suivi sommeil', 'Sleep Tracker'],
    ['Résumé hebdomadaire', 'Weekly Summary'],
    ['Ma progression', 'My Progress'],
    ['Journal alimentaire', 'Food Journal'],
    ['Badges', 'Badges'],
    ['Tous les badges', 'All Badges'],
    ['Voir tous les badges \u2192', 'View all badges \u2192'],
    ['Série en cours', 'Current Streak'],
    ['Mes données', 'My Data'],
    ['Mes mensurations', 'My Measurements'],
    ['Timer cuisine', 'Kitchen Timer'],
    ['Suivi médical', 'Medical Tracking'],
    ['Module hydratation indisponible', 'Hydration module unavailable'],
    ['Module hydratation non chargé', 'Hydration module not loaded'],
    ['Module sommeil indisponible', 'Sleep module unavailable'],
    ['Module sommeil non chargé', 'Sleep module not loaded'],
    ['Résumé indisponible', 'Summary unavailable'],
    ['Module résumé non chargé', 'Summary module not loaded'],
    ['Progression indisponible', 'Progress unavailable'],
    ['Module progression non chargé', 'Progress module not loaded'],
    ['Panneau badges indisponible.', 'Badges panel unavailable.'],
    ['Module mensurations indisponible.', 'Measurements module unavailable.'],
    ['Module mensurations non chargé.', 'Measurements module not loaded.'],
    ['\uD83C\uDFCB\uFE0F Brûlées', '\uD83C\uDFCB\uFE0F Burned'],
    ['\u26a1 Kcal nettes récupération', '\u26a1 Net kcal recovery'],
    ['CALORIES PAR JOUR — PLAN SEMAINE', 'CALORIES PER DAY — WEEKLY PLAN'],
    ['Aucun plan semaine généré', 'No weekly plan generated yet'],
    ['Votre programme personnalisé vous attend', 'Your personalized program is ready'],
    ['Complétez le questionnaire Nutrition pour générer votre plan alimentaire et sportif personnalisé.', 'Complete the Nutrition questionnaire to generate your personalized meal and workout plan.'],
    ['Générez votre plan semaine dans Nutrition pour commencer le suivi de vos calories et performances.', 'Generate your weekly plan in Nutrition to start tracking calories and performance.'],
    ['Générez votre plan semaine dans Nutrition pour commencer à suivre vos calories.', 'Generate your weekly plan in Nutrition to start tracking your calories.'],
    ['Démarrer le questionnaire', 'Start the questionnaire'],
    ["Continuer l'onboarding", 'Continue setup'],
    ['Exporter mes données', 'Export my data'],
    ['\u2B07 Exporter mes données', '\u2B07 Export my data'],
    ['Supprimer toutes mes données', 'Delete all my data'],
    ['Dernière visite : ', 'Last visit: '],
    ['Joyeux anniversaire', 'Happy Birthday'],
    ['Objectif \u2212 dépense = disponible récupération', 'Goal \u2212 expenditure = available for recovery'],
    // Nutrition — additional labels
    ['Ingrédients', 'Ingredients'],
    ['Préparation', 'Instructions'],
    ['Ingrédients non disponibles.', 'Ingredients not available.'],
    ['Étapes non disponibles.', 'Steps not available.'],
    ['Aucune recette trouvée.', 'No recipe found.'],
    ['Budget courses estimé', 'Estimated grocery budget'],
    ['Budget total estimé', 'Estimated total budget'],
    ['Générez d\'abord votre plan semaine', 'Generate your weekly plan first'],
    ["Générez d'abord votre plan de repas.", 'Generate your meal plan first.'],
    ['Aucun ingrédient détecté dans le plan.', 'No ingredients detected in the plan.'],
    ['Séances musculation — 7 derniers jours', 'Strength sessions — last 7 days'],
    ['\uD83C\uDFCB\uFE0F Séances musculation — 7 derniers jours', '\uD83C\uDFCB\uFE0F Strength sessions — last 7 days'],
    ['Séance validée aujourd\'hui — dépense', 'Session logged today — expenditure'],
    ['\uD83C\uDFCB\uFE0F Séance validée aujourd\'hui — dépense', '\uD83C\uDFCB\uFE0F Session logged today — expenditure'],
    ['2-3 fois par semaine en collation', '2-3 times per week as a snack'],
    ['🍮 Desserts healthy dans mon plan', '🍮 Healthy desserts in my plan'],
    ['⚠ CONFLIT : Objectif sèche/coupe incompatible avec un historique de TCA. Choisissez Maintien ou Prise de masse.', '⚠ CONFLICT: Cut/shred goal is incompatible with an eating disorder history. Choose Maintenance or Muscle Gain.'],
    ['Faites 2 courses par semaine — renouvelez dans 4 jours', 'Shop twice a week — restock in 4 days'],
    ["Courses pour aujourd'hui uniquement", 'Shopping for today only'],
    ['Quantités déjà doublées pour 14 jours — stock et surgelés recommandés', 'Quantities already doubled for 14 days — pantry staples and frozen food recommended'],
    ['Courses pour toute la semaine', 'Shopping for the whole week'],
    ['Aucune recette pour ces parfums. Sélectionnez d\'autres parfums dans vos préférences.', 'No recipe for these flavors. Select other flavors in your preferences.'],
    // Sport — additional labels
    ['Évaluation médicale', 'Medical Assessment'],
    ['Bilan\nmedical muscu', 'Medical\nassessment'],
    ['Avant de générer votre programme, aidez-nous à adapter les exercices à votre situation physique.', 'Before generating your program, help us adapt exercises to your physical condition.'],
    ['Avez-vous des douleurs ou fragilités ?', 'Do you have any pain or vulnerabilities?'],
    ['Avez-vous un diagnostic confirmé ?', 'Do you have a confirmed diagnosis?'],
    ["Quelle est l'intensité générale ?", 'What is your general pain intensity?'],
    ['\u26A0 Douleur sévère ou antécédent grave détecté. Nous adapterons le programme en mode réhabilitation.', '\u26A0 Severe pain or serious history detected. We will adapt the program to rehabilitation mode.'],
    ['Consultez impérativement un médecin ou kinésithérapeute avant de reprendre la musculation lourde.', 'Consult a doctor or physiotherapist before resuming heavy strength training.'],
    ['\u26A0 Diabète — Précautions sportives', '\u26A0 Diabetes — Sports Precautions'],
    ['Mesurez votre glycémie avant/après chaque séance. Évitez l\'entraînement si glycémie < 4,0 mmol/L ou > 14,0 mmol/L. Gardez toujours une source de sucres rapides à portée de main. Intensité progressive recommandée (RPE max 7/10 les 4 premières semaines).', 'Check blood sugar before/after each session. Avoid training if blood sugar < 4.0 mmol/L or > 14.0 mmol/L. Always carry fast-acting sugar. Progressive intensity recommended (max RPE 7/10 for the first 4 weeks).'],
    ['\uD83D\uDCAA Athlète 50+ — Adaptations recommandées', '\uD83D\uDCAA 50+ Athlete — Recommended Adaptations'],
    ['\uD83E\uDD30 Grossesse — Exercices autorisés seulement', '\uD83E\uDD30 Pregnancy — Authorized Exercises Only'],
    ['Évitez les charges lourdes, exercices allongés sur le dos (après 20 SA), abdominaux hyperpressifs, sauts et HIIT intense. Privilégiez marche, natation, yoga prénatal, Kegel. Consultez votre médecin avant tout entraînement.', 'Avoid heavy loads, lying on your back (after 20 weeks), high-pressure ab work, jumping and intense HIIT. Favor walking, swimming, prenatal yoga, Kegel. Consult your doctor before any training.'],
    ['Charges estimées', 'Estimated Loads'],
    ['Groupes musculaires — Priorité', 'Muscle Groups — Priority'],
    ['Attribuez 1 à 5 étoiles pour définir la priorité. Cliquez à nouveau pour retirer.', 'Assign 1 to 5 stars to set priority. Click again to remove.'],
    ['Durée de tes séances', 'Session Duration'],
    ["Quelle est la durée de tes séances ?", 'How long are your sessions?'],
    ['Sélectionnez au moins 2 zones', 'Select at least 2 zones'],
    ['Sélectionnez une durée de séance', 'Select a session duration'],
    ['Sélectionnez au moins 2 zones à cibler dans votre programme.', 'Select at least 2 zones to target in your program.'],
    ['Sélectionnez votre niveau pour adapter les charges et mouvements.', 'Select your level to adapt loads and movements.'],
    ["Vue d'ensemble — cliquez sur un jour pour y accéder", 'Overview — click on a day to access it'],
    [' Terminé', ' Completed'],
    ['▶ Aujourd\'hui', '▶ Today'],
    ['Plan d\'entraînement course à pied', 'Running Training Plan'],
    ['Préparation Hyrox complète', 'Full Hyrox Preparation'],
    ['Technique · Tactique · Match · Physique', 'Technique · Tactics · Match · Physical'],
    ['Progresser au golf — méthode Dave Pelz', 'Improve at golf — Dave Pelz method'],
    ['Programme Jan Frodeno · Patrick Lange · Daniela Ryf', 'Jan Frodeno · Patrick Lange · Daniela Ryf program'],
    ['Optionnel — laissez vide si variable', 'Optional — leave blank if variable'],
    ['Type de vélo', 'Bike Type'],
    ['Configuration', 'Configuration'],
    ['Discipline à renforcer (optionnel)', 'Discipline to improve (optional)'],
    ['Auto-évaluation (optionnel)', 'Self-assessment (optional)'],
    ['Allures estimées par zone', 'Estimated paces by zone'],
    ['Plan basé sur les zones FTP (méthode Andy Coggan)', 'Plan based on FTP zones (Andy Coggan method)'],
    ['Programmation basée sur la méthode Jack Daniels & Pfitzinger', 'Programming based on Jack Daniels & Pfitzinger method'],
    ['Aucun skill sélectionné', 'No skill selected'],
    ['Charge de travail', 'Workload'],
    ['Suivi du poids', 'Weight Tracking'],
    ['Technique, tactique et préparation physique.', 'Technique, tactics and physical preparation.'],
    ['Street workout, mouvements au poids du corps', 'Street workout, bodyweight movements'],
    ['Street workout, progressions au poids du corps.', 'Street workout, bodyweight progressions.'],
    ["Route, VTT, indoor \u2014 améliore l'", 'Road, MTB, indoor \u2014 improves '],
    ['Niveau d\'expérience et fréquence d\'entraînement.', 'Experience level and training frequency.'],
    ['Vos zones de puissance', 'Your Power Zones'],
    ['Volume hebdomadaire', 'Weekly Volume'],
    ['Vos charges actuelles (optionnel)', 'Your current loads (optional)'],
    ['Programme ciblé par groupes musculaires', 'Program targeting muscle groups'],
    // Auth — additional hardcoded strings
    ['Votre prénom', 'Your first name'],
    ['Min. 6 caractères', 'Min. 6 characters'],
    ['Ex: avocat, bœuf, saumon...', 'e.g. avocado, beef, salmon...'],
    ['Code-barres (EAN-13)', 'Barcode (EAN-13)'],
    ['Mot de passe', 'Password'],
    ['Création...', 'Creating...'],
    ['Erreur lors de la création du compte. Réessayez.', 'Error creating account. Please try again.'],
    ['Erreur de connexion. Réessayez.', 'Connection error. Please try again.'],
    ['Veuillez remplir tous les champs', 'Please fill in all fields'],
    ['Tous les champs sont obligatoires', 'All fields are required'],
    ['Retour à la connexion', 'Back to sign in'],
    ['Veuillez entrer votre adresse email', 'Please enter your email address'],
    ['Terminé !', 'Done!'],
    ['Cela remplacera vos données actuelles. Continuer ?', 'This will replace your current data. Continue?'],
    ['Êtes-vous sûr ? Toutes vos données seront supprimées définitivement.', 'Are you sure? All your data will be permanently deleted.'],
    ['Dernière confirmation : cette action est irréversible. Continuer ?', 'Final confirmation: this action is irreversible. Continue?'],
    // Quotes
    ['La discipline est le pont entre les objectifs et les résultats.', 'Discipline is the bridge between goals and accomplishments.'],
    ["Prenez soin de votre corps, c'est le seul endroit où vous vivez.", 'Take care of your body. It\'s the only place you have to live.'],
    ['Le succès est la somme de petits efforts répétés jour après jour.', 'Success is the sum of small efforts repeated day in and day out.'],
  ]);
};

window.I18N._frToEnPartial = null; // lazy init for partial match list

window.I18N.buildPartialMap = function() {
  if (window.I18N._frToEnPartial) return;
  window.I18N._frToEnPartial = [
    // Dynamic text with variables — handled via partial string replacement
    ['Votre questionnaire est en cours (étape ', 'Your questionnaire is in progress (step '],
    ['). Terminez-le pour accéder à votre tableau de bord complet.', '). Complete it to access your full dashboard.'],
    ['kcal/jour (besoins grossesse inclus dans votre cible)', 'kcal/day (pregnancy needs included in your target)'],
    ['T1 : pas de calories supplémentaires nécessaires', 'T1: no additional calories needed'],
    ['Poids attendu à SA', 'Expected weight at week'],
    ['kg (gain cible : +', 'kg (target gain: +'],
    ['Consultez votre médecin ou diabétologue avant de modifier votre alimentation ou votre programme sportif. Mesurez votre glycémie régulièrement, notamment avant et après l\'effort. Privilegiez les aliments à index glycémique bas.', 'Consult your doctor or diabetologist before changing your diet or workout program. Monitor your blood sugar regularly, especially before and after exercise. Favor low glycemic index foods.'],
    ['\u26A0 Diabète — Recommandations importantes', '\u26A0 Diabetes — Important Recommendations'],
    ['Grossesse — Semaine ', 'Pregnancy — Week '],
    ['Série de 7 jours', '7-day streak'],
    ['Dernière visite : ', 'Last visit: '],
    [' ans', ' years old'],
    ['Nutrition & Sport', 'Nutrition & Workout'],
    // Sport partial
    ['\uD83D\uDCC9 Semaine ', '\uD83D\uDCC9 Week '],
    [' / 100 jours complétés (', ' / 100 days completed ('],
    ['% des ingrédients', '% of ingredients'],
    ['pour la recette', 'for the recipe'],
    [' mouvement(s) retiré(s) pour restriction médicale', ' movement(s) removed for medical restriction'],
    ['Compte à rebours ', 'Countdown '],
    ['Chrono — ', 'Timer — '],
    ['SUIVI WOD — Jour ', 'WOD TRACKING — Day '],
    [' WOD complété le ', ' WOD completed on '],
    [' — Score : ', ' — Score: '],
    ['Score (rounds, temps, reps, kg) — optionnel', 'Score (rounds, time, reps, kg) — optional'],
    ['Charges adaptées pour : ', 'Adapted loads for: '],
    ['Début : ', 'Start: '],
    [' complétés (', ' completed ('],
    ['Tous les WODs sont adaptés à votre niveau', 'All WODs are adapted to your level'],
    ['Pour des charges de travail précises, renseignez vos 1RM', 'For precise workloads, enter your 1RM values'],
    ['Laissez vide les exercices que vous ne pratiquez pas.', 'Leave blank exercises you do not practice.'],
    ['Indiquez la charge ET le nombre de reps pour un calcul précis du 1RM', 'Enter the load AND reps for an accurate 1RM calculation'],
    ['Réduisez le volume de 40-50', 'Reduce volume by 40-50'],
    // DH budget
    [' DH pour ', ' DH for '],
    // Nutrition partial
    ['\uD83C\uDFCB\uFE0F Jour d\'entraînement', '\uD83C\uDFCB\uFE0F Training day'],
    ['\uD83D\uDE34 Jour de repos', '\uD83D\uDE34 Rest day'],
    ['\uD83D\uDE34 Récupération', '\uD83D\uDE34 Recovery'],
    ['\u26A1 Pré-séance', '\u26A1 Pre-session'],
    ['\uD83D\uDCAA Post-séance', '\uD83D\uDCAA Post-session'],
    ['kcal EPOC (afterburn) inclus', 'kcal EPOC (afterburn) included'],
    [' repas/j)', ' meals/day)'],
    [' repas/jour · 527 recettes', ' meals/day · 527 recipes'],
    ['7 jours · ', '7 days · '],
    ['Semaine d\'', 'Week of '],
    ['Liste pour ', 'List for '],
    ['Sélectionné dans vos compléments', 'Selected from your supplements'],
    ['Dose recommandée : ', 'Recommended dose: '],
    ['Hydratation quotidienne', 'Daily Hydration'],
    ['Détail de consommation', 'Consumption Details'],
    ['Objectif alimentaire ajusté (net)', 'Adjusted food goal (net)'],
    ['Objectif : G ', 'Goal: C '],
    ['Répartition par repas (', 'Meal breakdown ('],
    ['Supplément sélectionné dans vos compléments', 'Supplement selected from your supplements'],
    ['Supplémentation recommandée', 'Recommended Supplementation'],
    ['Supplémentation', 'Supplementation'],
    ['Suivi du cycle menstruel (optionnel)', 'Menstrual cycle tracking (optional)'],
    ['Cycle menstruel — Phase actuelle', 'Menstrual cycle — Current phase'],
    ['Date des dernières règles', 'Last menstrual period'],
    ['Durée moyenne : 28 jours', 'Average duration: 28 days'],
    ['Activer le suivi du cycle', 'Enable cycle tracking'],
    ['Courbe de poids — Grossesse', 'Pregnancy weight curve'],
    ['Suivi de poids grossesse', 'Pregnancy weight tracking'],
    ['Nutrition adaptée à chaque trimestre de votre grossesse.', 'Nutrition adapted to each trimester of your pregnancy.'],
    ["Êtes-vous enceinte ?", 'Are you pregnant?'],
    ['Pour calculer la prise de poids recommandée', 'To calculate recommended weight gain'],
    ['Semaine de grossesse', 'Week of pregnancy'],
    ['Ajouter un repas', 'Add a meal'],
    ['Choisir une recette', 'Choose a recipe'],
    ['Aliments exclus', 'Excluded foods'],
    ['Budget / jour', 'Budget / day'],
    ['Budget / semaine', 'Budget / week'],
    ['Budget alimentaire', 'Food Budget'],
    ['Habitudes de courses', 'Shopping Habits'],
    ['Où faites-vous vos courses ?', 'Where do you shop?'],
    ['Fréquence de courses', 'Shopping Frequency'],
    ['Grignotage', 'Snacking'],
    ['Consommation d\'alcool', 'Alcohol consumption'],
    ['Niveau cuisine', 'Cooking Level'],
    ['Préférences produits', 'Product Preferences'],
    ['Cuisines préférées', 'Preferred Cuisines'],
    ['Je suis en bonne santé', "I'm in good health"],
    ['Entre 14 et 80 ans', 'Between 14 and 80 years old'],
    ['Halal — exclure porc & alcool', 'Halal — exclude pork & alcohol'],
    ['Substitution Whey Végétale', 'Plant-based Whey Substitution'],
    ['L eau/jour', 'L water/day'],
    ['Composez votre création ou partez d\'une composition signature ci-dessus', 'Compose your creation or start from a signature composition above'],
    ['Résultats personnalisés', 'Personalized Results'],
    ['Nutrition & Sport personnalisés', 'Personalized Nutrition & Workout'],
    ['Photo de dos', 'Back photo'],
    ['Photo de face', 'Front photo'],
    ['Photo de profil (optionnel)', 'Profile photo (optional)'],
    ['Photo de progression (optionnel)', 'Progress photo (optional)'],
    ['Zones corporelles', 'Body Zones'],
    ['Vérif : ', 'Check: '],
    ['Évolution du poids', 'Weight Progress'],
    ['Smoothies Whey', 'Whey Smoothies'],
    ['Prends ta whey dans les 30 min après l\'', 'Take your whey within 30 min after '],
    ['Prenez-vous de la créatine ?', 'Are you taking creatine?'],
    // Hyrox program strings
    ['Programme Hyrox', 'Hyrox Program'],
    ['Préparation\nHyrox', 'Hyrox\nPreparation'],
    ['Préparation<br><em>Hyrox</em>', 'Preparation<br><em>Hyrox</em>'],
    ['Préparation<br><em>12 semaines</em>', 'Preparation<br><em>12 weeks</em>'],
    ['Zone 2 Run — Endurance de base', 'Zone 2 Run — Base Endurance'],
    ['Force fonctionnelle Hyrox', 'Hyrox Functional Strength'],
    ['Simulation Hyrox (', 'Hyrox Simulation ('],
    [' stations)', ' stations)'],
    ['Full Simulation Hyrox — 8 stations', 'Full Hyrox Simulation — 8 stations'],
    ['Endurance aérobie', 'Aerobic endurance'],
    ['Semaine de compétition', 'Race Week'],
    ['Semaine de récupération', 'Recovery Week'],
    ['Phase Build', 'Build Phase'],
    ['isDeload', 'isDeload'],
    ['Finir', 'Finish'],
    ['Niveau débutant', 'Beginner level'],
    ['Standard ', 'Standard '],
    ['Objectif : Finir', 'Goal: Finish'],
    ['/ ' , '/ '],
    // Rest timer strings
    ['Transition', 'Transition'],
    ['Repos adapté : ', 'Adapted rest: '],
    ['Série ', 'Set '],
    [' terminée — repos', ' completed — rest'],
    ['Commencer !', 'Start!'],
    ["C\u2019est parti !", "Let's go!"],
    ['Son coupé — cliquer pour activer', 'Sound off — click to enable'],
    ['Son actif — cliquer pour couper', 'Sound on — click to mute'],
    ['Passer ▶', 'Skip ▶'],
    // Golf / Padel program labels
    ['Petit jeu (60% du score)', 'Short game (60% of score)'],
    ['Long jeu', 'Long game'],
    ['Parcours', 'Course play'],
    ['Physique golf', 'Golf fitness'],
    ['Mental & Routine', 'Mental & Routine'],
    ['Fondamentaux', 'Fundamentals'],
    ['Développement', 'Development'],
    ['Performance', 'Performance'],
    ['Compétition', 'Competition'],
    ['Semaine légère', 'Light week'],
    ['Technique Padel', 'Padel Technique'],
    ['Prépa physique Padel', 'Padel Physical Prep'],
    ['Tactique', 'Tactics'],
    ['Récupération', 'Recovery'],
  ];
};

window.I18N.translateDOM = function() {
  if (window.I18N.current !== 'en') return;
  window.I18N.buildMap();
  window.I18N.buildPartialMap();
  var map = window.I18N._frToEn;
  var partial = window.I18N._frToEnPartial;
  var appEl = document.getElementById('app');
  if (!appEl) return;
  // Walk all text nodes
  var walker = document.createTreeWalker(appEl, NodeFilter.SHOW_TEXT, null, false);
  var nodes = [];
  var node;
  while ((node = walker.nextNode())) { nodes.push(node); }
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    var txt = n.nodeValue;
    if (!txt || !txt.trim()) continue;
    var trimmed = txt.trim();
    // Exact match first
    if (map.has(trimmed)) {
      n.nodeValue = txt.replace(trimmed, map.get(trimmed));
      continue;
    }
    // Partial match for dynamic strings
    var changed = false;
    for (var j = 0; j < partial.length; j++) {
      var fr = partial[j][0];
      var en = partial[j][1];
      if (txt.indexOf(fr) !== -1) {
        txt = txt.split(fr).join(en);
        changed = true;
      }
    }
    if (changed) n.nodeValue = txt;
  }
  // Also translate placeholder attributes
  var inputs = appEl.querySelectorAll('input[placeholder], textarea[placeholder]');
  for (var k = 0; k < inputs.length; k++) {
    var ph = inputs[k].getAttribute('placeholder');
    if (!ph) continue;
    if (map.has(ph)) { inputs[k].setAttribute('placeholder', map.get(ph)); continue; }
    var phChanged = false;
    var phTxt = ph;
    for (var m = 0; m < partial.length; m++) {
      if (phTxt.indexOf(partial[m][0]) !== -1) {
        phTxt = phTxt.split(partial[m][0]).join(partial[m][1]);
        phChanged = true;
      }
    }
    if (phChanged) inputs[k].setAttribute('placeholder', phTxt);
  }
};

// ═══════════════════════════════════════════════════════════════
// SHOP_AR — Dictionnaire arabe marocain (darija) pour la liste de courses
// Namespace séparé, n'affecte PAS window.I18N (FR/EN intact)
// ═══════════════════════════════════════════════════════════════
window.SHOP_AR = {

  // ── UI texts ──────────────────────────────────────────────────
  ui: {
    'title':           'قائمة التسوق',
    'subtitle':        'الأسبوع كامل — شكر كلشي كتشري',
    'back':            '← ارجع للبرنامج',
    'print':           '🖨️ طباعة',
    'print_title':     'قائمة التسوق — SmartFitCoach',
    'download_pdf':    '📄 تحميل PDF',
    'reset':           '↺ إعادة تعيين',
    'toggle_ar':       'عربي',
    'toggle_fr':       'FR',
    'total':           'المجموع',
    'articles_bought': 'منتج مشترى',
    'sections':        'رايون',
    'articles':        'منتج',
    'optimized_route': 'مسار محسّن',
    'no_plan':         'دير البرنامج ديالك قبل.',
    'no_items':        'ما لقينا حتى مكون فالبرنامج.',
    'date_label':      'تاريخ الطباعة'
  },

  // ── Rayons / sections supermarché ────────────────────────────
  sections: {
    '🥩 Boucherie & Poissonnerie':      '🥩 اللحوم والسمك',
    '🥚 Œufs & Produits laitiers':      '🥚 البيض ومنتجات الألبان',
    '🥦 Fruits & Légumes':              '🥦 الخضروات والفواكه',
    '🌾 Féculents & Céréales':          '🌾 النشويات والحبوب',
    '🧊 Surgelés':                      '🧊 المجمدات',
    '🥫 Conserves & Bocaux':            '🥫 المعلبات والمرطبانات',
    '🫙 Épicerie sèche':                '🫙 البقالة الجافة',
    '🌿 Épices & Herbes':               '🌿 التوابل والأعشاب',
    '🌰 Graines, Noix & Fruits secs':   '🌰 البذور والمكسرات والفواكه المجففة',
    '🥤 Boissons & Laits végétaux':     '🥤 المشروبات وحليب النباتات',
    '🍞 Boulangerie & Pâtisserie':      '🍞 المخبزة والحلويات',
    '❄️ Crèmerie & Fromages':           '❄️ الجبن والألبان المبردة',
    '🛒 Divers':                        '🛒 متفرقات'
  },

  // ── Ingrédients — 200+ traductions FR → Darija/arabe marocain ──
  ingredients: {
    // ─── Viandes & Volailles ───
    'poulet':                   'الدجاج',
    'blanc de poulet':          'صدر الدجاج',
    'filet de poulet':          'فيليه الدجاج',
    'cuisses de poulet':        'أفخاذ الدجاج',
    'poulet haché':             'الدجاج المفروم',
    'dinde':                    'الحبش',
    'filet de dinde':           'فيليه الحبش',
    'blanc de dinde':           'صدر الحبش',
    'boeuf':                    'لحم البقر',
    'bœuf':                     'لحم البقر',
    'viande hachée':            'اللحم المفروم',
    'steak':                    'الستيك',
    'filet de boeuf':           'فيليه البقر',
    'veau':                     'لحم العجل',
    'agneau':                   'لحم الغنم',
    'côtelettes d\'agneau':     'ضلوع الغنم',
    'kefta':                    'الكفتة',
    'merguez':                  'المرقاز',
    'hachis':                   'اللحم المفروم',
    'lardons':                  'اللاردون',
    'jambon':                   'الجامبون',
    'chorizo':                  'التشوريثو',
    'bacon':                    'البيكون',

    // ─── Poissons & Fruits de mer ───
    'saumon':                   'السلمون',
    'filet de saumon':          'فيليه السلمون',
    'thon':                     'التون',
    'cabillaud':                 'سمك الكابيو',
    'maquereau':                'سمك الكاوالا',
    'sardine':                  'السردين',
    'crevettes':                'الجمبري',
    'moules':                   'المحار',
    'dorade':                   'الدوراد',
    'bar':                      'القاروص',
    'sole':                     'سمك السول',
    'merlu':                    'الميرلو',
    'anchois':                  'الأنشوا',
    'tilapia':                  'التيلابيا',
    'truite':                   'الترويت',

    // ─── Œufs ───
    'oeuf':                     'البيضة',
    'oeufs':                    'البيض',
    'œuf':                      'البيضة',
    'œufs':                     'البيض',
    'blancs d\'oeufs':          'بياض البيض',
    'jaunes d\'oeufs':          'صفار البيض',

    // ─── Produits laitiers ───
    'lait':                     'الحليب',
    'lait écrémé':              'الحليب الكاشح',
    'lait demi-écrémé':         'الحليب نص كاشح',
    'lait entier':              'الحليب الكامل',
    'lait de vache':            'حليب البقرة',
    'yaourt':                   'الداون',
    'yaourt grec':              'الداون اليوناني',
    'yaourt nature':            'الداون طبيعي',
    'fromage':                  'الجبن',
    'fromage blanc':            'الجبن الأبيض',
    'fromage râpé':             'الجبن المبشور',
    'parmesan':                 'البارميزان',
    'mozzarella':               'الموزاريلا',
    'feta':                     'الفيتا',
    'ricotta':                  'الريكوتا',
    'skyr':                     'السكير',
    'mascarpone':               'الماسكاربوني',
    'cottage':                  'الكوتاج',
    'comté':                    'الكونتي',
    'emmental':                 'الإيمنتال',
    'gruyère':                  'الغرويار',
    'beurre':                   'الزبدة',
    'crème fraîche':            'الكريمة الطازجة',
    'crème':                    'الكريمة',
    'kéfir':                    'الكيفير',

    // ─── Légumes ───
    'tomate':                   'الطماطم',
    'tomates':                  'الطماطم',
    'tomates cerises':          'طماطم كرزية',
    'tomates concassées':       'طماطم مهروسة',
    'tomates pelées':           'طماطم مقشرة',
    'courgette':                'القرعة الخضراء',
    'courgettes':               'القرع الأخضر',
    'carotte':                  'الجزرة',
    'carottes':                 'الجزر',
    'oignon':                   'البصل',
    'oignons':                  'البصل',
    'ail':                      'الثوم',
    'brocoli':                  'البروكلي',
    'poivron':                  'الفلفل الرومي',
    'poivron rouge':            'الفلفل الرومي الأحمر',
    'poivron vert':             'الفلفل الرومي الأخضر',
    'épinards':                 'السبانخ',
    'épinard':                  'السبانخ',
    'chou':                     'الكرمب',
    'concombre':                'الخيار',
    'champignon':               'الشمبيون',
    'champignons':              'الشمبيون',
    'aubergine':                'الدنجال',
    'céleri':                   'الكرافس',
    'salade':                   'السلاطة',
    'laitue':                   'الليتيس',
    'roquette':                 'الجرجير',
    'mâche':                    'الماش',
    'pousses':                  'البراعم',
    'patate douce':             'البطاطا الحلوة',
    'pomme de terre':           'البطاطس',
    'poireau':                  'الكراث',
    'fenouil':                  'الفنل',
    'asperge':                  'الأسبراج',
    'asperges':                 'الأسبراج',
    'haricots verts':           'الفاصولية الخضراء',
    'haricot vert':             'الفاصولية الخضراء',
    'petits pois':              'الجلبانة',
    'maïs':                     'الدرة',
    'betterave':                'الشمندر',
    'navet':                    'اللفت',
    'radis':                    'الفجل',
    'artichaut':                'القرنون',
    'chou-fleur':               'الزهرة',
    'chou rouge':               'الكرمب الحمر',
    'potiron':                  'القرعة',
    'courge':                   'القرعة',
    'endive':                   'الشيكوريا',
    'cresson':                  'الحرشا',
    'bok choy':                 'بوك تشوي',
    'piment':                   'الهريسة',
    'piment rouge':             'الفلفل الأحمر الحار',
    'poireaux':                 'الكراث',

    // ─── Fruits ───
    'banane':                   'الموزة',
    'bananes':                  'الموز',
    'pomme':                    'التفاح',
    'pommes':                   'التفاح',
    'orange':                   'البرتقال',
    'citron':                   'الحامض',
    'citron vert':              'الليمون الأخضر',
    'fraise':                   'الفراولة',
    'fraises':                  'الفراولة',
    'myrtilles':                'التوت الأزرق',
    'framboises':               'التوت الأحمر',
    'mangue':                   'المانجو',
    'kiwi':                     'الكيوي',
    'ananas':                   'الأناناس',
    'raisin':                   'العنب',
    'pêche':                    'الخوخ',
    'poire':                    'الإجاص',
    'melon':                    'البطيخ الأصفر',
    'pastèque':                 'الدلاح',
    'abricot':                  'المشمش',
    'cerise':                   'الحب الملوك',
    'figue':                    'الكرماس',
    'datte':                    'التمر',
    'avocat':                   'الأفوكا',
    'pamplemousse':             'البامبلموس',
    'grenade':                  'الرمان',
    'noix de coco':             'جوز الهند',
    'pulpe d\'açaí':            'بولب الأكاي',

    // ─── Céréales & Féculents ───
    'riz':                      'الرز',
    'riz basmati':              'الرز البسمتي',
    'riz complet':              'الرز الكامل',
    'pâtes':                    'الماكرونة',
    'spaghetti':                'السباغيتي',
    'tagliatelles':             'التالياتيل',
    'penne':                    'البيني',
    'fusilli':                  'الفوزيلي',
    'quinoa':                   'الكينوا',
    'flocons d\'avoine':        'دقيق الشوفان',
    'avoine':                   'الشوفان',
    'soba':                     'نودل السوبا',
    'ramen':                    'الرامين',
    'nouilles':                 'النودل',
    'couscous':                 'الكسكس',
    'semoule':                  'السميد',
    'farine':                   'الدقيق',
    'farine complète':          'الدقيق الكامل',
    'boulgour':                 'البرغل',
    'polenta':                  'البولنتا',
    'sarrasin':                 'الحنطة السوداء',
    'millet':                   'الدخن',
    'épeautre':                 'الكاموت',
    'orge':                     'الشعير',
    'son d\'avoine':            'نخالة الشوفان',

    // ─── Légumineuses ───
    'lentilles':                'العدس',
    'lentilles vertes':         'العدس الأخضر',
    'lentilles rouges':         'العدس الأحمر',
    'pois chiches':             'الحمص',
    'haricots':                 'الفاصولية',
    'haricots rouges':          'الفاصولية الحمراء',
    'haricots noirs':           'الفاصولية السوداء',
    'fèves':                    'الفول',
    'edamame':                  'الإيدامامي',
    'soja':                     'الصويا',

    // ─── Pain & Boulangerie ───
    'pain':                     'الخبز',
    'pain complet':             'الخبز الكامل',
    'pain de seigle':           'خبز الجاودار',
    'baguette':                 'الباكيت',
    'tortilla':                 'التورتيا',
    'wraps':                    'الرابس',
    'pita':                     'خبز البيتا',
    'naan':                     'خبز النان',
    'chapati':                  'الشاباتي',
    'ciabatta':                 'الشياباتا',
    'brioche':                  'البريوش',
    'granola':                  'الغرانولا',

    // ─── Huiles, sauces & condiments ───
    'huile d\'olive':           'زيت الزيتون',
    'huile de coco':            'زيت جوز الهند',
    'huile':                    'الزيت',
    'vinaigre':                 'الخل',
    'vinaigre balsamique':      'خل البلسامي',
    'sauce soja':               'صلصة الصويا',
    'tahini':                   'الطحينة',
    'moutarde':                 'المسطردة',
    'pesto':                    'البيستو',
    'miel':                     'العسل',
    'sirop d\'érable':          'شراب القيقب',
    'ketchup':                  'الكاتشاب',
    'mayonnaise':               'المايونيز',
    'miso':                     'الميزو',
    'tamari':                   'التاماري',
    'sriracha':                 'السريراشا',
    'harissa':                  'الهريسة',
    'nuoc-mâm':                 'صلصة السمك',
    'bouillon':                 'المرق',
    'levure nutritionnelle':    'الخميرة الغذائية',
    'concentré de tomate':      'معجون الطماطم',

    // ─── Épices & Herbes ───
    'sel':                      'الملح',
    'poivre':                   'الفلفل الأسود',
    'cumin':                    'الكمون',
    'paprika':                  'الفلفل الحلو',
    'cannelle':                 'القرفة',
    'gingembre':                'الزنجبيل',
    'curry':                    'الكاري',
    'curcuma':                  'الكركم',
    'coriandre':                'الكزبرة',
    'persil':                   'المعدنوس',
    'basilic':                  'الحبق',
    'origan':                   'الزعتر الرومي',
    'thym':                     'الزعتر',
    'ras el hanout':            'رأس الحانوت',
    'garam masala':             'غارام ماسالا',
    'safran':                   'الزعفران',
    'menthe':                   'النعناع',
    'aneth':                    'الشبت',
    'estragon':                 'الطرخون',
    'laurier':                  'ورق الغار',
    'muscade':                  'جوزة الطيب',
    'cardamome':                'الهيل',
    'clou de girofle':          'القرنفل',
    'sumac':                    'السماق',
    'zaatar':                   'الزعتر',
    'chili':                    'الشيلي',
    'ciboulette':               'الثوم المعمر',
    'romarin':                  'إكليل الجبل',

    // ─── Graines, Noix & Fruits secs ───
    'amandes':                  'اللوز',
    'amande':                   'اللوز',
    'noix':                     'الجوز',
    'noix de cajou':            'الكاجو',
    'cacahuètes':               'الفول السوداني',
    'pistaches':                'الفستق',
    'noisettes':                'البندق',
    'sésame':                   'السمسم',
    'graines de chia':          'بذور الشيا',
    'graines de lin':           'بذور الكتان',
    'graines de tournesol':     'بذور عباد الشمس',
    'graines de courge':        'بذور القرعة',
    'raisins secs':             'الزبيب',
    'abricots secs':            'المشمش المجفف',
    'figues sèches':            'الكرماس المجفف',
    'cranberries':              'التوت البري المجفف',
    'noix de pécan':            'البقان',

    // ─── Boissons & Laits végétaux ───
    'lait d\'amande':           'حليب اللوز',
    'lait de coco':             'حليب جوز الهند',
    'lait de soja':             'حليب الصويا',
    'lait de riz':              'حليب الرز',
    'lait d\'avoine':           'حليب الشوفان',
    'lait végétal':             'الحليب النباتي',
    'jus d\'orange':            'عصير البرتقال',
    'eau de coco':              'ماء جوز الهند',
    'café':                     'القهوة',
    'thé':                      'الأتاي',
    'thé vert':                 'الأتاي الأخضر',
    'kombucha':                 'الكومبوتشا',

    // ─── Divers ───
    'protéine en poudre':       'البروتين البودرة',
    'whey':                     'الواي بروتين',
    'sirop':                    'الشراب',
    'cacao':                    'الكاكاو',
    'chocolat noir':            'الشوكولاتة الداكنة',
    'chocolat':                 'الشوكولاتة',
    'sucre':                    'السكر',
    'sucre roux':               'السكر الأحمر',
    'confiture':                'المربى',
    'bicarbonate':              'البيكاربونات',
    'levure chimique':          'الخميرة الكيميائية',
    'vanille':                  'الفانيليا',
    'arrow-root':               'نشا الكاساف'
  },

  // ── Méthode de traduction d'un nom d'ingrédient ──────────────
  translateIngredient: function(name) {
    if (!name) return name;
    var lower = name.toLowerCase().trim();
    var dict = window.SHOP_AR.ingredients;
    // Correspondance exacte
    if (dict[lower]) return dict[lower];
    // Correspondance partielle : cherche si une clé est contenue dans le nom
    var keys = Object.keys(dict);
    for (var i = 0; i < keys.length; i++) {
      if (lower.indexOf(keys[i]) !== -1) return dict[keys[i]];
    }
    // Aucune traduction : retourne le nom original
    return name;
  },

  // ── Traduction d'un rayon ────────────────────────────────────
  translateSection: function(sectionName) {
    return window.SHOP_AR.sections[sectionName] || sectionName;
  }
};

// ─── GLOBAL STATE ───
window.S = {
  // Routing
  view: 'auth', // 'auth','authRegister','dashboard','nutrition','sport'
  authError: '',
  // Nutrition wizard
  nStep: 0, sex: null, prenom: '', age: null, birthDate: null, weight: null, height: null,
  lang: 'fr', weightUnit: 'kg', heightUnit: 'cm',
  activity: null, train: [], sleep: null, medical: [], goal: null,
  cookLevel: 2, whey: null, wheyFlavors: [], allergies: [], intolerances: [],
  regime: 0, allowPork: false, allowAlcohol: false, excluded: '', cuisines: [0],
  shopFreq: null, shopStores: [], shopBudget: null, shopPrefs: [],
  shopChecked: {},   // { 'nom_ingrédient': true|false } — état cases à cocher liste de courses
  saladBar: {
    open: false,
    base: null,        // { name, qty, unit, k, p, g, l }
    proteins: [],      // array of { name, qty, unit, k, p, g, l }
    veggies: [],       // array of { name, qty, unit, k, p, g, l }
    fats: [],          // array of { name, qty, unit, k, p, g, l }
    sauce: null,       // { name, qty, unit, k, p, g, l }
    mealTarget: 'lunch' // 'lunch' | 'dinner'
  },
  weekPlan: null, selectedDay: 0, modalRecipe: null, showList: false, shopListOpen: false,
  smoothieBarOpen: false, modalSmoothie: null, _addMealModalSlot: null, _recipePicker: null,
  // Recettes favorites : map { _id: 1|2|3 } — étoiles = priorité dans generateWeek
  favoriteRecipes: {},
  // FIX VALIDATION WEEKPLAN 2026-04 : flags de validation utilisateur
  // Avant : weekPlan se régénérait tout seul à chaque boot / reload / changement
  //         de paramètre → user voyait son plan changer tout seul.
  // Maintenant : weekPlan figé jusqu'à revalidation explicite user.
  weekPlanValidated: false,
  weekPlanValidatedISOWeek: null,
  // FIX VALIDATION SPORTPROGRAM 2026-04 : même pattern pour le programme muscu
  // (le fix #4 ayant supprimé Math.random dans exerciseCountForPriority, la
  // régénération est déterministe — mais le flag sert à indiquer visuellement
  // que l'user a validé son programme et à empêcher des dérives futures).
  sportProgramValidated: false,
  sportProgramValidatedAt: null,
  // COACH ADAPTATIF 2026-04 (phase A) : feedback séances pour progression pilotée (ISSN/ACSM).
  // Structure : { 'YYYY-MM-DD': { sessionId, rpe, feeling, pain, chargeActual:{exo:kg}, reps:{exo:n}, notes } }
  // Remplie par le modal post-séance ; lue par le coach IA pour ajuster la semaine suivante.
  sessionFeedback: {},
  // Food habits
  mealsPerDay: 3, eatingLocation: null, mealPrepTime: null,
  snacking: null,
  wantsDessert: false,        // inclure des desserts healthy 2-3x/semaine dans le plan
  emailOptin: true,            // opt-in emails (anniversaire, rappels, etc.)
  pushNotifsEnabled: true,     // POLISH 2026-04 : opt-out PWA push notifications (défaut activé)
  mealTimes: { breakfast: '08:00', lunch: '12:30', snack: '16:00', dinner: '19:30' },
  restDayMood: null,           // { date: 'YYYY-MM-DD', emoji: string } — mood check-in jour de repos
  profilePhoto: null,          // base64 data URL (compressed JPEG)
  // Alcohol
  alcoholFreq: null, alcoholTypes: [],
  // Weight
  targetWeight: null, weightHistory: [],
  // Food habits extended
  hydration: null, bodyZones: {},
  // Photos
  photoFront: null, photoBack: null, strongZones: [], weakZones: [],
  // Sport
  sStep: 0, sportGoals: [], sportLevel: null, sportDays: 3, trainingDaysSelected: [],
  sportEquipment: 'gym', // 'gym' (salle complète), 'dumbbells' (haltères+banc), 'home' (poids du corps)
  trainTime: null, // 'morning' | 'noon' | 'evening' — heure d'entraînement pour nutrient timing
  sportSessionDuration: null, // '45min','1h','1h15','1h30'
  sportFocus: {}, sportProgram: null, selectedSportDay: 0,
  sportModalExercise: null,
  // Cross Training
  sportType: null, // 'musculation', 'crossfit', 'running', 'hyrox'
  crossfitLevel: null, // 'scaled', 'inter', 'rx'
  crossfitProgram: null, // generated daily program
  selectedCrossfitDay: 0,
  crossfitCycleWeek: 1,
  crossfitWeek: 1,
  // Cycle menstruel (femmes uniquement)
  cycleLength: 28,
  lastPeriodDate: null,
  cycleTracking: false,
  // Grossesse
  pregnant: false,
  pregnancyWeek: null,
  prePregnancyWeight: null,
  dueDate: null,
  // Supplémentation
  creatine: false,
  creatineDose: 0,
  supplements: [],
  // Musculation weight tracking
  musculationWeights: {},  // { exerciseName: { weight: Number, type: 'barre'|'haltere'|'machine'|'kb'|'bodyweight' } },
  muscuWeek: 1, muscuCycle: 1, muscuProgramStart: null, muscuProgramCount: 0, swapPanel: null, sportSplashDone: false,
  bonusExercises: {},  // { dayIndex: [{n,m,eq,sets,rest,_bonus:true}] }
  sessionHistory: {},  // { 'dayIndex_YYYY-MM-DD': { duration, kcalBase, kcalEpoc, kcalTotal } }
  sessionCompleting: false,  // dayIndex en cours de bilan, ou false
  _sessionDuration: null,    // durée saisie dans le panel bilan
  // CrossFit 100-day calendar
  cfCalendarOpen: false,  // true = vue calendrier 100 jours ouverte
  cfCurrentDay: 1,        // jour actuel de l'utilisateur dans le programme (1-100)
  cfProgress: {},         // { 1: { done: true, date: 'YYYY-MM-DD' }, ... }
  // CrossFit 1RM
  crossfit1RM: {},  // { 'clean': 80, 'snatch': 60, 'deadlift': 140, ... } in kg
  // Strength assessment profile
  muscuStrengthProfile: {},  // { 'bench_press': 60, 'squat': 80, 'deadlift': 100, ... }
  muscuZonesCibles: [],
  nutritionLog: {},
  aiCoachHistory: [],
  muscuSessionLog: {},
  // Structure : {
  //   'YYYY-MM-DD': {           // date de la séance
  //     'Développé couché': [   // nom exercice
  //       { set: 1, targetWeight: 60, targetReps: 10, actualWeight: 60, actualReps: 9 },
  //       { set: 2, targetWeight: 60, targetReps: 10, actualWeight: 62.5, actualReps: 8 },
  //     ]
  //   }
  // }
  muscuProgressionHistory: {},
  // Structure : {
  //   'Développé couché': [
  //     { week: 1, weight: 60, reps: 10, date: 'YYYY-MM-DD' },
  //     { week: 2, weight: 62.5, reps: 10, date: 'YYYY-MM-DD' },
  //   ]
  // }
  muscuMedical: {
    done: false,
    // Zones douloureuses (multi-select)
    shoulders: false,   // Épaules (coiffe des rotateurs, tendinite)
    elbows: false,      // Coudes (épicondylite, tendinite)
    wrists: false,      // Poignets
    neck: false,        // Nuque / cervicales
    upperBack: false,   // Haut du dos / thoracique
    lowerBack: false,   // Bas du dos (lombalgie, hernie discale)
    hips: false,        // Hanches (conflit fémoro-acétabulaire)
    knees: false,       // Genoux (tendinite rotulienne, ménisques)
    ankles: false,      // Chevilles
    // Antécédents graves
    herniaDisc: false,  // Hernie discale confirmée (IRM)
    herniaInguinal: false, // Hernie inguinale / abdominale
    rotatorCuff: false, // Déchirure coiffe des rotateurs (diagnostiquée)
    acl: false,         // LCA opéré ou fragilisé
    osteoporosis: false,// Ostéoporose
    hypertension: false,// HTA sévère (>160/100)
    rheumatoidArthritis: false, // Polyarthrite rhumatoïde (PR) — exercices doux en rémission, repos en poussée
    // Intensité douleur générale 0-3
    painLevel: 0,       // 0=aucune 1=légère 2=modérée 3=sévère
    // Notes libres
    notes: ''
  },
  // Running
  runningLevel: null,        // 'beginner','intermediate','advanced'
  runningGoal: null,         // '5k','10k','semi','marathon','trail'
  runningDays: 3,            // 3-6
  runningPace: null,         // current pace in min/km (e.g., '5:30')
  runningVO2max: null,       // estimated VO2max
  runningProgram: null,
  runningWeek: 1,
  selectedRunDay: 0,
  // Hyrox
  hyroxLevel: null,          // 'beginner','intermediate','advanced','pro'
  hyroxGoal: null,           // 'finish','sub90','sub75','sub60','podium'
  hyroxDays: 4,              // 3-6
  hyroxProgram: null,
  hyroxWeek: 1,
  selectedHyroxDay: 0,
  hyroxBenchmarks: {},        // {skiErg: time, sled_push: time, etc.}
  // Padel
  padelLevel: null, padelGoal: null, padelDays: 3, padelProgram: null, padelWeek: 1, selectedPadelDay: 0, padelProfile: {},
  // Golf
  golfLevel: null, golfGoal: null, golfDays: 3, golfProgram: null, golfWeek: 1, selectedGolfDay: 0, golfHandicap: null, golfProfile: {},
  // Triathlon / IRONMAN
  triathlonGoal: null, triathlonLevel: null, triathlonWeak: null,
  triathlonSwimPace: null, triathlonBikePace: null, triathlonRunPace: null,
  triathlonProgram: null, triathlonWeek: 1, selectedTriDay: 0,
  // Cardio metrics
  heartRateRest: null,       // FC repos en bpm (optionnel, défaut 65 si non renseigné)
  // Cycling
  cyclingLevel: null, cyclingGoal: null, cyclingDays: 3,
  cyclingType: null, cyclingFTP: null, cyclingSpeed: null, cyclingRelief: null,
  cyclingProgram: null, cyclingWeek: 1, selectedCyclingDay: 0,
  // Calisthenics
  calisthenicsLevel: null, calisthenicsGoal: null, calisthenicsdays: 3,
  calisthPullups: null, calisthPushups: null,
  calisthenicsProgram: null, calisthenicsWeek: 1, selectedCalisthDay: 0,
  // Yoga
  yogaLevel: null, yogaGoal: null, yogaDays: 3,
  yogaStyle: null, yogaDuration: null, yogaObjectif: null,
  yogaWeek: 1, yogaDay: 0,
  // Calisthenics onboarding
  calisthenicsOnboardingStep: null,
  // Séance Libre
  customSessionDraft:   null,  // brouillon en cours { id, title, blocks, view, startTime… }
  customSessionHistory: [],     // max 90 résumés de séances passées
  // ── Propriétés PROFILE_KEYS manquantes de l'init (ajout 2026-04) ──────────────────
  // Profil de base
  nom: null,                    // nom de famille
  phone: null,                  // numéro de téléphone
  // CrossFit extended
  crossfitCompGoal: null,       // objectif compétition crossfit
  crossfitOpenDate: null,       // date de l'Open crossfit
  cfHalteroCycleWeek: 1,        // semaine du cycle haltérophilie CF
  crossfitBenchmarks: {},       // benchmarks CrossFit { wod: time, ... }
  // Triathlon extended
  triathlonFTP: null,           // FTP cyclisme (W)
  triathlonRaceDate: null,      // date de la course cible
  // Calisthenics extended
  calisthenicsEquipment: null,  // équipement dispo (barre, anneaux, etc.)
  calisthDips: null,            // nb dips max
  calisthCurrentWeek: 1,        // semaine courante programme calisthénics
  // Sport program metadata
  _sportProgramVersion: null,   // version hash du programme sport généré
  competitionGoal: null,        // objectif de compétition (texte libre)
  competitionDate: null,        // date de la compétition cible
  competitionType: null,        // type de compétition
  sportHobbies: [],             // activités sportives secondaires
  installations: null,          // installations sportives disponibles
  // Nutrition plan metadata
  _weekPlanGeneratedAt: null,   // timestamp de génération du plan semaine
  saladBuilder: null,           // configuration salad builder sauvegardée
  // Wellness / tracking
  todayWellness: null,          // check-in bien-être du jour { date, score, ... }
  // App state
  appMode: null,                // mode actif de l'app ('nutrition','sport',...)
  stress: null,                 // niveau de stress déclaré (0-10 ou label)
  cfDeloadRecommended: false,   // déload CrossFit recommandé par le coach
  sessionPostponed: false,      // séance reportée au prochain jour
  // Anthropométrie
  waist: null,                  // tour de taille (cm)
  // Suivi alimentaire
  mealsLogged: null,            // repas loggés du jour (structure libre)
  // PAR-Q
  parqDone: false,              // questionnaire PAR-Q complété
  parqResult: null,             // résultat PAR-Q ('ok','consult',...)
  // Streaks & gamification
  streakFreezeUsedMonth: null,  // mois (YYYY-MM) du dernier streak freeze utilisé
  streakFreezeAvailable: 0,     // nombre de freeze disponibles
  swapCount: 0,                 // nombre de swaps repas effectués
  welcomeShown: false,          // écran de bienvenue déjà affiché
  firstLoginDate: null,         // date du premier login (YYYY-MM-DD)
  // Sport mix
  sportMixEnabled: false,       // mode sport mixte activé
  sportMixSecondary: null,      // sport secondaire en mode mixte
  // Body composition
  _bodyFatEstimate: null,       // estimation % masse grasse (calcul interne)
  _bodyCompositionProfile: null,// profil composition corporelle détaillé
  _bodyCompositionWeight: null, // poids de référence pour body composition
  bodyScanDone: false,          // body scan initial complété
  // Onboarding flags internes
  _parqNextStep: null,          // prochaine étape après PAR-Q
  _sportProfileDone: false,     // profil sport onboarding terminé
  _switchedFromSport: false,    // a basculé depuis le mode sport
  _switchedFromNutrition: false,// a basculé depuis le mode nutrition
  // Sync cloud
  _cloudUpdatedAt: null,        // timestamp dernière sync cloud (ISO)
  // Smart Calendar
  weeklyCalendar: null,         // calendrier hebdomadaire généré
  smartCalendarEnabled: false,  // calendrier intelligent activé
  smartCalendarDismissed: false,// bandeau smart calendar ignoré
  // Nutrition plan hash
  _planHash: null,              // hash des paramètres nutritionnels du plan
  // Programme muscu enrichi
  muscuObjectifSpecifique: null,// objectif muscu spécifique (texte)
  muscuRenforcementNote: null,  // note de renforcement musculaire
  muscuIAProgram: null,         // programme IA personnalisé (objet JSON)
  muscuIAProgramDate: null,     // date de génération du programme IA
  // Grossesse
  _prePregnancyGoal: null       // objectif pré-grossesse conservé
};

// ═══════════════════════════════════════════════════════════════
// SYSTÈME DE CONVERSION D'UNITÉS
// ═══════════════════════════════════════════════════════════════
window.UNITS = {
  weight: 'kg',   // 'kg' ou 'lbs'
  height: 'cm',   // 'cm' ou 'ft'

  // Facteurs de conversion
  KG_TO_LBS: 2.20462,
  LBS_TO_KG: 0.453592,
  CM_TO_INCH: 0.393701,
  INCH_TO_CM: 2.54,

  // Affichage poids
  displayWeight: function(kg) {
    if (!kg && kg !== 0) return '';
    if (window.UNITS.weight === 'lbs') {
      return Math.round(kg * window.UNITS.KG_TO_LBS * 10) / 10 + ' lbs';
    }
    return (Math.round(kg * 10) / 10) + ' kg';
  },

  // Affichage poids court (sans unité, pour inputs)
  displayWeightVal: function(kg) {
    if (!kg && kg !== 0) return '';
    if (window.UNITS.weight === 'lbs') {
      return Math.round(kg * window.UNITS.KG_TO_LBS * 10) / 10;
    }
    return Math.round(kg * 10) / 10;
  },

  // Convertir input → kg (pour stockage interne toujours en kg)
  toKg: function(val) {
    var n = parseFloat(val) || 0;
    if (window.UNITS.weight === 'lbs') return Math.round(n * window.UNITS.LBS_TO_KG * 10) / 10;
    return n;
  },

  // Affichage taille
  displayHeight: function(cm) {
    if (!cm && cm !== 0) return '';
    if (window.UNITS.height === 'ft') {
      var totalInches = cm * window.UNITS.CM_TO_INCH;
      var feet = Math.floor(totalInches / 12);
      var inches = Math.round(totalInches % 12);
      if (inches === 12) { feet++; inches = 0; }
      return feet + "'" + inches + '"';
    }
    return cm + ' cm';
  },

  // Affichage taille court pour input
  displayHeightVal: function(cm) {
    if (!cm && cm !== 0) return '';
    if (window.UNITS.height === 'ft') {
      var totalInches = cm * window.UNITS.CM_TO_INCH;
      return Math.round(totalInches * 10) / 10; // en pouces décimaux pour input
    }
    return cm;
  },

  // Convertir input taille → cm (stockage interne toujours en cm)
  toCm: function(val) {
    var n = parseFloat(val) || 0;
    if (window.UNITS.height === 'ft') return Math.round(n * window.UNITS.INCH_TO_CM * 10) / 10;
    return n;
  },

  // Label unité poids pour les inputs
  weightLabel: function() {
    return window.UNITS.weight === 'lbs' ? 'lbs' : 'kg';
  },

  // Label unité taille pour les inputs
  heightLabel: function() {
    return window.UNITS.height === 'ft' ? 'in (pouces)' : 'cm';
  },

  // Plages valides selon unité (pour validation input)
  weightRange: function() {
    return window.UNITS.weight === 'lbs'
      ? {min: 66, max: 660, step: 0.5}   // 30-300 kg en lbs
      : {min: 30, max: 300, step: 0.1};
  },

  heightRange: function() {
    return window.UNITS.height === 'ft'
      ? {min: 47, max: 98, step: 0.5}    // 120-250 cm en pouces
      : {min: 120, max: 250, step: 1};
  },

  // Changer d'unité poids
  setWeightUnit: function(unit) {
    window.UNITS.weight = unit;
    if (window.S) window.S.weightUnit = unit;
    // Persister via saveProfile (uid-versioned) plutôt que la clé générique
    if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
    if (window.render) window.render();
  },

  // Changer d'unité taille
  setHeightUnit: function(unit) {
    window.UNITS.height = unit;
    if (window.S) window.S.heightUnit = unit;
    // Persister via saveProfile (uid-versioned) plutôt que la clé générique
    if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
    if (window.render) window.render();
  }
};

// ─── MUSCULATION KEY EXERCISES (Strength Assessment) ───
// FIX Hermès : icônes sobres tonal-on-tonal.
var MUSCU_KEY_EXERCISES = [
  {key: 'bench_press',   name: 'Développé couché',   muscle: 'Poitrine', icon: '\u25A0', unit: 'kg', desc: 'Charge max pour 1 série de 8-10 reps'},
  {key: 'squat',         name: 'Squat',              muscle: 'Jambes',   icon: '\u25CF', unit: 'kg', desc: 'Charge max pour 1 série de 8-10 reps'},
  {key: 'deadlift',      name: 'Soulevé de terre',   muscle: 'Dos',      icon: '\u25A0', unit: 'kg', desc: 'Charge max pour 1 série de 8-10 reps'},
  {key: 'overhead_press',name: 'Développé militaire',muscle: 'Épaules',  icon: '\u25B2', unit: 'kg', desc: 'Charge max debout, 8-10 reps'},
  {key: 'barbell_row',   name: 'Rowing barre',       muscle: 'Dos',      icon: '\u25A0', unit: 'kg', desc: 'Charge pour 8-10 reps propres'},
  {key: 'barbell_curl',  name: 'Curl barre',         muscle: 'Biceps',   icon: '\u25C6', unit: 'kg', desc: 'Charge pour 10-12 reps'},
  {key: 'hip_thrust',    name: 'Hip Thrust',         muscle: 'Fessiers', icon: '\u25C7', unit: 'kg', desc: 'Charge pour 10-12 reps'},
  {key: 'leg_press',     name: 'Presse à cuisses',   muscle: 'Jambes',   icon: '\u25CF', unit: 'kg', desc: 'Charge totale pour 10-12 reps'}
];
window.MUSCU_KEY_EXERCISES = MUSCU_KEY_EXERCISES;

// ─── ESTIMATE WORKING WEIGHTS FROM STRENGTH PROFILE ───
function getMusculationWeight(exerciseName, sets, reps) {
  var s = window.S;
  var profile = s.muscuStrengthProfile || {};

  if (!exerciseName || typeof exerciseName !== 'string') return null;
  var exerciseLower = exerciseName.toLowerCase();
  var baseWeight = null;
  var ratio = 1.0;

  // Chest exercises: based on bench press
  if (/développé couché|bench|développé.*haltère|écarté|chest press/i.test(exerciseLower)) {
    baseWeight = profile.bench_press;
    if (/haltère|dumbbell/i.test(exerciseLower)) ratio = 0.4;
    else if (/incliné/i.test(exerciseLower)) ratio = 0.85;
    else if (/écarté/i.test(exerciseLower)) ratio = 0.3;
  }
  // Back exercises: based on deadlift/row
  else if (/rowing|tirage|pull/i.test(exerciseLower)) {
    baseWeight = profile.barbell_row || (profile.deadlift ? profile.deadlift * 0.6 : null);
    if (/haltère/i.test(exerciseLower)) ratio = 0.5;
    else if (/vertical|lat/i.test(exerciseLower)) ratio = 0.8;
  }
  else if (/soulevé|deadlift/i.test(exerciseLower)) {
    baseWeight = profile.deadlift;
    if (/roumain|romanian/i.test(exerciseLower)) ratio = 0.7;
  }
  // Shoulder exercises: based on overhead press
  else if (/militaire|overhead|épaule|latéral|press.*épaule/i.test(exerciseLower)) {
    baseWeight = profile.overhead_press;
    if (/latéral|élévation/i.test(exerciseLower)) ratio = 0.25;
    else if (/arnold/i.test(exerciseLower)) ratio = 0.7;
  }
  // Leg exercises: based on squat
  else if (/squat|fente|lunge|presse|leg/i.test(exerciseLower)) {
    baseWeight = profile.squat;
    if (/presse/i.test(exerciseLower)) { baseWeight = profile.leg_press || (profile.squat ? profile.squat * 2.5 : null); ratio = 1; }
    else if (/fente|lunge|bulgare/i.test(exerciseLower)) ratio = 0.5;
    else if (/extension|curl.*jambe/i.test(exerciseLower)) ratio = 0.4;
  }
  // Biceps: based on curl
  else if (/curl|biceps/i.test(exerciseLower)) {
    baseWeight = profile.barbell_curl;
    if (/haltère|marteau|concentré/i.test(exerciseLower)) ratio = 0.5;
  }
  // Glutes: based on hip thrust
  else if (/hip.*thrust|fessier|glute/i.test(exerciseLower)) {
    baseWeight = profile.hip_thrust;
    if (/kick|abduction/i.test(exerciseLower)) ratio = 0.2;
  }

  if (!baseWeight) return null;

  // Adjust for rep range (higher reps = lower weight)
  var repStr = reps || '8-12';
  var targetReps = parseInt(repStr) || 10;
  var repFactor = 1.0;
  if (targetReps <= 5) repFactor = 1.15;
  else if (targetReps <= 8) repFactor = 1.0;
  else if (targetReps <= 12) repFactor = 0.85;
  else repFactor = 0.7;

  // Adjust for level
  var levelFactor = s.sportLevel === 'beginner' ? 0.7 : s.sportLevel === 'advanced' ? 1.1 : 1.0;

  var suggested = Math.round(baseWeight * ratio * repFactor * levelFactor / 2.5) * 2.5;
  return Math.max(suggested, 0);
}
window.getMusculationWeight = getMusculationWeight;

// ─── SETS/REPS/REST GENERATOR (NSCA, Schoenfeld 2017) ───
function generateExerciseSets(exercise, userWeight, sportGoals, sportLevel, week, muscuStrengthProfile) {
  var style = 'hypertrophy';
  if (sportGoals && sportGoals.indexOf('shred') !== -1) style = 'shred';
  else if (sportGoals && sportGoals.indexOf('muscle') !== -1) style = 'hypertrophy';
  else if (sportGoals && sportGoals.indexOf('endurance') !== -1) style = 'endurance';
  var baseWeight = 0;
  if (window.getMusculationWeight) {
    baseWeight = getMusculationWeight(exercise.n || exercise, null, null) || 0;
  }
  var schemes = {
    strength: {sets:[{reps:5,pct:0.85,rest:'3min'},{reps:5,pct:0.85,rest:'3min'},{reps:3,pct:0.90,rest:'4min'},{reps:3,pct:0.90,rest:'4min'},{reps:1,pct:0.95,rest:'5min'}],inc:2.5,note:'Force pure — repos complets entre les séries'},
    hypertrophy: {sets:[{reps:12,pct:0.65,rest:'90s'},{reps:10,pct:0.70,rest:'90s'},{reps:8,pct:0.75,rest:'90s'},{reps:8,pct:0.75,rest:'2min'}],inc:1.25,note:'Hypertrophie — contrôlez la descente (3s excentrique)'},
    endurance: {sets:[{reps:15,pct:0.55,rest:'45s'},{reps:15,pct:0.55,rest:'45s'},{reps:12,pct:0.60,rest:'45s'},{reps:12,pct:0.60,rest:'30s'}],inc:1.0,note:'Endurance — enchaînez, gardez la tension'},
    shred: {sets:[{reps:15,pct:0.50,rest:'30s'},{reps:12,pct:0.55,rest:'30s'},{reps:12,pct:0.55,rest:'30s'},{reps:10,pct:0.60,rest:'45s'}],inc:0,note:'Sèche — tempo rapide, volume max, repos min.'}
  };
  var scheme = schemes[style] || schemes.hypertrophy;
  var weekBonus = ((week || 1) - 1) * scheme.inc;
  var levelMult = sportLevel === 'beginner' ? 0.7 : sportLevel === 'intermediate' ? 0.85 : 1.0;
  var setsToUse = sportLevel === 'beginner' ? scheme.sets.slice(0, 3) : scheme.sets;
  var isBodyweight = !exercise.eq || /poids|aucun|bodyweight/i.test(exercise.eq);
  return {
    style: style, totalSets: setsToUse.length,
    sets: setsToUse.map(function(set, idx) {
      var w = 0;
      if (!isBodyweight) {
        if (baseWeight > 0) {
          w = Math.round((baseWeight * set.pct * levelMult + weekBonus) / 2.5) * 2.5;
          w = Math.max(w, 5);
        } else {
          // CS-01: Fallback si profil de force non renseigné — charge estimée par poids de corps + niveau
          var bw = (window.S && window.S.weight) || 75;
          var bwPct = sportLevel === 'beginner' ? 0.3 : sportLevel === 'intermediate' ? 0.5 : 0.7;
          w = Math.round((bw * bwPct * set.pct) / 2.5) * 2.5;
          w = Math.max(w, 5);
        }
      }
      return {setNumber: idx + 1, reps: set.reps, weight: w, rest: set.rest, isBodyweight: isBodyweight, isEstimated: !isBodyweight && baseWeight === 0};
    }),
    note: scheme.note, weeklyIncrement: scheme.inc, week: week || 1, hasEstimatedWeights: !isBodyweight && baseWeight === 0
  };
}
window.generateExerciseSets = generateExerciseSets;

// ─── CYCLE MENSTRUEL ───
var CYCLE_PHASES = [
  {
    id: 'menstruation',
    name: 'Menstruation',
    icon: '\uD83D\uDD34',
    days: [1, 5],
    desc: 'Phase de r\u00e8gles \u2014 \u00c9nergie basse, privil\u00e9gier le repos actif',
    nutritionTips: [
      'Augmenter le fer (viande rouge, \u00e9pinards, lentilles)',
      'Magn\u00e9sium (chocolat noir, bananes, amandes)',
      'Om\u00e9ga-3 anti-inflammatoires (poisson gras, noix)',
      'Hydratation renforc\u00e9e (+0.5L/jour)',
      '\u00c9viter exc\u00e8s de sel (r\u00e9tention d\'eau)'
    ],
    sportTips: [
      'Privil\u00e9gier yoga, marche, stretching',
      'R\u00e9duire l\'intensit\u00e9 de 30-40%',
      '\u00c9couter son corps, ne pas forcer',
      'Exercices doux de mobilit\u00e9'
    ],
    calorieAdjust: 0,
    macroAdjust: null,
    intensityFactor: 0.6
  },
  {
    id: 'follicular',
    name: 'Phase folliculaire',
    icon: '\uD83D\uDFE1',
    days: [6, 13],
    desc: '\u00c9nergie montante \u2014 P\u00e9riode id\u00e9ale pour progresser',
    nutritionTips: [
      'P\u00e9riode optimale pour les glucides complexes',
      'Prot\u00e9ines pour la r\u00e9cup\u00e9ration musculaire',
      'Augmenter l\u00e9g\u00e8rement les calories (+5%)',
      'Favoriser les aliments riches en vitamine B'
    ],
    sportTips: [
      'Meilleure phase pour la force et l\'intensit\u00e9',
      'Id\u00e9al pour battre des records personnels',
      'Entra\u00eenement haute intensit\u00e9 recommand\u00e9',
      'Augmenter charges et volume'
    ],
    calorieAdjust: 0.05,
    macroAdjust: {g: 0.03, p: 0, l: -0.03},
    intensityFactor: 1.1
  },
  {
    id: 'ovulation',
    name: 'Ovulation',
    icon: '\uD83D\uDFE2',
    days: [14, 16],
    desc: 'Pic d\'\u00e9nergie \u2014 Performance maximale',
    nutritionTips: [
      'Pic d\'\u00e9nergie : profitez-en !',
      'Apport prot\u00e9ique optimal',
      'Hydratation importante',
      'Antioxydants (fruits rouges, l\u00e9gumes color\u00e9s)'
    ],
    sportTips: [
      'Phase de performance maximale',
      'HIIT, sprint, charges lourdes',
      'Attention aux articulations (laxit\u00e9 ligamentaire)',
      '\u00c9chauffement soign\u00e9 obligatoire'
    ],
    calorieAdjust: 0.05,
    macroAdjust: {g: 0.02, p: 0.02, l: -0.04},
    intensityFactor: 1.2
  },
  {
    id: 'luteal',
    name: 'Phase lut\u00e9ale',
    icon: '\uD83D\uDFE0',
    days: [17, 28],
    desc: '\u00c9nergie descendante \u2014 Adapter et r\u00e9cup\u00e9rer',
    nutritionTips: [
      'Augmenter les calories (+10%) \u2014 m\u00e9tabolisme acc\u00e9l\u00e9r\u00e9',
      'Plus de lipides sains pour l\'\u00e9quilibre hormonal',
      'Magn\u00e9sium et vitamine B6 contre le SPM',
      'R\u00e9duire caf\u00e9ine et sucres raffin\u00e9s',
      'Aliments riches en tryptophane (dinde, banane) pour le moral'
    ],
    sportTips: [
      'R\u00e9duire l\'intensit\u00e9 progressivement',
      'Privil\u00e9gier endurance douce, natation, yoga',
      '\u00c9viter les exercices \u00e0 impact \u00e9lev\u00e9 en fin de phase',
      'S\u00e9ances plus courtes mais r\u00e9guli\u00e8res'
    ],
    calorieAdjust: 0.10,
    macroAdjust: {g: -0.05, p: 0.02, l: 0.03},
    intensityFactor: 0.8
  }
];
window.CYCLE_PHASES = CYCLE_PHASES;

function getCurrentCyclePhase() {
  var s = window.S;
  if (!s.cycleTracking || !s.lastPeriodDate || !window.isFemale(s)) return null;

  var start = new Date(s.lastPeriodDate);
  if(isNaN(start.getTime())) return null; // Date invalide → ne pas propager NaN
  var now = new Date();
  var diffDays = Math.floor((now - start) / 86400000);
  var cycleLen = s.cycleLength || 28;
  var dayInCycle = ((diffDays % cycleLen) + cycleLen) % cycleLen + 1;

  for (var i = 0; i < CYCLE_PHASES.length; i++) {
    var phase = CYCLE_PHASES[i];
    var phaseStart = Math.round(phase.days[0] * cycleLen / 28);
    var phaseEnd = Math.round(phase.days[1] * cycleLen / 28);
    if (dayInCycle >= phaseStart && dayInCycle <= phaseEnd) {
      return {
        phase: phase,
        dayInCycle: dayInCycle,
        dayInPhase: dayInCycle - phaseStart + 1,
        daysLeftInPhase: phaseEnd - dayInCycle,
        nextPhase: CYCLE_PHASES[(i + 1) % CYCLE_PHASES.length]
      };
    }
  }
  return { phase: CYCLE_PHASES[3], dayInCycle: dayInCycle, dayInPhase: 1, daysLeftInPhase: 0, nextPhase: CYCLE_PHASES[0] };
}
window.getCurrentCyclePhase = getCurrentCyclePhase;

// ─── GROSSESSE ───
var PREGNANCY_TRIMESTERS = [
  {
    id: 'trimester1',
    name: '1er Trimestre',
    icon: '\uD83E\uDD30',
    weeks: [1, 13],
    desc: 'Mise en place \u2014 Naus\u00e9es possibles, fatigue',
    calorieExtra: 0,
    proteinExtra: 0,
    weightGainRange: [0.5, 2.0],
    nutritionTips: [
      'Acide folique : 400-800 \u00b5g/jour (pr\u00e9vention spina bifida) \u2014 commencer d\u00e8s le projet de grossesse',
      'Fer : 27 mg/jour (doublement du volume sanguin)',
      'Pas de calories suppl\u00e9mentaires n\u00e9cessaires au 1er trimestre',
      'Fractionner les repas en 5-6 petites prises (anti-naus\u00e9es)',
      '\u00c9viter : alcool, tabac, poisson cru, fromage au lait cru, charcuterie',
      'Gingembre et citron contre les naus\u00e9es',
      'Hydratation : 2.3L/jour minimum'
    ],
    sportTips: [
      'Activit\u00e9 physique mod\u00e9r\u00e9e recommand\u00e9e (ACOG 2020)',
      'Marche, natation, yoga pr\u00e9natal',
      '\u00c9viter : sports de contact, plong\u00e9e, altitude > 2500m',
      'Arr\u00eater si : saignements, vertiges, douleurs, contractions',
      'Intensit\u00e9 : pouvoir tenir une conversation',
      '150 min/semaine d\'activit\u00e9 mod\u00e9r\u00e9e (OMS)'
    ],
    intensityFactor: 0.6,
    forbiddenExercises: ['burpees', 'jumping jacks', 'box jumps', 'abdominaux classiques', 'soulev\u00e9 de terre lourd']
  },
  {
    id: 'trimester2',
    name: '2\u00e8me Trimestre',
    icon: '\uD83E\uDD30',
    weeks: [14, 27],
    desc: '\u00c9nergie retrouv\u00e9e \u2014 P\u00e9riode la plus confortable',
    calorieExtra: 340,
    proteinExtra: 25,
    weightGainRange: [4.0, 6.5],
    nutritionTips: [
      '+340 kcal/jour par rapport aux besoins pr\u00e9-grossesse (ACOG)',
      '+25g de prot\u00e9ines/jour (total : 1.1g/kg)',
      'Calcium : 1000 mg/jour (d\u00e9veloppement osseux du b\u00e9b\u00e9)',
      'Vitamine D : 600-1000 UI/jour',
      'DHA (om\u00e9ga-3) : 200-300 mg/jour (d\u00e9veloppement c\u00e9r\u00e9bral)',
      'Fer : 27 mg/jour \u2014 associer \u00e0 la vitamine C',
      'Fibres et hydratation contre la constipation'
    ],
    sportTips: [
      'P\u00e9riode id\u00e9ale pour l\'activit\u00e9 physique',
      'Natation (excellent : porte le poids), marche, v\u00e9lo d\'appartement',
      'Yoga pr\u00e9natal, Pilates adapt\u00e9',
      '\u00c9viter la position allong\u00e9e sur le dos apr\u00e8s 20 SA',
      'Exercices du plancher pelvien (Kegel) quotidiens',
      'Renforcement musculaire l\u00e9ger (pas de charges lourdes)'
    ],
    intensityFactor: 0.65,
    forbiddenExercises: ['crunch', 'relev\u00e9 de jambes allong\u00e9', 'burpees', 'jumping jacks', 'sprint', 'HIIT intense']
  },
  {
    id: 'trimester3',
    name: '3\u00e8me Trimestre',
    icon: '\uD83E\uDD31',
    weeks: [28, 42],
    desc: 'Derni\u00e8re ligne droite \u2014 Repos et pr\u00e9paration',
    calorieExtra: 450,
    proteinExtra: 25,
    weightGainRange: [4.0, 6.0],
    nutritionTips: [
      '+450 kcal/jour par rapport aux besoins pr\u00e9-grossesse (ACOG)',
      'Maintenir prot\u00e9ines \u00e9lev\u00e9es (1.1g/kg + 25g)',
      'Fer : risque accru d\'an\u00e9mie \u2014 contr\u00f4le sanguin',
      'Magn\u00e9sium : 350-400 mg/jour (crampes, contractions)',
      'Om\u00e9ga-3 DHA : maintenir 200-300 mg/jour',
      'Petits repas fr\u00e9quents (estomac compress\u00e9)',
      'Limiter le sel si \u0153d\u00e8mes'
    ],
    sportTips: [
      'R\u00e9duire l\'intensit\u00e9 progressivement',
      'Marche douce, natation, aquagym pr\u00e9natale',
      'Exercices de respiration et relaxation',
      'Plancher pelvien : essentiel pour l\'accouchement',
      '\u00c9tirements doux quotidiens',
      '\u00c9couter son corps \u2014 s\'arr\u00eater si fatigue'
    ],
    intensityFactor: 0.4,
    forbiddenExercises: ['tout exercice \u00e0 impact', 'position allong\u00e9e sur le dos', 'charges', 'cardio intense', 'exercices d\'\u00e9quilibre']
  }
];
window.PREGNANCY_TRIMESTERS = PREGNANCY_TRIMESTERS;

var PREGNANCY_WEIGHT_GAIN = [
  { bmiRange: [0, 18.5], category: 'Insuffisant', totalGainMin: 12.5, totalGainMax: 18.0, weeklyGainT2T3: [0.44, 0.58] },
  { bmiRange: [18.5, 25], category: 'Normal', totalGainMin: 11.5, totalGainMax: 16.0, weeklyGainT2T3: [0.35, 0.50] },
  { bmiRange: [25, 30], category: 'Surpoids', totalGainMin: 7.0, totalGainMax: 11.5, weeklyGainT2T3: [0.23, 0.33] },
  { bmiRange: [30, 100], category: 'Ob\u00e9sit\u00e9', totalGainMin: 5.0, totalGainMax: 9.0, weeklyGainT2T3: [0.17, 0.27] }
];
window.PREGNANCY_WEIGHT_GAIN = PREGNANCY_WEIGHT_GAIN;

// ── INVARIANT GLOBAL GROSSESSE ──────────────────────────────────────────────
// Garantit que pregnant=true implique sex='femme'. Appelée après toute mutation
// de S.pregnant ou S.sex pour empêcher toute incohérence (données corrompues,
// toggle médical sans gate, etc.)
function validatePregnancyState() {
  var s = window.S;
  if (!s) return;
  if (s.pregnant && !window.isFemale(s)) {
    s.pregnant = false;
    s.pregnancyWeek = null;
    s.prePregnancyWeight = null;
    s.dueDate = null;
  }
}
window.validatePregnancyState = validatePregnancyState;

// ── PREMIUM / TRIAL SYSTEM ──────────────────────────────────────────────────
// Single source of truth for subscription state.
// Priority chain (highest → lowest):
//   1. S._serverPremium === true  → server confirmed premium (boolean from user-status API)
//   2. S._serverPremium === false → server confirmed NOT premium
//   3. S.subscriptionPlan in PREMIUM_PLANS → plan name recognised as paid
//   4. S.subscriptionEnd > now → active dated subscription
//   5. Trial window (firstLoginDate + 7d)
//   6. Loading guard — if _subStatusReady not set, never flash trial UI
// Sync avec SFCConstants (source de vérité unique) — fallback liste locale si module non chargé
var _SFC_PREMIUM_PLANS = (
  typeof window !== 'undefined' && window.SFCConstants && Array.isArray(window.SFCConstants.PREMIUM_PLANS)
    ? window.SFCConstants.PREMIUM_PLANS
    : ['unlimited','lifetime','premium','legend','champion','athlete','admin','paid']
);
function _isPremiumPlan(plan) {
  return !!plan && _SFC_PREMIUM_PLANS.indexOf(plan) !== -1;
}
function isPremium() {
  try {
    var s = window.S;
    if (!s) return false;
    // 1. Server-confirmed boolean is authoritative
    if (s._serverPremium === true) return true;
    if (s._serverPremium === false && s._subStatusReady) return false;
    // 2. Loading guard — subscriptionPlan / subscriptionEnd come from the server response;
    //    reading them before _subStatusReady risks granting access based on stale/injected
    //    localStorage values that haven't been validated by the server yet. SEC-06 fix.
    if (!s._subStatusReady) return false;
    // 3. Recognised premium plan name (unlimited / lifetime / etc. with null end date)
    if (_isPremiumPlan(s.subscriptionPlan)) return true;
    // 4. Active dated subscription
    if (s.subscriptionEnd && new Date(s.subscriptionEnd) > new Date()) return true;
    // 5. Active trial window — expiry at local midnight end-of-day 7 (P3 timezone fix)
    if (s.firstLoginDate) {
      var trialEnd = new Date(s.firstLoginDate);
      trialEnd.setUTCDate(trialEnd.getUTCDate() + 7);
      trialEnd.setUTCHours(23, 59, 59, 999); // C9 fix: fin de journée UTC — aligné serveur (user-status.js + _user-auth.js)
      if (trialEnd > new Date()) return true;
    }
    // 6. No firstLoginDate after status confirmed → corrupted profile, deny
    if (!s.firstLoginDate) return false;
    return false;
  } catch(e) { return false; } // fail-closed: any JS error must not grant premium access
}
// Returns 0 when premium or loading; returns trial days when genuinely in trial
function getTrialDaysLeft() {
  try {
    var s = window.S;
    if (!s) return 0;
    if (s._serverPremium === true) return 0;
    if (_isPremiumPlan(s.subscriptionPlan)) return 0;
    if (s.subscriptionEnd && new Date(s.subscriptionEnd) > new Date()) return 0;
    if (!s._subStatusReady) return 0; // loading — never show countdown
    if (!s.firstLoginDate) return 7;  // confirmed status, no date = new user
    var trialEnd = new Date(s.firstLoginDate);
    trialEnd.setUTCDate(trialEnd.getUTCDate() + 7);
    trialEnd.setUTCHours(23, 59, 59, 999); // C9 fix: fin de journée UTC — aligné serveur
    return Math.max(0, Math.ceil((trialEnd - new Date()) / 86400000));
  } catch(e) { return 0; }
}
// Returns true ONLY when server has confirmed the user is NOT premium.
// Never returns true while loading or for any recognised premium plan.
function isTrialUser() {
  try {
    var s = window.S;
    if (!s) return false;
    if (!s._subStatusReady) return false;          // loading guard
    if (s._serverPremium === true) return false;   // server says premium
    if (_isPremiumPlan(s.subscriptionPlan)) return false;
    if (s.subscriptionEnd && new Date(s.subscriptionEnd) > new Date()) return false;
    return true;
  } catch(e) { return false; }
}
// Pricing cache — chargé en lazy depuis l'API get-pricing
window.SFC_PRICING_DATA = window.SFC_PRICING_DATA || null;
window._sfcPricingPromise = null;
window._sfcPricingAttempted = false; // FIX 2026-04-24 : évite boucle infinie de fetches si API retourne []
function loadSFCPricing() {
  if (window.SFC_PRICING_DATA) return Promise.resolve(window.SFC_PRICING_DATA);
  if (window._sfcPricingAttempted) return Promise.resolve(null); // déjà tenté — ne pas refetch
  if (window._sfcPricingPromise) return window._sfcPricingPromise;
  var _ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  var _timeout = setTimeout(function() { if (_ctrl) _ctrl.abort(); }, 5000);
  window._sfcPricingPromise = fetch('/.netlify/functions/get-pricing', _ctrl ? { signal: _ctrl.signal } : {})
    .then(function(r) { clearTimeout(_timeout); return r.json(); })
    .then(function(json) {
      window._sfcPricingAttempted = true;
      if (json && json.ok && Array.isArray(json.data) && json.data.length > 0)
        window.SFC_PRICING_DATA = json.data;
      window._sfcPricingPromise = null;
      return window.SFC_PRICING_DATA;
    })
    .catch(function() {
      clearTimeout(_timeout);
      window._sfcPricingAttempted = true;
      window._sfcPricingPromise = null;
      return null;
    });
  return window._sfcPricingPromise;
}
window.loadSFCPricing = loadSFCPricing;
// Pré-charger les prix dès le démarrage de l'app
loadSFCPricing();

// Paywall modal — affiche un message d'upgrade pour les features premium
function showPaywall(feature) {
  var featureNames = {
    scanner: 'Scanner de repas IA',
    pdf: 'Export PDF',
    coach: 'Coach IA illimité',
    'ai-coach': 'Coach IA',
    history: 'Historique de progression',
    body: 'Analyse corporelle IA',
    'body-analysis': 'Analyse corporelle IA',
    'muscu-program': 'Générateur de programme IA'
  };
  var name = featureNames[feature] || 'Cette fonctionnalité';
  var old = document.getElementById('sfc-paywall-modal');
  if (old && old.parentNode) old.parentNode.removeChild(old);
  if (window.TRACKER) window.TRACKER.track('paywall_hit', { feature: feature });
  var h = window.h;
  if (!h) { if (window.showToast) window.showToast(name + ' est r\u00e9serv\u00e9e aux abonn\u00e9s', 'error', 3500); return; }
  var ov = document.createElement('div');
  ov.id = 'sfc-paywall-modal';
  ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(10,10,9,0.55);z-index:9500;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.25s ease;';
  var box = document.createElement('div');
  box.style.cssText = 'background:var(--ivory,#FAF9F6);max-width:380px;width:90%;padding:28px 24px;border-radius:2px;text-align:center;';
  var _safeName = name.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  box.innerHTML = '<div style="font-size:28px;margin-bottom:12px;">\u2B50</div>' +
    '<div style="font-family:Georgia,serif;font-size:20px;margin-bottom:8px;">Passez \u00e0 Premium</div>' +
    '<div style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:12px;color:#6B6B65;line-height:1.6;margin-bottom:20px;">' +
    '<strong>' + _safeName + '</strong> est r\u00e9serv\u00e9(e) aux abonn\u00e9s SmartFitCoach Premium. D\u00e9bloquez toutes les fonctionnalit\u00e9s avanc\u00e9es pour atteindre vos objectifs.</div>' +
    '<div style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;color:#6B6B65;margin-bottom:12px;">' +
    'Scanner repas IA \u00b7 Coach IA illimit\u00e9 \u00b7 Export PDF \u00b7 Historique \u00b7 Analyse corporelle</div>' +
    '<div style="font-family:Georgia,serif;font-size:22px;color:#0A0A09;margin-bottom:4px;">' + (function() {
    var _d = window.SFC_PRICING_DATA;
    if (_d && _d.length) {
      for (var _pi = 0; _pi < _d.length; _pi++) {
        if (_d[_pi].tier === 'athlete' && _d[_pi].duration === 'saison')
          return 'À partir de ' + (_d[_pi].label_mad || '249 MAD') + '/trimestre';
      }
    }
    return window.SFC_PREMIUM_PRICE || 'À partir de 249 MAD/trimestre';
  })() + '</div>' +
    '<div style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:10px;color:#6B6B65;letter-spacing:1px;margin-bottom:20px;">SANS ENGAGEMENT \u00b7 R\u00c9SILIABLE \u00c0 TOUT MOMENT</div>';
  var dismiss = function() { ov.style.opacity = '0'; setTimeout(function() { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 250); };
  var upgradeBtn = document.createElement('button');
  upgradeBtn.style.cssText = 'width:100%;padding:14px;margin-bottom:8px;background:var(--black,#0A0A09);border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#fff;cursor:pointer;min-height:44px;letter-spacing:1px;';
  upgradeBtn.textContent = 'Découvrir Premium →';
  upgradeBtn.onclick = function() {
    dismiss();
    if (window.SupaSync) { try { window.SupaSync._userStatusCacheTs = 0; } catch(_e) {} }
    if (window.S && window.render) { window.S.view = 'profil'; window.render(); }
  };
  var closeBtn = document.createElement('button');
  closeBtn.style.cssText = 'width:100%;padding:14px;background:transparent;border:1px solid #D8D8D0;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#6B6B65;cursor:pointer;min-height:44px;';
  closeBtn.textContent = 'Fermer';
  closeBtn.onclick = dismiss;
  box.appendChild(upgradeBtn);
  box.appendChild(closeBtn);
  ov.appendChild(box);
  ov.onclick = function(e) { if (e.target === ov) dismiss(); };
  document.body.appendChild(ov);
  requestAnimationFrame(function() { ov.style.opacity = '1'; });
}
window.isPremium = isPremium;
window.getTrialDaysLeft = getTrialDaysLeft;
window.isTrialUser = isTrialUser;
window.showPaywall = showPaywall;

function isValidPassword(pw) {
  if (!pw || typeof pw !== 'string') return false;
  if (pw.length < 6) return false;
  if (!/[A-Z]/.test(pw)) return false;
  if (!/[0-9]/.test(pw)) return false;
  if (!/[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(pw)) return false;
  return true;
}
window.isValidPassword = isValidPassword;

// Modale de contact abonnement — email smartfitcoach@proton.me
function showSubscriptionContact(plan, ui) {
  var old = document.getElementById('sfc-contact-modal');
  if (old && old.parentNode) old.parentNode.removeChild(old);

  var EMAIL = 'smartfitcoach@proton.me';
  var SUBJECT = encodeURIComponent('Demande d\'accès — SmartFitCoach');
  var BODY = encodeURIComponent(
    'Bonjour,\n\n' +
    'Je souhaite en savoir davantage sur SmartFitCoach et ses formules d\'abonnement.\n\n' +
    'Pourriez-vous m\'adresser les informations nécessaires ?\n\n' +
    '[Votre prénom]'
  );
  var mailto = 'mailto:' + EMAIL + '?subject=' + SUBJECT + '&body=' + BODY;

  // Plan info line
  var _durPer = { saison: '/trimestre', cycle: '/semestre', engagement: '/an' };
  var planLine = '';
  if (plan && ui) {
    var _tierLabels = { athlete: 'Athlete', champion: 'Champion', legende: 'Légende' };
    planLine = (_tierLabels[ui.tier] || ui.tier) + ' · ' + (plan.label_mad || '') + (_durPer[ui.duration] || '');
  }

  var ov = document.createElement('div');
  ov.id = 'sfc-contact-modal';
  ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(10,10,9,0.6);z-index:9500;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s ease;';

  var box = document.createElement('div');
  box.style.cssText = 'background:var(--ivory,#FAF9F6);max-width:400px;width:92%;padding:36px 28px 28px;position:relative;border-radius:0;box-sizing:border-box;';

  // Filet + titre
  var _headerLine = document.createElement('div');
  _headerLine.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:20px;';
  var _l1 = document.createElement('span'); _l1.style.cssText = 'flex:1;height:1px;background:var(--border,#D8D8D0);';
  var _titleSpan = document.createElement('span');
  _titleSpan.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);white-space:nowrap;';
  _titleSpan.textContent = 'VOTRE ACCÈS SUR MESURE';
  var _l2 = document.createElement('span'); _l2.style.cssText = 'flex:1;height:1px;background:var(--border,#D8D8D0);';
  _headerLine.appendChild(_l1); _headerLine.appendChild(_titleSpan); _headerLine.appendChild(_l2);
  box.appendChild(_headerLine);

  // Titre Georgia
  var _h = document.createElement('div');
  _h.style.cssText = 'font-family:Georgia,serif;font-size:22px;color:var(--black,#0A0A09);margin-bottom:6px;font-weight:normal;line-height:1.3;';
  _h.innerHTML = 'Une exp&eacute;rience con&ccedil;ue<br>pour quelques-uns.';
  box.appendChild(_h);

  // Plan sélectionné
  if (planLine) {
    var _selLabel = document.createElement('div');
    _selLabel.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:6px;margin-top:12px;';
    _selLabel.textContent = 'VOTRE SÉLECTION';
    box.appendChild(_selLabel);
    var _planTag = document.createElement('div');
    _planTag.style.cssText = 'display:inline-block;border:1px solid var(--black,#0A0A09);font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;padding:3px 8px;margin:12px 0 16px;color:var(--black,#0A0A09);';
    _planTag.textContent = planLine;
    box.appendChild(_planTag);
  }

  // Corps
  var _body = document.createElement('div');
  _body.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);line-height:1.8;margin-bottom:24px;';
  _body.textContent = 'L\'accès à SmartFitCoach se fait par invitation personnalisée. Écrivez-nous, et nous vous répondrons dans les meilleurs délais avec l\'ensemble des détails : formules, tarifs et modalités d\'accès. Chaque demande reçoit notre attention complète.';
  box.appendChild(_body);

  // Bouton principal — mailto
  var _mailBtn = document.createElement('a');
  _mailBtn.href = mailto;
  _mailBtn.style.cssText = 'display:block;width:100%;padding:16px;margin-bottom:10px;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);text-align:center;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:4px;text-transform:uppercase;text-decoration:none;box-sizing:border-box;cursor:pointer;border-radius:0;';
  _mailBtn.textContent = 'Écrire à l\'équipe';
  box.appendChild(_mailBtn);

  // Bouton secondaire — fermer
  var dismiss = function() { ov.style.opacity = '0'; setTimeout(function() { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 300); };
  var _closeBtn = document.createElement('button');
  _closeBtn.style.cssText = 'display:block;width:100%;padding:16px;background:transparent;border:1px solid var(--border,#D8D8D0);color:var(--grey,#6B6B65);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;border-radius:0;appearance:none;-webkit-appearance:none;';
  _closeBtn.textContent = 'Peut-être plus tard';
  _closeBtn.onclick = dismiss;
  box.appendChild(_closeBtn);

  // Réassurance
  var _reassure = document.createElement('div');
  var _filet = document.createElement('div'); _filet.style.cssText = 'height:1px;background:var(--border,#D8D8D0);margin:20px 0 14px;'; box.appendChild(_filet);
  _reassure.style.cssText = 'text-align:center;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:1px;color:var(--grey,#6B6B65);';
  _reassure.textContent = 'Discrétion assurée — nous ne partageons aucune information personnelle.';
  box.appendChild(_reassure);

  ov.appendChild(box);
  ov.onclick = function(e) { if (e.target === ov) dismiss(); };
  document.body.appendChild(ov);
  requestAnimationFrame(function() { ov.style.opacity = '1'; });
}
window.showSubscriptionContact = showSubscriptionContact;

function getPregnancyTrimester() {
  var s = window.S;
  if (!s.pregnant || !window.isFemale(s)) return null;
  // C3: Semaine non renseignée → défaut T2 semaine 20 (OMS 2016: +340 kcal/j)
  // Evite sous-nutrition si femme enceinte sans semaine de grossesse saisie
  var week = s.pregnancyWeek || 20;
  for (var i = 0; i < PREGNANCY_TRIMESTERS.length; i++) {
    var t = PREGNANCY_TRIMESTERS[i];
    if (week >= t.weeks[0] && week <= t.weeks[1]) {
      return {
        trimester: t,
        week: week,
        trimesterNumber: i + 1,
        weeksLeft: 40 - week,
        progress: Math.round((week / 40) * 100)
      };
    }
  }
  return null;
}
window.getPregnancyTrimester = getPregnancyTrimester;

function getPregnancyWeightGuideline() {
  var s = window.S;
  if (!s.pregnant || !window.isFemale(s)) return null;
  var bmi = (s.prePregnancyWeight && s.height && s.height >= 100) ? s.prePregnancyWeight / Math.pow(s.height / 100, 2) : calcBMI();
  if (!bmi) return null; // cannot compute guideline without BMI
  var guideline = null;
  for (var i = 0; i < PREGNANCY_WEIGHT_GAIN.length; i++) {
    var pg = PREGNANCY_WEIGHT_GAIN[i];
    if (bmi >= pg.bmiRange[0] && bmi < pg.bmiRange[1]) { guideline = pg; break; }
  }
  if (!guideline) guideline = PREGNANCY_WEIGHT_GAIN[1];
  var week = s.pregnancyWeek || 1;
  var t1Gain = Math.min(week, 13) / 13 * 2.0;
  var t2t3Weeks = Math.max(0, week - 13);
  var expectedGainMin = t1Gain + t2t3Weeks * guideline.weeklyGainT2T3[0];
  var expectedGainMax = t1Gain + t2t3Weeks * guideline.weeklyGainT2T3[1];
  var baseWeight = s.prePregnancyWeight || s.weight || 0;
  return {
    category: guideline.category,
    totalGainMin: guideline.totalGainMin,
    totalGainMax: guideline.totalGainMax,
    expectedWeightMin: baseWeight > 0 ? Math.round((baseWeight + expectedGainMin) * 10) / 10 : null,
    expectedWeightMax: baseWeight > 0 ? Math.round((baseWeight + expectedGainMax) * 10) / 10 : null,
    currentExpectedGainMin: Math.round(expectedGainMin * 10) / 10,
    currentExpectedGainMax: Math.round(expectedGainMax * 10) / 10,
    weeklyGainRange: guideline.weeklyGainT2T3
  };
}
window.getPregnancyWeightGuideline = getPregnancyWeightGuideline;

// ─── FORMULAS ───
// ─── POIDS AJUSTÉ POUR LES MACROS (obésité) ───
// Pour IMC > 30, utiliser IBW (Devine) + 40% de l'excédent (ASPEN 2016, ESPEN 2015)
// Évite les recommandations absurdes : ex. 150kg × 2.5g/kg = 375g protéines
// Formule Devine : homme = 50 + 2.3×(taille_pouces-60), femme = 45.5 + 2.3×(taille_pouces-60)
function calcAdjustedWeight(){
  var s=window.S;
  if(!s.weight||!s.height)return s.weight||75;
  var bmi=s.weight/Math.pow(s.height/100,2);
  if(bmi<=30)return s.weight; // Pas d'ajustement si IMC ≤ 30
  var heightInches=s.height/2.54;
  var ibw=window.isMale(s)?(50+2.3*(heightInches-60)):(45.5+2.3*(heightInches-60));
  ibw=Math.max(40,Math.min(120,ibw));
  if(s.weight<=ibw)return s.weight; // sécurité : ne pas pénaliser si poids < IBW (ne devrait pas arriver si IMC>30)
  return Math.round((ibw+0.4*(s.weight-ibw))*10)/10; // Poids ajusté (Adjusted Body Weight)
}
window.calcAdjustedWeight=calcAdjustedWeight;

function calcBMR(){var s=window.S;if(!s.sex)return 0;var _age=getAge();if(!_age||_age<13||_age>120)return 0;if(!s.weight||s.weight<30||s.weight>300)return 0;if(!s.height||s.height<100||s.height>300)return 0;
// GROSSESSE : utiliser le poids pré-grossesse pour le BMR de base (ACOG 2018, OMS 2016)
// Les calories supplémentaires (+340 T2 / +450 T3) s'ajoutent à ce TDEE de référence via calcTarget()
// Utiliser s.weight actuel (gonflé par la grossesse) surestimerait le TDEE de base et additionnerait
// deux fois les besoins énergétiques liés à la grossesse.
var bw=s.weight;
if(s.pregnant&&window.isFemale(s)&&s.prePregnancyWeight&&s.prePregnancyWeight>=30&&s.prePregnancyWeight<=300)bw=s.prePregnancyWeight;
else if(s.pregnant&&window.isFemale(s)&&!s.prePregnancyWeight&&s.pregnancyWeek&&s.pregnancyWeek>=1&&s.pregnancyWeek<=42){
  // Estimation poids pré-grossesse si non renseigné (IOM 2009 : gain moyen ~0.5kg/semaine après S12)
  var _estGain=s.pregnancyWeek>12?Math.round((s.pregnancyWeek-12)*0.5):0;
  bw=Math.max(40,s.weight-_estGain);
}
// Katch-McArdle (masse maigre) — utilisé si % masse graisseuse estimé via body scan
// Plus précis que Mifflin-St Jeor pour les personnes musclées ou avec composition connue
var _bf=s._bodyFatEstimate;
if(_bf!==undefined&&_bf!==null&&_bf>=4&&_bf<=60){
  var _lbm=bw*(1-_bf/100);
  var bmrKM=370+(21.6*_lbm); // Katch-McArdle 1975 (McArdle, Katch & Katch, 2001)
  if(_age>=65)bmrKM=bmrKM*0.95;
  return Math.round(bmrKM); // Katch-McArdle — basé sur masse maigre mesurée
}
var bmrRaw;if(window.isMale(s))bmrRaw=(10*bw)+(6.25*s.height)-(5*_age)+5;else bmrRaw=(10*bw)+(6.25*s.height)-(5*_age)-161;
// Correction seniors 65+ : Mifflin-St Jeor surestime le BMR de ~5% après 65 ans (Amirkalali 2008)
if(_age>=65)bmrRaw=bmrRaw*0.95;
return Math.round(bmrRaw)} // Mifflin-St Jeor 1990 (Frankenfield 2005) + correction seniors 65+ (Amirkalali 2008)
function calcTDEE(){var s=window.S;if(s.activity===null||s.activity===undefined||!ACTIVITIES[s.activity])return 0;var selectedFactor=ACTIVITIES[s.activity].factor;// Auto-correct activity factor based on sport days (user may have selected wrong level)
// Uses the MAXIMUM of user's selected factor and sport-based estimate
// BUG A fix : utiliser trainingDaysSelected.length si disponible (plus précis que sportDays)
var sportDays=Array.isArray(s.trainingDaysSelected)&&s.trainingDaysSelected.length>0?s.trainingDaysSelected.length:(s.sportDays||0);var sportFactor=1.2;if(sportDays>=5)sportFactor=1.725;else if(sportDays>=3)sportFactor=1.55;else if(sportDays>=2)sportFactor=1.375;var effectiveFactor=Math.max(selectedFactor,sportFactor);
// Beginner cap : un débutant ne peut pas avoir un PAL > 1.55 (modéré) quelles que soient ses déclarations.
// Évite un surplus calorique 3× trop élevé si l'utilisateur débutant a coché "Athlète" par excès de confiance.
if(s.sportLevel==='beginner'&&effectiveFactor>1.55)effectiveFactor=1.55;
return calcBMR()*effectiveFactor}
function calcTarget(){var s=window.S;if(s.goal===null||s.goal===undefined||!GOALS[s.goal])return 0;var tdeeVal=calcTDEE();
// BUG FIX: si TDEE=0 (profil incomplet : activité/poids/taille/âge/sexe manquant), retourner 0.
// Avant : le code tombait dans les planchers (1400/1500 kcal) → dashboard affichait une cible fictive.
// Maintenant : 0 indique explicitement "données insuffisantes" aux appelants (dashboard, génération du plan).
// Exception TCA : conservée ci-dessous (le plancher sécurisé est intentionnel même sur profil partiel).
if(tdeeVal===0&&!(s.medical&&s.medical.indexOf('tca')!==-1))return 0;
var base=Math.round(tdeeVal*GOALS[s.goal].mult);if(s.pregnant&&window.isFemale(s)){var tri=getPregnancyTrimester();
// BUG FIX: le fallback était 300 kcal alors que getPregnancyTrimester() défaute pregnancyWeek à 20 (T2=340 kcal).
// Un retour null est donc théoriquement impossible pour une femme enceinte — mais si cela se produit,
// 340 est la valeur correcte (T2, semaine 20, ACOG 2018) et non 300.
var pregExtra=tri?tri.trimester.calorieExtra:340;
// Si allaitement ET enceinte (fin de grossesse + allaitement aîné) → ADDITIF (ACOG 2018 + 2022)
var allaitExtra=(s.medical&&s.medical.indexOf('allaitement')!==-1)?500:0;
base=Math.round(tdeeVal)+pregExtra+allaitExtra;
// Plancher grossesse : 1800 kcal/j minimum (OMS 2016 — jamais de restriction chez femme enceinte sauf prescription médicale)
base=Math.max(base,1800);return base;}var goalKey=GOALS[s.goal].key;// Cap shred deficit to 500 kcal/day (Helms 2014, ACSM — RED-S + muscle loss risk above 500kcal deficit)
// Cap déficit à -500 kcal/j pour shred ET cut (ACSM 2009, Helms 2014 — au-delà : perte musculaire + fatigue chronique)
// IMPORTANT : sans ce cap, un athlète élite (TDEE 3500+) en "cut -15%" pouvait avoir un déficit de 525-700 kcal/j
if((goalKey==='shred'||goalKey==='cut')&&tdeeVal>0){base=Math.max(base,Math.round(tdeeVal-500));}
// BMI≥30 safety gate: cap déficit à -350 kcal/j (Donnelly ACSM 2009 — déficit agressif chez obèse ↑ perte musculaire + risque métabolique)
var _bmiGate=calcBMI();if(_bmiGate!==null&&_bmiGate>=30&&(goalKey==='shred'||goalKey==='cut')&&tdeeVal>0){base=Math.max(base,Math.round(tdeeVal-350));}
// lean_bulk : cap surplus à +300 kcal/j (Helms 2014 — surplus minimal pour prise de masse douce, ↓ accumulation graisseuse vs. bulk)
if(goalKey==='lean_bulk'&&tdeeVal>0){base=Math.min(base,Math.round(tdeeVal+300));}
// bulk : cap surplus à +500 kcal/j (ISSN 2017, ACSM — au-delà : accumulation graisseuse excessive)
if(goalKey==='bulk'&&tdeeVal>0){base=Math.min(base,Math.round(tdeeVal+500));}
// Allaitement (non-enceinte) : +500 kcal/j (ACOG 2022) — appliqué dans le flow normal (pas de early return)
// pour que les protections ado/diabète/ménopause/cycle/alcool soient respectées
if(s.medical&&s.medical.indexOf('allaitement')!==-1&&window.isFemale(s)){base=Math.max(Math.round(tdeeVal)+500,base);base=Math.max(base,1800);}
// TCA/anorexie : forcer maintenance, bloquer cut/shred (ANAD, IOC 2018 — RED-S prevention)
// Profil incomplet (tdeeVal=0) : retourner plancher sécurisé pour éviter 0 kcal sur profil vulnérable
if(s.medical&&s.medical.indexOf('tca')!==-1){return Math.max(Math.round(tdeeVal),window.isFemale(s)?1800:1900);}
// Adolescent (13-17 ans) : déficit max -300kcal/j (ACSM 2007, IOC 2018 — préservation croissance + pic de masse osseuse)
// Surplus max +300kcal/j en bulk (ACSM adolescent — éviter accumulation graisseuse pendant croissance hormonale)
var _ageT=getAge();if(_ageT>=13&&_ageT<18&&tdeeVal>0){
  var minCalTeen=Math.round(tdeeVal-300);if(base<minCalTeen)base=minCalTeen;
  if(goalKey==='bulk'||goalKey==='lean_bulk'){var maxCalTeen=Math.round(tdeeVal+300);if(base>maxCalTeen)base=maxCalTeen;}
}
var hasDiabetes=s.medical&&(s.medical.indexOf('diabete_t2')!==-1||s.medical.indexOf('diabete_t1')!==-1||s.medical.indexOf('prediabete')!==-1);if(hasDiabetes&&tdeeVal>0){var minCal=Math.round(tdeeVal-500);if(base<minCal)base=minCal;}// Ménopause : réduction métabolique ~100 kcal/j (NAMS 2022, Poehlman 1995)
// Ménopause : réduction métabolique ~150 kcal/j (NAMS 2022, Poehlman 1995)
// Plancher 1400 kcal/j maintenu — les femmes ménopausées doivent être encouragées à rester actives (NAMS 2022)
if(window.isFemale(s)&&s.medical&&s.medical.indexOf('menopause')!==-1){base=base-150;// Re-enforce déficit cap -500 kcal : la réduction ménopause ne doit pas créer un déficit > 500 kcal/j (Helms 2014)
if((goalKey==='shred'||goalKey==='cut')&&tdeeVal>0){base=Math.max(base,Math.round(tdeeVal-500));}base=Math.max(1400,base);} // PMC Menopause 2024: -150-200 kcal/j (perte masse maigre + chute estrogènes) — femme uniquement
if(window.isFemale(s)){var cycleInfo=getCurrentCyclePhase();if(cycleInfo&&cycleInfo.phase.calorieAdjust){var adj=cycleInfo.phase.calorieAdjust;// Pendant une sèche/coupe, plafonner l'ajout du cycle à +5% max (préserver le déficit)
if((goalKey==='cut'||goalKey==='shred')&&adj>0.05)adj=0.05;base=Math.round(base*(1+adj));}}
// Plancher calorique sexe-spécifique (ISSN 2017, ACSM 2016, IOC 2018 RED-S prevention)
// Femme : plancher 1400 kcal/j — ISSN 2017 / ACSM 2016 (l'ancien plancher 1200 est obsolète et dangereux)
// Homme : plancher 1500 kcal/j (ACSM — plancher physiologique masculin)
var kcalFloor=window.isFemale(s)?1400:1500;
base=Math.max(base,kcalFloor);
// Plancher BMR : le déficit ne doit JAMAIS descendre sous le métabolisme de base (sécurité métabolique)
var bmrFloor=calcBMR();if(bmrFloor>0)base=Math.max(base,bmrFloor);
// Alcool : déduire les calories hebdo/7 du budget calorique journalier pour un calcul réaliste
// Ex : 500 kcal alcool/semaine ÷ 7 = 71 kcal/j que l'on retire de l'objectif alimentaire
// (l'alcool ne nourrit pas : 7kcal/g sans micronutriments, inhibe oxydation des graisses)
if(s.alcoholFreq&&s.alcoholFreq!=='never'&&typeof alcoholWeeklyKcal==='function'){
  var alcDaily=Math.round(alcoholWeeklyKcal()/7);
  if(alcDaily>0){base=Math.max(kcalFloor,base-alcDaily);} // soustraire mais respecter le plancher
}
// targetWeight : réduction progressive du déficit/surplus quand l'objectif est proche
// Quand |poids_actuel - poids_cible| <= 2 kg → réduire déficit/surplus de 50% pour éviter l'oscillation
// Quand |poids_actuel - poids_cible| <= 1 kg → passer en quasi-maintien (déficit/surplus réduit à 25%)
// Évite l'effet yoyo en fin de coupe/masse (recommandation ACSM 2016, Trexler 2014 — métabolic adaptation)
if(s.targetWeight&&s.weight&&s.weight!==s.targetWeight&&tdeeVal>0){
  var _twDiff=Math.abs(s.targetWeight-s.weight);
  var _isLosing=(goalKey==='cut'||goalKey==='shred')&&s.targetWeight<s.weight;
  var _isGaining=(goalKey==='bulk'||goalKey==='lean_bulk')&&s.targetWeight>s.weight;
  if((_isLosing||_isGaining)&&_twDiff<=2){
    var _twFactor=_twDiff<=1?0.25:0.50; // 25% si < 1kg, 50% si 1-2kg
    var _twBase=Math.round(tdeeVal); // référence = TDEE (maintien)
    base=Math.round(_twBase+(_twFactor*(base-_twBase))); // interpolation vers maintien
    base=Math.max(base,kcalFloor);
  }
}
return base} // ISSN 2017 / ACSM 2016: plancher universel ≥1400 kcal/j (femme et homme)
function calcMacros(){
  var s=window.S;var c=calcTarget();
  if(!c||s.goal===null||s.goal===undefined||!GOALS[s.goal])return{g:0,p:0,l:0};
  // Pour les macros g/kg : utiliser le poids ajusté si obèse (ASPEN 2016, ESPEN 2015)
  // Les calories (calcTarget/TDEE) restent basées sur le poids réel
  var bw=calcAdjustedWeight()||75;var goalKey=GOALS[s.goal].key;
  // TCA : forcer macros maintien même si l'objectif persisté est sèche/coupe/masse
  // calcTarget() redirige déjà vers maintenance — les macros doivent suivre (évite ppk sèche 3.19g/kg sur profil TCA)
  // ANAD, IOC 2018 — RED-S prevention
  if(s.medical&&s.medical.indexOf('tca')!==-1)goalKey='maintain';
  // ─── PROTÉINES (g/kg) — Table complète par sexe, activité et objectif ───
  // Sources : Phillips & Van Loon 2011 (BJSM) | Morton 2018 (BJSM meta-analysis)
  //           Tarnopolsky 2000 (MSSE) : femmes nécessitent ~13% de moins (oestrogène anti-catabolique,
  //           oxydation leucine réduite) | ISSN 2017 | Helms 2014 | EFSA 2012 | IOC 2011
  var ppk=1.8;
  var actFactor=(s.activity!==null&&s.activity!==undefined&&ACTIVITIES[s.activity])?ACTIVITIES[s.activity].factor:1.2;
  var isFemale=window.isFemale(s);

  if(goalKey==='maintain'){
    // ─── MAINTIEN — ppk selon activité ET sexe ───
    // Hommes : 1.2 → 2.4 g/kg selon niveau (Phillips & Van Loon 2011, ISSN 2017)
    // Femmes : ~13% de moins (oestrogène anti-catabolique — Tarnopolsky 2000)
    // Sédentaire plancher : OMS 0.83 minimum, EFSA 2012 recommande 1.0-1.2 pour maintien musculaire
    if(actFactor>=1.9){
      ppk=isFemale?2.0:2.2;  // Athlète élite : H=2.2g/kg, F=2.0g/kg (ISSN Position Stand 2023 upper — Morton 2018 BJSM)
    } else if(actFactor>=1.725){
      ppk=isFemale?1.6:1.8;  // Très actif : H=1.8, F=1.6 (ISSN 2017)
    } else if(actFactor>=1.55){
      ppk=isFemale?1.4:1.6;  // Modéré : H=1.6, F=1.4
    } else if(actFactor>=1.375){
      ppk=isFemale?1.2:1.4;  // Léger : H=1.4, F=1.2
    } else {
      ppk=isFemale?1.0:1.2;  // Sédentaire : H=1.2, F=1.0 (EFSA 2012 — anti-sarcopénie)
    }

  } else if(goalKey==='recomposition'){
    // ─── RECOMPOSITION — haute protéine (maintien masse musculaire + perte grasse simultanée) ───
    // Distribution : P=35%, G=40%, L=25% — calorie neutre (mult=1.00)
    // Sources : Barakat 2020 (NSCA) — recomposition validée ≥1.6g/kg ; Hall 2012 ; Morton 2018 BJSM
    if(actFactor>=1.9){
      ppk=isFemale?2.0:2.4;   // Élite recompo : H=2.4, F=2.0
    } else if(actFactor>=1.725){
      ppk=isFemale?1.8:2.1;   // Très actif recompo : H=2.1, F=1.8
    } else if(actFactor>=1.55){
      ppk=isFemale?1.6:1.9;   // Modéré recompo : H=1.9, F=1.6
    } else if(actFactor>=1.375){
      ppk=isFemale?1.4:1.7;   // Léger recompo : H=1.7, F=1.4
    } else {
      ppk=isFemale?1.2:1.6;   // Sédentaire recompo : H=1.6, F=1.2
    }

  } else if(goalKey==='bulk'||goalKey==='lean_bulk'){
    // ─── PRISE DE MASSE / PRISE DE MASSE DOUCE — ppk selon activité ET sexe ───
    // lean_bulk femme : relevé à 1.8-2.0 g/kg (Morton 2018 BJSM meta — masse maigre nécessite haute protéine même chez femmes)
    // bulk femme : 1.6-2.0 g/kg (ISSN 2017 / Tarnopolsky 2000)
    if(actFactor>=1.9){
      ppk=isFemale?2.0:2.2;  // Élite : H=2.2g/kg, F=2.0g/kg (ISSN 2023 upper / Morton 2018 BJSM)
    } else if(actFactor>=1.7){
      ppk=isFemale?(goalKey==='lean_bulk'?2.0:1.8):(goalKey==='lean_bulk'?2.1:2.0);  // Très actif lean_bulk F=2.0 (vs bulk F=1.8)
    } else {
      ppk=isFemale?(goalKey==='lean_bulk'?1.8:1.6):(goalKey==='lean_bulk'?2.0:1.8);  // Standard lean_bulk F=1.8 (vs bulk F=1.6)
    }

  } else {
    // ─── SÈCHE / COUPE — table complète par niveau d'activité (comme maintain) ───
    // Sources : ISSN 2017 (1.6-2.2g/kg actifs), Helms 2014 (2.3-3.1 compétiteurs), Tarnopolsky 2000 (F -13%)
    // Logique : sédentaire → protéines proches du maintien (+0.3-0.5g/kg pour déficit)
    //           élite → protéines hautes (catabolisme musculaire élevé sous déficit + volume d'entraînement)
    // Garantit cohérence calorique : évite l'overshoot quand protéines > budget calorique restant
    if(goalKey==='shred'){
      if(actFactor>=1.9){
        ppk=isFemale?2.3:2.8;   // Élite sèche : H=2.8g/kg, F=2.3g/kg (Helms 2014 upper, Tarnopolsky)
      } else if(actFactor>=1.725){
        ppk=isFemale?2.0:2.4;   // Très actif sèche : H=2.4, F=2.0 (ISSN 2017 upper)
      } else if(actFactor>=1.55){
        ppk=isFemale?1.8:2.1;   // Modéré sèche : H=2.1, F=1.8 (ISSN 2017 mid)
      } else if(actFactor>=1.375){
        ppk=isFemale?1.6:1.9;   // Léger sèche : H=1.9, F=1.6
      } else {
        ppk=isFemale?1.4:1.7;   // Sédentaire sèche : H=1.7, F=1.4 (EFSA 2012 + déficit)
      }
    } else {
      // cut — même table, valeurs ~0.2g/kg sous la sèche (déficit moins sévère)
      if(actFactor>=1.9){
        ppk=isFemale?2.0:2.5;   // Élite coupe : H=2.5, F=2.0
      } else if(actFactor>=1.725){
        ppk=isFemale?1.8:2.1;   // Très actif coupe : H=2.1, F=1.8
      } else if(actFactor>=1.55){
        ppk=isFemale?1.6:1.9;   // Modéré coupe : H=1.9, F=1.6
      } else if(actFactor>=1.375){
        ppk=isFemale?1.6:1.7;   // Léger coupe : H=1.7, F=1.6 (plancher Helms 2014 : ≥1.6g/kg en déficit)
      } else {
        ppk=isFemale?1.6:1.6;   // Sédentaire coupe : H=1.6, F=1.6 (ISSN 2017 minimum 1.6g/kg pour tous en déficit)
      }
    }
  }
  // Ajustement protéine selon type de sport : endurance pure vs musculation/force
  // ISSN 2017 : endurance = 1.4-1.6 g/kg vs résistance = 1.6-2.5 g/kg
  // Tarnopolsky 2004 (MSSE) : athlètes endurance nécessitent ~0.2g/kg de moins que athlètes de force
  // S'applique uniquement si l'utilisateur n'a PAS d'objectif musculaire ou de sèche sportive
  // FIX BUG-SPORT-PROTEIN 2026-04 : si sportGoals est vide (sport-only users sans nutrition onboarding),
  // se rabattre sur sportType pour déduire hasMuscGoal/hasEndurOnly.
  // Avant : yoga/running/padel users sans sportGoals ne recevaient aucun ajustement → protéines identiques
  //         à un user muscu au même actFactor (ex: 2.2g/kg pour un yogi = sur-protéiné sans raison).
  var _endurSportTypes = ['running','cycling','triathlon','hyrox','yoga','padel','golf'];
  var _muscuSportTypes = ['musculation','calisthenics'];
  var hasMuscGoal, hasEndurOnly, isDeficit;
  if(s.sportGoals&&s.sportGoals.length>0){
    hasMuscGoal=s.sportGoals.indexOf('muscle')!==-1||s.sportGoals.indexOf('shred')!==-1;
    hasEndurOnly=!hasMuscGoal&&(s.sportGoals.indexOf('endurance')!==-1||s.sportGoals.indexOf('weightloss')!==-1||s.sportGoals.indexOf('flexibility')!==-1||s.sportGoals.indexOf('general')!==-1);
  } else if(s.sportType){
    // Fallback sur sportType quand sportGoals absent (typique en mode sport-only)
    hasMuscGoal=_muscuSportTypes.indexOf(s.sportType)!==-1;
    hasEndurOnly=_endurSportTypes.indexOf(s.sportType)!==-1;
  }
  isDeficit=goalKey==='shred'||goalKey==='cut';
  if(hasEndurOnly&&!isDeficit)ppk=Math.max(1.2,ppk-0.2); // Tarnopolsky 2004 : -0.2g/kg endurance pure
  else if(hasEndurOnly&&isDeficit)ppk=Math.min(3.5,ppk+0.2); // Helms 2014: déficit calorique → +0.2g/kg pour préserver la masse maigre
  if(s.train&&Array.isArray(s.train)&&s.train.indexOf(0)!==-1)ppk+=0.1;
  if(s.medical&&s.medical.indexOf('irc')!==-1)ppk=Math.min(ppk,0.6); // KDOQI 2020: 0.55-0.60g/kg CKD 3-5 non-dialysis
  // Vegan/vegetarian: adjust protein for lower DIAAS bioavailability of plant proteins (Messina 2019, ISSN 2017)
  if(s.regime===3)ppk=Math.round(ppk*1.10*10)/10; // Végan: +10% (DIAAS correction — FAO 2013, PMC 2020)
  else if(s.regime===2)ppk=Math.round(ppk*1.10*10)/10; // Végétarien lacto-ovo: +10% (DIAAS correction — FAO 2013, PMC 2020)
  // IRC : ne pas appliquer le plancher universel 0.8g/kg — le cap KDOQI 0.6g/kg est plus restrictif
  // Correction arrondi DIAAS : round(0.6×1.10×10)/10 = round(6.6)/10 = 7/10 = 0.70 > cap 0.66
  // → re-enforce ppk au cap IRC dès ici pour que pGrams et proteinPerKg retourné soient cohérents
  var _isIrc=s.medical&&s.medical.indexOf('irc')!==-1;
  if(_isIrc){var _ircPpkCap=(s.regime===3||s.regime===2)?0.66:0.60;if(ppk>_ircPpkCap)ppk=_ircPpkCap;}
  ppk=_isIrc?Math.max(0.1,Math.min(3.5,ppk)):Math.max(0.8,Math.min(3.5,ppk));
  // Sarcopenia prevention: +0.3g/kg for age 40-49, +0.4g/kg for age 50+ (ESPEN 2019, Bauer 2013)
  // Skip for IRC (hard cap 0.6g/kg) and max is still 3.5g/kg
  if(!_isIrc){var _sarcAge=(typeof getAge==='function'?getAge():null)||(s.age||0);if(_sarcAge>=50)ppk=Math.min(3.5,ppk+0.4);else if(_sarcAge>=40)ppk=Math.min(3.5,ppk+0.3);}
  var pGrams=Math.round(bw*ppk);
  // Pregnancy protein bonus: +25g/day T2+T3 (ACOG 2018, WHO)
  if(s.pregnant&&window.isFemale(s)){var triP=getPregnancyTrimester();if(triP&&triP.trimester.proteinExtra)pGrams=Math.round(pGrams+triP.trimester.proteinExtra);}
  var pCal=pGrams*4;
  // Fat g/kg (minimum 0.5g/kg for hormonal health)
  var fpk=1.0;
  if(goalKey==='shred')fpk=0.7;else if(goalKey==='cut')fpk=0.85;else if(goalKey==='recomposition')fpk=0.9;else if(goalKey==='bulk'||goalKey==='lean_bulk')fpk=1.1;else fpk=1.0;
  if(window.isFemale(s))fpk=Math.round((fpk+0.1)*10)/10;
  // Min lipides femme 0.7g/kg (ISSN 2021) — santé hormonale (vs 0.5 homme)
  var lipidMin=window.isFemale(s)?0.7:0.5;
  fpk=Math.max(lipidMin,Math.min(1.5,fpk));
  var lGrams=Math.round(bw*fpk);var lCal=lGrams*9;
  // Plancher 20% lipides (santé hormonale — ISSN 2017, Volek 2006)
  var minFatCal=Math.round(c*0.20);if(lCal<minFatCal){lGrams=Math.round(minFatCal/9);lCal=lGrams*9;}
  // Carbs fill remaining calories
  var gCal=c-pCal-lCal;
  if(gCal<200){lCal=Math.max(bw*0.5*9,c-pCal-200);lGrams=Math.round(lCal/9);gCal=c-pCal-lCal;if(gCal<200){pCal=c-lCal-200;pGrams=Math.round(pCal/4);gCal=200}}
  var gGrams=Math.max(130,Math.round(gCal/4)); // IOM 2005: min 130g/j (cerveau+SNC)
  // Cap carbs to goal-specific maximum (g/kg) — prevents excessive carb surplus (Helms 2014, ISSN 2017)
  var carbCapGpkg=goalKey==='shred'?3.5:goalKey==='cut'?4.0:(goalKey==='bulk'||goalKey==='lean_bulk')?6.0:5.0;
  // Endurance : relever le cap à 8 g/kg (ISSN 2016 : 6-10 g/kg selon intensité)
  // Sans ce cap relevé, le glucides restant (après protéines + lipides) était plafonné à 5g/kg
  // et l'excédent redirigé vers les lipides → plan inadapté au marathon/cyclisme.
  if(hasEndurOnly)carbCapGpkg=Math.max(carbCapGpkg,8.0);
  var carbCap=Math.round(bw*carbCapGpkg);
  if(gGrams>carbCap){
    // CRITIQUE : redistribuer les calories libérées par le plafond glucides sur les lipides
    // Sans redistribution → sous-alimentation systématique (ex: -229 kcal en bulk, -347 kcal en cut)
    // Priorité : lipides (acides gras essentiels, hormones, vitamines liposolubles) — Helms 2014
    var freedKcalFromCarbCap=(gGrams-carbCap)*4;
    gGrams=carbCap;
    var lipidAbsCap=Math.round(bw*1.5); // plafond absolu lipides 1.5g/kg (ISSN 2017)
    var addableLipidGrams=Math.min(Math.floor(freedKcalFromCarbCap/9), Math.max(0,lipidAbsCap-lGrams));
    if(addableLipidGrams>0){lGrams+=addableLipidGrams;lCal=lGrams*9;
      // Si plafond lipides atteint, redistribuer le reste sur les protéines
      var stillFreedKcal=freedKcalFromCarbCap-(addableLipidGrams*9);
      if(stillFreedKcal>36){var addProt=Math.floor(stillFreedKcal/4);pGrams+=addProt;pCal=pGrams*4;}
    } else {
      // Lipides déjà au max → tout va sur les protéines
      var addProtOnly=Math.floor(freedKcalFromCarbCap/4);pGrams+=addProtOnly;pCal=pGrams*4;
    }
  }
  // Medical adjustments
  if(s.medical){for(var i=0;i<s.medical.length;i++){var mId=s.medical[i];var a=MEDICAL_ADVICE[mId];if(a&&a.macroAdj){// ménopause, sopk, grossesse, allaitement : ajustements féminins uniquement
var femaleOnly=['menopause','sopk','grossesse','allaitement'];if(femaleOnly.indexOf(mId)!==-1&&!window.isFemale(s))continue;gGrams=Math.round(gGrams*(1+(a.macroAdj.g||0)));pGrams=Math.round(pGrams*(1+(a.macroAdj.p||0)));lGrams=Math.round(lGrams*(1+(a.macroAdj.l||0)))}}}
  // Re-enforce IRC protein cap after all medical adjustments (KDOQI 2020: 0.6g/kg CKD 3-5 non-dialysis)
  // Vegan/végétarien IRC : +10% DIAAS correction → cap 0.66g/kg (FAO 2013, Messina 2019)
  if(s.medical&&s.medical.indexOf('irc')!==-1){var _ircCapGpkg=(s.regime===3||s.regime===2)?0.66:0.60;var maxIrcP=Math.round(bw*_ircCapGpkg);if(pGrams>maxIrcP)pGrams=maxIrcP;}
  // Diabète gestationnel : plafond glucides 175-200g/j (ADA 2023, ACOG 2018)
  if(s.medical&&s.medical.indexOf('diabete_gest')!==-1){var gdCarbMax=Math.min(200,Math.max(175,gGrams));if(gGrams>gdCarbMax)gGrams=gdCarbMax;}
  // Master athlete 60+ : résistance anabolique → leucine seuil 40g/meal (Churchward-Venne 2016, Moore 2015)
  // Augmenter protéines de 10% pour compenser la résistance anabolique (recommandation ESPEN 2019)
  if(getAge()>=60&&(!s.medical||s.medical.indexOf('irc')===-1)){pGrams=Math.max(pGrams,Math.round(bw*1.2));} // ESPEN 2014: plancher 1.2g/kg pour 60+ (résistance anabolique)
  // Seniors 65+ : plancher protéique renforcé pour lutter contre la sarcopénie (Bauer 2013 — PROT-AGE Study Group)
  // Bauer 2013 (JAMDA) : ≥1.6g/kg/j minimum si objectif maintenance ou prise de masse douce chez 65+
  // Sans IRC (le cap IRC 0.6g/kg reste prioritaire)
  if(getAge()>=65&&(!s.medical||s.medical.indexOf('irc')===-1)&&(goalKey==='maintain'||goalKey==='lean_bulk')){
    pGrams=Math.max(pGrams,Math.round(bw*1.6)); // Bauer 2013 PROT-AGE: ≥1.6g/kg anti-sarcopénie 65+
  }
  // Apply cycle-phase macro adjustments (only for non-pregnant women with cycle tracking)
  if(!s.pregnant&&window.isFemale(s)&&s.cycleTracking){var cycleM=getCurrentCyclePhase();if(cycleM&&cycleM.phase.macroAdjust){var mAdj=cycleM.phase.macroAdjust;// Small modulations per cycle phase — carb/fat shift, protein stable
gGrams=Math.round(gGrams*(1+(mAdj.g||0)));lGrams=Math.round(lGrams*(1+(mAdj.l||0)));// Never reduce protein during cycle — keep stable
}}
  gGrams=Math.max(130,gGrams);
  // IRC : plancher protéine ajusté au poids (0.55g/kg) pour ne pas violer le cap KDOQI 0.60g/kg
  var _ircFloorP=(_isIrc&&bw>0)?Math.round(bw*0.55):40;
  pGrams=Math.max(_ircFloorP,pGrams);lGrams=Math.max(20,lGrams);
  // C-01: Normalisation calorique — les ajustements médicaux peuvent créer un écart avec calcTarget()
  // On redistribue l'écart sur les glucides en priorité (macro la plus flexible), puis sur les lipides
  var actualCal=gGrams*4+pGrams*4+lGrams*9;
  var calGap=c-actualCal;
  if(Math.abs(calGap)>10){
    var carbAdj=Math.round(calGap/4);
    var newG=gGrams+carbAdj;
    if(newG>=130){
      gGrams=newG;
      // Re-enforce GD carb cap post-normalisation (ADA 2023: max 175-200g/j)
      // Si le cap réduit les glucides, redistribuer les calories libérées sur lipides puis protéines
      // (sans redistribution → écart calorique ~528 kcal sur profil DG+végan)
      if(s.medical&&s.medical.indexOf('diabete_gest')!==-1&&gGrams>200){
        var _dgFreedKcal=(gGrams-200)*4;gGrams=200;
        var _lipAbsCap=Math.round(bw*1.5);
        var _addLip=Math.min(Math.floor(_dgFreedKcal/9),Math.max(0,_lipAbsCap-lGrams));
        if(_addLip>0){lGrams+=_addLip;var _dgStillFree=_dgFreedKcal-_addLip*9;if(_dgStillFree>36)pGrams+=Math.floor(_dgStillFree/4);}
        else{pGrams+=Math.floor(_dgFreedKcal/4);}
      } else if(s.medical&&s.medical.indexOf('diabete_gest')!==-1){gGrams=Math.min(200,gGrams);}
    }else{
      gGrams=130;
      var remainGap=c-(gGrams*4+pGrams*4+lGrams*9);
      lGrams=Math.max(20,lGrams+Math.round(remainGap/9));
      // Re-enforce lipid floor for women (ISSN 2021: ≥0.7g/kg — santé hormonale, production oestrogènes)
      if(window.isFemale(s))lGrams=Math.max(Math.round(bw*0.7),lGrams);
    }
  }
  // FINAL IRC re-enforce — après planchers absolus Math.max(40,...) et redistribution DG
  // Ces opérations peuvent repousser pGrams au-dessus du cap KDOQI (ex: 60kg → floor 40 > cap 36)
  // C'est le dernier garde-fou garantissant que le plan servi respecte KDOQI 2020 sans exception
  if(_isIrc){var _finalIrcCap=(s.regime===3||s.regime===2)?0.66:0.60;var _finalMaxP=Math.round(bw*_finalIrcCap);if(pGrams>_finalMaxP){pGrams=_finalMaxP;ppk=Math.round(pGrams/bw*100)/100;}}
  return{g:gGrams,p:pGrams,l:lGrams,proteinPerKg:ppk,fatPerKg:fpk,carbsPerKg:Math.round(gGrams/bw*10)/10,cyclePhase:(!s.pregnant&&window.isFemale(s)&&s.cycleTracking)?getCurrentCyclePhase():null}
}
function calcBMI(){var s=window.S;if(!s.height||!s.weight||s.height<100)return null;var ht=s.height/100;return Math.round((s.weight/Math.pow(ht,2))*10)/10}
// OMS : 3 grades d'obésité — prise en charge radicalement différente selon le grade
// Grade 1 (30-34.9) : hygiène de vie | Grade 2 (35-39.9) : suivi spécialisé | Grade 3 (≥40) : chirurgie bariatrique possible (HAS 2022)
function bmiInfo(b){
  if(b===null||b===undefined||isNaN(b))return{label:'Données insuffisantes',color:'#6B6B65',grade:'?',note:''};
  if(b<16.0)return{label:'Dénutrition sévère',color:'#1A0050',grade:'D3',note:'Hospitalisation nécessaire (HAS 2019)'};
  if(b<17.0)return{label:'Dénutrition modérée',color:'#1A1070',grade:'D2',note:'Suivi diététique urgent'};
  if(b<18.5)return{label:'Insuffisance pondérale',color:'#1A3A6A',grade:'D1',note:'Augmenter les apports caloriques'};
  if(b<25)return{label:'Poids normal',color:'#3E5C3A',grade:'N',note:'Maintenir les habitudes alimentaires'};
  if(b<30)return{label:'Surpoids',color:'#7A3B0E',grade:'S',note:'Hygiène de vie à améliorer'};
  if(b<35)return{label:'Obésité grade 1',color:'#7A3010',grade:'O1',note:'Suivi médical recommandé (HAS 2022)'};
  if(b<40)return{label:'Obésité grade 2',color:'#8A1A10',grade:'O2',note:'Suivi spécialisé médical obligatoire'};
  return{label:'Obésité grade 3 (morbide)',color:'#7A1F1F',grade:'O3',note:'Équipe pluridisciplinaire — chirurgie bariatrique discutable (HAS 2022)'}
}

function calcWeightProjection(){
  var s=window.S;
  if(!s.targetWeight||!s.weight||s.targetWeight===s.weight)return null;

  var gaining=s.targetWeight>s.weight;

  // Realistic weekly change based on caloric surplus/deficit
  var tdee=calcTDEE();
  var target=calcTarget();

  // Guard: if TDEE or target not yet calculated, use default rates
  var weeklyChange;
  if(tdee&&target){
    var dailyDiff=target-tdee;
    weeklyChange=(dailyDiff*7)/7700;
  }else{
    weeklyChange=gaining?0.25:-0.4;
  }

  // Clamp to realistic rates
  if(gaining){
    weeklyChange=Math.max(0.1,Math.min(0.4,weeklyChange));
  }else{
    weeklyChange=Math.min(-0.1,Math.max(-1.0,weeklyChange));
  }

  var diff=s.targetWeight-s.weight;
  var weeks=Math.ceil(Math.abs(diff/weeklyChange));
  weeks=Math.max(1,Math.min(weeks,104));

  var data=[];
  for(var w=0;w<=weeks;w++){
    var projected=s.weight+weeklyChange*w;
    projected=Math.round(projected*10)/10;
    if(gaining&&projected>s.targetWeight)projected=s.targetWeight;
    if(!gaining&&projected<s.targetWeight)projected=s.targetWeight;
    data.push({week:w,weight:projected});
  }

  var td=new Date();td.setDate(td.getDate()+weeks*7);
  return{weeks:weeks,months:Math.round(weeks/4.3),targetDate:td,weeklyData:data,weeklyChange:weeklyChange};
}

function alcoholWeeklyKcal(){
  var total=0;
  var types=window.S&&Array.isArray(window.S.alcoholTypes)?window.S.alcoholTypes:[];
  types.forEach(function(at){
    var drink=ALCOHOL_DB.find(function(d){return d.name===at.type});
    if(drink&&at.freq)total+=drink.kcal*at.freq;
  });
  return total;
}

// ─── HYDRATATION PERSONNALISÉE ───
// Base : 35 ml/kg/jour (EFSA 2010) + bonus activité physique (ACSM 2007)
// Hommes : ANC 3.7L/j total (dont 2.5L boissons) | Femmes : ANC 2.7L/j total (dont 2L boissons)
function calcHydration(){
  var s=window.S;
  if(!s.weight)return null;
  var base=Math.round(s.weight*35); // 35 ml/kg/j de base (EFSA 2010)
  var actBonus=0; // bonus lié à l'activité physique (par séance)
  if(s.activity!==null&&s.activity!==undefined&&ACTIVITIES[s.activity]){
    var factor=ACTIVITIES[s.activity].factor;
    if(factor>=1.9)actBonus=1500;      // Athlète élite: +1.5L/j
    else if(factor>=1.725)actBonus=1000; // Très actif: +1L/j
    else if(factor>=1.55)actBonus=750;   // Modérément actif: +750ml/j
    else if(factor>=1.375)actBonus=500;  // Léger: +500ml/j
  }
  // Ajustement grossesse : +300ml/j (OMS 2020)
  var pregnancyBonus=(s.pregnant&&window.isFemale(s))?300:0;
  // Ajustement allaitement : +700ml/j (EFSA 2010, ANSES 2021)
  var allaitBonus=(s.medical&&s.medical.indexOf('allaitement')!==-1)?700:0;
  // Créatine : +500ml/j minimum (ISSN 2017 — créatine augmente rétention intramusculaire, risque microlithiase si sous-hydratation)
  var creatineBonus=s.creatine?500:0;
  var total=base+actBonus+pregnancyBonus+allaitBonus+creatineBonus;
  total=Math.ceil(total/100)*100; // arrondir à 100ml
  var minFloor=window.isFemale(s)?2000:2500; // minimums EFSA
  total=Math.max(total,minFloor);
  return{
    ml:total,
    liters:Math.round(total/100)/10,
    base:base,
    actBonus:actBonus,
    creatineBonus:creatineBonus,
    perSportHour:600, // 500-750ml/heure d'effort (ACSM 2007)
    electrolytes: actBonus >= 750, // Électrolytes recommandés si effort > ~60 min (Maughan & Shirreffs, BJSM 2010)
    tips:[
      'Urines jaune pâle = bonne hydratation',
      actBonus>0?'Ajoutez 500-750ml par heure d\'entraînement':'Buvez régulièrement, sans attendre la soif',
      // Électrolytes pour efforts > 1h (Maughan & Shirreffs, BJSM 2010 — sodium 500-1000mg/h, potassium 200-400mg/h)
      actBonus>=750?'Effort > 60 min : ajoutez des électrolytes (sodium 500-1000 mg/h, potassium 200-400 mg/h) pour prévenir hyponatrémie et crampes (Maughan & Shirreffs, BJSM 2010).':null,
      (s.pregnant&&window.isFemale(s))?'+300ml/j recommandé en grossesse (OMS)':null,
      (s.medical&&s.medical.indexOf('allaitement')!==-1)?'+700ml/j supplémentaires pendant l\'allaitement (ANSES 2021)':null,
      s.creatine?'+500ml/j obligatoires avec la créatine (ISSN 2017 — prévient la microlithiase rénale)':null
    ].filter(Boolean)
  };
}
window.calcHydration=calcHydration;

// ─── CIBLE FIBRES ALIMENTAIRES PERSONNALISÉE ───
// Base : 25g/j (femme) / 35g/j (homme) — ANSES 2016, IOM 2005
// Ajustements médicaux : ADA 2023 (diabète), NICE 2021 (IRC), FODMAP (SII)
function calcFiberTarget(){
  var s=window.S;
  var base=window.isMale(s)?35:25; // IOM 2005: hommes 38g, femmes 25g (ajusté ANSES 2016)
  var adjustments=[];
  var hasDiab=s.medical&&(s.medical.indexOf('diabete_t2')!==-1||s.medical.indexOf('diabete_t1')!==-1||s.medical.indexOf('prediabete')!==-1);
  if(hasDiab){base=Math.max(base,38);adjustments.push('Diabète : fibres solubles ≥ 38g/j (ADA 2023) — ralentissent absorption glucose');}
  if(s.medical&&s.medical.indexOf('nash')!==-1){base=Math.max(base,35);adjustments.push('NASH : fibres ≥ 35g/j pour réduire stéatose hépatique (ESPEN 2016)');}
  if(s.medical&&s.medical.indexOf('cholesterol')!==-1){base=Math.max(base,30);adjustments.push('Hypercholestérolémie : fibres solubles (avoine, psyllium) réduisent LDL (AHA 2019)');}
  // SII (FODMAP) : limiter en phase aiguë, fibres solubles uniquement
  if(s.medical&&s.medical.indexOf('sii')!==-1){base=Math.min(base,20);adjustments.push('SII : max 20g/j en phase d\'exclusion FODMAP — fibres solubles uniquement (NICE 2021)');}
  // IRC : limiter les fibres riches en potassium (légumineuses, fruits secs)
  if(s.medical&&s.medical.indexOf('irc')!==-1){base=Math.min(base,25);adjustments.push('IRC : éviter fibres riches en potassium (légumineuses, fruits secs) — KDOQI 2020');}
  // 60+ : transit, microbiote, prévention cancer colorectal
  if(getAge()>=60&&!adjustments.length){base=Math.max(base,30);adjustments.push('60+ : ≥ 30g/j pour microbiote et transit (EFSA 2017)');}
  return{
    target:base,
    adjustments:adjustments,
    sources:[
      'Légumineuses (lentilles, pois chiches) : 8-10g/100g',
      'Graines de chia : 35g/100g | Lin : 27g/100g',
      'Légumes verts : brocoli, épinards, artichaut',
      'Fruits entiers (pas en jus) : poire, pomme, framboises',
      'Céréales complètes : avoine, quinoa, pain complet'
    ]
  };
}
window.calcFiberTarget=calcFiberTarget;

function getAge(){var s=window.S;if(s.birthDate){var today=new Date();var b=new Date(s.birthDate);if(!isNaN(b.getTime())){var a=today.getFullYear()-b.getFullYear();var m=today.getMonth()-b.getMonth();if(m<0||(m===0&&today.getDate()<b.getDate()))a--;if(a<0||a>120)return null;return a;}}return s.age||null;}
function isBirthday(){var s=window.S;if(!s.birthDate)return false;var today=new Date();var b=new Date(s.birthDate);if(isNaN(b.getTime()))return false;return today.getMonth()===b.getMonth()&&today.getDate()===b.getDate();}
window.getAge=getAge;window.isBirthday=isBirthday;

window.calcBMR=calcBMR; window.calcTDEE=calcTDEE; window.calcTarget=calcTarget;
window.calcMacros=calcMacros; window.calcBMI=calcBMI; window.bmiInfo=bmiInfo;
window.calcWeightProjection=calcWeightProjection; window.alcoholWeeklyKcal=alcoholWeeklyKcal;

// ─── RECIPE FILTERING ───
function getPool(t){
  return (window.RecipeEngine && typeof window.RecipeEngine.getPool === 'function') ? window.RecipeEngine.getPool(t) : [];
}
// Helper: builds unified searchable string from both old (x.i string) and new (x.ingredients array) formats
function _ri(x){var ingArr=x.ingredients?x.ingredients.map(function(ig){return ig.name||'';}).join(' '):'';return((x.i||'')+' '+ingArr+' '+(x.name||x.n||'')+' '+(x.tags||[]).join(' ')).toLowerCase();}
function filterRecipes(pool,type){
  var s=window.S;
  var r=(pool||[]).slice();
  r=r.filter(function(x){return x.lv<=(s.cookLevel||0)+1});
  if(!s.whey)r=r.filter(function(x){return!x.w});
  if((s.allergies||[]).length>0&&(s.allergies||[]).indexOf('Aucune')===-1){
    r=r.filter(function(x){
      var ing=_ri(x);
      for(var a=0;a<s.allergies.length;a++){
        var al=s.allergies[a].toLowerCase();
        if(al==='fruits \u00e0 coque'){var nc=ing.replace(/noix de coco|noix de muscade/g,'');if((/amande|noix|noisette|cajou|pistache|pecan|macadamia|pignon/).test(nc))return false;}
        if(al==='arachides'&&(/arachide|cacahu[e\u00e8]te/).test(ing))return false;
        if((al==='oeufs'||al==='\u0153ufs')&&(/oeuf|\u0153uf/).test(ing))return false;
        if(al==='poisson'&&(/saumon|thon|cabillaud|dorade|sardine|maquereau|poisson|anchois|merlu|truite|sole|lotte|morue/).test(ing))return false;
        if(al==='crustac\u00e9s'&&(/crevette|crustac|homard|crabe|gambas/).test(ing))return false;
        if(al==='soja'&&(/soja|tofu|edamame|tempeh|tamari|miso|natto/).test(ing))return false;
        if(al==='lait/produits laitiers'||al==='lactose'){var dl=ing.replace(/lait de coco|lait d.amande|lait d.avoine|lait de soja|lait de riz|beurre de cacahu/g,'');if((/lait|fromage|yaourt|beurre|cr\u00e8me|ricotta|mozzarella|parmesan|emmental|feta|cottage|skyr|labneh|k\u00e9fir|whey/).test(dl))return false;}
        if(al==='gluten/bl\u00e9'||al==='gluten'){var gl=ing.replace(/galette de riz|farine de riz|farine de sarrasin|p\u00e2te miso/g,'');if((/pain|bl\u00e9|farine|p\u00e2te|seigle|couscous|semoule|tortilla|wrap|naan|galette|cr\u00eape|pancake|muffin|avoine|orge|\u00e9peautre|epeautre|boulgour|seitan|kamut|sauce soja|tamari/).test(gl))return false;} // BUG FIX : avoine (contamination croisée fréquente — AFDIAG), orge, épeautre, boulgour, seitan, kamut, sauce soja/tamari (gluten caché) manquaient; also accept 'gluten' alias
        // Sésame + tahini (pâte sésame pure) + houmous (contient tahini) — risque anaphylactique
        if((al==='sésame'||al==='sesame')&&(/(sésame|sesame|tahini|tahin\b|houmous|hummus)/).test(ing))return false;
        if(al==='moutarde'&&(/moutarde/).test(ing))return false;
      }return true;
    });
  }
  if((s.intolerances||[]).length>0&&(s.intolerances||[]).indexOf('Aucune')===-1){
    r=r.filter(function(x){
      var ing=_ri(x);
      for(var t=0;t<s.intolerances.length;t++){
        var it=s.intolerances[t].toLowerCase();
        if(it==='lactose'&&(/lait|fromage|yaourt|beurre|crème|ricotta|cottage|whey|feta|parmesan|mozzarella|skyr|emmental|gruyère|comté|camembert|mascarpone|kéfir|labneh|ghee|cheddar|gouda/).test(ing))return false;
        if(it==='gluten'){var gi=ing.replace(/galette de riz|farine de riz|farine de sarrasin|pâte miso|sauce tamari certifiée sans gluten/g,'');if((/pain|blé|farine|pâte|avoine|seigle|couscous|semoule|orge|épeautre|epeautre|boulgour|seitan|kamut|sauce soja|tamari|tortilla|wrap|naan|galette|crêpe|crepe|pancake|muffin/).test(gi))return false;} // BUG FIX : orge, épeautre, boulgour, seitan, kamut, sauce soja/tamari (gluten caché), avoine (contamination croisée), tortilla/naan/wrap manquaient — AFDIAG / INCO 2020
        if(it==='fructose'&&(/miel|pomme|poire|mangue|cerise|figue|datte/).test(ing))return false;
        if(it==='histamine'&&(/thon|saumon fumé|fromage|tomate|épinard|avocat|soja/).test(ing))return false;
      }return true;
    });
  }
  // Diabetics: soft-filter high-GI ingredients (prioritize low-GI sources — ADA 2023)
  var hasDiab=Array.isArray(s.medical)&&(s.medical.indexOf('diabete_t2')!==-1||s.medical.indexOf('diabete_t1')!==-1||s.medical.indexOf('prediabete')!==-1);
  if(hasDiab){var highGIban=/pain blanc|baguette|croissant|brioch[eé]|corn flakes|rice krispies|galette de mais|sirop de glucose|sucre blanc|sucre\s+\d|sucre vanill|bonbon|soda|jus de fruit|dattes|confiture|miel|riz blanc gluant/;var lowGIpool=r.filter(function(x){var i=_ri(x);return!highGIban.test(i)});if(lowGIpool.length>=3)r=lowGIpool;} // only filter if enough recipes remain
  // FIX P0 contre-audit 2026-04-15 — pescétarien (regime===1) manquait porc.
  // FIX P0r-BIS contre-audit : `steak` et `rillette` trop agressifs (bannissaient "Steak de
  // thon" / "Rillettes de sardines" qui sont OK en pescétarien). Patterns plus précis.
  if(s.regime===1)r=r.filter(function(x){var i=_ri(x);return!(/poulet|boeuf|bœuf|veau|dinde|agneau|kefta|steak\s+(?:hach[eé]|de\s+b[oœ]uf|de\s+veau|de\s+porc)|entrecôte|filet mignon|merguez|canard|lapin|lièvre|foie\s+(?:de\s+)?(?:volaille|veau|porc|boeuf)?|rognon|porc(?!ini)|cochon|\blard\b|lardon|bacon|pancetta|prosciutto|chorizo|pepperoni|saucisson|saucisse|andouille|boudin|rillette\s+(?:de\s+)?(?:porc|canard|poulet|volaille)|jambon(?!\s+de\s+dinde)|charcuterie/).test(i)});
  // Végétarien : ban poissons/viandes complet (inclut les 14 espèces absentes du ban vegan — cohérence nécessaire)
  // FIX P0 contre-audit 2026-04-15 — filtre végétarien (regime===2) incomplet :
  // manquait la famille porc (même faille que veganBan). Ajout cohérent.
  if(s.regime===2)r=r.filter(function(x){var i=_ri(x);return!(/poulet|boeuf|bœuf|veau|dinde|agneau|kefta|steak|saumon|thon|crevette|cabillaud|dorade|daurade|sardine|maquereau|poisson|sole|filet de bar|branzino|moules|poulpe|canard|lapin|lièvre|merguez|gambas|lotte|morue|foie|rognon|cœur|coeur|anchois|truite|colin|\bbar\b|lieu noir|mahi.?mahi|merlu|tilapia|hareng|mulet|pageot|vivaneau|saint-pierre|lingue|grondin|rascasse|porc(?!ini)|cochon|lard|lardon|bacon|pancetta|prosciutto|chorizo|pepperoni|saucisson|saucisse|andouille|boudin|rillette|jambon|charcuterie/).test(i)});
  // FIX P0 contre-audit 2026-04-15 — veganBan incomplet : le filtre laissait passer
  // "Tacos Al Pastor" (porc filet), "Dumplings Porc et Chou" (porc haché), Carbonara
  // (lardons fumés). Ajout complet de la famille porc : porc/cochon/lard/lardon/bacon/
  // pancetta/chorizo/pepperoni/saucisson/saucisse + lièvre + abats (rognon/foie/cœur).
  // Cohérence avec filtre halal ligne 4918 ci-dessous.
  if(s.regime===3){var veganBan=/poulet|boeuf|bœuf|veau|dinde|agneau|canard|kefta|steak|saumon|thon|crevette|cabillaud|sardine|maquereau|dorade|daurade|sole|lotte|morue|gambas|poisson|poulpe|oeuf|œuf|fromage|ricotta|feta|parmesan|mozzarella|cottage|emmental|skyr|labneh|yaourt|miel|whey|\bbar\b|lieu noir|mahi.?mahi|merlu|tilapia|hareng|truite|anchois|colin|branzino|mulet|pageot|vivaneau|saint-pierre|lingue|grondin|rascasse|lapin|lièvre|foie|rognon|cœur|coeur|jambon|charcuterie|porc(?!ini)|cochon|lard|lardon|bacon|pancetta|prosciutto|chorizo|pepperoni|saucisson|saucisse|merguez|andouille|boudin|rillette|p[âa]t[ée]|terrine|gel[ae]tine(?!\s+(?:agar|v[ée]g[ée]tal))/;r=r.filter(function(x){var i=_ri(x);if(veganBan.test(i))return false;if(/lait/.test(i)&&!/lait de coco|lait d.amande|lait d.avoine|lait de soja|lait de riz/.test(i))return false;if(/beurre/.test(i)&&!/beurre de cacahu|beurre d.amande|beurre de noisette|beurre de noix|beurre de coco/.test(i))return false;return true});} // beurre végétal (cacahuète, amande, noisette) autorisé en vegan
  // Grossesse : exclure les aliments contre-indiqués pendant la grossesse (OMS / ANSES 2022)
  // Risques : listériose (charcuterie crue, fromage au lait cru), parasites (poisson cru, sushi)
  // L'alcool traverse le placenta — aucune dose sûre (OMS 2014, ACOG 2021)
  if(s.pregnant&&window.isFemale(s)){r=r.filter(function(x){var i=_ri(x);
    // Poisson cru / sushi / carpaccio / ceviche / gravlax / tartare de poisson — élargi (carpaccio.*saumon, saumon tranché fin)
    if((/sushi|sashimi|tartare de (?:saumon|thon|poisson)|gravlax|carpaccio.*(?:saumon|thon|poisson)|ceviche|poisson cru|saumon (?:cru|tranché fin)|truite fumée|saumon fumé/).test(i))return false;
    // Alcool (même en cuisine — l'alcool ne s'évapore jamais totalement)
    if((/alcool|vin blanc|vin rouge|bière|rhum|cognac|whisky|vodka|porto|amaretto|mirin(?! halal)|sake/).test(i))return false;
    // Fromage au lait cru (listériose — ANSES 2022)
    if((/camembert au lait cru|brie au lait cru|roquefort|fromage de chèvre frais|fromage au lait cru|munster|époisses|livarot|pont.l.évêque/).test(i))return false;
    // Charcuterie crue / rillettes / pâté (listériose)
    if((/rillettes|p[âa]t[ée] de (?:foie|campagne)|jambon cru|jambon sec|charcuterie crue|saucisson cru|chorizo cru/).test(i))return false;
    return true;});}
  // Allaitement : exclure alcool en cuisine (passe dans le lait maternel — AAP 2012)
  if(!s.pregnant&&Array.isArray(s.medical)&&s.medical.indexOf('allaitement')!==-1){r=r.filter(function(x){var i=_ri(x);return!(/alcool|vin blanc|vin rouge|bière|rhum|cognac|whisky|vodka|porto|amaretto|mirin(?! halal)|sake/).test(i)});}
  // Halal : exclut porc, charcuterie porcine et alcool
  // Porc exclu par défaut — inclure si allowPork = true (opt-in explicite)
  if(!s.allowPork)r=r.filter(function(x){var i=_ri(x);return!(/porc(?!ini)|cochon|lard(?!on[s]?[-\s]+(?:de\s+)?(?:dinde|volaille|poulet))|bacon|jambon(?![-\s]+(?:de\s+)?(?:dinde|volaille|poulet))|saucisson|pepperoni|chorizo|pancetta|prosciutto|g\u00e9latine de porc|saucisse(?![-\s]+(?:de\s+)?(?:volaille|poulet|dinde|soja))|\bandouille\b|\bboudin\b/).test(i)});
  // Alcool en cuisine exclu par défaut — inclure si allowAlcohol = true
  if(!s.allowAlcohol)r=r.filter(function(x){var i=_ri(x);return!(/alcool|vin blanc|vin rouge|bi[e\u00e8]re|rhum|cognac|whisky|vodka|porto|amaretto|mirin(?! halal)/).test(i)});
  if(typeof s.excluded==='string'&&s.excluded&&s.excluded.trim()){var excl=s.excluded.toLowerCase().split(',').map(function(str){return str.trim()}).filter(Boolean);r=r.filter(function(x){var i=_ri(x);for(var e=0;e<excl.length;e++){if(i.indexOf(excl[e])!==-1)return false}return true})}
  var _cuisines=s.cuisines||[];if(_cuisines.indexOf(0)===-1&&_cuisines.length>0){var flags=[];for(var c=0;c<_cuisines.length;c++){var co=CUISINES[_cuisines[c]];if(co&&CUISINE_FLAGS[co.name])flags.push(CUISINE_FLAGS[co.name])}if(flags.length>0){var _preCuisinePool=r.slice();r=r.filter(function(x){return flags.indexOf(x.f)!==-1});if(r.length===0)r=_preCuisinePool;}} // fallback : si aucune recette ne correspond aux cuisines choisies, on garde le pool complet
  return r;
}
// ─── PROTEIN SOURCE DETECTION ───
var _PROT_MAP=[
{cat:'volaille',re:/poulet|dinde|escalope de dinde|blanc de poulet|cuisse de poulet/},
{cat:'poisson',re:/saumon|thon|cabillaud|sardine|dorade|daurade|maquereau|crevette|gambas|sole|lotte|morue|truite|bar |hareng|tilapia|merlu|anchois|colin|poulpe|poisson/},
{cat:'viande_rouge',re:/boeuf|b\u0153uf|veau|agneau|kefta|steak hach|filet de boeuf/},
{cat:'oeufs',re:/oeuf|\u0153uf|omelette|frittata/},
{cat:'legumineuses',re:/lentille|pois chiche|haricot|f\u00e8ve|edamame|houmous/},
{cat:'tofu_seitan',re:/tofu|tempeh|seitan/}
];
function getRecipeProtein(r){
var txt=((r.i||'')+(r.ingredients?r.ingredients.map(function(ig){return ig.name||''}).join(' '):'')).toLowerCase();
for(var i=0;i<_PROT_MAP.length;i++){if(_PROT_MAP[i].re.test(txt))return _PROT_MAP[i].cat;}
return null;
}
function getRecipeMainIngredient(r){
if(r.ingredients&&r.ingredients.length){var best=r.ingredients[0];for(var i=1;i<r.ingredients.length;i++){if((r.ingredients[i].qty||0)>(best.qty||0))best=r.ingredients[i];}return(best.name||'').toLowerCase();}
var txt=(r.i||'').toLowerCase();var parts=txt.split(',');return parts.length?parts[0].replace(/\d+\s*[a-z]*\s*/,'').trim():'';
}

function pickRecipe(pool,targetK,used,dayProteins,weekProtBudget){if(!pool||!pool.length)return{n:'Repas libre',k:targetK,p:Math.round(targetK*0.3/4),g:Math.round(targetK*0.4/4),l:Math.round(targetK*0.3/9),f:0,lv:1,i:'Adaptez selon vos pr\u00e9f\u00e9rences',st:[],w:0,tags:[]};var av=pool.filter(function(r){return!used.has(r.n)});if(!av.length)av=pool.slice();
// Score composite : proximité calorique + adéquation macros + diversité protéines
var s=window.S||{};var goalKey=(s.goal!==null&&s.goal!==undefined&&GOALS[s.goal])?GOALS[s.goal].key:'maintain';
// Bonus négatif pour les recettes favorites (étoiles 1-3) → remonte en tête du classement
var _favMap=(s.favoriteRecipes&&typeof s.favoriteRecipes==='object')?s.favoriteRecipes:{};
var scored=av.map(function(r){var calScore=Math.abs((r.k||0)-targetK);var macroScore=0;var totalMacroKcal=(r.p||0)*4+(r.g||0)*4+(r.l||0)*9;if(totalMacroKcal>0){var protPct=(r.p||0)*4/totalMacroKcal;if((goalKey==='cut'||goalKey==='shred'||goalKey==='recomposition')&&protPct<0.25){macroScore=100;}else if((goalKey==='bulk'||goalKey==='lean_bulk')&&protPct>0.45){macroScore=50;}}
// Pénaliser si même source protéique déjà dans la journée
var protCat=getRecipeProtein(r);var diversityPenalty=0;
if(protCat&&dayProteins&&dayProteins.indexOf(protCat)!==-1)diversityPenalty=80;
// Pénaliser si catégorie protéique sur-représentée dans la semaine
if(protCat&&weekProtBudget){var cnt=weekProtBudget[protCat]||0;var maxW={volaille:3,poisson:3,viande_rouge:2,oeufs:3,legumineuses:3,tofu_seitan:2};if(cnt>=(maxW[protCat]||3))diversityPenalty+=60;else if(cnt>=2)diversityPenalty+=20;}
// BUG-6 FIX: sportType-aware scoring (musculation → high-protein; endurance sports training day → high-carb)
// S._pickRecipeTrainingDay is set by generateWeek() just before calling pickRecipe (per-day flag).
var sportTypeBonus=0;
if(s.sportType&&totalMacroKcal>0){
  var protPct2=(r.p||0)*4/totalMacroKcal;
  var carbPct2=(r.g||0)*4/totalMacroKcal;
  if(s.sportType==='musculation'&&protPct2>=0.35){sportTypeBonus=-120;} // high-protein bonus for strength
  else if(s.sportType==='running'||s.sportType==='cycling'||s.sportType==='hyrox'||s.sportType==='triathlon'){
    // high-carb bonus on training days for endurance sports
    if(s._pickRecipeTrainingDay&&carbPct2>=0.50){sportTypeBonus=-120;}
  }
}
// Bonus favori : 1⭐=-200, 2⭐=-400, 3⭐=-600 — domine calScore/macroScore/diversity
var favStars=(r._id&&_favMap[r._id])?Math.max(1,Math.min(3,_favMap[r._id]|0)):0;
var favBonus=favStars?-(favStars*200):0;
return{recipe:r,score:calScore+macroScore+diversityPenalty+sportTypeBonus+favBonus};});scored.sort(function(a,b){return a.score-b.score});var top=scored.slice(0,Math.min(5,scored.length));var picked=top[Math.floor(Math.random()*top.length)].recipe;if(picked){used.add(picked.n);var pc=getRecipeProtein(picked);if(pc){if(dayProteins)dayProteins.push(pc);if(weekProtBudget)weekProtBudget[pc]=(weekProtBudget[pc]||0)+1;}}return picked||{n:'Repas libre',k:targetK,p:Math.round(targetK*0.3/4),g:Math.round(targetK*0.4/4),l:Math.round(targetK*0.3/9),f:0,lv:1,i:'',st:[],w:0,tags:[]}}
// Applique le scaling sur mesure pour les recettes R201+ (format riche) et L0XX-L3XX (format legacy)
function enrichWithScaling(recipe, targetKcal) {
  if (!recipe) return recipe;
  recipe = Object.assign({}, recipe); // clone to avoid mutating shared pool objects

  // Recettes R201+ (format riche) — scaling via RecipeEngine
  if (recipe._id && /^R\d+$/.test(recipe._id) && window.RecipeEngine && window.RecipeEngine.getAdaptedRecipe) {
    var nm = window.S._nm;
    if (!nm) return recipe;
    try {
      var adapted = window.RecipeEngine.getAdaptedRecipe(recipe._id, nm, { targetCalories: targetKcal });
      if (!adapted || !adapted.adaptedNutrition) return recipe;
      recipe.k = Math.round(adapted.adaptedNutrition.calories);
      recipe.p = Math.round(adapted.adaptedNutrition.proteinGrams);
      recipe.g = Math.round(adapted.adaptedNutrition.carbsGrams);
      recipe.l = Math.round(adapted.adaptedNutrition.fatGrams);
      recipe._scaledIngredients = adapted.ingredients || null;
      recipe._scalingRatio = adapted.scalingRatio || 1;
      // Appliquer les mesures pratiques sur les ingrédients scalés
      if (recipe._scaledIngredients && window.RecipeEngine && window.RecipeEngine.convertToDisplay) {
        recipe._scaledIngredients = recipe._scaledIngredients.map(function(ing) {
          var disp = window.RecipeEngine.convertToDisplay(ing.qty, ing.unit, ing.name);
          return { name: ing.name, qty: disp.qty, unit: disp.unit, note: ing.note };
        });
      }
    } catch(e) {
      console.error('[app-core] erreur:', e);
    }
    return recipe;
  }

  // Recettes legacy (format compact, _id = L0XX, L1XX, L2XX, L3XX)
  if (recipe._id && /^L\d+$/.test(recipe._id) && targetKcal && recipe.k && recipe.k > 0) {
    var ratio = targetKcal / recipe.k;
    // Limiter le ratio entre 0.5 et 2.0 pour rester réaliste
    ratio = Math.min(2.0, Math.max(0.5, ratio));
    recipe._scalingRatio = Math.round(ratio * 100) / 100;
    recipe.k = Math.round(recipe.k * ratio);
    recipe.p = Math.round((recipe.p || 0) * ratio);
    recipe.g = Math.round((recipe.g || 0) * ratio);
    recipe.l = Math.round((recipe.l || 0) * ratio);
    // Parser et scaler les ingrédients si RecipeEngine disponible
    if (window.RecipeEngine && window.RecipeEngine.parseIngredientsString && recipe.i) {
      var parsed = window.RecipeEngine.parseIngredientsString(recipe.i);
      recipe._scaledIngredients = parsed.map(function(ing) {
        var scaledQty = Math.round(ing.qty * ratio * 10) / 10;
        var disp = window.RecipeEngine.convertToDisplay ? window.RecipeEngine.convertToDisplay(scaledQty, ing.unit, ing.name) : { qty: scaledQty, unit: ing.unit };
        return { name: ing.name, qty: disp.qty, unit: disp.unit };
      });
    }
  }

  return recipe;
}
// ─── SMOOTHIE → COLLATION ─────────────────────────────────────────────────────
// Sélectionne un smoothie WHEY_SMOOTHIES adapté au profil et à la cible calorique.
// Retourne un objet au format plan (k/p/g/l/f/_id/_smoothie/ingredients/steps).
function pickSmoothieForPlan(targetKcal, usedIds) {
  var smDB = window.WHEY_SMOOTHIES;
  if (!smDB || !smDB.length) return null;
  var s = window.S;
  var goalKey = (s.goal !== null && s.goal !== undefined && GOALS[s.goal]) ? GOALS[s.goal].key : 'maintain';
  // Objectif → tags smoothie
  var wantedGoals;
  if (goalKey === 'bulk' || goalKey === 'lean_bulk') wantedGoals = ['muscle', 'performance', 'recovery'];
  else if (goalKey === 'cut' || goalKey === 'shred')  wantedGoals = ['fat_loss', 'performance'];
  else                                                 wantedGoals = ['muscle', 'fat_loss', 'performance', 'recovery'];
  // Timing préféré selon heure d'entraînement
  // Smoothie = snack slot (index 2). Déterminer si le snack est pré ou post-séance.
  // morning: snack=slot2, postSlot=1 → snack n'est ni pré ni post
  // noon: snack=slot2, postSlot=2 → snack IS post-séance
  // evening: snack=slot2, preSlot=2 → snack IS pré-séance
  var preferTiming = (s.trainTime === 'noon') ? 'post'
                   : (s.trainTime === 'evening') ? 'pre' : null;
  // Pool de départ — exclure déjà utilisés cette semaine
  var pool = smDB.filter(function(sm) { return !usedIds || !usedIds.has(sm.id); });
  if (!pool.length) pool = smDB.slice(); // reset si tous utilisés
  // Filtre parfum (soft — garder au moins 2 pour éviter la répétition)
  // Respecte les préférences de parfum whey déclarées dans l'onboarding (S.wheyFlavors)
  if (s.wheyFlavors && s.wheyFlavors.length > 0) {
    var fPool = pool.filter(function(sm) {
      return sm.flavors && sm.flavors.some(function(fl) { return s.wheyFlavors.indexOf(fl) !== -1; });
    });
    if (fPool.length >= 2) pool = fPool;
  }
  // Filtre objectif (soft — garder au moins 3)
  var gPool = pool.filter(function(sm) {
    return sm.goal && sm.goal.some(function(g) { return wantedGoals.indexOf(g) !== -1; });
  });
  if (gPool.length >= 3) pool = gPool;
  // Filtre timing (soft — garder au moins 2)
  if (preferTiming) {
    var tPool = pool.filter(function(sm) { return sm.timing === preferTiming || sm.timing === 'anytime'; });
    if (tPool.length >= 2) pool = tPool;
  }
  // Trier par proximité calorique, choisir parmi top 5
  pool.sort(function(a, b) { return Math.abs(a.cal - targetKcal) - Math.abs(b.cal - targetKcal); });
  var top = pool.slice(0, Math.min(5, pool.length));
  var sm = top[Math.floor(Math.random() * top.length)];
  if (!sm) return null;
  if (usedIds) usedIds.add(sm.id);
  // Convertir au format plan : g=glucides(sm.c), l=lipides(sm.f), f=emoji
  return {
    _id: sm.id, n: sm.name,
    k: sm.cal, p: sm.p, g: sm.c, l: sm.f,
    f: '\uD83E\uDD5B', // 🥤
    _smoothie: true,
    ingredients: sm.ingredients || [],
    steps: sm.steps || [],
    w: 1, lv: 1,
    tags: ['smoothie', 'whey'],
    i: sm.name
  };
}
window.pickSmoothieForPlan = pickSmoothieForPlan;

function generateWeek(){var s=window.S;var cBase=calcTarget();if(!cBase||cBase<=0)return[];var plan=[];var uB=new Set,uL=new Set,uS=new Set,uD=new Set,uSM=new Set;var weekProtBudget={};var pB=filterRecipes(getPool('breakfast'),'breakfast'),pL=filterRecipes(getPool('lunch'),'lunch'),pS=filterRecipes(getPool('snack'),'snack'),pD=filterRecipes(getPool('dinner'),'dinner');
// FIX P0 audit : si combinaison allergies + régime + intolérances rend les pools quasi-vides
// (< 2 recettes par slot principal), on flag l'incohérence pour que l'UI affiche une alerte.
// Ne pas retourner [] (laisse le moteur générer ce qu'il peut), juste signaler.
try {
  if (pB.length < 2 || pL.length < 2 || pD.length < 2) {
    console.warn('[generateWeek] Pools très restreints : breakfast=' + pB.length + ' lunch=' + pL.length + ' dinner=' + pD.length + ' — combinaison allergies/régime/intolérances peut empêcher un plan varié.');
    s._weekPlanRestrictionsTooStrict = true;
  } else {
    s._weekPlanRestrictionsTooStrict = false;
  }
} catch(_e) {}
var pSW=pS.filter(function(r){return r.w}),pSN=pS.filter(function(r){return!r.w&&!(r.tags&&r.tags.indexOf('dessert')>=0)});var pSD=s.wantsDessert?pS.filter(function(r){return r.tags&&r.tags.indexOf('dessert')>=0}):[];var DESSERT_DAYS=[0,2,4];var meals=s.mealsPerDay||3;
// useSmoothing : whey activé + WHEY_SMOOTHIES disponible + regime non-vegan (whey = protéine animale)
// _canSmooth : base condition (whey activé, DB disponible, pas vegan)
// Allergie lait/produits laitiers : whey = protéine lactée → bloquer les smoothies whey (sécurité allergène)
var _hasLaitAllergy=Array.isArray(s.allergies)&&(s.allergies.indexOf('Lait/Produits laitiers')!==-1||s.allergies.indexOf('Lactose')!==-1);
var _canSmooth=!!(s.whey&&window.WHEY_SMOOTHIES&&window.WHEY_SMOOTHIES.length&&s.regime!==3&&!_hasLaitAllergy);
var _kcalFloorDay=window.isFemale(s)?1400:1500;
for(var d=0;d<7;d++){var dayProteins=[];var split=getAdaptedMealSplit(d);var c=Math.max(_kcalFloorDay,Math.round(cBase*(split.calMultiplier||1)));var bT=Math.round(c*split.pctBreak),lT=Math.round(c*split.pctLunch),sT=Math.round(c*split.pctSnack),dT=Math.round(c*split.pctDinner);
// BUG-6 FIX: expose per-day training flag to pickRecipe for sportType-aware scoring
s._pickRecipeTrainingDay=!!(split.dayInfo&&split.dayInfo.isTraining);
// SFC Symbiosis : carbBoost propagé pour que pickRecipe favorise les recettes glucidiques les jours training
s._pickRecipeCarbBoost = split.carbBoost || 1.0;
// Déduplication intra-journée : éviter le même plat en déjeuner ET dîner (même recette dans les 2 pools)
var bR=pickRecipe(pB,bT,uB,dayProteins,weekProtBudget);
// Bloquer le petit-déj dans les pools déjeuner/dîner du même jour
if(bR&&bR.n){uL.add(bR.n);uD.add(bR.n);}
var lR=pickRecipe(pL,lT,uL,dayProteins,weekProtBudget);
// Bloquer le déjeuner dans le pool dîner du même jour — fix principal du doublon
if(lR&&lR.n)uD.add(lR.n);
var sR=null,dR=null;
// Snack : généré seulement si mealsPerDay >= 4 et split > 0
// Si whey activé → smoothie whey uniquement les jours d'entraînement (ISSN 2017 : timing post-workout)
// Jours de repos : collation normale (le smoothie whey cible la fenêtre anabolique post-séance)
var _dayInfoSmooth=getDayType(d);
var _useSmoothing=_canSmooth&&_dayInfoSmooth.isTraining;
if(meals>=4&&sT>0){var isDessertDay=s.wantsDessert&&pSD.length>0&&DESSERT_DAYS.indexOf(d)!==-1;if(isDessertDay)sR=pickRecipe(pSD,sT,uS,dayProteins,weekProtBudget);else if(_useSmoothing){sR=pickSmoothieForPlan(sT,uSM);// Fallback si pickSmoothieForPlan retourne null (DB vide ou tous utilisés)
if(!sR&&pSN.length>0)sR=pickRecipe(pSN,sT,uS,dayProteins,weekProtBudget);else if(!sR)sR=pickRecipe(pS,sT,uS,dayProteins,weekProtBudget);}else if(pSN.length>0)sR=pickRecipe(pSN,sT,uS,dayProteins,weekProtBudget);else sR=pickRecipe(pS,sT,uS,dayProteins,weekProtBudget);
// Bloquer le nom du snack dans les Sets des autres slots — déduplication intra-journée complète
if(sR&&sR.n){uB.add(sR.n);uL.add(sR.n);uD.add(sR.n);}}
// Dîner : généré seulement si mealsPerDay >= 3 (pas pour jeûne intermittent 2 repas)
if(meals>=3&&dT>0)dR=pickRecipe(pD,dT,uD,dayProteins,weekProtBudget);
// Scaling sur mesure : enrichit les recettes R201+ avec macros/ingrédients scalés
// (smoothies déjà calibrés — enrichWithScaling passthrough sans effet sur _smoothie:true)
bR=enrichWithScaling(bR,bT);lR=enrichWithScaling(lR,lT);if(sR&&!sR._smoothie)sR=enrichWithScaling(sR,sT);if(dR)dR=enrichWithScaling(dR,dT);
// Ajustement itératif ±5% : corriger le slot le plus déviant jusqu'à convergence (max 8 passes)
// Quand smoothie dans le snack → slot fixe (choix utilisateur), ajustement sur B/L/D uniquement
var isDessertDayPool=s.wantsDessert&&pSD.length>0&&DESSERT_DAYS.indexOf(d)!==-1;var sPool=meals>=4&&sT>0&&!_useSmoothing?(isDessertDayPool?pSD:(pSN.length>0?pSN:pS)):null;
for(var attempt=0;attempt<8;attempt++){var dayTot=(bR?bR.k:0)+(lR?lR.k:0)+(sR?sR.k:0)+(dR?dR.k:0);if(!c||Math.abs(dayTot-c)/c*100<=5)break;var sc=[bR?{key:'b',r:bR,pool:pB,used:uB,t:bT}:null,lR?{key:'l',r:lR,pool:pL,used:uL,t:lT}:null,(sR&&sPool)?{key:'s',r:sR,pool:sPool,used:uS,t:sT}:null,dR?{key:'d',r:dR,pool:pD,used:uD,t:dT}:null].filter(Boolean);if(!sc.length)break;sc.sort(function(a,b){return Math.abs(b.r.k-b.t)-Math.abs(a.r.k-a.t)});var w=sc[0];var otherTot=dayTot-w.r.k;var compT=c-otherTot;var nr=pickRecipe(w.pool,compT,w.used,dayProteins,weekProtBudget);if(!nr||nr.n===w.r.n)break;nr=enrichWithScaling(nr,compT);if(w.key==='b'){bR=nr;// Sync nom dans les autres Sets pour éviter les doublons inter-slots
if(nr&&nr.n){uL.add(nr.n);uS.add(nr.n);uD.add(nr.n);}}else if(w.key==='l'){lR=nr;if(nr&&nr.n){uS.add(nr.n);uD.add(nr.n);}}else if(w.key==='s'){sR=nr;if(nr&&nr.n){uB.add(nr.n);uL.add(nr.n);uD.add(nr.n);}}else{dR=nr;if(nr&&nr.n){uL.add(nr.n);uS.add(nr.n);}}}
// Agréger les macros du jour pour le dashboard (today-dashboard lit _dayPlan.kcal/.p/.g/.l)
var _dP=Math.round((bR?bR.p||0:0)+(lR?lR.p||0:0)+(sR?sR.p||0:0)+(dR?dR.p||0:0));
var _dG=Math.round((bR?bR.g||0:0)+(lR?lR.g||0:0)+(sR?sR.g||0:0)+(dR?dR.g||0:0));
var _dL=Math.round((bR?bR.l||0:0)+(lR?lR.l||0:0)+(sR?sR.l||0:0)+(dR?dR.l||0:0));
// BUG-7 FIX: use actual meal kcal sum (not planned target c) to keep day.kcal in sync with meals
var _dK=Math.round((bR?bR.k||0:0)+(lR?lR.k||0:0)+(sR?sR.k||0:0)+(dR?dR.k||0:0));
plan.push({breakfast:bR,lunch:lR,snack:sR,dinner:dR,kcal:_dK,targetKcal:c,p:_dP,g:_dG,l:_dL})}// BUG-6 cleanup: remove per-day training flag from profile state after generation
try{delete s._pickRecipeTrainingDay;}catch(_del){}if(window.validateWeekPlan){try{window.validateWeekPlan(plan);}catch(_ve){}}return plan}
function swapMeal(di,slot){
  var s=window.S;
  if(!s.weekPlan||!s.weekPlan[di])return;
  // MINEUR: valider slot avant de continuer
  var VALID_SLOTS=['breakfast','lunch','snack','dinner'];
  if(VALID_SLOTS.indexOf(slot)===-1)return;
  // 2026-04 SYMBIOSE : détecter si c'est un jour sport pour activer le carb cycling
  // (avant ce fix : trainingDay=false systématique → algo carb cycling jamais appliqué)
  if(!s._nm&&window.computeNutritionState){
    var _isTrainingDay = false;
    try { var _di = getDayType(di); _isTrainingDay = !!(_di && _di.isTraining); } catch(e) {}
    window.computeNutritionState(_isTrainingDay);
  }
  var cBase=calcTarget(),split=getAdaptedMealSplit(di);if(!split)return;var _swapFloor=window.isFemale(s)?1400:1500;var c=Math.max(_swapFloor,Math.round(cBase*(split.calMultiplier||1)));
  // BUG-6 FIX: set training day flag so pickRecipe sportType-aware scoring applies on swap too
  s._pickRecipeTrainingDay=!!(split.dayInfo&&split.dayInfo.isTraining);
  var tgt=slot==='breakfast'?Math.round(c*split.pctBreak):slot==='lunch'?Math.round(c*split.pctLunch):slot==='snack'?Math.round(c*split.pctSnack):Math.round(c*split.pctDinner);
  // Snack + whey → swapper vers un autre smoothie (pas une collation normale)
  // Condition : whey activé + jour d'entraînement + non-vegan (cohérent avec generateWeek)
  var _swapDayInfo=getDayType(di);
  var _swapLaitAllergy=Array.isArray(s.allergies)&&(s.allergies.indexOf('Lait/Produits laitiers')!==-1||s.allergies.indexOf('Lactose')!==-1);
  if(slot==='snack'&&s.whey&&s.regime!==3&&!_swapLaitAllergy&&window.WHEY_SMOOTHIES&&window.WHEY_SMOOTHIES.length&&_swapDayInfo.isTraining){
    var curId=(s.weekPlan[di][slot]&&s.weekPlan[di][slot]._id)||'';
    var usedSm=new Set([curId]);
    var nrSm=pickSmoothieForPlan(tgt,usedSm);
    if(nrSm){s.weekPlan[di][slot]=nrSm;var _ssQ=['breakfast','lunch','snack','dinner'],_ssD=s.weekPlan[di],_ssT={k:0,p:0,g:0,l:0};_ssQ.forEach(function(q){var m=_ssD[q];if(m){_ssT.k+=m.k||0;_ssT.p+=m.p||0;_ssT.g+=m.g||0;_ssT.l+=m.l||0;}});_ssD.kcal=_ssT.k;_ssD.p=_ssT.p;_ssD.g=_ssT.g;_ssD.l=_ssT.l;if(window.validateWeekPlan){try{window.validateWeekPlan(s.weekPlan);}catch(_ve){}}if(typeof window.saveProfile==='function'){try{window.saveProfile();}catch(e){}}if(typeof window.render==='function')window.render();return;}
    // Fallback : smoothie DB épuisé → swap vers collation normale
  }
  // Autres slots — swap recette normale
  var pool=filterRecipes(getPool(slot),slot);
  var cur=s.weekPlan[di][slot];
  if(!cur)return; // slot vide (plan IF 2-3 repas) → rien à swapper
  // Noms déjà utilisés dans les autres slots du même jour → exclure du swap
  var _daySlots=['breakfast','lunch','snack','dinner'];
  var _dayUsedNames=new Set();
  _daySlots.forEach(function(sl){if(sl!==slot&&s.weekPlan[di][sl]&&s.weekPlan[di][sl].n)_dayUsedNames.add(s.weekPlan[di][sl].n);});
  var av=pool.filter(function(r){return r.n!==cur.n&&!_dayUsedNames.has(r.n)});
  if(!av.length)av=pool.filter(function(r){return r.n!==cur.n;}); // fallback si tous exclus
  if(!av.length)return; // pool contient uniquement la recette actuelle — rien à swapper
  av.sort(function(a,b){return Math.abs(a.k-tgt)-Math.abs(b.k-tgt)});
  var top=av.slice(0,Math.min(5,av.length));
  var nr=top[Math.floor(Math.random()*top.length)];
  if(!nr)return; // sécurité — ne devrait pas arriver après le guard ci-dessus
  nr=enrichWithScaling(nr,tgt);
  s.weekPlan[di][slot]=nr;
  var _rtQ=['breakfast','lunch','snack','dinner'],_rtD=s.weekPlan[di],_rtT={k:0,p:0,g:0,l:0};
  _rtQ.forEach(function(q){var m=_rtD[q];if(m){_rtT.k+=m.k||0;_rtT.p+=m.p||0;_rtT.g+=m.g||0;_rtT.l+=m.l||0;}});
  _rtD.kcal=_rtT.k;_rtD.p=_rtT.p;_rtD.g=_rtT.g;_rtD.l=_rtT.l;
  // BUG-6 cleanup: remove training flag from state after swap
  try{delete s._pickRecipeTrainingDay;}catch(_del){}
  if(window.validateWeekPlan){try{window.validateWeekPlan(s.weekPlan);}catch(_ve){}}
  if(typeof window.saveProfile==='function'){try{window.saveProfile();}catch(e){}}
  if(typeof window.render==='function')window.render();
}

// ─── NUTRITIONAL SYNERGY TIPS ───
function getNutritionalTips(meal){
if(!meal)return[];
var tips=[];
var txt=((meal.i||'')+(meal.ingredients?meal.ingredients.map(function(ig){return ig.name||''}).join(' '):'')+' '+(meal.tags||[]).join(' ')).toLowerCase();
// Fer végétal + vitamine C
if(/lentille|pois chiche|haricot|épinard|edamame/.test(txt)){
  if(!/citron|kiwi|poivron|orange|tomate/.test(txt))tips.push('Ajoutez un filet de citron ou un kiwi — la vitamine C multiplie par 3 l\u2019absorption du fer v\u00e9g\u00e9tal.');
}
// Curcuma sans poivre
if(/curcuma/.test(txt)&&!/poivre/.test(txt)){
  tips.push('Le curcuma seul a une biodisponibilit\u00e9 de 1%. Ajoutez du poivre noir (pip\u00e9rine \u00d72000%) ou des lipides.');
}
// Protéines >40g par repas
if(meal.p&&meal.p>40){
  tips.push('Ce repas contient '+meal.p+'g de prot\u00e9ines. Au-del\u00e0 de 40g/repas, r\u00e9partissez sur plusieurs repas pour une meilleure synth\u00e8se musculaire.');
}
// Vitamines liposolubles (A, D, E, K) sans lipides
if(/carotte|patate douce|\u00e9pinard|brocoli|mangue|abricot/.test(txt)&&meal.l&&meal.l<5){
  tips.push('Ce repas est riche en vitamines liposolubles (A, K). Ajoutez un filet d\u2019huile d\u2019olive pour am\u00e9liorer leur absorption.');
}
return tips;
}
window.getNutritionalTips=getNutritionalTips;

window.getPool = getPool;
window.filterRecipes = filterRecipes;
window.pickRecipe = pickRecipe;
window.enrichWithScaling = enrichWithScaling;
window.generateWeek = generateWeek;
window.swapMeal = swapMeal;

// ─── PLAN HASH — détecte changement paramètres nutritionnels critiques ────
// Si l'un de ces paramètres change depuis la dernière génération du plan,
// weekPlan doit être régénéré pour rester cohérent avec le profil.
// BUG A fix : sportDays et trainingDaysSelected influencent le calMultiplier via
// getAdaptedMealSplit() → getDayType(). Un changement de planning sport doit
// invalider le weekPlan pour que les macros soient recalculées correctement.
// 2026-04 FIX MAJEUR : hash basé UNIQUEMENT sur les paramètres qui DÉTERMINENT
// les RECETTES proposées (pas les paramètres biométriques qui changent naturellement).
//
// AVANT (bug) : weight/height/age/sex/activity/sleep dans le hash
//   → user enregistre poids 79.5 → hash change → bandeau "Valider mon programme"
//   → user frustré : "j'ai validé hier !"
//
// APRÈS (fix) : seuls les paramètres qui PILOTENT les choix de recettes :
//   - Objectif (goal) : muscle/cut/maintain change la composition
//   - Régime (regime) : végé/vegan filtre les recettes
//   - Allergies/intolérances : exclusion d'ingrédients
//   - Cuisines préférées + cookLevel : type de recettes
//   - Médical/grossesse/halal : filtres santé/religion
//   - Repas/jour : nombre de plats à générer
//   - Whey/wantsDessert : ajout/retrait collations spécifiques
//   - Jours sport : impacte le carb cycling (recette différente jour repos vs sport)
//
// EXCLUS du hash (ne déclenchent plus de revalidation intempestive) :
//   - weight/height/age : changent naturellement, ne changent que les MACROS cibles
//     (recalculées silencieusement via _nm = null)
//   - sex : ne devrait jamais changer
//   - activity (PAL), sleep : modifient les besoins kcal mais pas les recettes
//   - cycle menstruel : affecte les macros, pas les recettes choisies
//   - trainTime : horaire d'entraînement (modifie le timing meals, pas les recettes)
window.getPlanHash = function() {
  var s = window.S;
  if (!s) return '';
  return [
    s.goal !== undefined && s.goal !== null ? String(s.goal) : '',
    s.mealsPerDay || 3,
    s.regime || 0,
    s.whey ? '1' : '0',
    Array.isArray(s.allergies) ? s.allergies.slice().sort().join(',') : '',
    Array.isArray(s.intolerances) ? s.intolerances.slice().sort().join(',') : '',
    s.wantsDessert ? '1' : '0',
    Array.isArray(s.trainingDaysSelected) ? s.trainingDaysSelected.slice().sort().join(',') : '',
    s.weeklyCalendar ? JSON.stringify(s.weeklyCalendar) : '',
    s.pregnant ? '1' : '0',
    s.allowPork ? '1' : '0',
    s.allowAlcohol ? '1' : '0',
    typeof s.excluded === 'string' ? s.excluded : '',
    s.cookLevel !== undefined && s.cookLevel !== null ? String(s.cookLevel) : '',
    Array.isArray(s.cuisines) ? s.cuisines.slice().sort().join(',') : '',
    Array.isArray(s.medical) ? s.medical.slice().sort().join(',') : '',
    Array.isArray(s.wheyFlavors) ? s.wheyFlavors.slice().sort().join(',') : (s.wheyFlavors || '')
  ].join('|');
};

// ─── SUPPLEMENTS DATABASE (Grade A evidence ONLY) ───
// Only supplements with overwhelming scientific evidence + personalized to user needs
var SUPPLEMENTS_DB = [
  {id:'whey',name:'Whey Prot\u00e9ine',icon:'\uD83E\uDD5B',desc:'Atteindre l\'objectif prot\u00e9ique quotidien',evidence:'ISSN 2017 \u2014 Niveau A (700+ \u00e9tudes)',grade:'A',
    condition:function(s){return s.whey===1||s.whey===true;}, // Only if user explicitly wants whey
    unnecessary_if:'Inutile si vous atteignez vos prot\u00e9ines via l\'alimentation seule',
    dosageCalc:function(s){var w=Number(s.weight)||75;var d=w>80?35:25;return{dose:d,unit:'g/prise',timing:'Post-entra\u00eenement ou petit-d\u00e9jeuner',note:'Objectif total : '+Math.round(w*1.8)+'g prot/jour (alimentation + whey)'};}},
  {id:'creatine',name:'Cr\u00e9atine Monohydrate',icon:'\uD83D\uDC8A',desc:'Force, masse musculaire, r\u00e9cup\u00e9ration',evidence:'ISSN 2017 \u2014 Niveau A (500+ \u00e9tudes, le suppl\u00e9ment le plus \u00e9tudi\u00e9)',grade:'A',
    condition:function(s){if((s.pregnant&&window.isFemale(s))||(getAge()!==null&&getAge()<18))return false;if(s.medical&&s.medical.indexOf('irc')!==-1)return false;var goals=s.sportGoals||[];return s.activity!==null&&s.activity>=2&&(goals.indexOf('muscle')!==-1||goals.indexOf('shred')!==-1);},
    unnecessary_if:'Non n\u00e9cessaire si objectif uniquement endurance/cardio sans musculation',
    dosageCalc:function(s){return{dose:'3-5',unit:'g/jour',timing:'Apr\u00e8s l\'entra\u00eenement avec glucides',note:'Tous les jours y compris repos. Pas de phase de charge n\u00e9cessaire'};}},
  {id:'vitamine_d',name:'Vitamine D3',icon:'\u2600\uFE0F',desc:'Carence fr\u00e9quente m\u00eame en climat ensoleill\u00e9 (travail en int\u00e9rieur, cr\u00e8me solaire)',evidence:'Endocrine Society 2011 \u2014 Recommandation forte',grade:'A',
    condition:function(){return true;},
    unnecessary_if:'V\u00e9rifiez par prise de sang (objectif 40-60 ng/mL)',
    dosageCalc:function(s){
      // Endocrine Society 2011 : obèse (IMC>30) = séquestration D3 dans tissu adipeux → 2-3× les besoins
      var bmi=s.weight&&s.height?s.weight/Math.pow(s.height/100,2):22;
      var d=2000;
      if(bmi>30)d=4000; // Endocrine Society 2011 : obèse → 6000 UI correction, 4000 UI maintenance
      else if(bmi>25)d=2500; // Surpoids léger : légère séquestration
      var _ageD=getAge();if(_ageD>70)d=Math.max(d,3000); // 70+ : synthèse cutanée réduite de 75% (Holick 2007)
      else if(_ageD>50)d=Math.max(d,2500); // 50-70 : synthèse réduite
      return{dose:d,unit:'UI/jour',timing:'Au petit-d\u00e9jeuner ou d\u00e9jeuner, avec une source de lipides (\u0153ufs, avocat, huile d\u2019olive). Vitamine liposoluble : jamais \u00e0 jeun.',note:'Dosage sanguin recommand\u00e9 (objectif 40-60 ng/mL). Obésité : D3 séquestrée dans tissu adipeux, besoins × 2-3 (Endocrine Society 2011). Associer à Vitamine K2 (MK-7) si ≥50 ans — prévient calcifications artérielles (Plaza 2021).'};}},
  {id:'omega3',name:'Om\u00e9ga-3 (EPA/DHA)',icon:'\uD83D\uDC1F',desc:'Anti-inflammatoire, c\u0153ur, cognition',evidence:'AHA 2019 \u2014 Recommandation',grade:'A',
    condition:function(s){return s.regime!==3&&(s.allergies||[]).indexOf('Poisson')===-1&&(s.allergies||[]).indexOf('Crustac\u00e9s')===-1;}, // Vegan : utiliser DHA algues à la place
    unnecessary_if:'Inutile si vous mangez du poisson gras 2-3x/semaine (saumon, sardines, maquereau)',
    dosageCalc:function(s){var d=1000;if(s.activity!==null&&s.activity>=3)d=2000;return{dose:d,unit:'mg EPA+DHA/jour',timing:'Pendant un repas',note:'Ratio EPA:DHA 2:1 pour sportifs'};}},
  {id:'magnesium',name:'Magn\u00e9sium (Bisglycinate)',icon:'\uD83E\uDDEA',desc:'Sommeil, crampes, r\u00e9cup\u00e9ration — sensibilit\u00e9 \u00e0 l\'insuline (diab\u00e8te T2)',evidence:'EFSA 2015 \u2014 Apport recommand\u00e9. ADA 2023 : d\u00e9ficit magn\u00e9sium fr\u00e9quent en diab\u00e8te T2 (r\u00e9sistance insuline)',grade:'A',
    condition:function(s){var hasDiab=s.medical&&(s.medical.indexOf('diabete_t2')!==-1||s.medical.indexOf('prediabete')!==-1);return hasDiab||(s.sleep!==null&&s.sleep<=1)||(s.activity!==null&&s.activity>=3);},
    unnecessary_if:'Non prioritaire si bon sommeil, entra\u00eenement mod\u00e9r\u00e9 et absence de diab\u00e8te/pr\u00e9-diab\u00e8te',
    dosageCalc:function(s){var d=window.isMale(s)?400:310;if(s.activity!==null&&s.activity>=3)d+=50;var hasDiab=s.medical&&(s.medical.indexOf('diabete_t2')!==-1||s.medical.indexOf('prediabete')!==-1);return{dose:d,unit:'mg/jour',timing:'Le soir avant le coucher',note:hasDiab?'Forme bisglycinate mieux tol\u00e9r\u00e9e. Le magn\u00e9sium am\u00e9liore la sensibilit\u00e9 \u00e0 l\'insuline et r\u00e9duit l\'insulino-r\u00e9sistance (ADA 2023, Guerrero-Romero 2011). Bilan magn\u00e9s\u00e9mie conseill\u00e9.':'Forme bisglycinate mieux tol\u00e9r\u00e9e'};}},
  {id:'fer',name:'Fer',icon:'\uD83E\uDE78',desc:'Transport d\'oxyg\u00e8ne, \u00e9nergie',evidence:'OMS \u2014 Recommandation (femmes)',grade:'A',
    condition:function(s){return (window.isFemale(s)&&getAge()<51)||(s.pregnant&&window.isFemale(s));},
    unnecessary_if:'Hommes : ne suppl\u00e9mentez PAS sans analyse de sang (surdosage dangereux)',warning:'\u26A0 Dosage sanguin (ferritine) OBLIGATOIRE avant suppl\u00e9mentation',
    dosageCalc:function(s){var d=(s.pregnant&&window.isFemale(s))?27:18;if(window.isFemale(s)&&getAge()>50)d=8;return{dose:d,unit:'mg/jour',timing:'\u00c0 jeun avec vitamine C',note:'Surdosage dangereux. Toujours sur avis m\u00e9dical'};}},
  {id:'folique',name:'Acide folique',icon:'\uD83E\uDD30',desc:'Pr\u00e9vention spina bifida (grossesse)',evidence:'ACOG 2020 \u2014 Recommandation forte',grade:'A',
    condition:function(s){return s.pregnant===true&&window.isFemale(s);},
    unnecessary_if:'Uniquement pendant la grossesse (et id\u00e9alement d\u00e8s le projet de grossesse)',
    dosageCalc:function(){return{dose:'400-800',unit:'\u00b5g/jour',timing:'Le matin',note:'Commencer d\u00e8s le projet de grossesse, maintenir pendant tout le T1'};}},
  {id:'vitamine_b12',name:'Vitamine B12',icon:'\uD83D\uDC8A',desc:'Ind\u00e9pensable pour les v\u00e9gans — absente des v\u00e9g\u00e9taux',evidence:'EFSA 2015 \u2014 Niveau A — seule vitamine introuvable dans les v\u00e9g\u00e9taux',grade:'A',
    condition:function(s){return s.regime===3;},
    warning:'\u26A0 CARENCE GRAVE si non suppl\u00e9ment\u00e9 : an\u00e9mie pernicieuse, neuropathies irr\u00e9versibles. Prise de sang annuelle obligatoire.',
    unnecessary_if:'Non n\u00e9cessaire si r\u00e9gime omnivore, pescétarien ou v\u00e9g\u00e9tarien lacto-ovo (\u0153ufs et produits laitiers en apportent)',
    dosageCalc:function(){return{dose:'1000',unit:'\u00b5g/semaine (ou 50\u00b5g/jour)',timing:'Avec un repas',note:'Formes recommand\u00e9es : m\u00e9thylcobalamine ou cyanocobalamine. Prise de sang ferritine + B12 annuelle.'};}},
  {id:'dha_algues',name:'DHA Algues (Om\u00e9ga-3 v\u00e9gan)',icon:'\uD83C\uDF3F',desc:'Source v\u00e9gane de DHA — bioéquivalent au DHA de poisson',evidence:'EFSA 2012 \u2014 DHA algues bioéquivalent au DHA poisson (gras cérébraux, cardiovasculaire)',grade:'A',
    condition:function(s){return s.regime===3||(s.pregnant&&window.isFemale(s)&&s.allergies&&s.allergies.indexOf('Poisson')!==-1);},
    unnecessary_if:'Non n\u00e9cessaire si vous consommez du poisson gras 2-3x/semaine (saumon, sardines, maquereau)',
    dosageCalc:function(s){var d=(s.pregnant&&window.isFemale(s))?300:200;return{dose:d,unit:'mg DHA/jour',timing:'Pendant un repas avec des graisses',note:'Cherchez "DHA d\'algues" ou "algal DHA". Durable et sans contaminants marins.'};}},
  {id:'calcium_vegan',name:'Calcium',icon:'\uD83E\uDDB4',desc:'Ossature, contraction musculaire, nerveux',evidence:'IOF 2017 \u2014 Apport r\u00e9f\u00e9rence nutritionnel : 1000 mg/jour',grade:'A',
    condition:function(s){return s.regime===3&&!(s.pregnant&&window.isFemale(s));},
    unnecessary_if:'Non n\u00e9cessaire si vous consommez produits laitiers régulièrement (lacto-ovo végétarien, omnivore)',
    dosageCalc:function(){return{dose:1000,unit:'mg/jour (fractionner en 500mg × 2)',timing:'Avec les repas (matin + soir)',note:'Formes : citrate de calcium (mieux absorbé) ou carbonate avec repas. Associer à vitamine D.'};}},
  {id:'iode_vegan',name:'Iode',icon:'\uD83C\uDF0A',desc:'Thyroïde, métabolisme, développement cérébral',evidence:'OMS 2007 — Apport recommand\u00e9 150-250 µg/jour',grade:'A',
    condition:function(s){return s.regime>=2;},
    unnecessary_if:'Non n\u00e9cessaire si vous consommez poissons, fruits de mer ou produits laitiers régulièrement',
    dosageCalc:function(s){var d=(s.pregnant&&window.isFemale(s))?220:150;return{dose:d,unit:'\u00b5g/jour',timing:'Avec un repas',note:'Utiliser sel iod\u00e9 et consommer algues mod\u00e9r\u00e9ment (wakame, nori). Attention aux algues riches en iode (kelp) : risque surdosage.'};
  }},
  {id:'zinc_vegan',name:'Zinc',icon:'\uD83E\uDDEC',desc:'Immunité, testostérone, synthèse protéique — biodisponibilité réduite dans les végétaux',evidence:'FAO/OMS 2002 — Biodisponibilité zinc végétal réduite de 50% par les phytates (légumineuses, céréales)',grade:'A',
    condition:function(s){return s.regime>=2;}, // Végétarien, Pescétarien, Végan
    unnecessary_if:'Non n\u00e9cessaire si régime omnivore (huîtres, bœuf, foie = sources zinc héminique)',
    warning:'\u26A0 Phytates dans légumineuses et céréales complètes réduisent absorption zinc de 40-50%. Techniques : trempage/germination des légumineuses, fermentation (pain au levain).',
    dosageCalc:function(s){
      // OMS 2002 : AJR zinc × 1.5 pour végans/végétariens (correction phytates)
      var base=window.isMale(s)?11:8; // AJR standard ANSES 2021
      var dose=Math.round(base*1.5); // +50% pour compenser phytates
      return{dose:dose,unit:'mg/jour',timing:'Entre les repas ou au coucher (éloigné du calcium/fer)',note:'Formes recommandées : gluconate ou citrate de zinc. Max 25mg/j (seuil UL EFSA). Prise de sang zinc sérique conseillée si supplémentation >3 mois.'};
    }
  },
  // ─── CAFÉINE — ISSN Position Stand 2021 (Grgic et al.) Grade A ───
  // 3-6 mg/kg avant entraînement : améliore force, endurance, puissance, focus
  // Sécurité : contre-indiqué grossesse (> 200mg/j — OMS), HTA non contrôlée, anxiété sévère
  {id:'cafeine',name:'Caféine',icon:'\u2615',desc:'Performance, focus, endurance, force',evidence:'ISSN Position Stand 2021 (Grgic et al.) \u2014 Niveau A',grade:'A',
    condition:function(s){
      if(s.pregnant&&window.isFemale(s))return false; // OMS : max 200mg/j grossesse → supplément déconseillé
      if(s.medical&&(s.medical.indexOf('hta')!==-1||s.medical.indexOf('insuffisance_card')!==-1))return false;
      if(s.medical&&s.medical.indexOf('insomnia')!==-1)return false;
      return s.activity!==null&&s.activity>=2; // Modérément actif minimum
    },
    unnecessary_if:'Café naturel (1-2 tasses) avant entraînement = source suffisante si bien toléré',
    warning:'\u26A0 Éviter après 14h (demi-vie 5-6h). Tolérance individuelle variable. Ne pas combiner avec autres stimulants.',
    dosageCalc:function(s){
      var dose=Math.round(s.weight*4); // 4 mg/kg (milieu ISSN 3-6 mg/kg)
      dose=Math.min(dose,400); // Cap à 400mg (seuil OMS adulte sain)
      return{dose:dose,unit:'mg, 30-60 min avant entraînement',timing:'30-60 min avant séance',note:'Dose ISSN : 3-6 mg/kg ('+Math.round(s.weight*3)+'-'+Math.round(s.weight*6)+'mg pour '+s.weight+'kg). Ne pas dépasser 400mg/j. Cycler : 1-2 semaines sans pour éviter la tolérance.'};
    }
  },
  // ─── BÊTA-ALANINE — ISSN Position Stand 2015 (Hobson et al.) Grade A ───
  // 3.2-6.4 g/j (en doses fractionnées) : tamponnage acide lactique → endurance musculaire et HIIT
  // Bénéfice principal : efforts 1-4 min (seuil lactate) — moins efficace force pure ou < 60s
  {id:'beta_alanine',name:'Bêta-Alanine',icon:'\uD83D\uDCAA',desc:'Tamponnage acide lactique — endurance musculaire, HIIT, musculation volume',evidence:'ISSN Position Stand 2015 (Hobson et al.) \u2014 Niveau A',grade:'A',
    condition:function(s){
      if(s.pregnant&&window.isFemale(s))return false;
      var goals=s.sportGoals||[];
      var hasEndur=goals.indexOf('endurance')!==-1;
      var hasMusc=goals.indexOf('muscle')!==-1||goals.indexOf('shred')!==-1;
      var hasGeneral=goals.indexOf('general')!==-1;
      return s.activity!==null&&s.activity>=2&&(hasEndur||hasMusc||hasGeneral);
    },
    unnecessary_if:'Peu bénéfique pour les sports de force pure (< 60s d\'effort) ou l\'endurance aérobie de fond',
    warning:'Paresthésie (fourmillements bénins) fréquente : fractionner la dose en 0.8-1.6g toutes les 3-4h.',
    dosageCalc:function(){
      return{dose:'3.2-6.4',unit:'g/jour en doses fractionnées (0.8-1.6g × 4)',timing:'Avec les repas pour réduire les fourmillements',note:'Saturation des réserves de carnosine musculaire en 4 semaines. Effet dose-dépendant. Maintenir la prise quotidiennement (y compris jours sans entraînement).'};
    }
  },
  {id:'vitamine_k2',name:'Vitamine K2 (MK-7)',icon:'\uD83E\uDDB4',desc:'Dirige le calcium vers les os — prévient calcifications artérielles avec D3',evidence:'EFSA 2017 — K2 (MK-7) synergie avec D3 pour ostéoporose (Vitamin K2 trial, Plaza 2021)',grade:'A',
    condition:function(s){
      // Pertinent si supplémenter en D3 ET facteur de risque osseux ou cardiovasculaire
      var hasOsteo=s.medical&&s.medical.indexOf('osteoporose')!==-1;
      var hasCardio=s.medical&&(s.medical.indexOf('cardio')!==-1||s.medical.indexOf('insuffisance_card')!==-1);
      var isMenopause=s.medical&&s.medical.indexOf('menopause')!==-1;
      var isOlder=getAge()>=50;
      return hasOsteo||hasCardio||isMenopause||isOlder;
    },
    unnecessary_if:'Moins prioritaire chez adultes jeunes < 50 ans sans facteur de risque osseux ou cardiovasculaire',
    dosageCalc:function(){return{dose:90,unit:'\u00b5g/jour (femme) / 120\u00b5g/jour (homme)',timing:'Au d\u00e9jeuner ou d\u00eener, avec lipides (vitamine liposoluble). Prendre en m\u00eame temps que la D3.',note:'Forme MK-7 (ménaquinone-7) = demi-vie 72h, supérieure à MK-4. Synergie obligatoire avec vitamine D3. Sources alimentaires : natto (fermenté), certains fromages, jaune d\'œuf.'};}}
];
window.SUPPLEMENTS_DB = SUPPLEMENTS_DB;

function getSupplementRecommendations() {
  var s = window.S;
  var recs = [];
  SUPPLEMENTS_DB.forEach(function(supp) {
    if (supp.condition(s)) {
      var dosage = supp.dosageCalc(s);
      recs.push({id:supp.id,name:supp.name,icon:supp.icon,desc:supp.desc,evidence:supp.evidence,grade:supp.grade,dosage:dosage,warning:supp.warning||null,unnecessary_if:supp.unnecessary_if||null,relevant:true});
    }
  });
  return recs;
}
window.getSupplementRecommendations = getSupplementRecommendations;

// ─── RED-S DETECTION (IOC 2018 — Relative Energy Deficiency in Sport) ───
// IOC 2018 : RED-S s'applique aux DEUX SEXES (étendu aux hommes en 2014, réaffirmé 2018)
// Seuils : Femmes < 30 kcal/kg LBM/j (risque RED-S) | Hommes < 25 kcal/kg LBM/j
function detectREDS() {
  var s = window.S;
  if(!s||!s.weight||!s.height||!getAge())return null;
  var target=calcTarget();var tdeeVal=calcTDEE();
  if(!target||!tdeeVal)return null;
  // Estimate LBM: use Navy/Boer formula approximation
  // Simplified: LBM ≈ weight × (1 - body fat estimate)
  // Fat % estimate from BMI (crude but functional)
  var bmi=s.weight/((s.height/100)*(s.height/100));
  var fatPct;
  var _ageF=getAge();if(window.isFemale(s)){fatPct=1.20*bmi+0.23*_ageF-5.4;}
  else{fatPct=1.20*bmi+0.23*_ageF-16.2;}
  fatPct=Math.max(10,Math.min(45,fatPct))/100;
  var lbm=s.weight*(1-fatPct);
  // EA = (caloric intake - exercise energy expenditure) / LBM
  // Approximate EEE = TDEE - BMR (activity-related expenditure)
  var bmrVal=calcBMR();
  var eee=Math.max(0,tdeeVal-bmrVal);
  var ea=(target-eee)/lbm;
  // Seuils IOC 2018 : femmes < 30 kcal/kgLBM/j, hommes < 25 kcal/kgLBM/j
  var eaThreshold = window.isFemale(s) ? 30 : 25;
  var eaCritical  = window.isFemale(s) ? 20 : 15;
  if(ea<eaThreshold){
    var isMale = window.isMale(s);
    var critSymptoms = isMale
      ? 'Risque : déficit testostérone, ostéoporose, immunodépression, arythmies.'
      : 'Risque : aménorrhée, ostéoporose, immunodépression, arythmies.';
    return{
      ea:Math.round(ea),
      lbm:Math.round(lbm),
      threshold: eaThreshold,
      risk:ea<eaCritical?'CRITIQUE':'ÉLEVÉ',
      message:ea<eaCritical
        ?'⚠ ALERTE RED-S CRITIQUE : Disponibilité énergétique '+Math.round(ea)+' kcal/kg MLG/j (seuil IOC 2018 : '+eaThreshold+'). '+critSymptoms+' Consultation médicale URGENTE.'
        :'⚠ ALERTE RED-S : Disponibilité énergétique '+Math.round(ea)+' kcal/kg MLG/j sous le seuil IOC 2018 ('+eaThreshold+' kcal/kg MLG/j). Risque RED-S : augmentez les apports ou réduisez le volume d\'entraînement.'
    };
  }
  return null;
}
window.detectREDS = detectREDS;

// ─── DÉTECTION CONFLITS MÉDICAUX ───
function detectMedicalConflicts() {
  var s = window.S;
  var conflicts = [];
  if(!s||!s.medical)return conflicts;
  var med=s.medical;
  // C-04: IMC < 18.5 + objectif déficitaire — risque médical réel (insuffisance pondérale)
  var _bmiCheck = calcBMI();
  var _goalKey = s.goal !== null && GOALS[s.goal] ? GOALS[s.goal].key : null;
  if(_bmiCheck!==null&&_bmiCheck<18.5&&(_goalKey==='cut'||_goalKey==='shred')){
    conflicts.push({level:'CRITIQUE',message:'⚠ ALERTE MÉDICALE : IMC '+_bmiCheck.toFixed(1)+' (insuffisance pondérale) incompatible avec un objectif déficitaire. Un déficit calorique sur ce profil peut aggraver la dénutrition et présente des risques cardiaques, osseux et hormonaux graves. Votre objectif a été remplacé par maintenance. Consultez un médecin avant tout programme nutritionnel.'});
  }
  // Conflit -1 : IRC + Allaitement → contraintes protéiques incompatibles
  // Allaitement : +500 kcal + besoins protéiques élevés | IRC : plafond 0.6g/kg non dialyse
  if(!s.pregnant&&med.indexOf('irc')!==-1&&med.indexOf('allaitement')!==-1){
    conflicts.push({level:'CRITIQUE',message:'⚠ CONFLIT MÉDICAL CRITIQUE : Insuffisance Rénale Chronique + Allaitement — L\'allaitement nécessite un apport protéique augmenté (1.1-1.3g/kg) incompatible avec le plafond IRC (0.6g/kg, KDOQI 2020). Ce profil NÉCESSITE un suivi conjoint néphrologue + diététicienne spécialisée. Ne pas modifier l\'alimentation sans avis médical.'});
  }
  // Conflit -2 : TCA + Grossesse → deux pathologies qui nécessitent une surveillance médicale spécialisée conjointe
  // IOC 2018 + ACOG 2022 : la restriction alimentaire en TCA est incompatible avec les besoins fœtaux
  if(s.pregnant&&window.isFemale(s)&&med.indexOf('tca')!==-1){
    conflicts.push({level:'CRITIQUE',message:'⚠ CONFLIT MÉDICAL CRITIQUE : TCA + Grossesse — Les troubles du comportement alimentaire pendant la grossesse sont associés à un risque élevé de complications (retard de croissance intra-utérin, prématurité, fausses couches — ACOG 2022). Un suivi psychiatrique ou psychologique ET obstétrical est OBLIGATOIRE. Ne suivez pas un programme diététique sans supervision médicale spécialisée.'});
  }
  // Conflit 0 : Grossesse + IRC → protéines plafonnées à 0.6g/kg = insuffisant pour le fœtus (C1)
  // OMS 2016 : grossesse T3 = +25g protéines/j | KDOQI 2020 : IRC CKD 3-5 = 0.6g/kg/j max
  // Conflit irrésoluble : les deux contraintes sont incompatibles → OBLIGATOIREMENT suivi médical spécialisé
  if(s.pregnant&&window.isFemale(s)&&med.indexOf('irc')!==-1){
    conflicts.push({level:'CRITIQUE',message:'⚠ CONFLIT MÉDICAL CRITIQUE : Grossesse + Insuffisance Rénale Chronique — Les besoins protéiques de la grossesse (75-100g/j) sont incompatibles avec le plafond IRC (0.6g/kg/j = ~36-45g/j). Ce profil NÉCESSITE un suivi conjoint néphrologue + diététicienne spécialisée grossesse. Ne pas modifier l\'alimentation sans avis médical.'});
  }
  // Conflit 1 : Grossesse + Diabète gestationnel + Végan → impossible de couvrir 2600kcal avec glucides ≤200g/j
  if(s.pregnant&&window.isFemale(s)&&med.indexOf('diabete_gest')!==-1&&s.regime===3){
    conflicts.push({level:'CRITIQUE',message:'⚠ CONFLIT : Grossesse + Diabète gestationnel + Végan — Contraintes caloriques incompatibles. Il peut être impossible de couvrir vos besoins ('+calcTarget()+' kcal) avec glucides ≤200g/j sans consommer d\'œufs ou produits laitiers. Consultation diététicienne spécialisée OBLIGATOIRE.'});
  }
  // Alerte B12 automatique régime végane (EFSA 2023, Messina 2019)
  if(s.regime===3&&med.indexOf('anemie_b12')===-1){
    conflicts.push({level:'INFO',message:'ℹ Régime végane — Supplémentation B12 OBLIGATOIRE (seule vitamine absente des végétaux). Recommandation EFSA 2023 : 1000µg/semaine ou 50µg/jour. Formes : méthylcobalamine ou cyanocobalamine. Prise de sang B12 annuelle conseillée.'});
  }
  // Alerte : allergie poisson + régime pescétarien = sources protéines animales quasi nulles
  if(s.regime===1&&s.allergies&&s.allergies.indexOf('Poisson')!==-1){
    conflicts.push({level:'ÉLEVÉ',message:'⚠ CONFLIT nutritionnel : Régime pescétarien + Allergie au poisson — toutes les sources de protéines animales non-végétales sont exclues. Votre profil devient quasi végétarien. Vérifiez vos apports en B12, zinc, fer et oméga-3 (supplémenter si nécessaire).'});
  }
  // Conflit 2 : TCA + objectif shred/cut
  if(med.indexOf('tca')!==-1){
    var goalKey=(s.goal!==null&&GOALS[s.goal])?GOALS[s.goal].key:null;
    if(goalKey==='shred'||goalKey==='cut'){
      conflicts.push({level:'CRITIQUE',message:'⚠ CONFLIT : TCA + objectif sèche/coupe — Objectif automatiquement remplacé par maintenance. Un suivi médical et psychologique est OBLIGATOIRE avant tout déficit calorique.'});
    }
  }
  // Conflit 2b : IRC + Végane/Végétarien + Allergie Soja — apport protéique quasi impossible
  // IRC plafonne les protéines à 0.60-0.66g/kg. Régime plant-based = légumineuses (soja = base).
  // Allergie soja + végane/végétarien = tofu, edamame, tempeh, protéines soja exclus → sources protéiques < plancher sécurisé
  if(med.indexOf('irc')!==-1&&(s.regime===2||s.regime===3)&&Array.isArray(s.allergies)&&s.allergies.indexOf('Soja')!==-1){
    conflicts.push({level:'CRITIQUE',message:'⚠ CONFLIT CRITIQUE : IRC + Végane/Végétarien + Allergie Soja — Le soja (tofu, edamame, tempeh) étant exclu, les sources protéiques d\'un régime végane/végétarien sont drastiquement réduites. Avec le plafond IRC (0.60g/kg, KDOQI 2020), il est quasiment impossible de couvrir les besoins protéiques minimaux sans risque carentiel. Consultation IMPÉRATIVE : néphrologue + diététicienne spécialisée nutrition végétale.'});
  }
  // Conflit 3 : IRC + créatine — bloqué dans SUPPLEMENTS_DB + avertissement explicite ici
  // KDOQI 2020 : la créatine augmente la créatininémie et aggrave la progression de l'IRC
  // Pas de seuil de sécurité établi pour la supplémentation en créatine en IRC (British Journal of Pharmacology 2012)
  if(med.indexOf('irc')!==-1){
    conflicts.push({level:'INFO',message:'ℹ IRC : Créatine contre-indiquée en cas d\'insuffisance rénale chronique (augmente la créatininémie, aggrave la progression — KDOQI 2020). La créatine est automatiquement exclue des suppléments recommandés. Protéines plafonnées à 0.60g/kg/j (CKD 3-5 non-dialyse). Consulter un néphrologue avant tout programme sportif intensif.'});
  }
  // Conflit 4 : Cardiopathie + intensité haute
  if(med.indexOf('cardio')!==-1){
    var actFactor=(s.activity!==null&&s.activity!==undefined&&ACTIVITIES[s.activity])?ACTIVITIES[s.activity].factor:0;
    if(actFactor>=1.7){
      conflicts.push({level:'ÉLEVÉ',message:'⚠ CONFLIT : Cardiopathie + activité très intense — Niveau d\'activité incompatible sans clearance cardiologique. Test d\'effort (VO2max) obligatoire. Zones FC via formule de Karvonen recommandées.'});
    }
  }
  // Conflit 4b : HTA sévère + programme HIIT/CrossFit intensif — BLOQUANT (risque cardiovasculaire élevé)
  // ESC/ESH 2018 : HTA sévère (≥180/110 mmHg) contre-indique tout exercice isométrique ou HIIT
  // American College of Cardiology 2019 : effort intense = pic tensionnel pouvant atteindre 300/150 mmHg
  if(med.indexOf('hta_severe')!==-1){
    var htaActivityFactor=(s.activity!==null&&s.activity!==undefined&&ACTIVITIES[s.activity])?ACTIVITIES[s.activity].factor:0;
    var htaHighIntensity=s.sportType==='crossfit'||(ACTIVITIES[3]&&htaActivityFactor>=ACTIVITIES[3].factor);
    if(htaHighIntensity){
      conflicts.push({level:'danger',message:'⚠ HTA sévère incompatible avec les entraînements HIIT/CrossFit intensifs. Consultez impérativement votre cardiologue avant de démarrer ce programme. Risque cardiovasculaire élevé.'});
    }
  }
  // Conflit 4c : Diabète de type 1 + programme sportif — avertissement obligatoire (non bloquant)
  // ADA 2023 / Colberg 2016 (Diabetes Care) : DT1 + exercice = gestion glycémique à l'effort indispensable
  // Objectif glycémie avant effort : 1.3-1.8 g/L (Riddell 2017, Lancet Diabetes & Endocrinology)
  if((med.indexOf('diabete_t1')!==-1)&&s.sportType!==null&&s.sStep!==undefined&&s.sStep>0){
    conflicts.push({level:'warning',message:'⚠ Diabète de type 1 : consultez votre diabétologue avant de démarrer un programme sportif. Gérez votre glycémie à l\'effort : vérifiez votre glycémie avant/pendant/après les séances, ayez toujours des glucides rapides à portée de main. Objectif glycémie avant effort : 1.3–1.8 g/L.'});
  }
  // Conflit 5 : Goutte + fructose — le fructose élève l'acide urique autant que les purines (Choi 2010, NEJM)
  if(med.indexOf('goutte')!==-1){
    conflicts.push({level:'ÉLEVÉ',message:'⚠ GOUTTE : Le fructose (sodas, jus de fruits industriels, miel, sirop d\'agave, dattes) élève l\'acide urique AUTANT que les purines (Choi 2010, NEJM). Évitez les sucres ajoutés et jus de fruits en plus des abats/sardines. Buvez 2L+ eau/j pour diluer l\'acide urique. La cerise et les fraises ont des propriétés anti-uricémiques (Zhang 2012, Arthritis & Rheumatism).'});
  }
  // Conflit 6 : Alcool + objectif musculaire/sèche — inhibe synthèse protéique
  if(s.alcoholFreq&&s.alcoholFreq!=='never'){
    var hasMusclGoal=s.sportGoals&&(s.sportGoals.indexOf('muscle')!==-1||s.sportGoals.indexOf('shred')!==-1);
    var isFrequentDrinker=s.alcoholFreq==='weekly'||s.alcoholFreq==='daily';
    if(hasMusclGoal&&isFrequentDrinker){
      conflicts.push({level:'ÉLEVÉ',message:'⚠ CONFLIT : Alcool régulier + objectif musculaire/sèche — L\'alcool inhibe la synthèse protéique musculaire de 15-30% (Parr 2014, PLOS ONE), réduit la testostérone et perturbe la récupération. Si >3 verres/j : risque de catabolisme musculaire même avec apports protéiques adéquats. Réduire à ≤2 verres/semaine pour maximiser les résultats (ISSN 2017).'});
    }
    // Alcool + HTA : même modéré, augmente la pression artérielle
    if(med.indexOf('hta')!==-1&&isFrequentDrinker){
      conflicts.push({level:'ÉLEVÉ',message:'⚠ CONFLIT : HTA + consommation régulière d\'alcool — Même 1-2 verres/jour élèvent la pression artérielle de 2-4 mmHg (PREDIMED 2010, ESC 2021). L\'OMS recommande zéro alcool pour les hypertendus. Vérifiez votre traitement antihypertenseur avec votre médecin.'});
    }
  }
  // Conflit 6b : Diabète T2 + Prise de masse — surplus calorique déconseillé (hyperglycémie, résistance insuline)
  // ADA 2023 : chez le diabétique T2, un surplus calorique agressif amplifie la résistance à l'insuline
  // Le bulk peut être envisagé uniquement sous supervision médicale avec contrôle glycémique strict
  if(med.indexOf('diabete_t2')!==-1||med.indexOf('prediabete')!==-1){
    var goalKeyDiab=(s.goal!==null&&GOALS[s.goal])?GOALS[s.goal].key:null;
    if(goalKeyDiab==='bulk'||goalKeyDiab==='lean_bulk'){
      conflicts.push({level:'ÉLEVÉ',message:'⚠ CONFLIT : Diabète T2 / Pré-diabète + Prise de masse — Un surplus calorique chez un diabétique T2 peut aggraver la résistance à l\'insuline et perturber le contrôle glycémique (ADA 2023). Recommandation : privilégiez la recomposition corporelle (maintien calorique + protéines 1.4-1.6g/kg + résistance musculaire) plutôt qu\'un surplus. Consultez votre diabétologue avant de modifier significativement votre alimentation.'});
    }
  }
  // Conflit 7 : IRC + régime hyperprotéiné (si objectif prise de masse sans pathologie déclarée)
  if(med.indexOf('irc')!==-1){
    var goalKeyIRC=(s.goal!==null&&GOALS[s.goal])?GOALS[s.goal].key:null;
    if(goalKeyIRC==='bulk'||goalKeyIRC==='lean_bulk'){
      conflicts.push({level:'CRITIQUE',message:'⚠ CONFLIT : IRC + Prise de masse — L\'objectif "prise de masse" est incompatible avec une insuffisance rénale chronique. Les protéines sont plafonnées à 0.55-0.60g/kg/j (KDOQI 2020). Un excès protéique accélère la progression de l\'insuffisance rénale. Consultation néphrologue OBLIGATOIRE avant de modifier l\'alimentation.'});
    }
  }
  // Conflit 8 : Grossesse + sèche/coupe — risque déficit pour le fœtus
  if(s.pregnant&&window.isFemale(s)&&s.goal!==null&&GOALS[s.goal]){
    var pGoalKey=GOALS[s.goal].key;
    if(pGoalKey==='cut'||pGoalKey==='shred'){
      conflicts.push({level:'CRITIQUE',message:'⚠ CONFLIT : Grossesse + déficit calorique — Tout déficit calorique pendant la grossesse est contre-indiqué (ACOG 2018). Les besoins augmentent de +300 kcal/j (T2-T3). La restriction calorique pendant la grossesse est associée à un retard de croissance intra-utérin (RCIU). Objectif automatiquement corrigé.'});
    }
  }
  // Conflit 9 : Nutrition "Prise de masse" + objectif sport "Sèche" — contradiction calorique directe
  // Bulk = surplus +15% | Sèche sport = brûler gras → les deux sont incompatibles simultanément
  var nutGoalKey9=(s.goal!==null&&GOALS[s.goal])?GOALS[s.goal].key:null;
  if((nutGoalKey9==='bulk'||nutGoalKey9==='lean_bulk')&&s.sportGoals&&s.sportGoals.indexOf('shred')!==-1){
    conflicts.push({level:'ÉLEVÉ',message:'⚠ CONFLIT objectif : Alimentation "Prise de masse" (+15% calories) + Objectif sport "Sèche" — Ces objectifs sont contradictoires. La prise de masse nécessite un surplus calorique, la sèche nécessite un déficit. Choisissez : (1) Recomposition corporelle = maintenance calorique si vous débutez ou revenez après une pause ; (2) Bulk + programme musculaire, puis sèche séparément (Helms 2014, ISSN 2017).'});
  }
  // Conflit 10 : Nutrition sèche/coupe + objectif sport "Muscle" chez intermédiaire/avancé
  // Débutants : recomposition possible. Intermédiaires/avancés : difficile voire contre-productif (Barakat 2020)
  if((nutGoalKey9==='cut'||nutGoalKey9==='shred')&&s.sportGoals&&s.sportGoals.indexOf('muscle')!==-1&&s.sportLevel&&s.sportLevel!=='beginner'){
    conflicts.push({level:'INFO',message:'ℹ Objectifs partiellement contradictoires : Déficit calorique + Objectif "Prise de masse" — Possible pour les débutants (recomposition corporelle) mais inefficace pour les intermédiaires/avancés. Un déficit réduit la synthèse protéique et limite la récupération post-séance (Barakat 2020, NSCA). Recommandé : alterner phases bulk/sèche distinctes pour maximiser les gains musculaires.'});
  }
  // Conflit 11 : CrossFit intensif + objectif nutrition "Prise de masse"
  // CrossFit haute intensité brûle 500-800 kcal/séance. Un surplus pour la masse amplifie le stockage adipeux si
  // l'entraînement est métabolique — recomposition plus adaptée (Barakat 2020, NSCA Journal)
  if(s.sportType==='crossfit'&&(nutGoalKey9==='bulk'||nutGoalKey9==='lean_bulk')){
    conflicts.push({level:'INFO',message:'ℹ CrossFit intensif + Prise de masse — La combinaison est difficile à optimiser : CrossFit brûle 500-800 kcal/séance (métabolique), ce qui réduit le surplus net. La synthèse protéique est compromise par l\'acidose lactique intense (Sale 2004). Pour une prise de masse efficace : privilégiez ≤3 séances CrossFit/sem + ajout musculation PPL 3j/sem. Surplus calorique +10% max pour limiter le gain de gras (Israetel 2019, RP Strength).'});
  }
  // Conflit 12 : Marathon + sèche — risque d\'insuffisance rénale chronique aiguë + blessure
  // Couplage déficit calorique + volume marathon > 70km/sem = catabolisme musculaire, IRC transitoire,
  // stress osseux (ACSM 2018 — Female Athlete Triad)
  if(s.sportType==='running'&&s.runningGoal==='marathon'&&(nutGoalKey9==='cut'||nutGoalKey9==='shred')){
    conflicts.push({level:'ÉLEVÉ',message:'⚠ CONFLIT : Marathon + Sèche — La restriction calorique pendant la préparation marathon est DANGEREUSE. Un déficit calorique en phase de volume élevé (>60km/sem) augmente le risque de : (1) Fractures de stress (déficit énergétique relatif au sport, RED-S — Mountjoy 2018, BJSM) ; (2) Catabolisme musculaire (perte de force propulsive) ; (3) Immunosuppression et surentraînement. Recommandation : maintien calorique minimum pendant la préparation, sèche uniquement HORS saison compétitive.'});
  }
  // Conflit 13 : Hyrox compétitif (sub75 / sub60 / podium) + sèche
  // Hyrox = 8 stations + 8×1km run — dépense 900-1400 kcal. Sèche compromet la puissance aérobie et force
  // fonctionnelle sur les stations (Sled Push/Pull, Farmers Carry, Sandbag Lunges)
  var hyroxCompGoals = ['sub75', 'sub60', 'podium'];
  if(s.sportType==='hyrox'&&s.hyroxGoal&&hyroxCompGoals.indexOf(s.hyroxGoal)!==-1&&(nutGoalKey9==='cut'||nutGoalKey9==='shred')){
    conflicts.push({level:'ÉLEVÉ',message:'⚠ CONFLIT : Hyrox compétitif (objectif ' + (s.hyroxGoal||'performance') + ') + Sèche — Un déficit calorique pendant la préparation Hyrox compétitive compromet : (1) La puissance sur Sled Push/Pull et Farmers Carry (nécessitent force maximale) ; (2) La résistance aérobie sur 8×1km (glycogène réduit) ; (3) La récupération inter-stations. Recommandation NSCA 2020 : recomposition corporelle à maintien calorique (+protéines 2.2g/kg) plutôt qu\'un déficit actif pendant la phase compétitive.'});
  }
  return conflicts;
}
window.detectMedicalConflicts = detectMedicalConflicts;

// ─── AUTH RATE LIMITING ───
var authAttempts = {};
window.canAttemptAuth = function(email) {
  var key = email.toLowerCase();
  var now = Date.now();
  if (!authAttempts[key]) authAttempts[key] = [];
  authAttempts[key] = authAttempts[key].filter(function(t){ return now - t < 300000; });
  if (authAttempts[key].length >= 5) return false;
  authAttempts[key].push(now);
  return true;
};

// ─── STRENGTH STANDARDS (A-E rating system) ───
// Sources: Symmetric Strength, ExRx, NSCA
var STRENGTH_STANDARDS = {
  // [E, D, C, B, A] as multipliers of body weight
  // For men
  m: {
    bench_press:    [0.40, 0.60, 0.85, 1.15, 1.50],
    squat:          [0.50, 0.75, 1.00, 1.50, 2.00],
    deadlift:       [0.60, 1.00, 1.25, 1.75, 2.50],
    overhead_press: [0.25, 0.40, 0.55, 0.75, 1.00],
    barbell_row:    [0.30, 0.50, 0.70, 0.90, 1.15],
    barbell_curl:   [0.15, 0.25, 0.35, 0.45, 0.60],
    hip_thrust:     [0.50, 0.75, 1.00, 1.50, 2.00],
    // CrossFit lifts (Symmetric Strength / ExRx aligned)
    clean:          [0.35, 0.55, 0.75, 1.00, 1.25],
    snatch:         [0.25, 0.45, 0.60, 0.80, 1.00],
    front_squat:    [0.40, 0.65, 0.85, 1.15, 1.50],
    thruster:       [0.25, 0.40, 0.55, 0.70, 0.90],
    overhead_squat: [0.20, 0.35, 0.50, 0.70, 0.90],
    push_press:     [0.25, 0.40, 0.55, 0.70, 0.85]
  },
  // For women (approximately 60-70% of men's standards)
  f: {
    bench_press:    [0.20, 0.35, 0.55, 0.75, 1.00],
    squat:          [0.35, 0.55, 0.75, 1.10, 1.50],
    deadlift:       [0.40, 0.70, 1.00, 1.30, 1.80],
    overhead_press: [0.12, 0.22, 0.35, 0.50, 0.65],
    barbell_row:    [0.20, 0.35, 0.50, 0.65, 0.80],
    barbell_curl:   [0.10, 0.18, 0.25, 0.33, 0.42],
    hip_thrust:     [0.40, 0.65, 0.90, 1.25, 1.75],
    clean:          [0.20, 0.35, 0.50, 0.65, 0.80],
    snatch:         [0.15, 0.28, 0.40, 0.55, 0.70],
    front_squat:    [0.30, 0.50, 0.65, 0.85, 1.10],
    thruster:       [0.18, 0.30, 0.42, 0.55, 0.70],
    overhead_squat: [0.12, 0.25, 0.38, 0.50, 0.65],
    push_press:     [0.18, 0.30, 0.42, 0.55, 0.65]
  }
};
window.STRENGTH_STANDARDS = STRENGTH_STANDARDS;

var GRADE_LABELS = {
  A: {name: '\u00c9lite', color: '#3E5C3A', bg: 'rgba(62,92,58,0.06)', desc: 'Niveau comp\u00e9tition. Impressionnant.'},
  B: {name: 'Avanc\u00e9', color: '#1A3A6A', bg: 'rgba(26,58,106,.08)', desc: 'Tr\u00e8s solide. Au-dessus de la moyenne.'},
  C: {name: 'Interm\u00e9diaire', color: '#7A3B0E', bg: 'rgba(232,111,30,0.06)', desc: 'Bon niveau. Continuez \u00e0 progresser.'},
  D: {name: 'D\u00e9butant+', color: '#8A6A2A', bg: 'rgba(138,106,42,.08)', desc: 'En progression. Les bases sont l\u00e0.'},
  E: {name: 'D\u00e9butant', color: '#7A1F1F', bg: 'rgba(122,31,31,0.06)', desc: 'Tout le monde commence quelque part.'}
};
window.GRADE_LABELS = GRADE_LABELS;

function calculateStrengthGrade() {
  var s = window.S;
  if (!s.weight || !s.sex) return null;

  var sexKey = window.isMale(s) ? 'm' : 'f';
  var standards = STRENGTH_STANDARDS[sexKey];
  var bw = s.weight;

  // Collect all available lifts (from muscu profile + crossfit 1RM)
  var scores = [];
  var liftsUsed = [];

  function scoreLift(key, weight, isFrom1RM) {
    if (!weight || !standards[key]) return;
    // Muscu strength profile = 8-10RM, convert to estimated 1RM (Brzycki)
    var estimated1RM = isFrom1RM ? weight : Math.round(weight / (1.0278 - 0.0278 * 9)); // ~1.3x for 9 reps
    var ratio = estimated1RM / bw;
    var thresholds = standards[key]; // [E, D, C, B, A]
    var grade;
    if (ratio >= thresholds[4]) grade = 4; // A
    else if (ratio >= thresholds[3]) grade = 3; // B
    else if (ratio >= thresholds[2]) grade = 2; // C
    else if (ratio >= thresholds[1]) grade = 1; // D
    else grade = 0; // E
    scores.push(grade);
    liftsUsed.push({key: key, weight: weight, ratio: Math.round(ratio * 100) / 100, grade: ['E','D','C','B','A'][grade]});
  }

  // From musculation profile
  var mp = s.muscuStrengthProfile || {};
  Object.keys(mp).forEach(function(k) { if (mp[k]) scoreLift(k, mp[k], false); }); // muscu = 8-10RM

  // From crossfit 1RM
  var cf = s.crossfit1RM || {};
  Object.keys(cf).forEach(function(k) { if (cf[k] && !mp[k]) scoreLift(k, cf[k], true); }); // CF = 1RM

  if (scores.length === 0) return null;

  // Average score -> grade
  var avg = scores.reduce(function(a, b) { return a + b; }, 0) / scores.length;
  var overallGrade;
  if (avg >= 3.5) overallGrade = 'A';
  else if (avg >= 2.5) overallGrade = 'B';
  else if (avg >= 1.5) overallGrade = 'C';
  else if (avg >= 0.5) overallGrade = 'D';
  else overallGrade = 'E';

  return {
    grade: overallGrade,
    label: GRADE_LABELS[overallGrade],
    avgScore: Math.round(avg * 10) / 10,
    liftsUsed: liftsUsed,
    liftsCount: liftsUsed.length
  };
}
window.calculateStrengthGrade = calculateStrengthGrade;

function renderStrengthGrade(container) {
  var result = calculateStrengthGrade();
  if (!result) return;

  var info = result.label;

  var card = h('div', {style: 'border:1px solid var(--border);padding:20px;margin:16px 0;text-align:center;background:' + info.bg});

  // Big grade letter
  card.appendChild(h('div', {style: 'font-family:Georgia;font-size:64px;font-style:italic;color:' + info.color + ';line-height:1'}, result.grade));
  card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:' + info.color + ';margin:8px 0'}, info.name));
  card.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:11px;color:var(--grey);margin-bottom:12px'}, info.desc));

  // Detail per lift
  if (result.liftsUsed.length > 0) {
    var detail = h('div', {style: 'text-align:left;border-top:1px solid var(--border);padding-top:12px;margin-top:12px'});
    detail.appendChild(h('div', {style: 'font-family:"Helvetica Neue",sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:8px'}, 'D\u00e9tail par exercice'));

    result.liftsUsed.forEach(function(lift) {
      var row = h('div', {style: 'display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--ivory3,#EEEDE8);font-family:"Helvetica Neue",sans-serif;font-size:11px'});
      row.appendChild(h('span', {}, lift.key.replace(/_/g, ' ')));
      row.appendChild(h('span', {}, lift.weight + 'kg (' + lift.ratio + '\u00d7BW)'));
      var gradeLabel = GRADE_LABELS[lift.grade];
      row.appendChild(h('span', {style: 'font-family:Georgia;font-weight:bold;color:' + gradeLabel.color}, lift.grade));
      detail.appendChild(row);
    });
    card.appendChild(detail);
  }

  container.appendChild(card);
}
window.renderStrengthGrade = renderStrengthGrade;

// ─── RUNNING CONSTANTS ───
var RUNNING_LEVELS = [
  {id: 'beginner', name: 'Débutant', desc: 'Je commence à courir ou < 6 mois', icon: '🟢', vdot: 30},
  {id: 'intermediate', name: 'Intermédiaire', desc: '6 mois - 2 ans de running', icon: '🟡', vdot: 42},
  {id: 'advanced', name: 'Avancé', desc: '2+ ans, compétitions', icon: '🔴', vdot: 52}
];
window.RUNNING_LEVELS = RUNNING_LEVELS;

// FIX Hermès : icônes sobres. Chiffres et symboles typographiques uniquement.
var RUNNING_GOALS = [
  {id: '5k',       name: '5 km',           desc: 'Première course ou PR', icon: '5',     weeks: 8,  longRunMax: 8},
  {id: '10k',      name: '10 km',          desc: 'Distance populaire',    icon: '10',    weeks: 10, longRunMax: 12},
  {id: 'semi',     name: 'Semi-marathon',  desc: '21.1 km',               icon: '21',    weeks: 12, longRunMax: 18},
  {id: 'marathon', name: 'Marathon',       desc: '42.195 km',             icon: '42',    weeks: 16, longRunMax: 35},
  {id: 'trail',    name: 'Trail',          desc: 'Course nature / dénivelé', icon: '\u25B2', weeks: 12, longRunMax: 25}
];
window.RUNNING_GOALS = RUNNING_GOALS;

// Zones FC course — modèle ACSM 5 zones FCmax (Swain & Franklin 2002)
var RUNNING_ZONES = [
  {zone: 'Z1', name: 'Récupération active',      pct: [50, 60], feel: 'Conversation très facile', color: '#3E5C3A'},
  {zone: 'Z2', name: 'Endurance fondamentale',   pct: [60, 70], feel: 'Conversation facile',      color: '#1A3A6A'},
  {zone: 'Z3', name: 'Aérobie / Tempo',          pct: [70, 80], feel: 'Quelques phrases',          color: '#7A3B0E'},
  {zone: 'Z4', name: 'Seuil anaérobie',          pct: [80, 90], feel: 'Quelques mots seulement',   color: '#8A3A1A'},
  {zone: 'Z5', name: 'VMA / VO2max',             pct: [90,100], feel: 'Effort maximal',             color: '#7A1F1F'}
];
window.RUNNING_ZONES = RUNNING_ZONES;

// ─── HYROX CONSTANTS ───
// FIX Hermès : gradés ○◔◑◕● (circles filling) au lieu de cercles colorés 🟢🟡🟠🔴.
var HYROX_LEVELS = [
  {id: 'beginner',     name: 'Débutant',       desc: 'Premier Hyrox',          icon: '\u25CB'},
  {id: 'intermediate', name: 'Intermédiaire',  desc: '1-3 Hyrox complétés',    icon: '\u25D4'},
  {id: 'advanced',     name: 'Avancé',         desc: 'Compétiteur régulier',   icon: '\u25D1'},
  {id: 'pro',          name: 'Pro / Élite',    desc: 'Top 10% ou Pro division',icon: '\u25CF'}
];
window.HYROX_LEVELS = HYROX_LEVELS;

// FIX Hermès : icônes temps/distance sobres.
var HYROX_GOALS = [
  {id: 'finish', name: 'Finir',    desc: 'Compléter mon premier Hyrox', icon: '\u25A1', targetMin: null},
  {id: 'sub90',  name: 'Sub 1h30', desc: 'Passer sous 1h30',            icon: '\u2014', targetMin: 90},
  {id: 'sub75',  name: 'Sub 1h15', desc: 'Passer sous 1h15',            icon: '\u2014', targetMin: 75},
  {id: 'sub60',  name: 'Sub 1h00', desc: 'Passer sous 1 heure',         icon: '\u2014', targetMin: 60},
  {id: 'podium', name: 'Podium',   desc: 'Top 3 de ma catégorie',       icon: '\u2605', targetMin: null}
];
window.HYROX_GOALS = HYROX_GOALS;

var HYROX_STATIONS = [
  {id: 'run', name: '1km Run', type: 'run', unit: 'min:sec'},
  {id: 'skiErg', name: '1000m SkiErg', type: 'erg', unit: 'min:sec', standards: {beginner: '5:00', intermediate: '4:00', advanced: '3:30', pro: '3:00'}},
  {id: 'sled_push', name: '50m Sled Push', type: 'strength', unit: 'min:sec', weight: {m: {beginner:102, intermediate:152, advanced:152, pro:202}, f: {beginner:52, intermediate:102, advanced:102, pro:152}}},
  {id: 'sled_pull', name: '50m Sled Pull', type: 'strength', unit: 'min:sec', weight: {m: {beginner:78, intermediate:103, advanced:103, pro:153}, f: {beginner:53, intermediate:78, advanced:78, pro:103}}},
  {id: 'burpee_bj', name: '80 Burpee Broad Jumps', type: 'bodyweight', unit: 'min:sec', reps: 80, standards: {beginner: '8:00', intermediate: '6:00', advanced: '4:30', pro: '3:30'}},
  {id: 'rowing', name: '1000m Row', type: 'erg', unit: 'min:sec', standards: {beginner: '4:30', intermediate: '3:45', advanced: '3:15', pro: '2:50'}},
  {id: 'farmers', name: '200m Farmers Carry', type: 'strength', unit: 'min:sec', weight: {m: {beginner:'2x16kg', intermediate:'2x24kg', advanced:'2x24kg', pro:'2x32kg'}, f: {beginner:'2x12kg', intermediate:'2x16kg', advanced:'2x16kg', pro:'2x24kg'}}},
  {id: 'lunges', name: '100m Lunges (sandbag)', type: 'strength', unit: 'min:sec', weight: {m: {beginner:10, intermediate:20, advanced:20, pro:30}, f: {beginner:0, intermediate:10, advanced:10, pro:20}}},
  {id: 'wall_balls', name: '100 Wall Balls', type: 'strength', unit: 'min:sec', reps: 100, weight: {m: '6/9kg', f: '4/6kg'}, standards: {beginner: '7:00', intermediate: '5:00', advanced: '4:00', pro: '3:00'}}
];
window.HYROX_STATIONS = HYROX_STATIONS;

// ─── RUNNING PROGRAM GENERATION (Jack Daniels / Pfitzinger) ───
function generateRunningProgram(weeks, daysPerWeek, level, goal) {
  var program = [];
  var goalObj = RUNNING_GOALS.find(function(g){ return g.id === goal; });
  var levelObj = RUNNING_LEVELS.find(function(l){ return l.id === level; });
  if (!goalObj || !levelObj) return [];

  var maxLongRun = goalObj.longRunMax;
  var totalWeeks = goalObj.weeks;

  // FIX Hermès : icônes unicode sobres (remplacement emojis 🟢🔵🟡🔴⛰🟠🔄).
  var SESSION_TYPES = {
    easy: {name: 'Footing facile', zone: 'Z1-Z2', icon: '\u25CB', desc: 'Allure conversationnelle'},
    long: {name: 'Sortie longue', zone: 'Z2', icon: '\u25CF', desc: 'Endurance fondamentale'},
    tempo: {name: 'Tempo / Seuil', zone: 'Z3', icon: '\u25D4', desc: 'Allure marathon à semi'},
    interval: {name: 'Fractionné', zone: 'Z4-Z5', icon: '\u25D1', desc: 'VMA / vitesse'},
    hills: {name: 'Côtes', zone: 'Z4', icon: '\u25B2', desc: 'Force spécifique'},
    recovery: {name: 'Récupération', zone: 'Z1', icon: '\u25CB', desc: 'Très facile ou repos'},
    race_pace: {name: 'Allure course', zone: 'Z3-Z4', icon: '\u25C6', desc: 'Simulation de course'},
    cross: {name: 'Cross-training', zone: 'Z2', icon: '\u21C4', desc: 'Vélo, natation, renforcement'}
  };

  var templates = {
    3: ['easy', 'interval', 'long'],
    4: ['easy', 'interval', 'tempo', 'long'],
    5: ['easy', 'interval', 'easy', 'tempo', 'long'],
    6: ['easy', 'interval', 'recovery', 'tempo', 'hills', 'long']
  };

  var weekTemplate = templates[daysPerWeek] || templates[4];

  for (var w = 1; w <= totalWeeks; w++) {
    var weekPlan = [];
    var phase;
    var pctOfPlan = w / totalWeeks;

    if (pctOfPlan <= 0.3) phase = 'Base';
    else if (pctOfPlan <= 0.6) phase = 'Développement';
    else if (pctOfPlan <= 0.85) phase = 'Spécifique';
    else phase = 'Affûtage';

    var longRunKm;
    if (pctOfPlan <= 0.75) {
      longRunKm = Math.round(maxLongRun * 0.5 + (maxLongRun * 0.5 * pctOfPlan / 0.75));
    } else {
      longRunKm = Math.round(maxLongRun * (1 - (pctOfPlan - 0.75) / 0.25 * 0.4));
    }
    if (w % 4 === 0) longRunKm = Math.round(longRunKm * 0.7);
    // Règle +10%/semaine (ACSM 2018) — évite les blessures par surcharge
    if (w > 1 && program.length > 0) {
      var prevLong = program[program.length - 1].longRun || 0;
      if (prevLong > 0 && !(w % 4 === 0) && longRunKm > Math.round(prevLong * 1.10)) {
        longRunKm = Math.round(prevLong * 1.10);
      }
    }

    var baseVolume = longRunKm * 2.5;
    if (level === 'beginner') baseVolume *= 0.7;
    if (level === 'advanced') baseVolume *= 1.2;

    weekTemplate.forEach(function(sessionType, dayIdx) {
      var session = JSON.parse(JSON.stringify(SESSION_TYPES[sessionType]));
      session.type = sessionType;
      session.dayNumber = dayIdx + 1;

      if (sessionType === 'long') {
        session.distance = longRunKm + ' km';
        session.detail = 'Allure Z2 constante. Ravitaillement tous les 5km si > 15km.';
      } else if (sessionType === 'easy') {
        var easyKm = Math.round(baseVolume * 0.2);
        session.distance = Math.max(3, easyKm) + ' km';
        session.detail = 'Facile ! Vous devez pouvoir parler sans essoufflement.';
      } else if (sessionType === 'interval') {
        if (phase === 'Base') {
          session.detail = level === 'beginner' ? '6x200m Z5, repos 200m marche' : '8x400m Z4-Z5, repos 200m trot';
        } else if (phase === 'Développement') {
          session.detail = level === 'beginner' ? '5x400m Z4, repos 400m trot' : '5x1000m Z4, repos 400m trot';
        } else {
          session.detail = level === 'beginner' ? '3x(3min Z4 + 2min Z1)' : '4x1600m Z4, repos 400m';
        }
        session.distance = Math.round(baseVolume * 0.15) + ' km total';
      } else if (sessionType === 'tempo') {
        var tempoKm = Math.round(baseVolume * 0.15);
        session.distance = Math.max(4, tempoKm) + ' km';
        session.detail = 'Échauffement 2km Z1 → ' + Math.max(2, tempoKm - 4) + 'km Z3 → Retour 2km Z1';
      } else if (sessionType === 'hills') {
        session.detail = level === 'beginner' ? '6x30s côte Z4, descente récup' : '8x60s côte Z4-Z5, descente trot';
        session.distance = '5-8 km total';
      } else if (sessionType === 'recovery') {
        session.distance = '3-4 km ou repos complet';
        session.detail = 'Très très facile. Ou repos si fatigue.';
      } else if (sessionType === 'race_pace') {
        session.distance = Math.round(baseVolume * 0.15) + ' km';
        session.detail = 'Simulez votre allure de course cible.';
      } else if (sessionType === 'cross') {
        session.distance = '30-45 min';
        session.detail = 'Vélo, natation, ou renforcement musculaire (gainage, squats, fentes)';
      }

      weekPlan.push(session);
    });

    program.push({
      week: w,
      phase: phase,
      totalKm: Math.round(baseVolume),
      longRun: longRunKm,
      sessions: weekPlan,
      isDeload: w % 4 === 0,
      isTaper: pctOfPlan > 0.85,
      notes: w % 4 === 0 ? 'Semaine de récupération — volume réduit' :
             pctOfPlan > 0.85 ? 'Affûtage — réduisez le volume, gardez l\'intensité' :
             phase === 'Base' ? 'Construction de la base aérobie' :
             phase === 'Développement' ? 'Montée en charge progressive' :
             '⚡ Travail spécifique course'
    });
  }

  return program;
}
window.generateRunningProgram = generateRunningProgram;

// ─── HYROX PROGRAM GENERATION ───
function generateHyroxProgram(daysPerWeek, level, goal) {
  var program = [];
  var totalWeeks = 12;

  // ─── Pacing targets par objectif ───
  var PACE = {
    finish:  {run1km: '6:00', skierg1k: '5:00', row1k: '4:30', wallballs100: '7:00', burpee80: '8:00', sled50: '3:30', farmers200: '3:00', lunges100: '5:00'},
    sub90:   {run1km: '5:30', skierg1k: '4:00', row1k: '3:45', wallballs100: '5:30', burpee80: '6:00', sled50: '2:45', farmers200: '2:20', lunges100: '4:00'},
    sub75:   {run1km: '4:45', skierg1k: '3:30', row1k: '3:15', wallballs100: '4:30', burpee80: '4:30', sled50: '2:15', farmers200: '1:50', lunges100: '3:15'},
    sub60:   {run1km: '4:00', skierg1k: '3:00', row1k: '2:50', wallballs100: '3:30', burpee80: '3:30', sled50: '1:50', farmers200: '1:30', lunges100: '2:30'},
    podium:  {run1km: '3:45', skierg1k: '2:50', row1k: '2:40', wallballs100: '3:00', burpee80: '3:00', sled50: '1:40', farmers200: '1:20', lunges100: '2:15'}
  };
  var pace = PACE[goal] || PACE['finish'];

  // ─── Volume de base par niveau ───
  var VOL = {
    beginner:     {runKm: 20, sessionMin: 50,  wbReps: 20, skiErgDist: '500m', rowDist: '500m', farmersM: 50, lungesM: 25},
    intermediate: {runKm: 35, sessionMin: 65,  wbReps: 30, skiErgDist: '750m', rowDist: '750m', farmersM: 100, lungesM: 50},
    advanced:     {runKm: 50, sessionMin: 80,  wbReps: 50, skiErgDist: '1000m', rowDist: '1000m', farmersM: 200, lungesM: 100},
    pro:          {runKm: 70, sessionMin: 100, wbReps: 75, skiErgDist: '1500m', rowDist: '1000m', farmersM: 200, lungesM: 100}
  };
  var vol = VOL[level] || VOL['beginner'];

  // ─── Progression du volume (multiplicateurs par semaine) ───
  var WEEK_MULT = [1.0, 1.1, 1.2, 0.6, 1.3, 1.4, 1.5, 1.6, 1.7, 0.8, 0.5, 0.3];

  // ─── Gabarits de jours par splits ───
  var TEMPLATES = {
    3: ['zone2_run', 'upper_ergs', 'sim_partial'],
    4: ['interval_run', 'upper_ergs', 'lower_strength', 'sim_partial'],
    5: ['zone2_run', 'interval_run', 'upper_ergs', 'lower_strength', 'sim_partial'],
    6: ['zone2_run', 'interval_run', 'upper_ergs', 'lower_strength', 'stations_drill', 'sim_full']
  };
  var dayTypes = TEMPLATES[daysPerWeek] || TEMPLATES[4];

  // ─── Générateurs de sessions ───
  function makeZone2Run(w, wMult) {
    var km = Math.round(vol.runKm * 0.3 * wMult);
    if (km < 3) km = 3;
    return {
      name: 'Zone 2 Run — Endurance de base',
      focus: 'Endurance aérobie',
      duration: Math.round(km * (goal === 'podium' ? 4.5 : goal === 'sub60' ? 5 : goal === 'sub75' ? 5.5 : goal === 'sub90' ? 6 : 7)),
      intensity: 'Z2',
      exercises: [
        {name: 'Échauffement marche/footing', detail: '5min transition Z1→Z2'},
        {name: 'Zone 2 footing', detail: km + 'km à allure confortable — vous devez pouvoir parler en phrases complètes. FC max 70-75%.'},
        {name: 'Retour au calme', detail: '5min footing Z1 + étirements dynamiques 5min'}
      ],
      notes: 'JAMAIS dépasser Z2. C\'est la fondation. Phil Maffetone : 80% de l\'entraînement Hyrox doit être ici.'
    };
  }

  function makeIntervalRun(w, wMult) {
    var repsInfo;
    if (w <= 3) repsInfo = {reps: Math.round(6 * wMult), dist: '400m', rest: '90s'};
    else if (w <= 6) repsInfo = {reps: Math.round(5 * wMult), dist: '800m', rest: '90s'};
    else if (w <= 9) repsInfo = {reps: Math.round(4 * wMult), dist: '1km', rest: '2min'};
    else repsInfo = {reps: 3, dist: '1km', rest: '90s'};
    if (repsInfo.reps < 2) repsInfo.reps = 2;
    return {
      name: 'Run Intervals — Puissance aérobie',
      focus: 'VO2max / Seuil lactique',
      duration: Math.round(repsInfo.reps * (repsInfo.dist === '400m' ? 3 : repsInfo.dist === '800m' ? 6 : 9) + 20),
      intensity: w <= 6 ? 'Z3-Z4' : 'Z4-Z5',
      exercises: [
        {name: 'Échauffement', detail: '10min footing Z2 + 4 strides 20s'},
        {name: repsInfo.reps + 'x' + repsInfo.dist + ' @allure Hyrox', detail: 'Cible : ' + pace.run1km + '/km — repos ' + repsInfo.rest + ' entre chaque'},
        {name: 'Retour au calme', detail: '10min footing Z1 + étirements 5min'}
      ],
      notes: 'Hyrox = 8x1km run entre chaque station. Ces intervalles simulent exactement cela. Tenez la même allure sur toutes les répétitions.'
    };
  }

  function makeUpperErgs(w, wMult) {
    var sets = (level === 'beginner') ? 3 : 4;
    var skiDist = vol.skiErgDist;
    var rowDist = vol.rowDist;
    var wbReps = Math.round(vol.wbReps * wMult);
    if (wbReps < 10) wbReps = 10;
    return {
      name: 'SkiErg + Haut du corps',
      focus: 'Poussée / Tirage / SkiErg',
      duration: vol.sessionMin,
      intensity: 'Z3',
      exercises: [
        {name: skiDist + ' SkiErg (technique)', detail: 'Cible : ' + pace.skierg1k + ' /1000m — Double poling, genoux fléchis, core engagé'},
        {name: sets + 'x12 Push Press haltères', detail: (level === 'beginner' ? '2x8kg' : level === 'intermediate' ? '2x14kg' : level === 'advanced' ? '2x20kg' : '2x28kg') + ' — explosif, lockout complet'},
        {name: sets + 'x15 Inverted rows / Tractions', detail: 'Tirage horizontal strict — simulation Sled Pull'},
        {name: sets + 'x' + wbReps + ' Wall Balls', detail: (level === 'beginner' ? '6kg' : level === 'intermediate' ? '9kg' : '9kg') + ' cible 3m — rythme continu cible ' + pace.wallballs100 + ' /100 reps'},
        {name: skiDist + ' SkiErg (finisher)', detail: 'For time — tout donner. Notez votre temps.'},
        {name: '3x20 Triceps push-downs', detail: 'Récupération active des épaules'}
      ],
      notes: 'SkiErg : tirez avec les DORSAUX pas les bras. Inclinez le buste vers l\'avant, bras hauts, puis poussez en fléchissant tout le corps.'
    };
  }

  function makeLowerStrength(w, wMult) {
    var sets = (level === 'beginner') ? 3 : 4;
    var farmersM = Math.round(vol.farmersM * wMult);
    if (farmersM < 25) farmersM = 25;
    var lungesM = Math.round(vol.lungesM * wMult);
    if (lungesM < 10) lungesM = 10;
    return {
      name: 'Force jambes + Sled + Carry',
      focus: 'Puissance / Endurance musculaire',
      duration: vol.sessionMin,
      intensity: 'Z3-Z4',
      exercises: [
        {name: '4x' + Math.round(50 * wMult) + 'm Sled Push', detail: (level === 'beginner' ? '60% poids compétition' : '80% poids compétition') + ' — cible ' + pace.sled50 + '/50m'},
        {name: sets + 'x' + (6 + Math.round(w / 2)) + ' Back Squat', detail: (level === 'beginner' ? '65%' : level === 'intermediate' ? '70%' : '75%') + ' 1RM — tempo 3-1-1, core bracing'},
        {name: sets + 'x10 Romanian Deadlift', detail: 'Ischio-jambiers — descente 3s, montée explosive'},
        {name: '4x' + farmersM + 'm Farmers Carry', detail: (level === 'beginner' ? '2x16kg' : level === 'intermediate' ? '2x24kg' : level === 'advanced' ? '2x24kg' : '2x32kg') + ' — marche rapide, épaules en arrière. Cible ' + pace.farmers200 + '/200m'},
        {name: lungesM + 'm Lunges (sandbag)', detail: (level === 'beginner' ? '0kg' : level === 'intermediate' ? '10kg' : level === 'advanced' ? '20kg' : '30kg') + ' sandbag — pas longs, genou arrière effleure. Cible ' + pace.lunges100 + '/100m'},
        {name: vol.rowDist + ' Rowing finisher', detail: 'For time — cible ' + pace.row1k + '/1000m'}
      ],
      notes: 'Sled + Lunges + Farmers = 3 des 8 stations. Maîtrisez ces 3 là et vous gagnez 4-5 minutes en course.'
    };
  }

  function makeStationsDrill(w, wMult) {
    var wbReps = Math.round(vol.wbReps * 1.5 * wMult);
    if (wbReps < 20) wbReps = 20;
    var burpee = (level === 'beginner') ? 20 : (level === 'intermediate') ? 40 : 60;
    return {
      name: 'Stations Drill — Technique pure',
      focus: 'Maîtrise technique toutes stations',
      duration: Math.round(vol.sessionMin * 0.85),
      intensity: 'Z2-Z3',
      exercises: [
        {name: '2x' + vol.skiErgDist + ' SkiErg', detail: 'Focus technique — double poling, genoux, hanche. Repos 2min. Notez écart de temps entre les 2.'},
        {name: wbReps + ' Wall Balls', detail: 'Sets de ' + (level === 'beginner' ? '10' : '20') + ', repos 30s — cible : zéro ballon tombé'},
        {name: burpee + ' Burpee Broad Jumps', detail: 'Rythme constant — saut long pas haut, réception douce. Cible ' + pace.burpee80 + '/80 reps'},
        {name: '2x' + vol.rowDist + ' Rowing', detail: 'Technique : 60% jambes, 20% buste, 20% bras. Drive puissant, récupération lente. Repos 90s'},
        {name: '2x50m Sled Pull', detail: 'Main sur main, hanche basse, traction régulière'},
        {name: '50m Lunges', detail: 'Sans charge — technique parfaite avant d\'ajouter du poids'}
      ],
      notes: 'Intensité réduite, technique maximale. Filmez-vous si possible. 1 défaut technique = 30-60s perdu en course.'
    };
  }

  function makeSimPartial(w, wMult) {
    var stations = w <= 3 ? 4 : w <= 6 ? 6 : 7;
    var runDist = (level === 'beginner') ? '500m' : '1km';
    return {
      name: 'Simulation Hyrox (' + stations + ' stations)',
      focus: 'Race simulation — pacing',
      duration: Math.round(stations * (goal === 'podium' ? 8 : goal === 'sub60' ? 9 : goal === 'sub75' ? 11 : goal === 'sub90' ? 13 : 16)),
      intensity: 'Z4',
      exercises: [
        {name: stations + ' rounds AMRAP chrono', detail: runDist + ' Run + 1 station Hyrox à rotation'},
        {name: 'Stations en rotation', detail: 'SkiErg ' + vol.skiErgDist + ', Wall Balls x' + vol.wbReps + ', Row ' + vol.rowDist + ', Burpee x' + (level === 'beginner' ? 20 : 40) + ', Farmers ' + Math.round(vol.farmersM/2) + 'm, Lunges ' + Math.round(vol.lungesM/2) + 'm, Sled Push 25m, Sled Pull 25m'},
        {name: 'Transitions', detail: 'Simulez les transitions en marchant 30s max entre run et station'}
      ],
      notes: 'Pacing cible : 1km run en ' + pace.run1km + '. Commencez CONSERVATEUR. Beaucoup de personnes explosent dès le début. L\'objectif : finir plus vite que vous n\'avez commencé.'
    };
  }

  function makeSimFull(w, wMult) {
    return {
      name: 'Full Simulation Hyrox — 8 stations',
      focus: 'Race day simulation — chrono complet',
      duration: goal === 'podium' ? 65 : goal === 'sub60' ? 70 : goal === 'sub75' ? 85 : goal === 'sub90' ? 100 : 110,
      intensity: 'Z4-Z5',
      exercises: [
        {name: '8x(1km Run + Station)', detail: 'FORMAT COMPÉTITION EXACT. Chronométrez chaque split.'},
        {name: 'Station 1 : 1000m SkiErg', detail: 'Cible : ' + pace.skierg1k},
        {name: 'Station 2 : 50m Sled Push', detail: 'Poids compétition. Cible : ' + pace.sled50},
        {name: 'Station 3 : 50m Sled Pull', detail: 'Cible : ' + pace.sled50},
        {name: 'Station 4 : 80 Burpee Broad Jumps', detail: 'Cible : ' + pace.burpee80},
        {name: 'Station 5 : 1000m Rowing', detail: 'Cible : ' + pace.row1k},
        {name: 'Station 6 : 200m Farmers Carry', detail: 'Cible : ' + pace.farmers200},
        {name: 'Station 7 : 100m Lunges + sandbag', detail: 'Cible : ' + pace.lunges100},
        {name: 'Station 8 : 100 Wall Balls', detail: 'Cible : ' + pace.wallballs100},
        {name: 'Analyse post-simulation', detail: 'Notez les 3 stations les plus lentes → focus semaine suivante'}
      ],
      notes: 'C\'est votre test. Comparez à chaque simulation précédente. Progressez sur votre goulot d\'étranglement, pas sur vos points forts.'
    };
  }

  function makeForceFonctionnelle(w, wMult) {
    var sets = (level === 'beginner') ? 3 : (level === 'intermediate') ? 4 : 4;
    return {
      name: 'Force fonctionnelle Hyrox',
      focus: 'Capacité de travail / Conditioning',
      duration: vol.sessionMin,
      intensity: 'Z3',
      exercises: [
        {name: sets + 'x6 Deadlift', detail: (level === 'beginner' ? '70%' : '80%') + ' 1RM — transfert direct Sled Push/Pull'},
        {name: sets + 'x8 Front Squat', detail: 'Tempo 3-1-1 — position Hyrox lunges'},
        {name: sets + 'x12 DB Push Press explosif', detail: 'Transfert Wall Balls / SkiErg'},
        {name: '3x1min Sled Push AMRAP', detail: 'Poids léger — maximum de distance. Repos 2min'},
        {name: '3x1min Farmers Carry AMRAP', detail: 'Maximum de distance. Repos 2min'},
        {name: '50 Wall Balls for time', detail: 'Cible ' + Math.round(parseInt(pace.wallballs100) / 2) + 'min'}
      ],
      notes: 'Chaque exercice a un transfert DIRECT sur une station Hyrox. Force + endurance musculaire = la combinaison gagnante.'
    };
  }

  function makeMobiliteRecup(w) {
    return {
      name: 'Mobilité & Récupération active',
      focus: 'Prévention / Régénération',
      duration: 45,
      intensity: 'Z1',
      exercises: [
        {name: 'Foam rolling', detail: '2min/zone : mollets, IT band, quads, ischio, dorsaux, épaules'},
        {name: 'Mobilité hanches', detail: '90/90 stretch 2x90s chaque côté — crucial pour lunges et squats'},
        {name: 'Thoracique', detail: 'Foam roll thoracique + rotations assis 3x10 — crucial pour SkiErg'},
        {name: 'Activation fessiers', detail: 'Clamshells 3x20, Hip thrusts BW 3x20 — prévention genou/dos'},
        {name: 'Yoga flow', detail: 'Chien tête en bas → Guerrier I → II → Pigeon posture. 2 tours'},
        {name: 'Respiration diaphragmatique', detail: '5min box breathing : 4s inspire, 4s hold, 4s expire, 4s hold'}
      ],
      notes: 'Les blessures = fin de prépa. 1 journée de récupération active remplace 3 jours de repos passif. Hyrox sollicite massivement épaules, genoux et bas du dos.'
    };
  }

  function makeRaceWeek(w) {
    return {
      name: 'Race Week — Activation pré-compétition',
      focus: 'Affûtage / Préparation mentale',
      duration: 30,
      intensity: 'Z2-Z3',
      exercises: [
        {name: '2x300m Run strides', detail: 'Allure Hyrox + 10s/km. Reveil musculaire. NE PAS forcer.'},
        {name: '3x5 Wall Balls technique', detail: 'Mouvement parfait, rythme respiratoire. Pas d\'effort.'},
        {name: '200m SkiErg technique', detail: 'Double poling parfait à 60% effort'},
        {name: 'Visualisation complète', detail: '15min yeux fermés : visualisez les 8km run + 8 stations, sentez le rythme, les transitions, la ligne d\'arrivée'},
        {name: 'Checklist matériel', detail: 'Chaussures, tenue, gants SkiErg/Rowing, ceinture Hyrox, nutrition, hydratation'},
        {name: 'Repos', detail: 'DORMEZ. Visez 9h de sommeil les 3 derniers jours.'}
      ],
      notes: 'Race week : plus rien à gagner physiquement, tout à perdre. Réduisez le volume de 70%. Maintenez quelques efforts intenses courts pour garder les jambes réactives.'
    };
  }

  // ─── Sélecteur de session par type ───
  var SESSION_MAP = {
    'zone2_run':       makeZone2Run,
    'interval_run':    makeIntervalRun,
    'upper_ergs':      makeUpperErgs,
    'lower_strength':  makeLowerStrength,
    'stations_drill':  makeStationsDrill,
    'sim_partial':     makeSimPartial,
    'sim_full':        makeSimFull,
    'force_fonct':     makeForceFonctionnelle,
    'mobilite':        makeMobiliteRecup,
    'race_week':       makeRaceWeek
  };

  // ─── Génération semaine par semaine ───
  for (var w = 1; w <= totalWeeks; w++) {
    var phase, isDeload, notes, weekDayTypes;
    var wMult = WEEK_MULT[w - 1];

    if (w <= 3) {
      phase = 'Base';
      isDeload = false;
      notes = 'Phase Base S' + w + ' : volume x' + wMult.toFixed(1) + '. Construction aérobie. Technique stations. Pas d\'effort >Z3.';
    } else if (w === 4) {
      phase = 'Build';
      isDeload = true;
      notes = 'DELOAD S4 : volume -40%. Récupération active. Résistez à l\'envie d\'en faire plus. Les adaptations se font au repos.';
    } else if (w <= 6) {
      phase = 'Build';
      isDeload = false;
      notes = 'Phase Build S' + w + ' : volume x' + wMult.toFixed(1) + '. Intensité montante. Simulations partielles 4-6 stations.';
    } else if (w <= 9) {
      phase = 'Peak';
      isDeload = false;
      notes = 'Phase Peak S' + w + ' : intensité maximale. Full simulations. VO2max work. Récupérez bien entre les sessions.';
    } else if (w === 10) {
      phase = 'Taper';
      isDeload = true;
      notes = 'TAPER S10 : volume -30%. Maintenez l\'intensité, réduisez le volume. Corps en super-compensation.';
    } else if (w === 11) {
      phase = 'Taper';
      isDeload = false;
      notes = 'TAPER S11 : volume -50%. Séances courtes et nettes. Vous avez fait le travail. Faites confiance.';
    } else {
      phase = 'Taper';
      isDeload = false;
      notes = 'RACE WEEK S12 : activation légère, visualisation, récupération maximale. RACE DAY approche.';
    }

    // Adapter les types de sessions selon la semaine
    if (w === 12) {
      weekDayTypes = [];
      for (var d = 0; d < Math.min(daysPerWeek, 4); d++) {
        if (d < 2) weekDayTypes.push('race_week');
        else weekDayTypes.push('mobilite');
      }
    } else if (w >= 10) {
      weekDayTypes = [];
      for (var d2 = 0; d2 < daysPerWeek; d2++) {
        if (d2 === 0) weekDayTypes.push('zone2_run');
        else if (d2 === 1) weekDayTypes.push('upper_ergs');
        else if (d2 === 2) weekDayTypes.push('lower_strength');
        else if (d2 === 3) weekDayTypes.push('sim_partial');
        else weekDayTypes.push('mobilite');
      }
    } else if (w >= 7) {
      weekDayTypes = [];
      for (var d3 = 0; d3 < daysPerWeek; d3++) {
        if (d3 === 0) weekDayTypes.push('interval_run');
        else if (d3 === 1) weekDayTypes.push('upper_ergs');
        else if (d3 === 2) weekDayTypes.push('lower_strength');
        else if (d3 === 3) weekDayTypes.push(daysPerWeek >= 6 ? 'stations_drill' : 'sim_full');
        else if (d3 === 4) weekDayTypes.push('sim_full');
        else weekDayTypes.push('mobilite');
      }
    } else {
      weekDayTypes = [];
      for (var d4 = 0; d4 < daysPerWeek; d4++) {
        weekDayTypes.push(dayTypes[d4] || dayTypes[dayTypes.length - 1]);
      }
    }

    var weekSessions = [];
    for (var di = 0; di < weekDayTypes.length; di++) {
      var sType = weekDayTypes[di];
      var fn = SESSION_MAP[sType];
      if (fn) {
        var session = fn(w, wMult);
        session.dayNumber = di + 1;
        session.type = sType;
        weekSessions.push(session);
      }
    }

    var totalMin = 0;
    for (var si = 0; si < weekSessions.length; si++) {
      totalMin += (weekSessions[si].duration || 60);
    }

    program.push({
      week: w,
      phase: phase,
      sessions: weekSessions,
      isDeload: isDeload,
      totalDuration: totalMin,
      notes: notes
    });
  }

  return program;
}
window.generateHyroxProgram = generateHyroxProgram;


// ─── PADEL ───
// FIX Hermès : icônes sobres gradées ○◔◑◕● + marqueurs typographiques.
var PADEL_LEVELS=[{id:'beginner',name:'Débutant',desc:'< 6 mois',icon:'\u25CB'},{id:'intermediate',name:'Intermédiaire',desc:'6 mois-2 ans',icon:'\u25D4'},{id:'advanced',name:'Avancé',desc:'2+ ans, compétitions',icon:'\u25D1'},{id:'competition',name:'Compétition',desc:'Tournois, classé',icon:'\u25CF'}];
window.PADEL_LEVELS=PADEL_LEVELS;
var PADEL_GOALS=[{id:'fitness',name:'Forme physique',desc:'Padel pour rester en forme',icon:'\u25A0'},{id:'improve',name:'Progresser',desc:'Améliorer technique et jeu',icon:'\u2197'},{id:'compete',name:'Compétition',desc:'Préparer des tournois',icon:'\u2605'},{id:'tournament',name:'Tournoi spécifique',desc:'Préparation ciblée',icon:'\u25CE'}];
window.PADEL_GOALS=PADEL_GOALS;
var PADEL_SKILLS=[{id:'forehand',name:'Coup droit',category:'Fondamentaux'},{id:'backhand',name:'Revers',category:'Fondamentaux'},{id:'serve',name:'Service',category:'Fondamentaux'},{id:'volley',name:'Volée',category:'Filet'},{id:'bandeja',name:'Bandeja',category:'Coups spéciaux'},{id:'vibora',name:'Víbora',category:'Coups spéciaux'},{id:'smash',name:'Smash',category:'Attaque'},{id:'lob',name:'Lob',category:'Défense'},{id:'chiquita',name:'Chiquita',category:'Coups spéciaux'},{id:'wall_play',name:'Jeu de mur',category:'Murs'},{id:'positioning',name:'Placement',category:'Tactique'}];
window.PADEL_SKILLS=PADEL_SKILLS;

function generatePadelProgram(days,level,goal){var program=[];var totalWeeks=8;var types={technique:function(w,lv){var d=lv==='beginner'?[{name:'Échauffement échanges',detail:'10min échanges fond de court',duration:'10min'},{name:'Coup droit fond',detail:'Échanges croisés, 50 balles. Préparation haute, transfert de poids',duration:'15min'},{name:'Revers fond',detail:'Échanges croisés revers, 50 balles. Prise continentale',duration:'15min'},{name:'Service',detail:'20 services chaque côté. Effet slicé, régularité',duration:'10min'},{name:'Volée',detail:'Volée-volée avec partenaire, 3x2min',duration:'10min'},{name:'Match dirigé',detail:'Points joués sans smash, jeu au sol',duration:'15min'}]:lv==='intermediate'?[{name:'Échauffement progressif',detail:'Fond → volées → bandeja, 5min chaque',duration:'15min'},{name:'Bandeja',detail:'Partenaire lobe, bandeja croisée. 30 balles chaque côté',duration:'15min'},{name:'Víbora',detail:'Prise marteau, slice agressif. 20 balles chaque côté',duration:'10min'},{name:'Jeu de mur',detail:'Partenaire sur le mur, contrôle. 3x3min',duration:'10min'},{name:'Chiquita',detail:'Depuis le fond, chiquita pour reprendre le filet. 30 balles',duration:'10min'},{name:'Points tactiques',detail:'Obligation de monter au filet sur chaque point',duration:'20min'}]:[{name:'Échauffement spécifique',detail:'Fond → volées → bandeja → smash → points',duration:'15min'},{name:'Sortie de mur',detail:'Bajada de pared, enchaînement attaque',duration:'15min'},{name:'Enchaînement bandeja-víbora-remate',detail:'Séquence offensive depuis le filet',duration:'15min'},{name:'Jeu de position',detail:'Points avec zones cibles, placement partenaire',duration:'15min'},{name:'Situations de match',detail:'Break points, tie-break, retour de service',duration:'20min'}];return{name:'🎾 Technique Padel',exercises:d,notes:'Focus technique. Qualité > quantité.'}},physical:function(w,lv){var s=lv==='beginner'?3:4;return{name:'💪 Prépa physique Padel',exercises:[{name:'Échauffement dynamique',detail:'Montées genoux, carioca, pas chassés × 5min',duration:'5min'},{name:'Déplacements latéraux',detail:s+'x30s shuffle + 30s repos',duration:'8min'},{name:'Agilité échelle',detail:'6 passages: in-out, icky shuffle, lateral',duration:'8min'},{name:'Explosivité split step',detail:'Split step + sprint 3m. '+s+'x8 reps',duration:'8min'},{name:'Circuit renforcement',detail:'3 tours: 15 squats + 10 fentes lat + 10 rotations + 30s planche',duration:'12min'},{name:'Épaules & poignet',detail:'Élastique: rotations 3x15, flexion poignet 3x20',duration:'8min'},{name:'Cardio intermittent',detail:s+'x(30s sprint + 30s repos)',duration:'10min'}],notes:'Le padel demande explosivité et agilité. 🏃'}},match:function(){return{name:'🏆 Match',exercises:[{name:'Échauffement',detail:'10min échanges + 5min volées',duration:'15min'},{name:'Match complet',detail:'2 sets complets',duration:'45-60min'},{name:'Analyse',detail:'Points forts/faibles, situations à travailler',duration:'5min'}],notes:'Le match est le meilleur entraînement. 🎾'}},tactics:function(w,lv){var d=lv==='beginner'?[{name:'Contrôle du filet',detail:'Celui au filet gagne 80% des points. Montez !',duration:'15min'},{name:'Lob défensif',detail:'En difficulté: lob haut et profond',duration:'15min'},{name:'Retour de service',detail:'Renvoyer au centre et monter. 20 retours',duration:'15min'},{name:'Points avec consigne',detail:'Pas de smash, patience',duration:'20min'}]:[{name:'Jeu croisé systématique',detail:'Tous les coups croisés sauf opportunité claire',duration:'15min'},{name:'Communication partenaire',detail:'Annonce mía/tuya, changements de côté',duration:'10min'},{name:'Pressing filet',detail:'Enchaînement volée-volée-smash pour conclure',duration:'15min'},{name:'Défense en X',detail:'Position en X, lob croisé pour reprendre',duration:'10min'},{name:'Situations spéciales',detail:'Mur latéral, bajada offensive, contre-attaque',duration:'15min'}];return{name:'🧠 Tactique',exercises:d,notes:'Padel = 70% tactique, 30% technique. 🧠'}},recovery:function(){return{name:'🧘 Récupération',exercises:[{name:'Mobilité épaules',detail:'Rotations, étirements dorsaux, 5min',duration:'5min'},{name:'Mobilité hanches',detail:'90/90, pigeon, fentes rotation, 5min',duration:'5min'},{name:'Foam rolling',detail:'Mollets, quads, IT band, dorsaux, 2min/zone',duration:'10min'},{name:'Yoga/stretching',detail:'Chien tête en bas → cobra → enfant → torsion, 3 tours',duration:'10min'},{name:'Poignet & avant-bras',detail:'Flexion/extension, massage balle tennis',duration:'5min'}],notes:'Essentiel pour prévenir blessures épaule/coude/poignet. 🧘'}}};var tpl={2:[{t:'technique'},{t:'match'}],3:[{t:'technique'},{t:'physical'},{t:'match'}],4:[{t:'technique'},{t:'physical'},{t:'tactics'},{t:'match'}],5:[{t:'technique'},{t:'physical'},{t:'tactics'},{t:'match'},{t:'recovery'}]};var wt=tpl[days]||tpl[3];for(var w=1;w<=totalWeeks;w++){var ws=[];var phase=w<=3?'Fondamentaux':w<=6?'Développement':'Compétition';wt.forEach(function(d,i){var fn=types[d.t];if(fn){var s=fn(w,level);s.dayNumber=i+1;s.type=d.t;ws.push(s)}});program.push({week:w,phase:phase,sessions:ws,isDeload:w===4,notes:w===4?'📉 Semaine légère':w===8?'🏆 Semaine test':phase==='Fondamentaux'?'🎾 Bases techniques et physiques':phase==='Développement'?'📈 Tactique et jeu':'🎯 Préparation compétition'})}return program}
window.generatePadelProgram=generatePadelProgram;

// ─── GOLF ───
// FIX Hermès : cercles gradés + marqueurs typographiques.
var GOLF_LEVELS=[{id:'beginner',name:'Débutant',desc:'< 1 an, HC 36+',icon:'\u25CB'},{id:'intermediate',name:'Intermédiaire',desc:'1-3 ans, HC 18-36',icon:'\u25D4'},{id:'advanced',name:'Avancé',desc:'3+ ans, HC 5-18',icon:'\u25D1'},{id:'scratch',name:'Expert',desc:'HC < 5, compétitions',icon:'\u25CF'}];
window.GOLF_LEVELS=GOLF_LEVELS;
// FIX Hermès : scores numériques + glyphes sobres.
var GOLF_GOALS=[{id:'start',name:'Débuter',desc:'Bases et carte verte',icon:'\u25CB'},{id:'break100',name:'Casser 100',desc:'Passer sous 100',icon:'100'},{id:'break90',name:'Casser 90',desc:'Scorer sous 90',icon:'90'},{id:'break80',name:'Casser 80',desc:'Niveau avancé',icon:'80'},{id:'compete',name:'Compétition',desc:'Préparer des tournois',icon:'\u2605'}];
window.GOLF_GOALS=GOLF_GOALS;
var GOLF_SKILLS=[{id:'driving',name:'Drive',category:'Long jeu'},{id:'iron_long',name:'Fers longs (3-5)',category:'Long jeu'},{id:'iron_mid',name:'Fers moyens (6-8)',category:'Long jeu'},{id:'iron_short',name:'Fers courts (9-PW)',category:'Approche'},{id:'chipping',name:'Chipping',category:'Petit jeu'},{id:'pitching',name:'Pitching',category:'Petit jeu'},{id:'putting',name:'Putting',category:'Putting'},{id:'bunker',name:'Bunker',category:'Petit jeu'},{id:'course_mgmt',name:'Gestion parcours',category:'Mental'},{id:'mental',name:'Mental & Routine',category:'Mental'}];
window.GOLF_SKILLS=GOLF_SKILLS;

function generateGolfProgram(days,level,goal){var program=[];var totalWeeks=8;var types={short_game:function(w,lv){var d=lv==='beginner'?[{name:'Putting distance',detail:'3 cercles: 3 balles à 1m, 2m, 3m. Objectif 8/9',duration:'15min'},{name:'Putting alignement',detail:'2 tees comme rails, 20 putts de 1.5m',duration:'10min'},{name:'Chip basique',detail:'Chip & run fer 8, 20 balles depuis 5m du green',duration:'15min'},{name:'Pitch 30m',detail:'SW depuis 30m, 15 balles. Contact balle-sol',duration:'15min'},{name:'Bunker initiation',detail:'15 balles, face ouverte, frapper sable 5cm avant',duration:'10min'}]:[{name:'Putting cercle pression',detail:'6 balles à 1m. Toutes rentrer. Raté = recommencer',duration:'10min'},{name:'Putting lag 8-12m',detail:'Putts longs, objectif cercle 1m du trou',duration:'10min'},{name:'Chip flop vs bump',detail:'Alternez chip roulé (fer 7) et lobé (LW)',duration:'15min'},{name:'Pitching distances clés',detail:'40m, 50m, 60m. 5 balles chaque. Mesurer dispersion',duration:'15min'},{name:'Bunker contrôle distance',detail:'Sorties à 5m, 10m, 15m. Varier ouverture face',duration:'10min'},{name:'Up & down challenge',detail:'10 positions aléatoires. Objectif 5/10 réussis',duration:'15min'}];return{name:'⛳ Petit jeu (60% du score)',exercises:d,notes:'Dave Pelz: 60% des coups à moins de 100m. ⛳'}},long_game:function(w,lv){var d=lv==='beginner'?[{name:'Échauffement fer 7',detail:'10 balles demi-swings. Contact et direction',duration:'5min'},{name:'Fer 7 full',detail:'20 balles cible 130m. Grip neutre, finish équilibré',duration:'15min'},{name:'Fer 9 précision',detail:'15 balles cible 110m',duration:'10min'},{name:'Driver',detail:'15 balles. Tee haut, sweep ascendant',duration:'15min'},{name:'Routine de tir',detail:'Derrière la balle, alignement, waggle, tir',duration:'10min'}]:[{name:'Échauffement progressif',detail:'SW → PW → 8 → 6 → 4 → Driver, 5/club',duration:'15min'},{name:'Travail de shape',detail:'Fer 7: 5 draws + 5 fades',duration:'15min'},{name:'Fers longs / Hybride',detail:'15 balles fer 5 ou hybride. Cible précise',duration:'10min'},{name:'Driver stratégie',detail:'10 balles. Visez fairway 230m. Régularité > distance',duration:'10min'},{name:'Simulation parcours',detail:'9 trous imaginaires, club approprié chaque situation',duration:'15min'}];return{name:'🏌️ Long jeu',exercises:d,notes:'Le drive impressionne, le putting gagne. 🏌️'}},course_play:function(w,lv){return{name:'⛳ Parcours',exercises:[{name:'Parcours',detail:lv==='beginner'?'9 trous focus tempo et plaisir':'18 trous conditions de score',duration:'2-4h'},{name:'Gestion',detail:'Stratégie conservatrice: centre du green, pas le drapeau',duration:'pendant parcours'},{name:'Notes post-parcours',detail:'Fairways touchés, GIR, putts, up & down',duration:'10min'}],notes:'Appliquez ce que vous avez travaillé. 📊'}},physical:function(){return{name:'💪 Physique golf',exercises:[{name:'Mobilité rotation',detail:'Rotation thoracique 3x10 chaque côté',duration:'8min'},{name:'Stabilité hanche',detail:'Fentes latérales 3x10, single leg RDL 3x8',duration:'10min'},{name:'Force core',detail:'Planche 3x45s, russian twist 3x20, pallof press 3x10',duration:'10min'},{name:'Puissance rotationnelle',detail:'Medicine ball throws: 3x8 rotational, 3x8 overhead',duration:'8min'},{name:'Souplesse',detail:'Hamstrings, épaules, hanches, thoracique. 30s/stretch',duration:'10min'},{name:'Grip & avant-bras',detail:'Squeezes 3x20, wrist curls 3x15',duration:'5min'}],notes:'La distance vient de la rotation et du core, pas des bras. 💪'}},mental:function(){return{name:'🧠 Mental & Routine',exercises:[{name:'Routine pré-tir',detail:'Visualisation, alignement, trigger. 15 balles',duration:'15min'},{name:'Respiration',detail:'Box breathing: 4s inspire, 4s retient, 4s expire, 4s retient',duration:'5min'},{name:'Visualisation',detail:'Fermez les yeux. Jouez le trou le plus dur mentalement',duration:'5min'},{name:'Putting sous pression',detail:'Jeu du 21: putts consécutifs 1m, 1.5m, 2m...',duration:'15min'},{name:'Analyse vidéo',detail:'Filmez votre swing face et DTL. Comparez',duration:'10min'}],notes:'Bob Rotella: "Golf is not a game of perfect." 🧘'}}};var tpl={2:[{t:'short_game'},{t:'course_play'}],3:[{t:'short_game'},{t:'long_game'},{t:'course_play'}],4:[{t:'short_game'},{t:'long_game'},{t:'physical'},{t:'course_play'}],5:[{t:'short_game'},{t:'long_game'},{t:'physical'},{t:'mental'},{t:'course_play'}]};var wt=tpl[days]||tpl[3];for(var w=1;w<=totalWeeks;w++){var ws=[];var phase=w<=3?'Fondamentaux':w<=6?'Développement':'Performance';wt.forEach(function(d,i){var fn=types[d.t];if(fn){var s=fn(w,level);s.dayNumber=i+1;s.type=d.t;ws.push(s)}});program.push({week:w,phase:phase,sessions:ws,isDeload:w===4,notes:w===4?'📉 Semaine légère — jouez pour le plaisir':w===8?'🏆 Parcours test — conditions compétition':phase==='Fondamentaux'?'⛳ Fondations solides':phase==='Développement'?'📈 Technique et stratégie':'🎯 Performance et gestion parcours'})}return program}
window.generateGolfProgram=generateGolfProgram;

// ─── CARDIO PRESCRIPTIONS (ACSM 2018, Tanaka FCmax) ───
function generateCardioPrescription(userAge, userWeight, sportGoals, sportLevel, sex) {
  var fcMax = Math.round(208 - 0.7 * (userAge || 30));
  var isShred = sportGoals && (sportGoals.indexOf('shred') !== -1 || sportGoals.indexOf('weightloss') !== -1);
  var isBulk = sportGoals && sportGoals.indexOf('muscle') !== -1;
  var isEndurance = sportGoals && sportGoals.indexOf('endurance') !== -1;
  var prescriptions = [];
  if (isShred) {
    prescriptions.push({type:'LISS',name:'Marche inclinée (tapis)',duration:sportLevel==='beginner'?25:sportLevel==='intermediate'?35:45,intensity:'Z2 (60-70% FC)',fcTarget:Math.round(fcMax*0.60)+'-'+Math.round(fcMax*0.70)+' bpm',incline:sportLevel==='beginner'?'4-6%':'8-12%',speed:'5-6 km/h',frequency:'3-5x/semaine',timing:'Après la musculation',note:'La marche inclinée est le ROI #1 pour la sèche : brûle les graisses sans détruire le muscle.'});
    prescriptions.push({type:'HIIT',name:'HIIT Sprint/Récup',duration:sportLevel==='beginner'?12:18,intensity:'Z4-Z5 (85-95% FC)',fcTarget:Math.round(fcMax*0.85)+'-'+Math.round(fcMax*0.95)+' bpm',incline:'1-2%',protocol:sportLevel==='beginner'?'6x (20s sprint / 40s marche)':sportLevel==='intermediate'?'8x (30s sprint / 60s trot)':'10x (30s sprint / 30s trot)',frequency:'1-2x/semaine',timing:'Session séparée',note:'HIIT = afterburn effect (EPOC). Brûle des calories 24h après.'});
  }
  if (isBulk) {
    prescriptions.push({type:'LISS',name:'Marche inclinée légère',duration:15,intensity:'Z1-Z2 (55-65% FC)',fcTarget:Math.round(fcMax*0.55)+'-'+Math.round(fcMax*0.65)+' bpm',incline:'2-3%',speed:'5 km/h',frequency:'2-3x/semaine',note:'En prise de masse : cardio MINIMUM. Juste assez pour le cœur.'});
  }
  if (isEndurance) {
    prescriptions.push({type:'LISS',name:'Course endurance fondamentale',duration:sportLevel==='beginner'?25:sportLevel==='intermediate'?35:50,intensity:'Z2 (65-75% FC)',fcTarget:Math.round(fcMax*0.65)+'-'+Math.round(fcMax*0.75)+' bpm',incline:'1-2%',speed:sex==='femme'?'7-9 km/h':'8-11 km/h',frequency:'3-4x/semaine',note:'Endurance fondamentale : vous devez pouvoir parler.'});
    prescriptions.push({type:'INTERVALS',name:'Intervalles VO2max',duration:20,intensity:'Z4-Z5 (88-95% FC)',fcTarget:Math.round(fcMax*0.88)+'-'+Math.round(fcMax*0.95)+' bpm',protocol:sportLevel==='beginner'?'4x (3min Z4 / 2min Z1)':'5x (4min Z4 / 2min Z1)',frequency:'1x/semaine',note:'Le travail de VO2max est le plus efficace pour progresser.'});
  }
  if (!isShred && !isBulk && !isEndurance) {
    prescriptions.push({type:'LISS',name:'Cardio modéré',duration:25,intensity:'Z2 (60-70% FC)',fcTarget:Math.round(fcMax*0.60)+'-'+Math.round(fcMax*0.70)+' bpm',incline:'2-3%',frequency:'2-3x/semaine',note:'Maintien cardiovasculaire. Variez : tapis, vélo, elliptique, rameur.'});
  }
  return {
    fcMax:fcMax,
    zones:[
      {zone:'Z1',name:'Échauffement',range:Math.round(fcMax*0.50)+'-'+Math.round(fcMax*0.60)+' bpm',color:'#C8C8C0'},
      {zone:'Z2',name:'Brûle-graisse',range:Math.round(fcMax*0.60)+'-'+Math.round(fcMax*0.70)+' bpm',color:'#3E5C3A'},
      {zone:'Z3',name:'Aérobie',range:Math.round(fcMax*0.70)+'-'+Math.round(fcMax*0.80)+' bpm',color:'#1A3A6A'},
      {zone:'Z4',name:'Seuil',range:Math.round(fcMax*0.80)+'-'+Math.round(fcMax*0.90)+' bpm',color:'#7A3B0E'},
      {zone:'Z5',name:'Max',range:Math.round(fcMax*0.90)+'-'+fcMax+' bpm',color:'#7A1F1F'}
    ],
    prescriptions:prescriptions
  };
}
window.generateCardioPrescription = generateCardioPrescription;

// ─── BRIDGE NUTRITION MASTER ─────────────────────────────────────────────────
// Connecte window.S → NutritionMaster.compute() → window.S._nm (cache)
// Les fonctions calcBMR/calcTDEE/calcTarget/calcMacros restent inchangées
// et continuent à gérer les ajustements médicaux.
// window.S._nm est la source de vérité pour RecipeEngine et app-sport.

function buildNMInputs(trainingDay) {
  var s = window.S;
  var genderMap = { homme: 'male', femme: 'female' };
  return {
    gender:        genderMap[s.sex] || 'male',
    age:           getAge() || 30, // Défaut 30 si âge non renseigné (plus représentatif que 25)
    weightKg:      s.weight || 75,
    heightCm:      s.height || 175,
    activityLevel: s.activity !== null && ACTIVITIES[s.activity]
                   ? Math.min(ACTIVITIES[s.activity].factor, 2.5)
                   : 1.2,
    goal:             s.goal !== null && GOALS[s.goal] ? GOALS[s.goal].key : 'maintain',
    isElite:          s.activity !== null && s.activity >= 4,
    bodyFatEstimate:  (s._bodyFatEstimate !== undefined && s._bodyFatEstimate !== null) ? s._bodyFatEstimate : null,
    trainingDay:      false // NM never applies carb cycling; computeNutritionState is the sole source
  };
}

function computeNutritionState(trainingDay) {
  // Derive training status from ACTUAL session history via SFCEngine — overrides schedule-based param
  var _sfcSignal = null;
  if (window.SFCEngine && window.SFCSymbiosis && window.SFCSymbiosis.getSFCSessions) {
    try { _sfcSignal = window.SFCEngine.computeTrainingSignal(window.SFCSymbiosis.getSFCSessions(), Date.now()); } catch (_) {}
  }
  if (_sfcSignal !== null) { trainingDay = _sfcSignal.trainedToday; }

  if (!window.NutritionMaster) return null;
  // FIX BUG-NM-SPORT-ONLY 2026-04 : en mode sport-only (appMode='sport'), S.goal est null
  // (l'user n'a pas fait l'onboarding nutrition). computeNutritionState retournait null → S._nm=null
  // → RecipeEngine.getAdaptedRecipe échouait silencieusement (no scaling, no adapted macros).
  // buildNMInputs() defaulte déjà goal → 'maintain' si S.goal=null (ligne ~6689).
  // Seul le guard ci-dessous bloquait le calcul. On autorise S.goal=null pour les sport-only
  // si le profil biométrique est complet (sex + age) — NutritionMaster peut calculer.
  // calcTarget/calcMacros retournent toujours 0 pour S.goal===null (pas d'affichage nutrition).
  var _allowNullGoal = window.S.appMode === 'sport' && window.S.sex !== null;
  if (!_allowNullGoal && window.S.goal === null) return null;
  if (window.S.sex === null) return null;
  // I-02: si getAge() retourne null/0, on ne calcule pas avec age=25 fantôme
  if (!getAge()) { window.S._nm = null; return null; }
  var inputs = buildNMInputs(trainingDay);
  var result = window.NutritionMaster.compute(inputs);
  // I-01: invalider le cache stale si NutritionMaster remonte des erreurs
  if (result.errors && result.errors.length > 0) { window.S._nm = null; return null; }

  // Applique les sur-couches médicales de app-core (calcTarget / calcMacros)
  // pour que les valeurs médicalement ajustées soient reflétées dans _nm
  // FIX BUG-NM-SPORT-ONLY 2026-04 : pour sport-only (S.goal===null), calcTarget()→0 et
  // calcMacros()→{g:0,p:0,l:0}. Ne pas écraser les valeurs NutritionMaster (goal='maintain')
  // avec ces zéros — le result NutritionMaster est la seule source valide de macros pour ces users.
  var adjustedCalories = calcTarget();
  var adjustedMacros   = calcMacros();
  if (adjustedCalories && adjustedCalories > 0) {
    result.caloriesTarget = adjustedCalories;
  }
  if (adjustedMacros && (adjustedMacros.p > 0 || adjustedMacros.g > 0 || adjustedMacros.l > 0)) {
    result.proteinGrams = adjustedMacros.p;
    result.carbsGrams   = adjustedMacros.g;
    result.fatGrams     = adjustedMacros.l;
    result.caloriesCheck = Math.round(
      adjustedMacros.p * 4 + adjustedMacros.g * 4 + adjustedMacros.l * 9
    );
  }

  // ─── CARB CYCLING v2 — granular load-dependent modulation + consecutive-heavy smoothing ───
  // Holland 2019 JISSN: periodic carb modulation → ↑ glycogen resynthesis
  // Rates: heavy=+20%, moderate=+10%, light=baseline, rest=-10%
  // Smoothing: 2+ consecutive heavy days → cap raised to +25% (accumulated glycogen depletion)
  // Macro swap is always calorie-neutral (carbs ↑ = fat ↓) so caloriesTarget is preserved:
  //   fat-loss users stay in their deficit; muscle users benefit from higher carb availability.
  var _hasSportDays  = Array.isArray(window.S.trainingDaysSelected) && window.S.trainingDaysSelected.length > 0;
  var _hasSportGoals = Array.isArray(window.S.sportGoals) && window.S.sportGoals.length > 0;
  if (_hasSportDays && _hasSportGoals && result.carbsGrams > 0 && result.fatGrams > 0 && result.caloriesTarget > 0) {
    var _fatFloor = Math.round(result.caloriesTarget * 0.15 / 9); // floor 15% fat (ACSM 2009)
    // Load from SFCEngine (actual sessions) with fallback to legacy S.trainingLoad
    var _tl = _sfcSignal
      ? ((_sfcSignal.trainedToday && _sfcSignal.todayLoad) || (_sfcSignal.trainedYesterday && _sfcSignal.yesterdayLoad) || 'rest')
      : ((window.S && (window.S.dailyTrainingLoad || window.S.trainingLoad)) || 'moderate');
    if (!_tl) _tl = 'rest';

    // ── Consecutive heavy-day streak (smoothing) ──────────────────────────────────
    var _prevStreak  = (typeof window.S.heavyDayStreak === 'number') ? window.S.heavyDayStreak : 0;
    // Only count actual training days toward the streak — yesterdayLoad carryover must not increment it
    var _trainedTodayHeavy = trainingDay === true && _tl === 'heavy';
    var _heavyStreak = _trainedTodayHeavy ? _prevStreak + 1 : 0;
    window.S.heavyDayStreak = _heavyStreak;

    // ── UX nutrition tag ──────────────────────────────────────────────────────────
    // recovery   → 2+ consecutive heavy days; body needs active recovery nutrition
    // performance → training day heavy/moderate; fuel for workout output
    // fat-loss    → rest day or light training; deficit is the priority
    if (_heavyStreak >= 2) {
      window.S.nutritionTag = 'recovery';
    } else if (!trainingDay || _tl === 'light') {
      window.S.nutritionTag = 'fat-loss';
    } else {
      window.S.nutritionTag = 'performance';
    }

    // ── Macro modulation ──────────────────────────────────────────────────────────
    if (trainingDay === true) {
      var _carbRate;
      if (_tl === 'heavy') {
        // 2+ consecutive heavy days → cap at +25% (more glycogen depletion, higher replenishment need)
        // Single heavy day → standard +20%
        _carbRate = _heavyStreak >= 2 ? 0.25 : 0.20;
      } else if (_tl === 'moderate') {
        _carbRate = 0.10;
      } else {
        _carbRate = 0; // light → baseline
      }
      if (_carbRate > 0) {
        var _carbExtra  = Math.round(result.carbsGrams * _carbRate);
        var _fatCompens = Math.min(Math.round(_carbExtra * 4 / 9), result.fatGrams - _fatFloor);
        result.carbsGrams += _carbExtra;
        if (_fatCompens > 0) result.fatGrams -= _fatCompens;
      }
    } else {
      // Rest day: -10% carbs, shift to fat (Helms 2014 calorie cycling)
      var _carbRed = Math.round(result.carbsGrams * 0.10);
      var _carbsAfterRed = Math.max(130, result.carbsGrams - _carbRed); // floor 130g (IOM 2005 — brain glucose minimum)
      var _actualCarbRed = result.carbsGrams - _carbsAfterRed; // < _carbRed when IOM floor is hit
      result.carbsGrams = _carbsAfterRed;
      // Only add fat for the calories actually removed from carbs (prevents net surplus when floor is hit)
      if (_actualCarbRed > 0) {
        result.fatGrams = Math.min(result.fatGrams + Math.round(_actualCarbRed * 4 / 9), Math.round(result.caloriesTarget * 0.35 / 9));
      }
    }
    result.caloriesCheck = Math.round(result.proteinGrams*4 + result.carbsGrams*4 + result.fatGrams*9);
  }

  // Détection conflit objectif nutrition ↔ sport (bulk + endurance = surplus inutile)
  var _gk = window.GOALS && window.GOALS[window.S.goal] ? window.GOALS[window.S.goal].key : null;
  var _isBulk = _gk === 'bulk' || _gk === 'lean_bulk';
  var _sg = window.S.sportGoals || [];
  var _hasMuscSport = _sg.indexOf('muscle') !== -1 || _sg.indexOf('shred') !== -1;
  var _hasEndurSport = _sg.length > 0 && !_hasMuscSport &&
    (_sg.indexOf('endurance') !== -1 || _sg.indexOf('weightloss') !== -1 || _sg.indexOf('general') !== -1);
  result.goalConflict = (_isBulk && _hasEndurSport)
    ? 'Votre objectif nutrition (prise de masse) est incompatible avec votre programme sport (endurance/cardio). Un surplus calorique sans entraînement en force favorise la prise de gras. Alignez vos objectifs pour de meilleurs résultats.'
    : null;

  window.S._nm = result;
  return result;
}

window.computeNutritionState = computeNutritionState;
window.buildNMInputs = buildNMInputs;
// ─────────────────────────────────────────────────────────────────────────────

// ─── SECURITY: Freeze all constants ───
if (Object.freeze) {
  [ACTIVITIES,TRAINS,SLEEPS,GOALS,RATIOS,COOK_LEVELS,ALLERGIES,INTOLERANCES,REGIMES,CUISINES,MEDICAL,ALCOHOL_DB,ALCOHOL_FREQS,FOOD_HABITS_MEALS,EATING_LOCATIONS,BODY_ZONES,SPORT_GOALS,SPORT_LEVELS,PADEL_LEVELS,PADEL_GOALS,PADEL_SKILLS,GOLF_LEVELS,GOLF_GOALS,GOLF_SKILLS].forEach(function(obj){ try{Object.freeze(obj);}catch(e){} });
  // Freeze unit conversion constants (mutable 'weight'/'height' props are intentionally left unfrozen)
  try { Object.freeze({ KG_TO_LBS: window.UNITS.KG_TO_LBS, LBS_TO_KG: window.UNITS.LBS_TO_KG, CM_TO_INCH: window.UNITS.CM_TO_INCH, INCH_TO_CM: window.UNITS.INCH_TO_CM }); } catch(e) {}
}

// ─── SECURITY: localStorage XOR obfuscation helpers ───
// Discourages trivial reading of profile data from DevTools console
// Key is derived per-session using user id + a fixed app salt
(function(){
  'use strict';
  var _XOR_KEY = 'MTD_SFCH_2024';

  function xorString(str, key) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      out.push(String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length)));
    }
    return out.join('');
  }

  function encodeStorage(data) {
    try {
      var json = JSON.stringify(data);
      var xored = xorString(json, _XOR_KEY);
      return btoa(unescape(encodeURIComponent(xored)));
    } catch(e) { return null; }
  }

  function decodeStorage(encoded) {
    try {
      var xored = decodeURIComponent(escape(atob(encoded)));
      return JSON.parse(xorString(xored, _XOR_KEY));
    } catch(e) { return null; }
  }

  // Expose helpers for app-main.js saveProfile / loadProfile
  window._storageEncode = encodeStorage;
  window._storageDecode = decodeStorage;

  // ─── SECURITY: Integrity check on critical functions ───
  // Detect if key functions have been tampered with by malicious browser extensions
  // Runs once at load time; logs warning if fingerprint mismatch detected
  function fingerprintFn(fn) {
    if (typeof fn !== 'function') return 0;
    var s = fn.toString();
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0);
  }

  // Record baseline fingerprints at first load (before any extension can modify)
  var _baseFP = {};
  try {
    _baseFP.calcBMR     = fingerprintFn(window.calcBMR);
    _baseFP.calcTarget  = fingerprintFn(window.calcTarget);
    _baseFP.calcMacros  = fingerprintFn(window.calcMacros);
    _baseFP.sanitizeHTML = fingerprintFn(window.sanitizeHTML);
  } catch(e) {
    console.error('[app-core] erreur:', e);
  }

  window._verifyCriticalFunctions = function() {
    var tampered = [];
    try {
      if (_baseFP.calcBMR     && fingerprintFn(window.calcBMR)      !== _baseFP.calcBMR)     tampered.push('calcBMR');
      if (_baseFP.calcTarget  && fingerprintFn(window.calcTarget)   !== _baseFP.calcTarget)  tampered.push('calcTarget');
      if (_baseFP.calcMacros  && fingerprintFn(window.calcMacros)   !== _baseFP.calcMacros)  tampered.push('calcMacros');
      if (_baseFP.sanitizeHTML && fingerprintFn(window.sanitizeHTML) !== _baseFP.sanitizeHTML) tampered.push('sanitizeHTML');
    } catch(e) {
      console.error('[app-core] erreur:', e);
    }
    if (tampered.length > 0 && typeof console !== 'undefined' && console.warn) {
      console.warn('[MTD Security] Integrity check: modified functions detected:', tampered.join(', '));
    }
    return tampered.length === 0;
  };

  // ─── SECURITY: Anti-copy protection on sensitive calculated results ───
  // Disables right-click and text selection on macro result elements
  document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('contextmenu', function(e) {
      var el = e.target;
      // Only block on macro/result display elements
      if (el && (
        el.classList.contains('macro-cell') ||
        el.classList.contains('result-title') ||
        el.classList.contains('stat-val')
      )) {
        e.preventDefault();
      }
    });
  });
})();

})();

// ─── RGPD: Export des données utilisateur (droit à la portabilité) ───
function exportUserData() {
  var data = {
    exportDate: new Date().toISOString(),
    appVersion: 'SmartFitCoach v1',
    profile: {},
    nutrition: {},
    sport: {},
    gamification: {}
  };

  // Profil — lire la clé UID-versionnée (migration V4 2026-04)
  var _expUid = (window.AUTH && window.AUTH.getUser()) ? window.AUTH.getUser().id : null;
  var _expKey = _expUid ? 'mtd_profile_' + _expUid : 'mtd_profile';
  try { data.profile = JSON.parse(localStorage.getItem(_expKey) || '{}'); } catch(e) {}

  // Nutrition : toutes les clés mtd_weight_history_* et mtd_meals_*
  try {
    Object.keys(localStorage).forEach(function(k) {
      if (k.indexOf('mtd_weight') === 0 || k.indexOf('mtd_meal') === 0 || k.indexOf('mtd_food') === 0) {
        try { data.nutrition[k] = JSON.parse(localStorage.getItem(k)); } catch(e) { data.nutrition[k] = localStorage.getItem(k); }
      }
    });
  } catch(e) {}

  // Sport : toutes les clés mtd_cf_*, mtd_muscu_*, mtd_run_*, mtd_perf_*
  try {
    Object.keys(localStorage).forEach(function(k) {
      if (k.indexOf('mtd_cf_') === 0 || k.indexOf('mtd_muscu_') === 0 || k.indexOf('mtd_run_') === 0 || k.indexOf('mtd_perf_') === 0 || k.indexOf('mtd_sport') === 0) {
        try { data.sport[k] = JSON.parse(localStorage.getItem(k)); } catch(e) { data.sport[k] = localStorage.getItem(k); }
      }
    });
  } catch(e) {}

  // Gamification
  try {
    Object.keys(localStorage).forEach(function(k) {
      if (k.indexOf('mtd_gami') === 0 || k.indexOf('mtd_badge') === 0 || k.indexOf('mtd_streak') === 0) {
        try { data.gamification[k] = JSON.parse(localStorage.getItem(k)); } catch(e) { data.gamification[k] = localStorage.getItem(k); }
      }
    });
  } catch(e) {}

  // Télécharger le fichier JSON
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'smartfitcoach-mes-donnees-' + new Date().toISOString().slice(0,10) + '.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(function() { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
}

// Exposer globalement
window.exportUserData = exportUserData;

// ─── OFFLINE BANNER ───
(function() {
  var banner = document.getElementById('offline-banner');
  if (!banner) return;
  function update() {
    var isOffline = !navigator.onLine;
    banner.style.display = isOffline ? 'block' : 'none';
    if (isOffline) {
      var lang = (typeof window.isEnglish === 'function' && window.isEnglish()) ? 'en' : 'fr';
      var txt = banner.getAttribute('data-' + lang) || banner.getAttribute('data-fr') || banner.textContent;
      banner.textContent = txt;
    }
  }
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
})();
