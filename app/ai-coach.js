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

// ─── CSS ─────────────────────────────────────────────────────────────────────
var style = document.createElement('style');
style.textContent = [
  // Bouton flottant — desktop
  '#ai-coach-btn{position:fixed;bottom:calc(72px + env(safe-area-inset-bottom,0px));right:24px;z-index:9000;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:1px solid var(--black,#0A0A09);border-radius:2px;padding:14px 22px;cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;display:flex;align-items:center;gap:10px;box-shadow:0 8px 32px rgba(10,10,9,0.12);transition:all 0.2s ease;min-width:52px;min-height:52px;}',
  '#ai-coach-btn:hover{background:var(--ivory,#FAF9F6);color:var(--black,#0A0A09);box-shadow:0 8px 32px rgba(10,10,9,0.18);}',
  // Bouton flottant — mobile
  '@media(max-width:479px){#ai-coach-btn{bottom:80px;right:16px;}}',

  // Panel — desktop
  '#ai-coach-panel{position:fixed;bottom:80px;right:24px;z-index:8999;width:min(440px,100vw);height:min(680px,92vh);max-height:calc(100dvh - 80px);background:var(--ivory,#FAF9F6);border-top:1px solid var(--black,#0A0A09);border-left:1px solid var(--border,#D8D8D0);border-radius:2px 0 0 0;display:flex;flex-direction:column;transform:translateY(calc(100% + 80px));transition:transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94);box-shadow:-8px 0 40px rgba(10,10,9,0.1);}',
  '#ai-coach-panel.open{transform:translateY(0);}',
  // Panel — mobile
  '@media(max-width:479px){#ai-coach-panel{bottom:0;left:0;right:0;width:100%;border-radius:12px 12px 0 0;border-left:none;max-height:calc(100dvh - 80px);transform:translateY(100%);}#ai-coach-panel.open{transform:translateY(0);}}',

  // Header
  '#ai-coach-header{padding:20px 24px;border-bottom:1px solid var(--border,#D8D8D0);display:flex;align-items:center;justify-content:space-between;background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);flex-shrink:0;}',
  '#ai-coach-header-title{font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:5px;text-transform:uppercase;}',
  '#ai-coach-header-sub{font-family:Georgia,serif;font-size:13px;font-style:italic;opacity:0.6;margin-top:3px;}',
  '#ai-coach-close{background:none;border:none;color:var(--ivory,#FAF9F6);cursor:pointer;font-size:20px;padding:4px;opacity:0.6;line-height:1;transition:opacity 0.2s ease;}',
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
  '.ai-msg-typing{font-family:Georgia,serif;font-style:italic;color:var(--grey,#6B6B65);font-size:13px;}',

  // Suggestions rapides
  '#ai-suggestions{padding:10px 20px;display:flex;gap:8px;flex-wrap:wrap;border-top:1px solid var(--border,#D8D8D0);background:var(--ivory2,#F4F4F0);flex-shrink:0;}',
  '.ai-suggestion{font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;padding:8px 12px;background:none;border:1px solid var(--border,#D8D8D0);border-radius:2px;cursor:pointer;color:var(--black,#0A0A09);white-space:nowrap;transition:all 0.2s ease;}',
  '.ai-suggestion:hover{background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border-color:var(--black,#0A0A09);}',

  // Input
  '#ai-coach-input-area{padding:14px 20px;border-top:1px solid var(--border,#D8D8D0);display:flex;gap:12px;align-items:flex-end;background:var(--ivory,#FAF9F6);flex-shrink:0;}',
  '#ai-coach-input{flex:1;border:none;border-bottom:1px solid var(--border,#D8D8D0);padding:10px 0;font-size:13px;font-family:"Helvetica Neue",Arial,sans-serif;resize:none;height:36px;max-height:120px;background:transparent;color:var(--black,#0A0A09);line-height:1.5;outline:none;}',
  '#ai-coach-input:focus{border-bottom-color:var(--black,#0A0A09);}',
  '#ai-coach-send{background:var(--black,#0A0A09);color:var(--ivory,#FAF9F6);border:1px solid var(--black,#0A0A09);border-radius:2px;padding:10px 18px;cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;white-space:nowrap;transition:all 0.2s ease;}',
  '#ai-coach-send:disabled{opacity:0.35;cursor:not-allowed;}',
  '#ai-coach-send:hover:not(:disabled){background:var(--ivory,#FAF9F6);color:var(--black,#0A0A09);}',

  // Erreur
  '.ai-msg-error{background:var(--redbg,rgba(90,16,16,0.06));border:1px solid rgba(90,16,16,0.15);border-radius:2px;color:var(--red,#5A1010);padding:12px 16px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;}'
].join('');
document.head.appendChild(style);

// ─── CONTEXTE UTILISATEUR ────────────────────────────────────────────────────
function buildContext() {
  var S = window.S || {};
  var user = null;
  try { user = window.AUTH && window.AUTH.getUser ? window.AUTH.getUser() : null; } catch(e) {}

  var ctx = {
    prenom: user && user.name ? user.name.split(' ')[0] : (S.prenom || ''),
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
    appMode: S.appMode || 'both'
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
  // Objectifs sport et équipement
  if (Array.isArray(S.sportGoals) && S.sportGoals.length) {
    ctx.sportGoals = S.sportGoals;
  }
  if (S.sportEquipment) {
    ctx.sportEquipment = S.sportEquipment;
  }

  // Bilan de forme du jour
  if (S.todayWellness && S.todayWellness.date) {
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

  return ctx;
}

// ─── SUGGESTIONS CONTEXTUELLES ───────────────────────────────────────────────
function getSuggestions() {
  var S = window.S || {};
  var suggestions = [];

  // Nutrition
  suggestions.push('Mon plan nutrition est-il adapté ?');

  // Sport spécifique
  if (S.sportType === 'crossfit') {
    suggestions.push('Comment progresser en haltéro ?');
    suggestions.push('Augmenter mes charges ce mois ?');
  } else if (S.sportType === 'triathlon') {
    suggestions.push('Adapter mon volume cette semaine ?');
    suggestions.push('Optimiser ma nutrition longue distance ?');
  } else if (S.sportType === 'calisthenics') {
    suggestions.push('Progresser vers le muscle-up ?');
    suggestions.push('Programme sur mesure cette semaine ?');
  } else if (S.sportType === 'running') {
    suggestions.push('Améliorer mon allure seuil ?');
    suggestions.push('Gérer ma récupération ?');
  } else {
    suggestions.push('Adapter ma séance du jour ?');
    suggestions.push('Progresser sur mes charges ?');
  }

  // Wellness
  var w = S.todayWellness || {};
  if (w.sleep && w.sleep <= 2) suggestions.push('Je suis fatigué, que faire ?');
  if (w.muscles === 'douleurs') suggestions.push('J\'ai des douleurs musculaires');

  return suggestions.slice(0, 4);
}

// ─── DOM ─────────────────────────────────────────────────────────────────────
function buildUI() {
  // Bouton flottant
  var btn = document.createElement('button');
  btn.id = 'ai-coach-btn';
  btn.setAttribute('aria-label', 'Ouvrir le coach IA');
  // Static button content: built via DOM for CSP compliance
  var _btnIcon = document.createElement('span');
  _btnIcon.style.fontSize = '14px';
  _btnIcon.textContent = '\u25C6';
  btn.appendChild(_btnIcon);
  btn.appendChild(document.createTextNode(' Smart Fit Coach'));
  btn.addEventListener('click', togglePanel);
  document.body.appendChild(btn);

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
  _aiHeaderSub.textContent = 'Nutrition \u00b7 Sport \u00b7 Progression';
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
  appendCoachMessage(messages, 'La performance se construit dans les détails. Sur quoi veux-tu affiner ta préparation aujourd\'hui' + prenom0 + ' ?');
  panel.appendChild(messages);

  // Suggestions
  var suggestions = document.createElement('div');
  suggestions.id = 'ai-suggestions';
  panel.appendChild(suggestions);

  // Input
  var inputArea = document.createElement('div');
  inputArea.id = 'ai-coach-input-area';
  var input = document.createElement('textarea');
  input.id = 'ai-coach-input';
  input.placeholder = 'Pose ta question...';
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  input.addEventListener('input', function() {
    this.style.height = '40px';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });
  var sendBtn = document.createElement('button');
  sendBtn.id = 'ai-coach-send';
  sendBtn.textContent = 'Envoyer';
  sendBtn.addEventListener('click', sendMessage);
  inputArea.appendChild(input);
  inputArea.appendChild(sendBtn);
  panel.appendChild(inputArea);

  document.body.appendChild(panel);

  // Historique depuis S
  loadHistory(messages);

  // Suggestions
  refreshSuggestions(suggestions);
}

function appendCoachMessage(container, text) {
  var wrap = document.createElement('div');
  wrap.className = 'ai-msg ai-msg-coach';
  var name = document.createElement('div');
  name.className = 'ai-msg-coach-name';
  name.textContent = 'Smart Fit Coach';
  var msg = document.createElement('div');
  msg.className = 'ai-msg-text';
  msg.textContent = text;
  wrap.appendChild(name);
  wrap.appendChild(msg);
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
  msg.textContent = 'En train de réfléchir...';
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
  // Afficher les 6 derniers messages de l'historique (pas le welcome)
  var recent = history.slice(-6);
  recent.forEach(function(msg) {
    if (msg.role === 'user') appendUserMessage(container, msg.content);
    else if (msg.role === 'assistant') appendCoachMessage(container, msg.content);
  });
  container.scrollTop = container.scrollHeight;
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

  // Premium gate — coach IA illimité = premium (trial = 3 messages/jour)
  if (window.isTrialUser && window.isTrialUser()) {
    var _coachCount = parseInt(sessionStorage.getItem('sfc_coach_count') || '0');
    if (_coachCount >= 3) {
      appendError(messages, 'Limite atteinte (3 messages/jour en version d\u2019essai). Abonnez-vous pour un acc\u00e8s illimit\u00e9.');
      return;
    }
    sessionStorage.setItem('sfc_coach_count', String(_coachCount + 1));
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

  // Appel API avec timeout client 28s (marge 2s avant le timeout serveur Netlify 30s)
  var _coachCtrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  var _coachTimer = _coachCtrl ? setTimeout(function() { _coachCtrl.abort(); }, 80000) : null;
  fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: apiMessages, context: ctx }),
    signal: _coachCtrl ? _coachCtrl.signal : undefined
  }).then(function(res) {
    if (_coachTimer) clearTimeout(_coachTimer);
    if (!res.ok) return res.json().catch(function(){ return {}; }).then(function(e){ throw new Error(e.error || 'Erreur HTTP ' + res.status); });
    return res.json();
  }).then(function(data) {
    if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);

    if (data.error) {
      appendError(messages, 'Erreur : ' + data.error);
    } else {
      var reply = data.reply || 'Pas de réponse.';
      appendCoachMessage(messages, reply);
      // Sauvegarder réponse dans historique
      if (Array.isArray(S.aiCoachHistory)) {
        S.aiCoachHistory.push({ role: 'assistant', content: reply });
        if (S.aiCoachHistory.length > MAX_HISTORY) {
          S.aiCoachHistory = S.aiCoachHistory.slice(-MAX_HISTORY);
        }
      }
      // Sauvegarder profil
      try { if (window.saveProfile) window.saveProfile(); } catch(e) {}
    }
    messages.scrollTop = messages.scrollHeight;
  }).catch(function(err) {
    if (_coachTimer) clearTimeout(_coachTimer);
    if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
    var errMsg = (err && err.name === 'AbortError')
      ? 'Le coach met trop de temps \u00e0 r\u00e9pondre. R\u00e9essaie dans quelques instants.'
      : (err && err.message && err.message.indexOf('429') !== -1)
      ? 'Trop de messages envoy\u00e9s. Attends quelques minutes avant de r\u00e9essayer.'
      : 'Impossible de joindre le coach. V\u00e9rifiez votre connexion.';
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
  buildContext: buildContext
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
        buildUI();
      } else if (!loggedIn) {
        var btn = document.getElementById('ai-coach-btn');
        var panel = document.getElementById('ai-coach-panel');
        if (btn) btn.remove();
        if (panel) panel.remove();
      }
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
