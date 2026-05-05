/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
// ai-coach.js — Coach IA SmartFitCoach
// Interface chat + contexte utilisateur + appel Netlify Function
(function() {
'use strict';

var FUNCTION_URL = '/.netlify/functions/ai-coach';
var MAX_HISTORY = 20;    // messages max en mémoire locale
var MAX_API_MESSAGES = 10; // max messages envoyés à l'API (5 échanges)
var MAX_MSG_CHARS = 500;   // tronquer chaque message à 500 chars avant envoi
var _panelOpen = false;
var _sending = false;
var _lastRemaining = null; // dernier quota reçu du backend

// POLISH 2026-04 (i18n) : helper local i18n avec fallback FR (si window.I18N absent
// ou clé inexistante). Permet refactor incrémental sans casser le hardcoded existant.
function _t(key, fallback) {
  try {
    if (window.I18N && typeof window.I18N.t === 'function') {
      var v = window.I18N.t(key);
      // Si la clé n'est pas trouvée, I18N.t retourne la clé elle-même → fallback
      if (v && v !== key) return v;
    }
  } catch(e) {}
  return fallback;
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
var style = document.createElement('style');
style.textContent = [
  // Bouton flottant — desktop
  /* FIX supervision Hermès 2026-04-15 : cercle 48×48 (bible §8 FAB spec). */
  '#ai-coach-btn{position:fixed;bottom:calc(72px + env(safe-area-inset-bottom,0px));right:84px;z-index:950;background:var(--ink-900,#0A0A09);color:var(--paper,#FAF9F6);border:none;border-radius:50%;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center;width:48px;height:48px;box-shadow:0 6px 16px rgba(10,10,9,0.18);transition:transform 120ms ease-out;}',
  '#ai-coach-btn:hover{background:var(--ivory,#FAF9F6);color:var(--black,#0A0A09);box-shadow:0 8px 32px rgba(10,10,9,0.18);}',
  // Bouton flottant — mobile
  '@media(max-width:479px){#ai-coach-btn{bottom:calc(64px + 36px + env(safe-area-inset-bottom,0px));right:84px;}}',

  // Panel — desktop
  '#ai-coach-panel{position:fixed;bottom:80px;right:24px;z-index:8999;width:min(440px,100vw);height:min(680px,92vh);max-height:calc(100dvh - 80px);background:var(--ivory,#FAF9F6);border-top:1px solid var(--black,#0A0A09);border-left:1px solid var(--border,#D8D8D0);border-radius:2px 0 0 0;display:flex;flex-direction:column;transform:translateY(calc(100% + 80px));transition:transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94);box-shadow:-8px 0 40px rgba(10,10,9,0.1);}',
  '#ai-coach-panel.open{transform:translateY(0);}',
  // Panel — mobile
  '@media(max-width:479px){#ai-coach-panel{bottom:0;left:0;right:0;width:100%;border-radius:12px 12px 0 0;border-left:none;max-height:calc(100dvh - 80px);transform:translateY(100%);}#ai-coach-panel.open{transform:translateY(0);}}',

  // Header
  '#ai-coach-header{padding:20px 24px;border-bottom:1px solid var(--border,#D8D8D0);display:flex;align-items:center;justify-content:space-between;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);flex-shrink:0;}',
  '#ai-coach-header-title{font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:5px;text-transform:uppercase;}',
  '#ai-coach-header-sub{font-family:Georgia,serif;font-size:13px;font-style:italic;opacity:0.6;margin-top:3px;}',
  '#ai-coach-close{background:none;border:none;color:var(--ivory,#FAF9F6);cursor:pointer;font-size:20px;padding:4px;opacity:0.6;line-height:1;transition:opacity 0.2s ease;min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;}',
  '#ai-coach-close:hover{opacity:1;}',

  // Messages
  '#ai-coach-messages{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:16px;}',
  '#ai-coach-messages::-webkit-scrollbar{width:3px;}',
  '#ai-coach-messages::-webkit-scrollbar-track{background:var(--ivory3,#EEEDE8);}',
  '#ai-coach-messages::-webkit-scrollbar-thumb{background:var(--border,#D8D8D0);}',
  '.ai-msg{max-width:88%;line-height:1.65;}',
  '.ai-msg-user{align-self:flex-end;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);padding:12px 16px;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;}',
  '.ai-msg-coach{align-self:flex-start;background:var(--ivory2,#F4F4F0);border:1px solid var(--border,#D8D8D0);border-radius:2px;padding:14px 16px;}',
  '.ai-msg-coach-name{font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:8px;}',
  '.ai-msg-text{font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:inherit;line-height:1.65;}',
  '.ai-msg-typing{font-family:Georgia,serif;font-style:italic;color:var(--grey,#6B6B65);font-size:13px;display:inline-flex;align-items:center;gap:3px;}',
  // POLISH 2026-04 (V1.1) : 3 points animés propres (vs texte statique "réfléchit...")
  '.ai-typing-dots{display:inline-flex;gap:3px;margin-left:6px;}',
  '.ai-typing-dots span{width:4px;height:4px;background:var(--grey,#6B6B65);border-radius:50%;display:inline-block;animation:aiTypingBlink 1.4s infinite both;}',
  '.ai-typing-dots span:nth-child(2){animation-delay:0.2s;}',
  '.ai-typing-dots span:nth-child(3){animation-delay:0.4s;}',
  '@keyframes aiTypingBlink{0%,80%,100%{opacity:0.25;transform:scale(0.9);}40%{opacity:1;transform:scale(1.1);}}',
  // POLISH 2026-04 (V1.2) : barre d'actions sous messages coach (copier / régénérer / feedback)
  '.ai-msg-actions{display:flex;gap:4px;margin-top:8px;opacity:0;transition:opacity 0.2s ease;}',
  '.ai-msg-coach:hover .ai-msg-actions{opacity:1;}',
  '.ai-msg-actions button{background:none;border:1px solid var(--border,#D8D8D0);border-radius:2px;padding:4px 7px;cursor:pointer;color:var(--grey,#6B6B65);font-size:11px;line-height:1;transition:all 0.15s ease;display:inline-flex;align-items:center;justify-content:center;min-width:26px;height:24px;}',
  '.ai-msg-actions button:hover{background:var(--ivory2,#F4F4F0);color:var(--black,#0A0A09);border-color:var(--grey,#6B6B65);}',
  '.ai-msg-actions button.active-up{color:var(--green,#1A4A1A);border-color:var(--green,#1A4A1A);background:var(--greenbg,rgba(26,74,26,0.06));}',
  '.ai-msg-actions button.active-down{color:var(--red,#5A1010);border-color:var(--red,#5A1010);background:var(--redbg,rgba(90,16,16,0.06));}',
  // Toast feedback action (copié, régénéré, merci)
  '.ai-toast{position:fixed;bottom:120px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);padding:10px 18px;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;z-index:9999;opacity:0;pointer-events:none;transition:opacity 0.25s ease, transform 0.25s ease;}',
  '.ai-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}',
  // Compteur rate-limit (V1.3)
  '.ai-rate-hint{font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--grey,#6B6B65);padding:4px 20px 0;text-align:right;}',
  // Pill "nouveaux messages" si auto-scroll suspendu (V1.3)
  '.ai-new-pill{position:absolute;bottom:90px;left:50%;transform:translateX(-50%);background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);padding:6px 14px;border-radius:14px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;z-index:10;opacity:0;pointer-events:none;transition:opacity 0.2s ease;}',
  '.ai-new-pill.show{opacity:1;pointer-events:auto;}',

  // Suggestions rapides
  '#ai-suggestions{padding:10px 20px;display:flex;gap:8px;flex-wrap:wrap;border-top:1px solid var(--border,#D8D8D0);background:var(--ivory2,#F4F4F0);flex-shrink:0;}',
  '.ai-suggestion{font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;padding:8px 12px;background:none;border:1px solid var(--border,#D8D8D0);border-radius:2px;cursor:pointer;color:var(--black,#0A0A09);white-space:nowrap;transition:all 0.2s ease;}',
  '.ai-suggestion:hover{background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border-color:var(--black,#0A0A09);}',

  // Input
  '#ai-coach-input-area{padding:14px 20px;border-top:1px solid var(--border,#D8D8D0);display:flex;gap:12px;align-items:flex-end;background:var(--ivory,#FAF9F6);flex-shrink:0;}',
  '#ai-coach-input{flex:1;border:none;border-bottom:1px solid var(--border,#D8D8D0);padding:10px 0;font-size:13px;font-family:"Helvetica Neue",Arial,sans-serif;resize:none;height:36px;max-height:120px;background:transparent;color:var(--black,#0A0A09);line-height:1.5;outline:none;}',
  '#ai-coach-input:focus{border-bottom-color:var(--black,#0A0A09);}',
  '#ai-coach-send{background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:1px solid var(--black,#0A0A09);border-radius:2px;padding:12px 20px;cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;white-space:nowrap;transition:all 0.2s ease;}',
  // FIX P2 audit accessibility WCAG : focus-visible visible pour navigation clavier (input + boutons coach)
  '#ai-coach-input:focus-visible,#ai-coach-send:focus-visible,#ai-coach-mic:focus-visible,.ai-suggestion:focus-visible,.ai-msg-actions button:focus-visible{outline:2px solid var(--black,#0A0A09);outline-offset:2px;}',
  '#ai-coach-send:disabled{opacity:0.35;cursor:not-allowed;}',
  '#ai-coach-send:hover:not(:disabled){background:var(--ivory,#FAF9F6);color:var(--black,#0A0A09);}',
  // POLISH 2026-04 (VOICE) : bouton micro Web Speech API. SVG inline (cohérent design luxe vs emoji).
  '#ai-coach-mic{background:none;border:1px solid var(--border,#D8D8D0);border-radius:2px;width:44px;height:44px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--grey,#6B6B65);transition:all 0.2s ease;flex-shrink:0;padding:0;}',
  '#ai-coach-mic:hover:not(:disabled){border-color:var(--black,#0A0A09);color:var(--black,#0A0A09);background:var(--ivory2,#F4F4F0);}',
  '#ai-coach-mic:disabled{opacity:0.35;cursor:not-allowed;}',
  '#ai-coach-mic.recording{border-color:var(--red,#5A1010);color:var(--red,#5A1010);background:rgba(90,16,16,0.04);animation:micPulse 1.4s ease-in-out infinite;}',
  '#ai-coach-mic svg{width:18px;height:18px;display:block;}',
  '@keyframes micPulse{0%,100%{box-shadow:0 0 0 0 rgba(90,16,16,0.35);}50%{box-shadow:0 0 0 6px rgba(90,16,16,0);}}',
  // FIX P2 audit accessibility : respecter prefers-reduced-motion (user avec migraines/vestibular)
  '@media (prefers-reduced-motion: reduce){#ai-coach-mic.recording{animation:none;box-shadow:0 0 0 3px rgba(90,16,16,0.2);}}',

  // Erreur
  '.ai-msg-error{background:var(--redbg,rgba(90,16,16,0.06));border:1px solid rgba(90,16,16,0.15);border-radius:2px;color:var(--red,#5A1010);padding:12px 16px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;}'
].join('');
document.head.appendChild(style);

// ─── CONTEXTE UTILISATEUR ────────────────────────────────────────────────────
function buildContext() {
  var S = window.S || {};
  var user = null;
  try { user = window.AUTH && window.AUTH.getUser ? window.AUTH.getUser() : null; } catch(e) {}

  // FIX COACH IA CONTEXT 2026-04 : enrichissement contexte pour recos pertinentes + sécurité
  // Avant : pregnant/cycle/trainingDays/streak/medical/mealsPerDay/trainTime absents
  //         → IA pouvait donner des recos DANGEREUSES en grossesse, ignorer les blessures,
  //           ne pas adapter selon les jours d'entraînement réels de l'user.
  // Maintenant : contexte exhaustif. L'IA sait TOUT ce qui est pertinent.
  var _streakVal = 0;
  try {
    var _uidForStreak = user && user.id ? user.id : 'anon';
    var _sRaw = localStorage.getItem('mtd_streak_' + _uidForStreak);
    if (_sRaw) {
      var _sObj = JSON.parse(_sRaw);
      if (_sObj && typeof _sObj.current === 'number') _streakVal = _sObj.current;
    }
  } catch(eS) {}

  // FIX P0 stability 2026-04-17 : guard typeof user.name avant .split() (crash si non-string)
  var _aiFirst = '';
  if (user && typeof user.name === 'string' && user.name.trim()) {
    _aiFirst = user.name.trim().split(/\s+/)[0] || '';
  }
  var ctx = {
    prenom: (window.getDisplayFirstName ? window.getDisplayFirstName() : (_aiFirst || S.prenom || '')),
    sex: S.sex || '',
    age: S.age || '',
    weight: S.weight || '',
    height: S.height || '',
    goal: S.goal || '',
    activity: S.activity || '',
    sportType: S.sportType || '',
    sportLevel: S.sportLevel || '',
    sportDays: S.sportDays || '',
    regime: S.regime || '',
    allergies: Array.isArray(S.allergies) ? S.allergies : [],
    excluded: S.excluded || '',
    appMode: S.appMode || 'both',
    // FIX 2026-04 : ajouts critiques pour pertinence + sécurité
    pregnant: !!S.pregnant,
    pregnancyWeek: S.pregnancyWeek || null,
    breastfeeding: Array.isArray(S.medical) && S.medical.indexOf('allaitement') !== -1,
    cycleTracking: !!S.cycleTracking,
    cycleLength: S.cycleLength || null,
    lastPeriodDate: S.lastPeriodDate || null,
    trainingDaysSelected: Array.isArray(S.trainingDaysSelected) ? S.trainingDaysSelected : [],
    trainTime: S.trainTime || null,
    mealsPerDay: S.mealsPerDay || 3,
    muscuMedical: (S.muscuMedical && typeof S.muscuMedical === 'object') ? S.muscuMedical : {},
    medical: Array.isArray(S.medical) ? S.medical : [],
    streak: _streakVal,
    intolerances: Array.isArray(S.intolerances) ? S.intolerances : [],
    allowPork: !!S.allowPork,
    allowAlcohol: !!S.allowAlcohol
  };

  // Sport spécifique
  if (S.sportType === 'crossfit') {
    ctx.crossfitLevel = S.crossfitLevel || '';
    ctx.crossfitWeek = S.crossfitWeek || 1;
    ctx.crossfit1RM = S.crossfit1RM || null;
  }
  if (S.sportType === 'triathlon') {
    ctx.triathlonGoal = S.triathlonGoal || '';
    ctx.triathlonLevel = S.triathlonLevel || '';
    ctx.triathlonFTP = S.triathlonFTP || '';
    ctx.triathlonSwimPace = S.triathlonSwimPace || '';
    ctx.triathlonRunPace = S.triathlonRunPace || '';
    ctx.triathlonWeek = S.triathlonWeek || 1;
  }
  if (S.sportType === 'calisthenics') {
    ctx.calisthenicsLevel = S.calisthenicsLevel || '';
    ctx.calisthPullups = S.calisthPullups || 0;
    ctx.calisthPushups = S.calisthPushups || 0;
  }
  if (S.sportType === 'hyrox') {
    ctx.hyroxLevel = S.hyroxLevel || '';
    ctx.hyroxGoal = S.hyroxGoal || '';
    ctx.hyroxWeek = S.hyroxWeek || 1;
  }
  if (S.sportType === 'running') {
    ctx.runningLevel = S.runningLevel || '';
    ctx.runningGoal = S.runningGoal || '';
    ctx.runningWeek = S.runningWeek || 1;
  }
  if (S.sportType === 'cycling') {
    ctx.cyclingLevel = S.cyclingLevel || '';
    ctx.cyclingGoal = S.cyclingGoal || '';
  }
  if (S.musculationWeights && Object.keys(S.musculationWeights).length) {
    ctx.muscuWeights = S.musculationWeights;
  }
  // Profil de force (1RM) — pour que le coach adapte ses conseils aux charges
  if (S.muscuStrengthProfile && Object.keys(S.muscuStrengthProfile).length) {
    ctx.strengthProfile = S.muscuStrengthProfile;
  }
  if (S.crossfit1RM && Object.keys(S.crossfit1RM).length) {
    ctx.crossfit1RM = S.crossfit1RM;
  }
  // FIX SPRINT P2.5 — muscuWeek + phase courante envoyés au Coach IA.
  // Avant : coach IA ignorait la phase (intensification = RPE 9 attendu vs décharge = RPE 5).
  // Maintenant : ctx.muscuPhase permet conseils calibrés au cycle de l'user.
  if (typeof S.muscuWeek === 'number' && S.muscuWeek > 0) {
    ctx.muscuWeek = S.muscuWeek;
    // Phase Israetel/RP : S1=Accumulation, S2=Accumulation+, S3=Surcharge, S4=Décharge
    var weekInMeso = ((S.muscuWeek - 1) % 4) + 1;
    var phaseMap = { 1:'accumulation', 2:'accumulation_plus', 3:'surcharge_intensification', 4:'décharge_deload' };
    ctx.muscuPhase = phaseMap[weekInMeso];
    ctx.muscuPhaseRIRTarget = ({ 1:3, 2:2, 3:1, 4:4 })[weekInMeso];
    ctx.muscuPhaseSetsMultiplier = ({ 1:0.85, 2:1.0, 3:1.15, 4:0.55 })[weekInMeso];
  }
  if (typeof S.muscuCycle === 'number' && S.muscuCycle > 0) {
    ctx.muscuCycle = S.muscuCycle;
  }
  // Objectifs sport et équipement
  if (Array.isArray(S.sportGoals) && S.sportGoals.length) {
    ctx.sportGoals = S.sportGoals;
  }
  if (S.sportEquipment) {
    ctx.sportEquipment = S.sportEquipment;
  }

  // Bilan de forme du jour
  // FIX F8 (contre-audit UI #3 2026-04) : ignorer les wellness "dismissed" (close ×)
  // qui n'ont pas de vraies données saisies par l'utilisateur — sinon on enverrait
  // sleep/muscles/energy = undefined dans le prompt IA (pollution silencieuse).
  if (S.todayWellness && S.todayWellness.date && !S.todayWellness.dismissed) {
    var adapt = null;
    try { if (window.getWellnessAdaptation) adapt = window.getWellnessAdaptation(); } catch(e) {}
    ctx.wellness = {
      sleep: S.todayWellness.sleep,
      muscles: S.todayWellness.muscles,
      energy: S.todayWellness.energy,
      adaptation: adapt ? adapt.label : null
    };
  }

  // Nutrition aujourd'hui
  if (Array.isArray(S.weekPlan) && S.weekPlan.length > 0) {
    var todayIdx = new Date().getDay();
    var planIdx = todayIdx === 0 ? 6 : todayIdx - 1;
    var todayPlan = S.weekPlan[planIdx];
    if (todayPlan) {
      var kcalTotal = 0;
      var nutrition = {};
      var slots = ['breakfast', 'lunch', 'snack', 'dinner'];
      slots.forEach(function(slot) {
        var meal = todayPlan[slot];
        if (meal && meal.n) {
          nutrition[slot] = meal.n + (meal.k ? ' (' + meal.k + ' kcal)' : '');
          kcalTotal += (meal.k || 0);
        }
      });
      if (Object.keys(nutrition).length > 0) {
        nutrition.totalKcal = kcalTotal;
        ctx.todayNutrition = nutrition;
      }
    }
  }

  // COACH ADAPTATIF 2026-04 (phase A-4) : enrichissement contexte avec feedback
  // séances, performance hebdo, prochaine séance planifiée, phase de cycle.
  // L'IA utilise ces données pour ajuster charges/volume (ISSN/ACSM) et adapter
  // les conseils nutritionnels au timing (pré/post séance).
  try {
    if (typeof window.getLastSessionFeedback === 'function') {
      var _lsf = window.getLastSessionFeedback();
      if (_lsf) ctx.lastSessionFeedback = _lsf;
    }
    if (typeof window.getWeekPerformanceSummary === 'function') {
      var _wperf = window.getWeekPerformanceSummary();
      if (_wperf) ctx.weekPerformance = _wperf;
    }
    if (typeof window.getNextScheduledSession === 'function') {
      var _nss = window.getNextScheduledSession();
      if (_nss) ctx.nextSessionScheduled = _nss;
    }
    if (typeof window.getCyclePhaseForAI === 'function') {
      var _cp = window.getCyclePhaseForAI();
      if (_cp) ctx.cyclePhase = _cp;
    }
    // POLISH 2026-04 (INSIGHTS) : insights hebdo condensés pour que l'IA puisse
    // référencer les patterns détectés (fatigue, progression, sur-entraînement).
    // getWeekInsights retourne déjà { sessions, kcalTotal, sleepAvg, rpeAvg,
    //   chargeProgressionPct, lastPain, patterns:[{id,severity,label}] }.
    // On envoie un extrait léger pour économiser les tokens (labels seulement, pas advice).
    if (typeof window.getWeekInsights === 'function') {
      var _wi = window.getWeekInsights();
      if (_wi) {
        var compact = {};
        if (typeof _wi.sessions === 'number') compact.sessions = _wi.sessions;
        if (typeof _wi.sleepAvg === 'number') compact.sleepAvg = _wi.sleepAvg;
        if (typeof _wi.rpeAvg === 'number') compact.rpeAvg = _wi.rpeAvg;
        if (Array.isArray(_wi.patterns) && _wi.patterns.length) {
          // Top 3 patterns — id + severity + label uniquement (tokens économisés)
          compact.patterns = _wi.patterns.slice(0, 3).map(function(p) {
            return { id: p.id, severity: p.severity, label: p.label };
          });
        }
        if (Object.keys(compact).length > 0) ctx.weekInsights = compact;
      }
    }
  } catch(_e) {}

  return ctx;
}

// ─── SUGGESTIONS CONTEXTUELLES ───────────────────────────────────────────────
// COACH ADAPTATIF 2026-04 (phase A-4) : suggestions pilotées par le dernier
// feedback séance + wellness + cycle pour rendre le chat actionnable direct.
function getSuggestions() {
  var S = window.S || {};
  var suggestions = [];

  // ── 1. Priorité haute : feedback dernière séance (ajustements ISSN/ACSM) ──
  var lsf = null;
  try { lsf = typeof window.getLastSessionFeedback === 'function' ? window.getLastSessionFeedback() : null; } catch(e) {}
  if (lsf) {
    if (lsf.pain) {
      // Douleur signalée → priorité absolue : adapter autour de la zone
      suggestions.push((window.isEnglish && window.isEnglish() ? 'Adapt my session around ' : 'Adapter ma séance autour de ') + lsf.pain + ' ?');
    }
    if (typeof lsf.rpe === 'number') {
      if (lsf.rpe <= 6) {
        suggestions.push((window.isEnglish && window.isEnglish() ? 'Can I increase the weights for my next session?' : 'Je peux monter les charges pour la prochaine séance ?'));
      } else if (lsf.rpe >= 9) {
        suggestions.push((window.isEnglish && window.isEnglish() ? 'Suggest a deload week?' : 'Je propose un dé-load cette semaine ?'));
      } else {
        suggestions.push((window.isEnglish && window.isEnglish() ? 'How to progress without overdoing it?' : 'Comment progresser sans en faire trop ?'));
      }
    }
  } else if (S.sessionHistory && Object.keys(S.sessionHistory).length > 0) {
    // Des séances existent mais pas de feedback → inviter à reporter
    suggestions.push((window.isEnglish && window.isEnglish() ? 'Log my last session' : 'Reporter ma dernière séance'));
  }

  // ── 2. Cycle — si suivi activé ──
  try {
    var cp = typeof window.getCyclePhaseForAI === 'function' ? window.getCyclePhaseForAI() : null;
    if (cp && cp.phase) {
      if (cp.phase === 'menstruation') suggestions.push((window.isEnglish && window.isEnglish() ? 'Adapted session for this phase?' : 'Séance adaptée à cette phase ?'));
      else if (cp.phase === 'folliculaire') suggestions.push((window.isEnglish && window.isEnglish() ? 'Take advantage of the performance peak?' : 'Profiter du pic de performance ?'));
      else if (cp.phase === 'lutéale') suggestions.push((window.isEnglish && window.isEnglish() ? 'Adjust my volume in the luteal phase?' : 'Ajuster mon volume en phase lutéale ?'));
    }
  } catch(e) {}

  // ── 3. Grossesse ──
  if (S.pregnant && S.pregnancyWeek) {
    var w2 = Number(S.pregnancyWeek);
    var trim = w2 <= 12 ? 'T1' : (w2 <= 26 ? 'T2' : 'T3');
    suggestions.push((window.isEnglish && window.isEnglish() ? 'Tips adapted to my pregnancy (' + trim + ')?' : 'Conseils adaptés à ma grossesse (' + trim + ') ?'));
  }

  // ── 4. Wellness du jour ──
  var w = S.todayWellness || {};
  if (w.sleep && w.sleep <= 2) suggestions.push((window.isEnglish && window.isEnglish() ? 'I\'m tired, what should I do?' : 'Je suis fatigué, que faire ?'));
  if (w.muscles === 'douleurs') suggestions.push((window.isEnglish && window.isEnglish() ? 'I have muscle soreness' : 'J\'ai des douleurs musculaires'));

  // ── 5. Streak ──
  try {
    var _uidS = (window.AUTH && window.AUTH.getUser && window.AUTH.getUser()) ? window.AUTH.getUser().id : 'anon';
    var _sRaw2 = localStorage.getItem('mtd_streak_' + _uidS);
    if (_sRaw2) {
      var _so = JSON.parse(_sRaw2);
      if (_so && _so.current >= 7) suggestions.push((window.isEnglish && window.isEnglish() ? 'I\'m on a ' + _so.current + '-day streak — how to keep it up?' : 'Je tiens ' + _so.current + ' jours — comment garder la cadence ?'));
    }
  } catch(e) {}

  // ── 6. Nutrition ──
  suggestions.push((window.isEnglish && window.isEnglish() ? 'Is my nutrition plan adapted?' : 'Mon plan nutrition est-il adapté ?'));

  // ── 7. Sport spécifique (fallback) ──
  if (S.sportType === 'crossfit') {
    suggestions.push((window.isEnglish && window.isEnglish() ? 'How to progress in weightlifting?' : 'Comment progresser en haltéro ?'));
  } else if (S.sportType === 'triathlon') {
    suggestions.push((window.isEnglish && window.isEnglish() ? 'Optimize my long-distance nutrition?' : 'Optimiser ma nutrition longue distance ?'));
  } else if (S.sportType === 'calisthenics') {
    suggestions.push((window.isEnglish && window.isEnglish() ? 'Progress towards the muscle-up?' : 'Progresser vers le muscle-up ?'));
  } else if (S.sportType === 'running') {
    suggestions.push((window.isEnglish && window.isEnglish() ? 'Improve my threshold pace?' : 'Améliorer mon allure seuil ?'));
  } else {
    suggestions.push((window.isEnglish && window.isEnglish() ? 'Adapt my today\'s session?' : 'Adapter ma séance du jour ?'));
  }

  // Déduplication (au cas où un contexte produise la même phrase 2×)
  var seen = {};
  var uniq = suggestions.filter(function(s) {
    if (seen[s]) return false;
    seen[s] = true;
    return true;
  });

  return uniq.slice(0, 4);
}

// ─── DOM ─────────────────────────────────────────────────────────────────────
function buildUI() {
  _panelOpen = false; // reset state — panel is rebuilt from scratch
  // FIX CRITIQUE 2026-04-15 (supervision Hermès user screenshot) :
  // Si la nouvelle coach bar Hermès (#coach-bar, today-dashboard.js) est active,
  // NE PAS créer ce FAB legacy — doublon visuel qui masque le contenu repas.
  // L'ancien FAB était un pill 213×52 "◆ SMART FIT COACH" (violation Bible §13.4).
  // La nouvelle coach bar sticky bottom remplace intégralement cette fonction.
  if (document.getElementById('coach-bar') || (typeof window !== 'undefined' && window.renderCoachBar)) {
    // La coach bar Hermès est ouverte ou dispo → on ne crée que le panel (pas le FAB)
    // Panel reste buildable pour compatibilité des handlers togglePanel ailleurs.
  } else {
    // Fallback legacy : bouton flottant cercle discret 48×48 (bible §8)
    var btn = document.createElement('button');
    btn.id = 'ai-coach-btn';
    btn.setAttribute('aria-label', (window.isEnglish && window.isEnglish() ? 'Open AI coach' : 'Ouvrir le coach IA'));
    btn.setAttribute('title', 'Smart Fit Coach');
    var _btnIcon = document.createElement('span');
    _btnIcon.style.cssText = 'font-size:18px;line-height:1;';
    _btnIcon.textContent = '\u25C6';
    btn.appendChild(_btnIcon);
    btn.addEventListener('click', togglePanel);
    document.body.appendChild(btn);
  }

  // Panel
  var panel = document.createElement('div');
  panel.id = 'ai-coach-panel';

  // Header
  var header = document.createElement('div');
  header.id = 'ai-coach-header';
  var headerText = document.createElement('div');
  // Static header: built via DOM for CSP compliance
  var _aiHeaderTitle = document.createElement('div');
  _aiHeaderTitle.id = 'ai-coach-header-title';
  _aiHeaderTitle.textContent = 'Smart Fit Coach';
  var _aiHeaderSub = document.createElement('div');
  _aiHeaderSub.id = 'ai-coach-header-sub';
  _aiHeaderSub.textContent = (window.isEnglish && window.isEnglish() ? 'Nutrition \u00b7 Sport \u00b7 Progress' : 'Nutrition \u00b7 Sport \u00b7 Progression');
  headerText.appendChild(_aiHeaderTitle);
  headerText.appendChild(_aiHeaderSub);
  var closeBtn = document.createElement('button');
  closeBtn.id = 'ai-coach-close';
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', closePanel);
  header.appendChild(headerText);
  header.appendChild(closeBtn);
  panel.appendChild(header);

  // Messages
  var messages = document.createElement('div');
  messages.id = 'ai-coach-messages';
  // Message de bienvenue
  var ctx0 = buildContext();
  var prenom0 = ctx0.prenom ? (', ' + ctx0.prenom) : '';
  appendCoachMessage(messages, _t('coach.welcome', "La performance se construit dans les détails. Sur quoi veux-tu affiner ta préparation aujourd'hui") + prenom0 + ' ?', { skipActions: true });
  panel.appendChild(messages);
  // Disclaimer médical — WCAG + ACOG compliance (absent auparavant vs body-analysis.js qui en avait un)
  var disclaimer = document.createElement('div');
  disclaimer.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--ink-500,#6B6B65);padding:0 20px 12px;text-align:center;line-height:1.5;';
  disclaimer.textContent = _t('coach.disclaimer', (window.isEnglish && window.isEnglish() ? 'AI Coach — does not replace medical or health professional advice.' : 'Coach IA — ne remplace pas l\'avis d\'un médecin ou professionnel de santé.'));
  panel.appendChild(disclaimer);

  // Suggestions
  var suggestions = document.createElement('div');
  suggestions.id = 'ai-suggestions';
  panel.appendChild(suggestions);

  // Input
  var inputArea = document.createElement('div');
  inputArea.id = 'ai-coach-input-area';
  var input = document.createElement('textarea');
  input.id = 'ai-coach-input';
  input.placeholder = _t('coach.placeholder', 'Pose ta question...');
  // FIX P2 audit : maxLength pour éviter scroll horizontal confus (aligné MAX_MSG_CHARS backend)
  input.maxLength = MAX_MSG_CHARS;
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  input.addEventListener('input', function() {
    this.style.height = '40px';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });
  // POLISH 2026-04 (VOICE) : bouton micro pour dictée vocale (Web Speech API).
  // Affiché UNIQUEMENT si SpeechRecognition disponible (fallback gracieux).
  // Click → toggle (start si idle, stop si recording). Transcrit dans le textarea.
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var micBtn = null;
  if (SR) {
    micBtn = document.createElement('button');
    micBtn.id = 'ai-coach-mic';
    micBtn.type = 'button';
    micBtn.title = (window.isEnglish && window.isEnglish() ? 'Voice dictation' : 'Dictée vocale');
    micBtn.setAttribute('aria-label', (window.isEnglish && window.isEnglish() ? 'Dictate my question to the coach' : 'Dicter ma question au coach'));
    micBtn.setAttribute('data-tooltip', (window.isEnglish && window.isEnglish() ? 'Voice dictation' : 'Dictée vocale'));
    // SVG inline micro (cohérent design luxe — pas d'emoji)
    micBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      + '<rect x="9" y="3" width="6" height="11" rx="3"/>'
      + '<path d="M5 11a7 7 0 0 0 14 0"/>'
      + '<line x1="12" y1="18" x2="12" y2="22"/>'
      + '<line x1="9" y1="22" x2="15" y2="22"/>'
      + '</svg>';
    // FIX P1 audit : aria-pressed initial (toggle button state pour screen readers)
    micBtn.setAttribute('aria-pressed', 'false');
    micBtn.addEventListener('click', function() {
      try {
        if (window.SpeechInput) window.SpeechInput.toggle();
      } catch(e) { /* silencieux */ }
    });
  }
  var sendBtn = document.createElement('button');
  sendBtn.id = 'ai-coach-send';
  sendBtn.textContent = _t('coach.send', 'Envoyer');
  sendBtn.addEventListener('click', sendMessage);
  inputArea.appendChild(input);
  if (micBtn) inputArea.appendChild(micBtn);
  inputArea.appendChild(sendBtn);
  panel.appendChild(inputArea);

  // POLISH 2026-04 (V1.3) : hint rate-limit sous input (rempli après chaque réponse API).
  var rateHint = document.createElement('div');
  rateHint.id = 'ai-rate-hint';
  rateHint.className = 'ai-rate-hint';
  rateHint.textContent = ''; // vide tant qu'on n'a pas fait d'appel
  panel.appendChild(rateHint);

  // POLISH 2026-04 (V1.3) : pill "nouveaux messages" pour auto-scroll intelligent.
  var newPill = document.createElement('div');
  newPill.id = 'ai-new-pill';
  newPill.className = 'ai-new-pill';
  newPill.textContent = _t('coach.new_messages_pill', '↓ Nouveaux messages');
  newPill.addEventListener('click', function() {
    var msgs = document.getElementById('ai-coach-messages');
    if (msgs) {
      msgs.scrollTop = msgs.scrollHeight;
      newPill.classList.remove('show');
    }
  });
  panel.appendChild(newPill);

  // POLISH 2026-04 (V1.3) : détecter si user scrolle loin du bas → suspend auto-scroll.
  messages.addEventListener('scroll', function() {
    var threshold = 100; // px de tolérance
    var distFromBottom = messages.scrollHeight - messages.scrollTop - messages.clientHeight;
    _autoScrollSuspended = distFromBottom > threshold;
    // Quand user revient en bas manuellement → hide pill
    if (!_autoScrollSuspended) {
      var pill = document.getElementById('ai-new-pill');
      if (pill) pill.classList.remove('show');
    }
  });

  document.body.appendChild(panel);

  // Historique depuis S
  loadHistory(messages);

  // Suggestions
  refreshSuggestions(suggestions);
}

// POLISH 2026-04 (V1.3) : état auto-scroll. False par défaut → scroll auto en bas.
// Passe à true quand user remonte de > 100px, déclenche affichage pill.
var _autoScrollSuspended = false;

// Helper : scroll auto si pas suspendu, sinon montre pill "nouveaux messages".
function smartScroll(container) {
  try {
    if (!container) return;
    if (_autoScrollSuspended) {
      var pill = document.getElementById('ai-new-pill');
      if (pill) pill.classList.add('show');
    } else {
      container.scrollTop = container.scrollHeight;
    }
  } catch(e) {}
}

// POLISH 2026-04 (V1.2) : retire le bouton "Régénérer" des messages coach précédents
// quand une nouvelle réponse arrive (le bouton regen n'a de sens que sur la DERNIÈRE).
function stripRegenerateButtonsFromPrevious(container) {
  try {
    if (!container) return;
    var coachMsgs = container.querySelectorAll('.ai-msg-coach');
    coachMsgs.forEach(function(m) {
      var actions = m.querySelector('.ai-msg-actions');
      if (!actions) return;
      actions.querySelectorAll('button').forEach(function(b) {
        if (b.getAttribute('title') === 'Régénérer' || b.getAttribute('title') === 'Regenerate') b.remove();
      });
    });
  } catch(e) {}
}

// POLISH 2026-04 (V1.2) : régénère la dernière réponse coach en rejouant le dernier
// message user. Si aucun message user précédent, no-op (silencieux).
function regenerateLastResponse() {
  try {
    if (_sending) return;
    if (_lastRemaining) {
      var _hr = typeof _lastRemaining.hourRemaining === 'number' ? _lastRemaining.hourRemaining : null;
      var _dy = typeof _lastRemaining.dayRemaining === 'number' ? _lastRemaining.dayRemaining : null;
      if (_hr === 0) { showToast((window.isEnglish && window.isEnglish() ? 'Hourly limit reached — try again in 1h' : 'Limite horaire atteinte — réessaie dans 1h')); return; }
      if (_dy === 0) { showToast((window.isEnglish && window.isEnglish() ? 'Daily quota reached — come back tomorrow' : 'Quota journalier atteint — retour demain')); return; }
    }
    var S = window.S || {};
    if (!Array.isArray(S.aiCoachHistory) || !S.aiCoachHistory.length) return;
    // Trouver le dernier message user
    var lastUserMsg = null;
    for (var i = S.aiCoachHistory.length - 1; i >= 0; i--) {
      if (S.aiCoachHistory[i].role === 'user') { lastUserMsg = S.aiCoachHistory[i].content; break; }
    }
    if (!lastUserMsg) return;
    // Retirer la dernière réponse assistant de l'historique (on va la refaire)
    var lastMsg = S.aiCoachHistory[S.aiCoachHistory.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') S.aiCoachHistory.pop();
    // Retirer la DOM du dernier message coach (le plus récent)
    var messages = document.getElementById('ai-coach-messages');
    if (messages) {
      var coachMsgs = messages.querySelectorAll('.ai-msg-coach');
      if (coachMsgs.length) coachMsgs[coachMsgs.length - 1].remove();
    }
    // Replayer le dernier message user via sendMessage (il va re-appender user, mais on veut éviter)
    // → On appelle directement la partie "api call" sans re-push user.
    showToast((window.isEnglish && window.isEnglish() ? 'Regenerating…' : 'Régénération…'));
    replayLastUserMessage(lastUserMsg);
  } catch(e) {}
}

// Interne : envoie directement à l'API sans re-push du message user (utilisé par regenerate).
function replayLastUserMessage(_unused) {
  var messages = document.getElementById('ai-coach-messages');
  var sendBtn = document.getElementById('ai-coach-send');
  if (!messages) return;
  _sending = true;
  if (sendBtn) sendBtn.disabled = true;
  var typingEl = appendTyping(messages);
  var S = window.S || {};
  var apiMessages = (S.aiCoachHistory || []).slice(-MAX_API_MESSAGES).map(function(m) {
    return { role: m.role, content: String(m.content || '').slice(0, MAX_MSG_CHARS) };
  });
  var ctx = buildContext();
  var _ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  var _tm = _ctrl ? setTimeout(function() { _ctrl.abort(); }, 25000) : null;
  (window.AUTH && window.AUTH.getJWT ? window.AUTH.getJWT() : Promise.resolve(null)).then(function(_jwt) {
    var _hdrs = { 'Content-Type': 'application/json' };
    if (_jwt) _hdrs['Authorization'] = 'Bearer ' + _jwt;
    return fetch(FUNCTION_URL, {
      method: 'POST',
      headers: _hdrs,
      body: JSON.stringify({ messages: apiMessages, context: ctx }),
      signal: _ctrl ? _ctrl.signal : undefined
    });
  }).then(function(res) {
    if (_tm) clearTimeout(_tm);
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) { if (window.showPaywall) window.showPaywall('ai-coach'); var _pe = new Error('paywall'); _pe._paywall = true; throw _pe; }
      return res.json().catch(function(){ return {}; }).then(function(e){ throw new Error(e.error || (window.isEnglish && window.isEnglish() ? 'HTTP Error ' : 'Erreur HTTP ') + res.status); });
    }
    return res.json();
  }).then(function(data) {
    if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
    if (data.error) {
      appendError(messages, (window.isEnglish && window.isEnglish() ? 'Error: ' : 'Erreur : ') + data.error);
    } else if (!data.reply) {
      appendError(messages, window.isEnglish && window.isEnglish() ? 'The coach could not formulate a response. Please try again.' : 'Le coach n\'a pas pu formuler de réponse. Réessayez.');
    } else {
      var reply = data.reply;
      stripRegenerateButtonsFromPrevious(messages);
      appendCoachMessage(messages, reply, { canRegenerate: true, stream: true });
      if (Array.isArray(S.aiCoachHistory)) {
        S.aiCoachHistory.push({ role: 'assistant', content: reply });
        if (S.aiCoachHistory.length > MAX_HISTORY) S.aiCoachHistory = S.aiCoachHistory.slice(-MAX_HISTORY);
      }
      if (data.remaining && typeof data.remaining === 'object') updateRateLimitHint(data.remaining);
      try { if (window.saveProfile) window.saveProfile(); } catch(e) {}
    }
    smartScroll(messages);
  }).catch(function(err) {
    if (_tm) clearTimeout(_tm);
    if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
    if (err && err._paywall) return;
    var errMsg = (err && err.name === 'AbortError')
      ? (window.isEnglish && window.isEnglish() ? 'The coach is taking too long to respond. Try again in a moment.' : 'Le coach met trop de temps à répondre. Réessaie dans quelques instants.')
      : (window.isEnglish && window.isEnglish() ? 'Unable to regenerate. Check your connection.' : 'Impossible de régénérer. Vérifie ta connexion.');
    appendError(messages, errMsg);
  }).finally(function() {
    _sending = false;
    if (sendBtn) sendBtn.disabled = false;
  });
}

// POLISH 2026-04 (V1.3) : met à jour le hint rate-limit sous la barre d'input.
// FIX CONTRE-AUDIT V3 : message explicite selon quota contraignant (heure vs jour)
// pour éviter l'ambiguïté "0 questions restantes" (user ne sait pas s'il attend 1h ou 24h).
function updateRateLimitHint(remaining) {
  try {
    var el = document.getElementById('ai-rate-hint');
    if (!el) return;
    var hr = (remaining && typeof remaining.hourRemaining === 'number') ? remaining.hourRemaining : null;
    var dy = (remaining && typeof remaining.dayRemaining === 'number') ? remaining.dayRemaining : null;
    if (hr === null && dy === null) { el.textContent = ''; return; }
    // Cas limite : quota épuisé — on précise quel reset attendre (heure vs jour)
    if (hr === 0 && dy !== null && dy > 0) {
      el.textContent = (window.isEnglish && window.isEnglish() ? 'Hourly limit reached — try again in 1h' : 'Limite horaire atteinte — réessaie dans 1h');
      return;
    }
    if (dy === 0) {
      el.textContent = (window.isEnglish && window.isEnglish() ? 'Daily quota reached — come back tomorrow' : 'Quota journalier atteint — retour demain');
      return;
    }
    // Cas standard : on affiche le plus contraignant avec label clair
    if (hr !== null && dy !== null) {
      var limiting = (hr <= dy) ? hr : dy;
      var label = (hr <= dy) ? (window.isEnglish && window.isEnglish() ? 'this hour' : 'cette heure') : (window.isEnglish && window.isEnglish() ? 'today' : 'aujourd\'hui');
      el.textContent = limiting + ' ' + window.locPlural(limiting, {fr:{one:'question',other:'questions'},en:{one:'question',other:'questions'}}) + ' ' + label;
    } else {
      var v = hr !== null ? hr : dy;
      var lbl = hr !== null ? (window.isEnglish && window.isEnglish() ? 'this hour' : 'cette heure') : (window.isEnglish && window.isEnglish() ? 'today' : 'aujourd\'hui');
      el.textContent = v + ' ' + window.locPlural(v, {fr:{one:'question',other:'questions'},en:{one:'question',other:'questions'}}) + ' ' + lbl;
    }
  } catch(e) {}
}

// POLISH 2026-04 (VOICE) : Web Speech API wrapper pour dictée vocale.
// Exposé sur window.SpeechInput. Fallback gracieux si API absente.
// État : { recognition (instance), recording (bool), unsupported (bool) }
// API publique : SpeechInput.isSupported(), SpeechInput.toggle(), SpeechInput.stop()
window.SpeechInput = (function() {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var supported = !!SR;
  var recognition = null;
  var recording = false;
  var _lastError = null;
  var _initializing = false; // FIX P0 audit : flag anti-race condition double-toggle

  // Helper : update UI bouton micro selon état (recording + aria-pressed + disabled)
  // FIX P1 audit : aria-pressed pour screen readers + sync disabled si _sending
  function _updateBtn() {
    try {
      var btn = document.getElementById('ai-coach-mic');
      if (!btn) return;
      if (recording) {
        btn.classList.add('recording');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('recording');
        btn.setAttribute('aria-pressed', 'false');
      }
      // Désactiver micro pendant qu'une requête API est en cours (UX cohérence)
      btn.disabled = !!_sending;
    } catch(e) {}
  }

  // Helper : append text au textarea coach (à la position curseur OU fin)
  function _appendToInput(text) {
    try {
      var input = document.getElementById('ai-coach-input');
      if (!input || typeof text !== 'string') return;
      var current = input.value || '';
      var trimmed = String(text).trim();
      if (!trimmed) return;
      var separator = (current && !current.endsWith(' ')) ? ' ' : '';
      input.value = current + separator + trimmed;
      // Trigger "input" event pour auto-resize du textarea
      try { input.dispatchEvent(new Event('input', { bubbles: true })); } catch(e) {}
      // Focus pour permettre édition + envoi clavier
      try { input.focus(); } catch(e) {}
    } catch(e) {}
  }

  function _initRecognition() {
    if (!SR) return null;
    try {
      var rec = new SR();
      rec.continuous = false;       // 1 seul résultat (puis arrêt)
      rec.interimResults = false;   // pas de mots intermédiaires (transcript final seulement)
      // FIX P2 audit : dériver du lang app (ou navigator.language) au lieu de fr-FR hardcodé
      var _lang = 'fr-FR';
      try {
        if (window.S && typeof window.S.lang === 'string' && window.S.lang.length >= 2) {
          // S.lang est souvent 'fr' → BCP-47 étendu à 'fr-FR' / 'en-US'
          var shortMap = { fr: 'fr-FR', en: 'en-US', es: 'es-ES', de: 'de-DE', it: 'it-IT', pt: 'pt-PT' };
          _lang = shortMap[window.S.lang.toLowerCase()] || window.S.lang;
        } else if (navigator && navigator.language) {
          _lang = navigator.language;
        }
      } catch(_le) {}
      rec.lang = _lang;
      rec.maxAlternatives = 1;
      rec.onresult = function(event) {
        try {
          if (!event || !event.results || !event.results.length) return;
          var transcript = '';
          for (var i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal && event.results[i][0]) {
              transcript += event.results[i][0].transcript;
            }
          }
          if (transcript) _appendToInput(transcript);
        } catch(e) {}
      };
      rec.onerror = function(event) {
        try {
          var err = event && event.error ? event.error : 'unknown';
          _lastError = err;
          // Erreurs courantes : 'no-speech' (silencieux OK), 'aborted' (user stop OK),
          // 'not-allowed' (permission refusée → toast plus explicite pour retry)
          // 'audio-capture' (pas de micro) / 'network' (offline)
          // FIX P1 audit : message permission plus explicite → guide user vers settings browser
          if (err === 'not-allowed' || err === 'service-not-allowed') {
            if (typeof showToast === 'function') showToast((window.isEnglish && window.isEnglish() ? 'Microphone denied. Check your browser settings' : 'Micro refusé. Vérifie les paramètres du navigateur'));
          } else if (err === 'audio-capture') {
            if (typeof showToast === 'function') showToast((window.isEnglish && window.isEnglish() ? 'No microphone detected' : 'Aucun micro détecté'));
          } else if (err === 'network') {
            if (typeof showToast === 'function') showToast((window.isEnglish && window.isEnglish() ? 'Network required for dictation' : 'Réseau requis pour la dictée'));
          }
          // 'no-speech' et 'aborted' = silencieux (UX douce)
        } catch(e) {}
        recording = false;
        _updateBtn();
      };
      rec.onend = function() {
        recording = false;
        _updateBtn();
      };
      rec.onstart = function() {
        recording = true;
        _lastError = null;
        _updateBtn();
      };
      return rec;
    } catch(e) { return null; }
  }

  return {
    isSupported: function() { return supported; },
    isRecording: function() { return recording; },
    lastError: function() { return _lastError; },
    toggle: function() {
      // FIX P0 audit : bloquer double-toggle pendant init (race condition double append)
      if (_initializing) return;
      if (!supported) {
        try { if (typeof showToast === 'function') showToast((window.isEnglish && window.isEnglish() ? 'Voice dictation not supported' : 'Dictée vocale non supportée')); } catch(e) {}
        return;
      }
      _initializing = true;
      try {
        if (recording) {
          // Stop
          try { if (recognition && recognition.stop) recognition.stop(); } catch(e) {}
          recording = false;
          _updateBtn();
        } else {
          // Start (réinit l'instance pour éviter conflits state)
          try {
            if (recognition && recognition.abort) { try { recognition.abort(); } catch(e) {} }
            recognition = _initRecognition();
            if (recognition) recognition.start();
          } catch(e) {
            recording = false;
            _updateBtn();
            try { if (typeof showToast === 'function') showToast((window.isEnglish && window.isEnglish() ? 'Error starting microphone' : 'Erreur démarrage micro')); } catch(_e) {}
          }
        }
      } finally {
        // Libérer le lock après ~50ms (délai normal pour instance init + start async)
        setTimeout(function() { _initializing = false; }, 50);
      }
    },
    stop: function() {
      if (recording && recognition) {
        try { recognition.stop(); } catch(e) {}
        recording = false;
        _updateBtn();
      }
    }
  };
})();

// POLISH 2026-04 (V1.2) : toast léger pour feedback actions (copier/régénérer/rating).
function showToast(text) {
  try {
    var existing = document.querySelector('.ai-toast');
    if (existing) existing.parentNode && existing.parentNode.removeChild(existing);
    var t = document.createElement('div');
    t.className = 'ai-toast';
    t.textContent = text;
    document.body.appendChild(t);
    // Force reflow pour trigger transition
    void t.offsetWidth;
    t.classList.add('show');
    setTimeout(function() {
      t.classList.remove('show');
      setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
    }, 1800);
  } catch(e) {}
}

// Stockage feedback local (👍/👎) — pour stats futures, pas envoyé à l'API.
// FIX CONTRE-AUDIT V3 : hash renforcé avec DJB2 32-bit pour éviter collisions
// entre messages de même début (60 chars) ET même longueur totale.
function _hashMessage(str) {
  var s = String(str || '');
  // DJB2 hash (simple, rapide, peu de collisions pour messages courts/moyens)
  var h = 5381;
  for (var i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0; // force 32-bit
  }
  // Combinaison : début (32) + longueur + hash 32-bit → quasi-unique
  return s.slice(0, 32) + '|' + s.length + '|' + (h >>> 0).toString(36);
}

function recordCoachFeedback(messageText, rating) {
  try {
    var user = (window.AUTH && window.AUTH.getUser) ? window.AUTH.getUser() : null;
    var uid = user && user.id ? user.id : 'anon';
    var key = 'mtd_aicoach_feedback_' + uid;
    var raw = localStorage.getItem(key);
    var arr = [];
    if (raw) { try { arr = JSON.parse(raw); if (!Array.isArray(arr)) arr = []; } catch(e) { arr = []; } }
    var msgHash = _hashMessage(messageText);
    // Dédupe : si déjà noté, remplace
    arr = arr.filter(function(x) { return x.hash !== msgHash; });
    arr.push({ hash: msgHash, rating: rating, ts: Date.now() });
    // Purge > 100 entries
    if (arr.length > 100) arr = arr.slice(-100);
    localStorage.setItem(key, JSON.stringify(arr));
  } catch(e) {}
}

// POLISH 2026-04 (STREAMING) : streaming visuel "fake" client-side.
// Affiche le texte mot par mot avec un délai variable basé sur la longueur du mot.
// Pas de vrai SSE backend (Netlify timeout 26s + SSE proxy limité), mais le user
// PERÇOIT un effet "live typing" identique. Respecte prefers-reduced-motion.
// Vitesse : ~28ms/mot court, +6ms/caractère supplémentaire (max 80ms par chunk).
function _streamTextInto(msgEl, text, doneCb) {
  try {
    if (!msgEl || !text) { if (doneCb) doneCb(); return; }
    // Bypass animation si prefers-reduced-motion (accessibilité)
    var reduceMotion = false;
    try {
      reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch(e) {}
    if (reduceMotion) { msgEl.textContent = text; if (doneCb) doneCb(); return; }
    // Découper par mot (préserve espaces + ponctuation)
    var tokens = String(text).match(/\S+\s*/g) || [text];
    msgEl.textContent = '';
    var i = 0;
    function tick() {
      if (i >= tokens.length) { if (doneCb) doneCb(); return; }
      msgEl.textContent += tokens[i];
      // Auto-scroll pendant le streaming
      try {
        var scroller = document.getElementById('ai-coach-messages');
        if (scroller && !_autoScrollSuspended) scroller.scrollTop = scroller.scrollHeight;
      } catch(e) {}
      var token = tokens[i];
      i++;
      // Délai variable : base 28ms + 6ms par char au-delà de 4 chars (cap 80ms)
      var extra = Math.max(0, token.length - 4) * 6;
      // Ralentir après ponctuation (point, virgule, deux-points, point d'exclamation/interrogation)
      var lastChar = token.replace(/\s+$/, '').slice(-1);
      var punctBoost = (lastChar === '.' || lastChar === '!' || lastChar === '?') ? 120
                     : (lastChar === ',' || lastChar === ':' || lastChar === ';') ? 60 : 0;
      var delay = Math.min(80, 28 + extra) + punctBoost;
      setTimeout(tick, delay);
    }
    tick();
  } catch(e) {
    // Fallback : pose le texte d'un coup
    try { msgEl.textContent = text; } catch(_e) {}
    if (doneCb) doneCb();
  }
}

function appendCoachMessage(container, text, opts) {
  opts = opts || {};
  var wrap = document.createElement('div');
  wrap.className = 'ai-msg ai-msg-coach';
  var name = document.createElement('div');
  name.className = 'ai-msg-coach-name';
  name.textContent = 'Smart Fit Coach';
  var msg = document.createElement('div');
  msg.className = 'ai-msg-text';
  // POLISH 2026-04 (STREAMING) : si opts.stream=true → animation mot par mot.
  // Sinon (chargement historique, regen, etc.) → texte d'un coup.
  if (opts.stream) {
    msg.textContent = ''; // vide initial
    _streamTextInto(msg, text);
  } else {
    msg.textContent = text;
  }
  wrap.appendChild(name);
  wrap.appendChild(msg);

  // POLISH 2026-04 (V1.2) : barre d'actions — copier / régénérer / 👍 / 👎
  // opts.canRegenerate=true uniquement sur le DERNIER message (pas dans l'historique rechargé).
  if (!opts.skipActions) {
    var actions = document.createElement('div');
    actions.className = 'ai-msg-actions';

    // Copier
    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.title = (window.isEnglish && window.isEnglish() ? 'Copy' : 'Copier');
    // POLISH 2026-04 (V3) : tooltip premium via [data-tooltip] (système global CSS)
    copyBtn.setAttribute('data-tooltip', (window.isEnglish && window.isEnglish() ? 'Copy' : 'Copier'));
    copyBtn.setAttribute('aria-label', (window.isEnglish && window.isEnglish() ? 'Copy the response' : 'Copier la réponse'));
    copyBtn.textContent = '\u2398'; // U+2398 next page icon — visible et sobre
    copyBtn.addEventListener('click', function() {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function() { showToast((window.isEnglish && window.isEnglish() ? 'Copied' : 'Copié')); }, function() { showToast((window.isEnglish && window.isEnglish() ? 'Copy failed' : '\u00c9chec copie')); });
        } else {
          // Fallback vieux navigateurs : textarea temporaire
          var ta = document.createElement('textarea');
          ta.value = text; document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); showToast((window.isEnglish && window.isEnglish() ? 'Copied' : 'Copié')); } catch(e) { showToast((window.isEnglish && window.isEnglish() ? 'Copy failed' : '\u00c9chec copie')); }
          document.body.removeChild(ta);
        }
      } catch(e) { showToast((window.isEnglish && window.isEnglish() ? 'Copy failed' : '\u00c9chec copie')); }
    });
    actions.appendChild(copyBtn);

    // Régénérer (uniquement sur le dernier message)
    if (opts.canRegenerate) {
      var regenBtn = document.createElement('button');
      regenBtn.type = 'button';
      regenBtn.title = (window.isEnglish && window.isEnglish() ? 'Regenerate' : 'Régénérer');
      regenBtn.setAttribute('data-tooltip', (window.isEnglish && window.isEnglish() ? 'Regenerate' : 'Régénérer'));
      regenBtn.setAttribute('aria-label', (window.isEnglish && window.isEnglish() ? 'Regenerate the response' : 'Régénérer la réponse'));
      regenBtn.textContent = '\u21BB'; // clockwise arrow
      regenBtn.addEventListener('click', function() { regenerateLastResponse(); });
      actions.appendChild(regenBtn);
    }

    // 👍
    var upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.title = (window.isEnglish && window.isEnglish() ? 'Helpful' : 'Utile');
    upBtn.setAttribute('data-tooltip', (window.isEnglish && window.isEnglish() ? 'Helpful' : 'Utile'));
    upBtn.setAttribute('aria-label', (window.isEnglish && window.isEnglish() ? 'Mark as helpful' : 'Marquer comme utile'));
    upBtn.textContent = '\u2713'; // check mark
    upBtn.addEventListener('click', function() {
      recordCoachFeedback(text, 'up');
      upBtn.classList.add('active-up');
      downBtn.classList.remove('active-down');
      showToast((window.isEnglish && window.isEnglish() ? 'Thanks for your feedback' : 'Merci pour ton retour'));
    });
    actions.appendChild(upBtn);

    // 👎
    var downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.title = (window.isEnglish && window.isEnglish() ? 'Not helpful' : 'Peu utile');
    downBtn.setAttribute('data-tooltip', (window.isEnglish && window.isEnglish() ? 'Not helpful' : 'Peu utile'));
    downBtn.setAttribute('aria-label', (window.isEnglish && window.isEnglish() ? 'Mark as not helpful' : 'Marquer comme peu utile'));
    downBtn.textContent = '\u2717'; // cross mark
    downBtn.addEventListener('click', function() {
      recordCoachFeedback(text, 'down');
      downBtn.classList.add('active-down');
      upBtn.classList.remove('active-up');
      showToast((window.isEnglish && window.isEnglish() ? 'Feedback recorded' : 'Retour enregistré'));
    });
    actions.appendChild(downBtn);

    wrap.appendChild(actions);
  }

  container.appendChild(wrap);
  return wrap;
}

function appendUserMessage(container, text) {
  var wrap = document.createElement('div');
  wrap.className = 'ai-msg ai-msg-user';
  var msg = document.createElement('div');
  msg.className = 'ai-msg-text';
  msg.textContent = text;
  wrap.appendChild(msg);
  container.appendChild(wrap);
  return wrap;
}

function appendTyping(container) {
  var wrap = document.createElement('div');
  wrap.className = 'ai-msg ai-msg-coach';
  var name = document.createElement('div');
  name.className = 'ai-msg-coach-name';
  name.textContent = 'Smart Fit Coach';
  var msg = document.createElement('div');
  msg.className = 'ai-msg-text ai-msg-typing';
  var lbl = document.createElement('span');
  lbl.textContent = _t('coach.typing_label', 'Analyse en cours');
  msg.appendChild(lbl);
  // POLISH 2026-04 : 3 points animés CSS (clean, moins gadget que "réfléchit…")
  var dots = document.createElement('span');
  dots.className = 'ai-typing-dots';
  dots.appendChild(document.createElement('span'));
  dots.appendChild(document.createElement('span'));
  dots.appendChild(document.createElement('span'));
  msg.appendChild(dots);
  wrap.appendChild(name);
  wrap.appendChild(msg);
  container.appendChild(wrap);
  container.scrollTop = container.scrollHeight;
  return wrap;
}

function appendError(container, text) {
  var wrap = document.createElement('div');
  wrap.className = 'ai-msg ai-msg-error';
  wrap.textContent = text;
  container.appendChild(wrap);
  container.scrollTop = container.scrollHeight;
}

function refreshSuggestions(container) {
  if (!container) return;
  container.innerHTML = '';
  var suggs = getSuggestions();
  suggs.forEach(function(s) {
    var btn = document.createElement('button');
    btn.className = 'ai-suggestion';
    btn.textContent = s;
    btn.addEventListener('click', function() {
      var input = document.getElementById('ai-coach-input');
      if (input) { input.value = s; input.focus(); }
    });
    container.appendChild(btn);
  });
}

function loadHistory(container) {
  var S = window.S || {};
  var history = S.aiCoachHistory;
  if (!Array.isArray(history) || !history.length) return;
  // POLISH 2026-04 (V1.1) : charger TOUT l'historique persisté (vs 6 derniers).
  // MAX_HISTORY = 20 limite déjà la taille. Scroll auto en bas après rendu.
  // Le user peut remonter pour relire les anciens échanges.
  history.forEach(function(msg) {
    if (msg.role === 'user') appendUserMessage(container, msg.content);
    else if (msg.role === 'assistant') appendCoachMessage(container, msg.content);
  });
  // Force un scroll bas après rendu asynchrone
  setTimeout(function() { container.scrollTop = container.scrollHeight; }, 0);
}

// ─── LAYOUT ADAPTATIF ────────────────────────────────────────────────────────
function applyPanelLayout() {
  var panel = document.getElementById('ai-coach-panel');
  var btn   = document.getElementById('ai-coach-btn');
  if (!panel || !btn) return;
  var isMobile = window.innerWidth < 480;
  if (isMobile) {
    panel.style.bottom      = '0';
    panel.style.left        = '0';
    panel.style.right       = '0';
    panel.style.width       = '100%';
    panel.style.borderRadius = '12px 12px 0 0';
    panel.style.borderLeft  = 'none';
    panel.style.maxHeight   = 'calc(100dvh - 80px)';
    btn.style.bottom = '80px';
    btn.style.right  = '16px';
  } else {
    panel.style.bottom      = '80px';
    panel.style.left        = '';
    panel.style.right       = '24px';
    panel.style.width       = 'min(440px,100vw)';
    panel.style.borderRadius = '2px 0 0 0';
    panel.style.borderLeft  = '1px solid var(--border,#D8D8D0)';
    panel.style.maxHeight   = 'calc(100dvh - 80px)';
    btn.style.bottom = '';
    btn.style.right  = '24px';
  }
}

var _resizeHandler = null;

// ─── TOGGLE ──────────────────────────────────────────────────────────────────
function togglePanel() {
  _panelOpen ? closePanel() : openPanel();
}

function openPanel() {
  if (_panelOpen) return;
  window.safeUserStatusCheck({ force: true }).then(function(status) {
    if (!status.isPremium) {
      if (status.source === 'fallback' && window._showPremiumCheckFailed) { window._showPremiumCheckFailed(openPanel); return; }
      if (window.showPaywall) window.showPaywall('ai-coach');
      return;
    }
    var panel = document.getElementById('ai-coach-panel');
    if (panel) { panel.classList.add('open'); _panelOpen = true; }
    applyPanelLayout();
    if (!_resizeHandler) {
      _resizeHandler = function() { if (_panelOpen) applyPanelLayout(); };
      window.addEventListener('resize', _resizeHandler);
    }
    var msgs = document.getElementById('ai-coach-messages');
    if (msgs) { setTimeout(function() { msgs.scrollTop = msgs.scrollHeight; }, 100); }
    var suggs = document.getElementById('ai-suggestions');
    if (suggs) refreshSuggestions(suggs);
  });
}

function closePanel() {
  var panel = document.getElementById('ai-coach-panel');
  if (panel) { panel.classList.remove('open'); _panelOpen = false; }
  if (_resizeHandler) { window.removeEventListener('resize', _resizeHandler); _resizeHandler = null; }
}

// ─── ENVOI MESSAGE ───────────────────────────────────────────────────────────
function sendMessage() {
  if (_sending) return;
  var input = document.getElementById('ai-coach-input');
  var messages = document.getElementById('ai-coach-messages');
  var sendBtn = document.getElementById('ai-coach-send');
  if (!input || !messages) return;

  var text = input.value.trim();
  if (!text) return;
  if (window.TRACKER) window.TRACKER.track('ai_coach_used', {});

  // Premium gate — coach IA illimité = premium (trial = 3 messages/jour)
  if (window.isTrialUser && window.isTrialUser()) {
    var _today = (window.sfcLocalDateStr ? window.sfcLocalDateStr() : new Date().toISOString().slice(0, 10));
    var _rawCount = (function() { try { return JSON.parse(localStorage.getItem('sfc_coach_count') || 'null'); } catch(e) { return null; } })();
    var _coachCount = (_rawCount && _rawCount.date === _today) ? (_rawCount.n || 0) : 0;
    if (_coachCount >= 3) {
      appendError(messages, (window.isEnglish && window.isEnglish() ? 'Limit reached (3 messages/day in trial). Subscribe for unlimited access.' : 'Limite atteinte (3 messages/jour en version d\u2019essai). Abonnez-vous pour un acc\u00e8s illimit\u00e9.'));
      return;
    }
    try { localStorage.setItem('sfc_coach_count', JSON.stringify({ date: _today, n: _coachCount + 1 })); } catch(e) {}
  }

  input.value = '';
  input.style.height = '40px';
  _sending = true;
  if (sendBtn) sendBtn.disabled = true;

  // Afficher message user
  appendUserMessage(messages, text);
  messages.scrollTop = messages.scrollHeight;

  // Sauvegarder dans historique
  var S = window.S || {};
  if (!Array.isArray(S.aiCoachHistory)) S.aiCoachHistory = [];
  S.aiCoachHistory.push({ role: 'user', content: text });
  if (S.aiCoachHistory.length > MAX_HISTORY) {
    S.aiCoachHistory = S.aiCoachHistory.slice(-MAX_HISTORY);
  }

  // Afficher "en train de réfléchir"
  var typingEl = appendTyping(messages);

  // Préparer les messages pour l'API — limiter à 5 derniers échanges, tronquer à 500 chars
  var apiMessages = S.aiCoachHistory.slice(-MAX_API_MESSAGES).map(function(m) {
    return { role: m.role, content: String(m.content || '').slice(0, MAX_MSG_CHARS) };
  });

  // Contexte utilisateur
  var ctx = buildContext();

  // Appel API avec timeout client 25s (marge 1s avant le timeout serveur Netlify Pro 26s).
  // Sonnet 4.6 + MAX_TOKENS 500 → tient dans 10-20s typiquement.
  // Si Sonnet dépasse → AbortController force une sortie propre + message erreur.
  var _coachCtrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  var _coachTimer = _coachCtrl ? setTimeout(function() { _coachCtrl.abort(); }, 25000) : null;
  (window.AUTH && window.AUTH.getJWT ? window.AUTH.getJWT() : Promise.resolve(null)).then(function(_jwt) {
    var _hdrs = { 'Content-Type': 'application/json' };
    if (_jwt) _hdrs['Authorization'] = 'Bearer ' + _jwt;
    return fetch(FUNCTION_URL, {
      method: 'POST',
      headers: _hdrs,
      body: JSON.stringify({ messages: apiMessages, context: ctx }),
      signal: _coachCtrl ? _coachCtrl.signal : undefined
    });
  }).then(function(res) {
    if (_coachTimer) clearTimeout(_coachTimer);
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) { if (window.showPaywall) window.showPaywall('ai-coach'); var _pe = new Error('paywall'); _pe._paywall = true; throw _pe; }
      return res.json().catch(function(){ return {}; }).then(function(e){ throw new Error(e.error || (window.isEnglish && window.isEnglish() ? 'HTTP Error ' : 'Erreur HTTP ') + res.status); });
    }
    return res.json();
  }).then(function(data) {
    if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);

    if (data.error) {
      appendError(messages, (window.isEnglish && window.isEnglish() ? 'Error: ' : 'Erreur : ') + data.error);
    } else if (!data.reply) {
      appendError(messages, window.isEnglish && window.isEnglish() ? 'The coach could not formulate a response. Please try again.' : 'Le coach n\'a pas pu formuler de réponse. Réessayez.');
    } else {
      var reply = data.reply;
      // POLISH 2026-04 (V1.2) : dernier message a le bouton "Régénérer".
      // Les précédents (via stripActions) gardent copier + feedback mais pas regen.
      stripRegenerateButtonsFromPrevious(messages);
      appendCoachMessage(messages, reply, { canRegenerate: true, stream: true });
      // Sauvegarder réponse dans historique
      if (Array.isArray(S.aiCoachHistory)) {
        S.aiCoachHistory.push({ role: 'assistant', content: reply });
        if (S.aiCoachHistory.length > MAX_HISTORY) {
          S.aiCoachHistory = S.aiCoachHistory.slice(-MAX_HISTORY);
        }
      }
      // POLISH 2026-04 (V1.3) : mettre à jour le hint rate-limit si backend fournit les restants.
      if (data.remaining && typeof data.remaining === 'object') {
        _lastRemaining = data.remaining;
        updateRateLimitHint(data.remaining);
      }
      // Sauvegarder profil
      try { if (window.saveProfile) window.saveProfile(); } catch(e) {}
    }
    // Auto-scroll intelligent : bas si user en bas, sinon pill "nouveaux messages"
    smartScroll(messages);
  }).catch(function(err) {
    if (_coachTimer) clearTimeout(_coachTimer);
    if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
    if (err && err._paywall) return;
    var errMsg = (err && err.name === 'AbortError')
      ? (window.isEnglish && window.isEnglish() ? 'The coach is taking too long to respond. Try again in a moment.' : 'Le coach met trop de temps \u00e0 r\u00e9pondre. R\u00e9essaie dans quelques instants.')
      : (err && err.message && err.message.indexOf('429') !== -1)
      ? (window.isEnglish && window.isEnglish() ? 'Too many messages sent. Wait a few minutes before retrying.' : 'Trop de messages envoy\u00e9s. Attends quelques minutes avant de r\u00e9essayer.')
      : (window.isEnglish && window.isEnglish() ? 'Unable to reach the coach. Check your connection.' : 'Impossible de joindre le coach. V\u00e9rifiez votre connexion.');
    appendError(messages, errMsg);
    messages.scrollTop = messages.scrollHeight;
  }).finally(function() {
    _sending = false;
    if (sendBtn) sendBtn.disabled = false;
    if (input) input.focus();
  });
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
window.AI_COACH = {
  open: openPanel,
  close: closePanel,
  toggle: togglePanel,
  send: sendMessage,
  buildContext: buildContext,
  // COACH ADAPTATIF 2026-04 (phase A-4) : expose getSuggestions pour tests E2E.
  getSuggestions: getSuggestions
};

// Le coach ne s'initialise qu'après une vraie session authentifiée.
// On patche window.render : à chaque appel, si l'utilisateur est connecté
// et que le bouton n'existe pas encore → init. S'il est déconnecté → cleanup.
var _origRender = null;
function _patchRender() {
  if (typeof window.render !== 'function') return;
  if (window.render._coachPatched) return;
  _origRender = window.render;
  window.render = function() {
    _origRender.apply(this, arguments);
    try {
      var loggedIn = window.AUTH && window.AUTH.isLoggedIn && window.AUTH.isLoggedIn();
      if (loggedIn && !document.getElementById('ai-coach-btn')) {
        // FIX P1 audit : stop recording AVANT buildUI si panel était recréé pendant dictée
        // (évite état fantôme : instance SpeechRecognition active mais bouton sans .recording)
        try { if (window.SpeechInput && window.SpeechInput.isRecording && window.SpeechInput.isRecording()) window.SpeechInput.stop(); } catch(_sie) {}
        buildUI();
      } else if (!loggedIn) {
        var btn = document.getElementById('ai-coach-btn');
        var panel = document.getElementById('ai-coach-panel');
        if (btn) btn.remove();
        if (panel) panel.remove();
        // FIX P1 audit : si logout pendant recording, stopper proprement
        try { if (window.SpeechInput && window.SpeechInput.isRecording && window.SpeechInput.isRecording()) window.SpeechInput.stop(); } catch(_sle) {}
      }
      // FIX CRITIQUE 2026-04-15 (supervision Hermès) : si la nouvelle coach bar Hermès
      // est présente, AUTO-DÉTRUIRE le legacy #ai-coach-btn (doublon visuel masquant
      // le contenu du dashboard — pavé pill 213×52 violation Bible §13.4).
      try {
        if (document.getElementById('coach-bar')) {
          var _legacyBtn = document.getElementById('ai-coach-btn');
          if (_legacyBtn) _legacyBtn.remove();
        }
      } catch(_eDup) {}
      // Masquer le bouton coach pendant l'onboarding actif (nStep 1-10 ou sStep 1-3)
      // pour éviter de bloquer les champs de saisie et les options de formulaire
      var _s = window.S;
      var _btn = document.getElementById('ai-coach-btn');
      if (_btn && _s) {
        var _inNutrOnboarding = _s.view === 'nutrition' && typeof _s.nStep === 'number' && _s.nStep >= 1 && _s.nStep <= 10;
        var _inSportOnboarding = _s.view === 'sport' && typeof _s.sStep === 'number' && _s.sStep >= 1 && _s.sStep <= 3;
        _btn.style.display = (_inNutrOnboarding || _inSportOnboarding) ? 'none' : '';
      }
    } catch(e) {
      console.error('[ai-coach] erreur:', e);
    }
  };
  // Forward all patch flags from the previous render so other modules
  // don't re-patch an already-patched function when they check their own flag.
  if (_origRender._baPatched) window.render._baPatched = true;
  window.render._coachPatched = true;
}

// Tenter le patch dès que possible, puis à nouveau après DOMContentLoaded
_patchRender();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _patchRender);
} else {
  _patchRender();
}

})();
