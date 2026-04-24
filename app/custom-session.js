/**
 * SmartFitCoach — Séance Libre (Custom Session Builder)
 * custom-session.js
 */
(function() {
'use strict';

// ─────────────────────────────────────────────
//  ÉTAPE 1 : EXERCISE_SEARCH — normalize + lev
// ─────────────────────────────────────────────
window.EXERCISE_SEARCH = {

  _DB: null, // lazy-built

  _normalize: function(str) {
    return (str || '').toLowerCase()
      .replace(/[àâä]/g, 'a')
      .replace(/[éèêë]/g, 'e')
      .replace(/[ïî]/g, 'i')
      .replace(/[ôö]/g, 'o')
      .replace(/[ùûü]/g, 'u')
      .replace(/ç/g, 'c')
      .replace(/[œ]/g, 'oe')
      .replace(/[æ]/g, 'ae')
      .replace(/['']/g, '')
      .replace(/[-]/g, ' ');
  },

  _lev: function(a, b, max) {
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > max) return max + 1;
    if (la === 0) return lb;
    if (lb === 0) return la;
    var prev = new Array(lb + 1), cur = new Array(lb + 1);
    for (var j = 0; j <= lb; j++) prev[j] = j;
    for (var i = 1; i <= la; i++) {
      cur[0] = i;
      var rowMin = i;
      for (var jj = 1; jj <= lb; jj++) {
        var cost = a.charCodeAt(i - 1) === b.charCodeAt(jj - 1) ? 0 : 1;
        cur[jj] = Math.min(prev[jj] + 1, cur[jj - 1] + 1, prev[jj - 1] + cost);
        if (cur[jj] < rowMin) rowMin = cur[jj];
      }
      if (rowMin > max) return max + 1;
      var tmp = prev; prev = cur; cur = tmp;
    }
    return prev[lb];
  },

  // ─────────────────────────────────────────────
  //  ÉTAPE 2 : _buildDB — aplatir EXERCISES
  // ─────────────────────────────────────────────
  _buildDB: function() {
    if (this._DB) return; // déjà construit
    var db = [];
    if (!window.EXERCISES) { this._DB = db; return; }
    var groups = Object.keys(window.EXERCISES);
    for (var gi = 0; gi < groups.length; gi++) {
      var grp = groups[gi];
      var arr = window.EXERCISES[grp];
      if (!Array.isArray(arr)) continue;
      for (var ei = 0; ei < arr.length; ei++) {
        var ex = arr[ei];
        if (!ex || !ex.n) continue;
        db.push({
          n:    ex.n,
          m:    ex.m    || '',
          eq:   ex.eq   || '',
          sets: ex.sets || '4×10',
          rest: ex.rest || '90s',
          lv:   ex.lv   || 1,
          tags: Array.isArray(ex.tags) ? ex.tags : [],
          group: grp,
          warn: ex.warn || null
        });
      }
    }
    this._DB = db;
  },

  // ─────────────────────────────────────────────
  //  ÉTAPE 3 : search
  // ─────────────────────────────────────────────
  search: function(query) {
    this._buildDB();
    if (!query || query.length < 2) return [];
    var q = this._normalize(query);
    var qCompact = q.replace(/\s+/g, '');
    var rawTerms = q.split(/\s+/);
    var terms = [];
    for (var rt = 0; rt < rawTerms.length; rt++) {
      if (rawTerms[rt].length >= 2) terms.push(rawTerms[rt]);
      else if (rawTerms[rt].length === 1 && /[0-9]/.test(rawTerms[rt])) terms.push(rawTerms[rt]);
    }
    if (!terms.length) terms = [q];

    var full = [], partial = [], seen = Object.create(null);
    var db = this._DB;
    var self = this;

    for (var i = 0; i < db.length; i++) {
      var item = db[i];
      var name = self._normalize(item.n);
      if (seen[name]) continue;
      seen[name] = 1;
      var nameCompact = name.replace(/\s+/g, '');
      // cherche aussi dans muscle + group
      var searchText = name + ' ' + self._normalize(item.m) + ' ' + self._normalize(item.group);

      var score = 0, wordBoundaryBonus = 0, startsWithBonus = 0, matchedOriginal = 0;
      for (var t = 0; t < terms.length; t++) {
        var term = terms[t];
        var idx = searchText.indexOf(term);
        if (idx === -1) continue;
        score++;
        matchedOriginal++;
        var cb = (idx === 0) ? ' ' : searchText[idx - 1];
        var ca = (idx + term.length >= searchText.length) ? ' ' : searchText[idx + term.length];
        if (!/[a-z0-9]/i.test(cb) && !/[a-z0-9]/i.test(ca)) wordBoundaryBonus += 2;
        if (idx === 0) startsWithBonus += 3;
      }

      var compoundBonus = 0;
      if (score === 0 && qCompact.length >= 4 && nameCompact.indexOf(qCompact) !== -1) {
        score = 1; compoundBonus = 1;
      }
      if (score === 0) continue;

      var phraseBonus = (name.indexOf(q) !== -1) ? terms.length * 2 : 0;
      var finalScore = score + wordBoundaryBonus + startsWithBonus + phraseBonus + compoundBonus;

      if (matchedOriginal === terms.length || (compoundBonus && terms.length === 1)) {
        full.push({ item: item, score: finalScore, _alpha: name });
      } else {
        partial.push({ item: item, score: finalScore, _alpha: name });
      }
    }

    // Levenshtein fallback si aucun match
    if (full.length === 0 && partial.length === 0 && terms.length === 1 && terms[0].length >= 4) {
      var fuzzyTerm = terms[0];
      var fuzzyMax = fuzzyTerm.length <= 5 ? 1 : 2;
      var fuzzySeen = Object.create(null);
      for (var fi = 0; fi < db.length; fi++) {
        var fItem = db[fi];
        var fName = self._normalize(fItem.n);
        if (fuzzySeen[fName]) continue;
        fuzzySeen[fName] = 1;
        var tokens = fName.split(/\s+/);
        var bestDist = fuzzyMax + 1;
        for (var nt = 0; nt < tokens.length; nt++) {
          var d = self._lev(tokens[nt], fuzzyTerm, fuzzyMax);
          if (d < bestDist) bestDist = d;
        }
        if (bestDist <= fuzzyMax) {
          full.push({ item: fItem, score: fuzzyMax + 1 - bestDist, _alpha: fName });
        }
      }
    }

    function byScore(a, b) { return b.score !== a.score ? b.score - a.score : a._alpha.localeCompare(b._alpha); }
    full.sort(byScore);
    partial.sort(byScore);
    return full.concat(partial).slice(0, 40).map(function(r) { return r.item; });
  }

}; // fin EXERCISE_SEARCH

// ─────────────────────────────────────────────
//  ÉTAPE 4 : CUSTOM_SESSION — helpers stockage
// ─────────────────────────────────────────────
window.CUSTOM_SESSION = {

  _uid: function() {
    return (window.AUTH && window.AUTH.getUser()) ? window.AUTH.getUser().id : 'anon';
  },

  _draftKey: function() { return 'mtd_custom_draft_' + this._uid(); },
  _histKey:  function() { return 'mtd_custom_hist_'  + this._uid(); },

  getDefaultDraft: function() {
    var now = new Date();
    var dd = String(now.getDate()).padStart(2, '0');
    var mm = String(now.getMonth() + 1).padStart(2, '0');
    return {
      id:        'custom-' + now.toISOString().slice(0, 10),
      title:     'Séance du ' + dd + '/' + mm,
      startTime: null,
      endTime:   null,
      durationMins: null,
      blocks:    [],
      view:      'build'   // 'build' | 'active' | 'done'
    };
  },

  ensureDraft: function() {
    var S = window.S;
    if (!S) return this.getDefaultDraft();
    if (!S.customSessionDraft || typeof S.customSessionDraft !== 'object') {
      // essayer de restaurer depuis localStorage
      var saved = this._loadRaw();
      if (saved && saved.view !== 'done' && Array.isArray(saved.blocks)) {
        S.customSessionDraft = saved;
      } else {
        S.customSessionDraft = this.getDefaultDraft();
      }
    }
    return S.customSessionDraft;
  },

  saveDraft: function() {
    var S = window.S;
    if (!S || !S.customSessionDraft) return;
    try {
      localStorage.setItem(this._draftKey(), JSON.stringify(S.customSessionDraft));
    } catch(e) {
      if (window.showToast) window.showToast('Stockage plein — brouillon non sauvegardé.', 'error', 3000);
    }
  },

  _loadRaw: function() {
    try {
      var raw = localStorage.getItem(this._draftKey());
      if (!raw) return null;
      var p = JSON.parse(raw);
      return (p && Array.isArray(p.blocks)) ? p : null;
    } catch(e) { return null; }
  },

  clearDraft: function() {
    var S = window.S;
    if (S) S.customSessionDraft = null;
    try { localStorage.removeItem(this._draftKey()); } catch(e) {}
  },

  // ─────────────────────────────────────────────
  //  ÉTAPE 5 : gestion des blocs
  // ─────────────────────────────────────────────
  addBlock: function(block) {
    var draft = this.ensureDraft();
    block.id = 'b' + Date.now() + '_' + Math.floor(Math.random() * 9999);
    draft.blocks.push(block);
    this.saveDraft();
  },

  removeBlock: function(blockId) {
    var draft = this.ensureDraft();
    draft.blocks = draft.blocks.filter(function(b) { return b.id !== blockId; });
    this.saveDraft();
  },

  moveBlock: function(blockId, dir) {
    var draft = this.ensureDraft();
    var idx = -1;
    for (var i = 0; i < draft.blocks.length; i++) {
      if (draft.blocks[i].id === blockId) { idx = i; break; }
    }
    if (idx < 0) return;
    var newIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= draft.blocks.length) return;
    var tmp = draft.blocks[idx];
    draft.blocks[idx] = draft.blocks[newIdx];
    draft.blocks[newIdx] = tmp;
    this.saveDraft();
  },

  // ─────────────────────────────────────────────
  //  ÉTAPE 6 : cycle séance
  // ─────────────────────────────────────────────
  startSession: function() {
    var draft = this.ensureDraft();
    draft.startTime = Date.now();
    draft.view = 'active';
    draft.blocks.forEach(function(b) {
      if (b.type !== 'exercise') return;
      if (!Array.isArray(b.loggedSets)) b.loggedSets = [];
      var targetSets = parseInt(b.sets) || 4;
      while (b.loggedSets.length < targetSets) {
        b.loggedSets.push({
          weight: b.targetWeight != null ? b.targetWeight : '',
          reps: (b.reps !== undefined && b.reps !== null && b.reps !== '') ? String(b.reps) : '',
          validated: false
        });
      }
      b.loggedSets = b.loggedSets.slice(0, targetSets);
    });
    this.saveDraft();
  },

  validateSet: function(blockId, setIdx) {
    var draft = this.ensureDraft();
    var block = null;
    for (var i = 0; i < draft.blocks.length; i++) {
      if (draft.blocks[i].id === blockId) { block = draft.blocks[i]; break; }
    }
    if (!block || !Array.isArray(block.loggedSets)) return;
    if (setIdx < 0 || setIdx >= block.loggedSets.length) return;
    block.loggedSets[setIdx].validated = !block.loggedSets[setIdx].validated;

    // Pré-remplir la série suivante avec les valeurs réelles de la série validée
    if (block.loggedSets[setIdx].validated) {
      var nextSet = block.loggedSets[setIdx + 1];
      if (nextSet && !nextSet.validated) {
        if (block.loggedSets[setIdx].weight != null) nextSet.weight = block.loggedSets[setIdx].weight;
        if (block.loggedSets[setIdx].reps   != null) nextSet.reps   = block.loggedSets[setIdx].reps;
      }
    }

    // persistance dans muscuSessionLog (même structure que le programme muscu)
    var S = window.S;
    var today = new Date().toISOString().slice(0, 10);
    if (!S.muscuSessionLog || typeof S.muscuSessionLog !== 'object') S.muscuSessionLog = {};
    if (!S.muscuSessionLog[today]) S.muscuSessionLog[today] = {};
    S.muscuSessionLog[today][block.n] = block.loggedSets.map(function(s, si) {
      return {
        set: si + 1,
        targetWeight: parseFloat(block.targetWeight) || 0,
        targetReps:   parseInt(block.reps) || 0,
        actualWeight: s.validated ? (parseFloat(s.weight) || null) : null,
        actualReps:   s.validated ? (parseInt(s.reps)   || null) : null,
        validated:    s.validated
      };
    });
    // appel saveMuscuSessionLog si exposé
    if (typeof window.saveMuscuSessionLog === 'function') {
      try { window.saveMuscuSessionLog(); } catch(e) {}
    }
    this.saveDraft();
  },

  finishSession: function(durationMins) {
    var draft = this.ensureDraft();
    var S = window.S;
    if (!S) return;
    draft.view = 'done';
    draft.endTime = Date.now();
    draft.durationMins = durationMins || Math.max(1, Math.round(((draft.endTime - (draft.startTime || draft.endTime)) / 60000))) || 30;

    // historique des séances custom (max 90)
    if (!Array.isArray(S.customSessionHistory)) S.customSessionHistory = [];
    S.customSessionHistory.unshift({
      id:          draft.id,
      title:       draft.title,
      date:        new Date().toISOString().slice(0, 10),
      durationMins: draft.durationMins,
      exCount:     draft.blocks.filter(function(b) { return b.type === 'exercise'; }).length
    });
    if (S.customSessionHistory.length > 90) S.customSessionHistory = S.customSessionHistory.slice(0, 90);
    try { localStorage.setItem(this._histKey(), JSON.stringify(S.customSessionHistory)); } catch(e) {}

    // compte aussi dans sessionHistory pour le widget "semaine" + brûlé du dashboard
    var todayStr = new Date().toISOString().slice(0, 10);
    if (!S.sessionHistory) S.sessionHistory = {};
    var _kcal = this.calcKcal(draft);
    S.sessionHistory[todayStr] = {
      date: todayStr, duration: draft.durationMins, type: 'custom', title: draft.title,
      kcalBase: _kcal.base, kcalEpoc: _kcal.epoc, kcalTotal: _kcal.total
    };
    try {
      localStorage.setItem('mtd_session_history_' + this._uid(), JSON.stringify(S.sessionHistory));
    } catch(e) {}

    // Mise à jour muscuProgressionHistory (alimente sparklines + suggestions futures)
    var _today3 = new Date().toISOString().slice(0, 10);
    if (!S.muscuProgressionHistory) S.muscuProgressionHistory = {};
    draft.blocks.forEach(function(b) {
      if (b.type !== 'exercise' || !Array.isArray(b.loggedSets)) return;
      var vs3 = b.loggedSets.filter(function(s) { return s.validated && s.weight && s.reps; });
      if (!vs3.length) return;
      var avgW3 = vs3.reduce(function(sum3, s) { return sum3 + (parseFloat(s.weight) || 0); }, 0) / vs3.length;
      var avgR3 = vs3.reduce(function(sum3, s) { return sum3 + (parseInt(s.reps) || 0); }, 0) / vs3.length;
      if (!S.muscuProgressionHistory[b.n]) S.muscuProgressionHistory[b.n] = [];
      if (!S.muscuProgressionHistory[b.n].some(function(e3) { return e3.date === _today3; })) {
        S.muscuProgressionHistory[b.n].push({ date: _today3, week: S.muscuWeek || 0, weight: Math.round(avgW3 * 2) / 2, reps: Math.round(avgR3) });
        if (S.muscuProgressionHistory[b.n].length > 365) S.muscuProgressionHistory[b.n] = S.muscuProgressionHistory[b.n].slice(-365);
      }
    });
    try { localStorage.setItem('mtd_muscu_progression_' + this._uid(), JSON.stringify(S.muscuProgressionHistory)); } catch(e2) {}

    // Gamification
    if (window.GAMIFICATION) {
      try {
        window.GAMIFICATION.unlockBadge('first_custom_session');
        var cCount = window.GAMIFICATION.incrementCounter('muscu_sessions');
        if (cCount >= 1)  window.GAMIFICATION.unlockBadge('first_workout');
        if (cCount >= 10) window.GAMIFICATION.unlockBadge('muscu_sessions_10');
        if (cCount >= 50) window.GAMIFICATION.unlockBadge('muscu_sessions_50');
        if (typeof window.GAMIFICATION.updateStreak === 'function') window.GAMIFICATION.updateStreak();
      } catch(eg) {}
    }

    this.saveDraft();
    // Persiste sessionHistory + muscuProgressionHistory + customSessionHistory dans le profil
    if (typeof window.saveProfile === 'function') {
      try { window.saveProfile(); } catch(ep) {}
    }
  },

  calcKcal: function(draft) {
    if (!draft) return { base: 0, epoc: 0, total: 0 };
    var mins   = draft.durationMins || 30;
    var weight = (window.S && window.S.weight) ? parseFloat(window.S.weight) : 70;
    var hasCardio = draft.blocks.some(function(b) { return b.type === 'cardio'; });
    var met = hasCardio ? 5.5 : 4.5;
    var base = Math.round((met * weight * 3.5 / 200) * mins);
    var epoc = Math.round(base * 0.12);
    return { base: base, epoc: epoc, total: base + epoc };
  },

  // ─── Templates de séance ───────────────────────────────────────────────────
  _tplKey: function() { return 'mtd_cs_tpl_' + this._uid(); },

  getTemplates: function() {
    try { return JSON.parse(localStorage.getItem(this._tplKey()) || '[]'); } catch(e) { return []; }
  },

  saveAsTemplate: function(name) {
    var draft = this.ensureDraft();
    var tpls = this.getTemplates();
    var blocks = draft.blocks.map(function(b) {
      return {
        type: b.type, n: b.n, m: b.m, eq: b.eq,
        sets: b.sets, reps: b.reps, rest: b.rest,
        targetWeight: b.targetWeight,
        subtype: b.subtype, label: b.label,
        duration: b.duration, speed: b.speed, incline: b.incline
      };
    });
    tpls.unshift({ name: name, date: new Date().toISOString().slice(0, 10), blocks: blocks });
    if (tpls.length > 10) tpls = tpls.slice(0, 10);
    try { localStorage.setItem(this._tplKey(), JSON.stringify(tpls)); } catch(e) {}
    return tpls;
  },

  loadTemplate: function(tpl) {
    this.clearDraft();
    var S = window.S;
    if (S) {
      S._csSkipMuscleSelect = true;
      S._csSelectedGroups = [];
    }
    var self = this;
    (tpl.blocks || []).forEach(function(b) { self.addBlock(JSON.parse(JSON.stringify(b))); });
  }

}; // fin CUSTOM_SESSION

// ─────────────────────────────────────────────
//  ÉTAPE 7 : renderCustomSessionBuilder — point d'entrée
// ─────────────────────────────────────────────
window.renderCustomSessionBuilder = function(container) {
  var S = window.S;
  if (!S || !window.h) return;

  var draft = window.CUSTOM_SESSION.ensureDraft();
  if (!draft.view) draft.view = 'build';

  if      (draft.view === 'build')  { _csRenderBuild(container, draft); }
  else if (draft.view === 'active') { _csRenderActive(container, draft); }
  else if (draft.view === 'done')   { _csRenderDone(container, draft); }
  else { draft.view = 'build'; _csRenderBuild(container, draft); }
};

// ─────────────────────────────────────────────
//  ÉTAPE 8-10 : placeholders (remplis ensuite)
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
//  Groupes musculaires — constantes
// ─────────────────────────────────────────────
var _CS_MUSCLE_GROUPS = [
  { key: 'glutes',    label: 'Fessiers',  keywords: ['fessier', 'gluteus', 'grand fessier', 'moyen fessier'] },
  { key: 'back',      label: 'Dos',       keywords: ['dos', 'latissimus', 'trapeze', 'grand dorsal', 'lombaire', 'rhomboide', 'grand rond'] },
  { key: 'chest',     label: 'Pecs',      keywords: ['pectoraux', 'pectoral', 'pec'] },
  { key: 'legs',      label: 'Jambes',    keywords: ['quadriceps', 'ischio', 'mollet', 'femoral', 'solea', 'jumeau', 'jambe'] },
  { key: 'shoulders', label: 'Épaules',  keywords: ['epaule', 'deltoid'] },
  { key: 'abs',       label: 'Abdos',     keywords: ['abdominaux', 'abdo', 'transverse', 'oblique'] },
  { key: 'arms',      label: 'Bras',      keywords: ['biceps', 'triceps', 'avant-bras', 'brachialis'] },
  { key: 'cardio',    label: 'Cardio',    keywords: [] }
];

// ─────────────────────────────────────────────
//  Génération de séance depuis groupes musculaires
// ─────────────────────────────────────────────
function _csGenerateSessionFromMuscles(groups) {
  window.EXERCISE_SEARCH._buildDB();
  var db = window.EXERCISE_SEARCH._DB || [];
  var S = window.S;
  var norm = function(s) { return window.EXERCISE_SEARCH._normalize(s); };

  // Historique récent pour prioriser les exercices connus
  var recentEx = {};
  var log = (S && S.muscuSessionLog) || {};
  Object.keys(log).sort().reverse().slice(0, 30).forEach(function(d) {
    Object.keys(log[d] || {}).forEach(function(n) { recentEx[norm(n)] = true; });
  });

  // Contre-indications médicales
  var medWarns = [];
  if (S && Array.isArray(S.medical)) {
    S.medical.forEach(function(m) {
      var ml = norm(m);
      if (ml.indexOf('genou') !== -1) medWarns.push('genou');
      if (ml.indexOf('lombaire') !== -1 || ml.indexOf('hernie') !== -1) medWarns.push('lombaire');
      if (ml.indexOf('epaule') !== -1) medWarns.push('epaule');
    });
  }

  var usedNames = {};

  groups.forEach(function(grp) {
    if (grp.key === 'cardio') {
      _csAddCardio('tapis', 'Tapis de course');
      return;
    }
    if (!grp.keywords || !grp.keywords.length) return;

    var matching = db.filter(function(ex) {
      if (usedNames[norm(ex.n)]) return false;
      var mNorm = norm(ex.m || '');
      return grp.keywords.some(function(kw) { return mNorm.indexOf(kw) !== -1; });
    });

    if (medWarns.length) {
      matching = matching.filter(function(ex) {
        if (!ex.warn) return true;
        var w = norm(ex.warn);
        return !medWarns.some(function(mw) { return w.indexOf(mw) !== -1; });
      });
    }

    // Prioriser : exercices connus d'abord, puis niveau croissant (compound en 1er)
    matching.sort(function(a, b) {
      var ah = recentEx[norm(a.n)] ? 1 : 0;
      var bh = recentEx[norm(b.n)] ? 1 : 0;
      if (ah !== bh) return bh - ah;
      return (a.lv || 2) - (b.lv || 2);
    });

    matching.slice(0, 4).forEach(function(ex) {
      usedNames[norm(ex.n)] = true;
      _csAddExercise(ex);
    });
  });
}

// ─────────────────────────────────────────────
//  Sélecteur de groupes musculaires
// ─────────────────────────────────────────────
function _csRenderMuscleSelector(container, draft) {
  var h = window.h;
  var S = window.S;
  if (!Array.isArray(S._csSelectedGroups)) S._csSelectedGroups = [];

  container.appendChild(h('div', {
    style: 'font-family:Georgia,serif;font-size:18px;font-weight:normal;color:var(--black,#0A0A09);margin-bottom:6px;'
  }, 'Quels muscles travailler ?'));
  container.appendChild(h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);margin-bottom:20px;line-height:1.5;'
  }, 'Sélectionnez un ou plusieurs groupes. Nous générons une séance sur mesure que vous pourrez modifier librement.'));

  var grid = h('div', {
    style: 'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;'
  });

  _CS_MUSCLE_GROUPS.forEach(function(grp) {
    var sel = S._csSelectedGroups.indexOf(grp.key) !== -1;
    var btn = h('button', {
      style: [
        'padding:18px 10px;',
        'border:2px solid ' + (sel ? 'var(--green,#3E5C3A)' : 'var(--border,#D8D8D0)') + ';',
        'background:' + (sel ? 'rgba(62,92,58,0.08)' : 'var(--ivory,#FAF9F6)') + ';',
        'border-radius:2px;cursor:pointer;text-align:center;',
        'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;',
        'color:' + (sel ? 'var(--green,#3E5C3A)' : 'var(--black,#0A0A09)') + ';',
        'min-height:64px;',
        sel ? 'font-weight:bold;' : ''
      ].join(''),
      onclick: (function(gKey) {
        return function() {
          if (!Array.isArray(S._csSelectedGroups)) S._csSelectedGroups = [];
          var idx = S._csSelectedGroups.indexOf(gKey);
          if (idx === -1) S._csSelectedGroups.push(gKey);
          else S._csSelectedGroups.splice(idx, 1);
          if (window.render) window.render();
        };
      })(grp.key)
    });
    btn.appendChild(h('div', {}, grp.label));
    grid.appendChild(btn);
  });

  container.appendChild(grid);

  var hasSel = S._csSelectedGroups.length > 0;

  container.appendChild(h('button', {
    style: [
      'display:block;width:100%;padding:16px;margin-bottom:10px;',
      'background:' + (hasSel ? 'var(--ink-900,#0A0A09)' : 'var(--border,#D8D8D0)') + ';',
      'color:' + (hasSel ? 'var(--paper,#FAF9F6)' : 'var(--grey,#6B6B65)') + ';',
      'border:none;border-radius:2px;',
      'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;',
      'cursor:' + (hasSel ? 'pointer' : 'not-allowed') + ';min-height:52px;'
    ].join(''),
    onclick: function() {
      if (!hasSel || S._csGenerating) return;
      S._csGenerating = true;
      var sel2 = S._csSelectedGroups;
      var groups = _CS_MUSCLE_GROUPS.filter(function(g) { return sel2.indexOf(g.key) !== -1; });
      _csGenerateSessionFromMuscles(groups);
      S._csSkipMuscleSelect = true;
      S._csGenerating = false;
      if (window.render) window.render();
    }
  }, hasSel ? '→ Générer ma séance' : 'Sélectionnez au moins un groupe'));

  container.appendChild(h('button', {
    style: 'display:block;width:100%;padding:10px;background:transparent;border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);cursor:pointer;',
    onclick: function() {
      S._csSkipMuscleSelect = true;
      S._csSelectedGroups = [];
      if (window.render) window.render();
    }
  }, 'Construire librement sans suggestion →'));
}

// ─────────────────────────────────────────────
//  ÉTAPE 8 : vue BUILD
// ─────────────────────────────────────────────
function _csRenderBuild(container, draft) {
  var h = window.h;
  var S = window.S;

  // ── En-tête ──
  var hdr = h('div', { style: 'margin-bottom:16px;' });
  hdr.appendChild(h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:5px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:6px;'
  }, 'SÉANCE LIBRE'));
  hdr.appendChild(h('div', {
    style: 'font-family:Georgia,serif;font-size:22px;font-weight:normal;color:var(--black,#0A0A09);margin-bottom:4px;'
  }, draft.title));
  var _genGroups = (S._csSelectedGroups && S._csSelectedGroups.length && S._csSkipMuscleSelect);
  var _subtitleText = draft.blocks.length === 0
    ? 'Recherchez un exercice ou ajoutez un bloc cardio.'
    : _genGroups
      ? draft.blocks.length + ' exercice' + (draft.blocks.length > 1 ? 's' : '') + ' suggérés · Modifiez librement avant de démarrer.'
      : draft.blocks.length + ' bloc' + (draft.blocks.length > 1 ? 's' : '') + ' · Appuyez sur Démarrer quand vous êtes prêt.';
  hdr.appendChild(h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);'
  }, _subtitleText));
  container.appendChild(hdr);

  // ── Sélecteur groupes musculaires (quand aucun bloc et pas encore skippé) ──
  if (draft.blocks.length === 0 && !S._csSkipMuscleSelect) {
    _csRenderMuscleSelector(container, draft);
    container.appendChild(h('button', {
      style: 'display:block;width:100%;padding:11px;margin-top:8px;background:transparent;border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;color:var(--grey,#6B6B65);',
      onclick: function() {
        window.CUSTOM_SESSION.clearDraft();
        var S2 = window.S;
        S2._csQuery = '';
        S2._csSkipMuscleSelect = false;
        S2._csSelectedGroups = [];
        S2.sStep = 0;
        S2.view = 'today';
        if (window.render) window.render();
      }
    }, 'Annuler'));
    return;
  }

  // ── Bandeau "séance générée" si groupes sélectionnés mais 0 résultats ──
  if (S._csSkipMuscleSelect && S._csSelectedGroups && S._csSelectedGroups.length > 0 && draft.blocks.length === 0) {
    container.appendChild(h('div', {
      style: 'padding:10px 14px;margin-bottom:12px;background:rgba(10,10,9,0.04);border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);'
    }, 'Aucun exercice trouvé pour ces groupes musculaires. Ajoutez vos exercices manuellement ci-dessous.'));
  }

  // ── Barre de recherche ──
  var srchWrap = h('div', { style: 'position:relative;margin-bottom:12px;' });
  srchWrap.appendChild(h('div', {
    style: 'position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--grey,#6B6B65);font-size:16px;pointer-events:none;'
  }, '⌕'));
  var srchInput = h('input', {
    type: 'search', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'off',
    placeholder: 'Squat, fessiers, hip thrust…',
    value: S._csQuery || '',
    style: [
      'width:100%;box-sizing:border-box;',
      'padding:13px 36px 13px 36px;',
      'border:1px solid var(--border,#D8D8D0);',
      'border-radius:2px;',
      'font-family:"Helvetica Neue",Arial,sans-serif;font-size:14px;',
      'background:var(--ivory,#FAF9F6);color:var(--black,#0A0A09);',
      '-webkit-appearance:none;outline:none;'
    ].join('')
  });
  var clearBtn = h('button', {
    style: 'position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:18px;cursor:pointer;color:var(--grey,#6B6B65);padding:4px 6px;display:' + (S._csQuery ? 'block' : 'none') + ';',
    onclick: function() {
      S._csQuery = '';
      srchInput.value = '';
      clearBtn.style.display = 'none';
      _csUpdateResults('');
    }
  }, '×');
  srchWrap.appendChild(clearBtn);
  srchWrap.appendChild(srchInput);
  container.appendChild(srchWrap);

  // ── Résultats (mis à jour sans re-render global pour préserver le focus clavier) ──
  var srchResultsContainer = h('div', {});
  container.appendChild(srchResultsContainer);

  function _csUpdateResults(q) {
    while (srchResultsContainer.firstChild) srchResultsContainer.removeChild(srchResultsContainer.firstChild);
    if (!q || q.length < 2) return;
    var results = window.EXERCISE_SEARCH.search(q);
    var resBox = h('div', {
      style: 'border:1px solid var(--border,#D8D8D0);border-radius:2px;margin-bottom:14px;max-height:260px;overflow-y:auto;background:var(--ivory,#FAF9F6);'
    });
    if (results.length === 0) {
      resBox.appendChild(h('div', {
        style: 'padding:14px;text-align:center;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey,#6B6B65);'
      }, 'Aucun exercice pour "' + q + '"'));
    } else {
      results.forEach(function(ex) {
        var row = h('div', {
          style: 'display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid var(--border,#D8D8D0);cursor:pointer;',
          onclick: function() { _csAddExercise(ex); S._csQuery = ''; if (window.render) window.render(); }
        });
        row.onmouseover = function() { row.style.background = 'rgba(0,0,0,0.03)'; };
        row.onmouseout  = function() { row.style.background = ''; };
        var lft = h('div', { style: 'flex:1;min-width:0;' });
        lft.appendChild(h('div', {
          style: 'font-family:Georgia,serif;font-size:13px;color:var(--black,#0A0A09);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'
        }, ex.n));
        lft.appendChild(h('div', {
          style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);margin-top:2px;'
        }, (ex.m || '') + (ex.eq ? ' · ' + ex.eq : '')));
        row.appendChild(lft);
        row.appendChild(h('div', { style: 'font-size:20px;font-weight:300;color:var(--black,#0A0A09);margin-left:10px;' }, '+'));
        resBox.appendChild(row);
      });
    }
    srchResultsContainer.appendChild(resBox);
  }

  _csUpdateResults(S._csQuery || '');

  srchInput.onfocus = function() { srchInput.style.borderColor = 'var(--black,#0A0A09)'; };
  srchInput.onblur  = function() { srchInput.style.borderColor = 'var(--border,#D8D8D0)'; };
  var _srchTimer = null;
  srchInput.oninput = function(e) {
    if (_srchTimer) clearTimeout(_srchTimer);
    var val = e.target.value;
    clearBtn.style.display = val ? 'block' : 'none';
    _srchTimer = setTimeout(function() {
      S._csQuery = val;
      _csUpdateResults(val);
    }, 180);
  };

  // ── Blocs cardio rapides ──
  var cardioSect = h('div', { style: 'margin-bottom:18px;' });
  cardioSect.appendChild(h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:8px;'
  }, 'AJOUTER UN BLOC CARDIO'));
  var cardioRow = h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;' });
  var cardioTypes = [
    { key: 'tapis',       label: 'Tapis de course' },
    { key: 'velo',        label: 'Vélo' },
    { key: 'rameur',      label: 'Rameur' },
    { key: 'elliptique',  label: 'Elliptique' },
    { key: 'corde',       label: 'Corde à sauter' }
  ];
  cardioTypes.forEach(function(ct) {
    cardioRow.appendChild(h('button', {
      style: 'padding:8px 12px;background:var(--ivory,#FAF9F6);border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;cursor:pointer;color:var(--black,#0A0A09);min-height:36px;',
      onclick: (function(c) { return function() { _csAddCardio(c.key, c.label); if (window.render) window.render(); }; })(ct)
    }, ct.label));
  });
  cardioSect.appendChild(cardioRow);
  container.appendChild(cardioSect);

  // ── Templates sauvegardés (quand builder vide) ──
  if (draft.blocks.length === 0) {
    var tpls = window.CUSTOM_SESSION.getTemplates();
    if (tpls.length > 0) {
      container.appendChild(h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:8px;margin-top:6px;'
      }, 'MES SÉANCES SAUVEGARDÉES'));
      tpls.forEach(function(tpl) {
        var tRow = h('div', {
          style: 'display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border:1px solid var(--border,#D8D8D0);margin-bottom:6px;background:var(--ivory,#FAF9F6);cursor:pointer;border-radius:2px;',
          onclick: function() {
            window.CUSTOM_SESSION.loadTemplate(tpl);
            if (window.render) window.render();
          }
        });
        tRow.onmouseover = function() { tRow.style.background = 'rgba(0,0,0,0.03)'; };
        tRow.onmouseout  = function() { tRow.style.background = 'var(--ivory,#FAF9F6)'; };
        var tLeft = h('div', { style: 'flex:1;min-width:0;' });
        tLeft.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--black,#0A0A09);' }, tpl.name));
        tLeft.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);margin-top:2px;' },
          (tpl.blocks || []).filter(function(b) { return b.type === 'exercise'; }).length + ' exercices · ' + tpl.date));
        tRow.appendChild(tLeft);
        tRow.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--green,#3E5C3A);margin-left:10px;' }, 'Charger →'));
        container.appendChild(tRow);
      });
    }
  }

  // ── Liste des blocs du brouillon ──
  if (draft.blocks.length > 0) {
    container.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:8px;'
    }, 'MA SÉANCE'));
    draft.blocks.forEach(function(block) {
      container.appendChild(_csRenderDraftBlock(block));
    });
  }

  // ── Bouton Démarrer ──
  var canStart = draft.blocks.length > 0;
  container.appendChild(h('button', {
    style: [
      'display:block;width:100%;padding:16px;margin-top:18px;',
      'background:' + (canStart ? 'var(--ink-900,#0A0A09)' : 'var(--border,#D8D8D0)') + ';',
      'color:' + (canStart ? 'var(--paper,#FAF9F6)' : 'var(--grey,#6B6B65)') + ';',
      'border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;',
      'font-size:11px;letter-spacing:3px;text-transform:uppercase;',
      'cursor:' + (canStart ? 'pointer' : 'not-allowed') + ';min-height:52px;'
    ].join(''),
    onclick: function() {
      if (!canStart) return;
      window.CUSTOM_SESSION.startSession();
      if (window.render) window.render();
    }
  }, canStart ? '▶ Démarrer la séance' : 'Ajoutez au moins un exercice'));

  // ── Bouton Annuler ──
  container.appendChild(h('button', {
    style: 'display:block;width:100%;padding:11px;margin-top:8px;background:transparent;border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;color:var(--grey,#6B6B65);',
    onclick: function() {
      window.CUSTOM_SESSION.clearDraft();
      var S2 = window.S;
      S2._csQuery = '';
      S2._csSkipMuscleSelect = false;
      S2._csSelectedGroups = [];
      S2.sStep = 0;
      S2.view = 'today';
      if (window.render) window.render();
    }
  }, 'Annuler'));
}
// ─────────────────────────────────────────────
//  ÉTAPE 9a : vue ACTIVE
// ─────────────────────────────────────────────
function _csRenderActive(container, draft) {
  var h = window.h;
  var S = window.S;

  // Pré-calcul dates log (partagé entre tous les blocs pour éviter N tris)
  var _logToday = new Date().toISOString().slice(0, 10);
  var _logAll = (S && S.muscuSessionLog) || {};
  S._csActiveDates = Object.keys(_logAll).filter(function(d) { return d < _logToday; }).sort().reverse();

  // comptage sets
  var totalSets = 0, doneSets = 0;
  draft.blocks.forEach(function(b) {
    if (b.type !== 'exercise' || !Array.isArray(b.loggedSets)) return;
    b.loggedSets.forEach(function(s) { totalSets++; if (s.validated) doneSets++; });
  });
  var allDone = (totalSets > 0 && doneSets === totalSets);

  // Chrono temps réel — interval persistant entre renders, rafraîchit uniquement le span
  if (window._csChronoInterval) { clearInterval(window._csChronoInterval); window._csChronoInterval = null; }
  var _chronoStart = draft.startTime || Date.now();
  function _fmtElapsed(ms) {
    var sec = Math.floor(ms / 1000);
    var m = Math.floor(sec / 60); var s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  // En-tête
  var hdr = h('div', { style: 'margin-bottom:14px;' });
  var hdrTop = h('div', { style: 'display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;' });
  hdrTop.appendChild(h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:5px;text-transform:uppercase;color:var(--grey,#6B6B65);'
  }, 'SÉANCE EN COURS'));
  var chronoSpan = h('span', {
    id: 'cs-elapsed-timer',
    style: 'font-family:Georgia,serif;font-size:13px;color:var(--grey,#6B6B65);letter-spacing:1px;'
  }, _fmtElapsed(Date.now() - _chronoStart));
  hdrTop.appendChild(chronoSpan);
  hdr.appendChild(hdrTop);
  hdr.appendChild(h('div', {
    style: 'font-family:Georgia,serif;font-size:20px;font-weight:normal;color:var(--black,#0A0A09);margin-bottom:6px;'
  }, draft.title));
  if (totalSets > 0) {
    var pct = Math.round((doneSets / totalSets) * 100);
    var pb = h('div', { style: 'height:3px;background:var(--border,#D8D8D0);border-radius:2px;overflow:hidden;' });
    pb.appendChild(h('div', { style: 'height:100%;width:' + pct + '%;background:var(--green,#3E5C3A);transition:width 0.3s;' }, ''));
    hdr.appendChild(pb);
    hdr.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);margin-top:4px;text-align:right;'
    }, doneSets + '/' + totalSets + ' séries validées'));
  }
  container.appendChild(hdr);

  // Démarrer le chrono (met à jour #cs-elapsed-timer sans re-render)
  window._csChronoInterval = setInterval(function() {
    var el = document.getElementById('cs-elapsed-timer');
    if (el) { el.textContent = _fmtElapsed(Date.now() - _chronoStart); }
    else { clearInterval(window._csChronoInterval); window._csChronoInterval = null; }
  }, 1000);

  // Blocs
  draft.blocks.forEach(function(block) {
    if (block.type === 'exercise') {
      container.appendChild(_csRenderActiveExBlock(block));
    } else if (block.type === 'cardio') {
      container.appendChild(_csRenderActiveCardioBlock(block));
    }
  });

  // Bouton Terminer
  container.appendChild(h('button', {
    style: [
      'display:block;width:100%;padding:16px;margin-top:18px;',
      'background:' + (allDone ? 'var(--green,#3E5C3A)' : 'var(--ink-900,#0A0A09)') + ';',
      'color:var(--paper,#FAF9F6);border:none;border-radius:2px;',
      'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;',
      'cursor:pointer;min-height:52px;'
    ].join(''),
    onclick: function() {
      if (window._csChronoInterval) { clearInterval(window._csChronoInterval); window._csChronoInterval = null; }
      var elapsed = draft.startTime ? Math.max(1, Math.round((Date.now() - draft.startTime) / 60000)) : 30;
      window.CUSTOM_SESSION.finishSession(elapsed);
      if (window.render) window.render();
    }
  }, allDone ? '✓ Terminer la séance' : 'Terminer la séance →'));

  // Abandon
  container.appendChild(h('button', {
    style: 'display:block;width:100%;padding:10px;margin-top:8px;background:transparent;border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;color:var(--grey,#6B6B65);',
    onclick: function() {
      if (!confirm('Abandonner la séance ? Les séries validées sont conservées.')) return;
      if (window._csChronoInterval) { clearInterval(window._csChronoInterval); window._csChronoInterval = null; }
      var elapsed2 = draft.startTime ? Math.max(1, Math.round((Date.now() - draft.startTime) / 60000)) : 5;
      window.CUSTOM_SESSION.finishSession(elapsed2);
      if (window.render) window.render();
    }
  }, 'Abandonner'));
}

// ─────────────────────────────────────────────
//  ÉTAPE 9b : vue DONE
// ─────────────────────────────────────────────
function _csRenderDone(container, draft) {
  var h = window.h;
  var S = window.S;
  var kcal = window.CUSTOM_SESSION.calcKcal(draft);

  // Header succès
  var hdrDone = h('div', { style: 'text-align:center;padding:20px 0 12px;' });
  hdrDone.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:28px;margin-bottom:8px;' }, '✓'));
  hdrDone.appendChild(h('div', {
    style: 'font-family:Georgia,serif;font-size:21px;font-weight:normal;color:var(--black,#0A0A09);margin-bottom:4px;'
  }, 'Séance terminée'));
  hdrDone.appendChild(h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);'
  }, draft.title));
  container.appendChild(hdrDone);

  // Grille stats
  var exCount = draft.blocks.filter(function(b) { return b.type === 'exercise'; }).length;
  var statsGrid = h('div', {
    style: 'display:grid;grid-template-columns:1fr 1fr 1fr;border:1px solid var(--border,#D8D8D0);border-radius:2px;margin:12px 0;background:var(--ivory,#FAF9F6);'
  });
  function _sc(val, lbl, last) {
    var c = h('div', { style: 'padding:12px 8px;text-align:center;' + (last ? '' : 'border-right:1px solid var(--border,#D8D8D0);') });
    c.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:20px;font-weight:normal;' }, String(val)));
    c.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-top:4px;' }, lbl));
    return c;
  }
  statsGrid.appendChild(_sc(exCount, 'Exercices', false));
  statsGrid.appendChild(_sc((draft.durationMins || 0) + "'", 'Durée', false));
  statsGrid.appendChild(_sc(kcal.total + ' kcal', 'Dépense', true));
  container.appendChild(statsGrid);

  // Récap exercices
  var exBlocks = draft.blocks.filter(function(b) { return b.type === 'exercise' && Array.isArray(b.loggedSets); });
  if (exBlocks.length > 0) {
    var recapBox = h('div', { style: 'border:1px solid var(--border,#D8D8D0);margin-bottom:14px;background:var(--ivory,#FAF9F6);' });
    recapBox.appendChild(h('div', {
      style: 'padding:7px 12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);border-bottom:1px solid var(--border,#D8D8D0);'
    }, 'Récap. des exercices'));
    exBlocks.forEach(function(b) {
      var valid = b.loggedSets.filter(function(s) { return s.validated; });
      if (!valid.length) return;
      var r = h('div', { style: 'display:flex;justify-content:space-between;align-items:center;padding:7px 12px;border-bottom:1px solid var(--border,#D8D8D0);' });
      r.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:13px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' }, b.n));
      var w = valid[0] && parseFloat(valid[0].weight) > 0 ? ' — ' + valid[0].weight + ' kg' : '';
      r.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin-left:8px;white-space:nowrap;' }, valid.length + ' séries' + w));
      r.appendChild(h('span', { style: 'color:var(--green,#3E5C3A);font-size:14px;margin-left:6px;' }, '✓'));
      recapBox.appendChild(r);
    });
    container.appendChild(recapBox);
  }

  // Durée éditable
  var durRow = h('div', { style: 'display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid var(--border,#D8D8D0);margin-bottom:12px;' });
  durRow.appendChild(h('span', { style: 'font-family:"Helvetice Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);flex:1;' }, 'Durée réelle'));
  var durInp = h('input', {
    type: 'number', min: '1', max: '300', inputmode: 'numeric',
    value: String(draft.durationMins || 30),
    style: 'width:60px;padding:8px;border:1px solid var(--border);border-radius:2px;font-family:Georgia;font-size:16px;text-align:center;background:var(--ivory);',
    onclick: function(e) { e.stopPropagation(); },
    onchange: function(e) {
      var v = parseInt(e.target.value);
      if (!isNaN(v) && v > 0) { draft.durationMins = v; window.CUSTOM_SESSION.saveDraft(); if (window.render) window.render(); }
    }
  });
  durRow.appendChild(durInp);
  durRow.appendChild(h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);' }, 'min'));
  container.appendChild(durRow);

  // Bilan calories
  var kcalBox = h('div', { style: 'background:var(--ivory,#FAF9F6);border:1px solid var(--border,#D8D8D0);padding:12px 16px;margin-bottom:14px;' });
  function _kr(lbl, val, bold, col) {
    var row = h('div', { style: 'display:flex;justify-content:space-between;margin-bottom:6px;' });
    row.appendChild(h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);' + (bold ? 'font-weight:bold;' : '') }, lbl));
    row.appendChild(h('span', { style: 'font-family:Georgia,serif;font-size:' + (bold ? '17' : '15') + 'px;' + (col ? 'color:' + col + ';' : '') + (bold ? 'font-weight:bold;' : '') }, val));
    return row;
  }
  kcalBox.appendChild(_kr('Dépense séance', kcal.base + ' kcal', false, null));
  kcalBox.appendChild(_kr('EPOC +24h', '+' + kcal.epoc + ' kcal', false, 'var(--orange,#E86F1E)'));
  var tot = h('div', { style: 'display:flex;justify-content:space-between;border-top:1px solid var(--border,#D8D8D0);padding-top:8px;' });
  tot.appendChild(h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;font-weight:bold;' }, 'Total estimé'));
  tot.appendChild(h('span', { style: 'font-family:Georgia,serif;font-size:17px;font-weight:bold;color:var(--green,#3E5C3A);' }, kcal.total + ' kcal'));
  kcalBox.appendChild(tot);
  container.appendChild(kcalBox);

  // Retour dashboard
  // ── Sauvegarder comme template ──
  var exBlocks2 = draft.blocks.filter(function(b) { return b.type === 'exercise' || b.type === 'cardio'; });
  if (exBlocks2.length > 0) {
    var tplRow = h('div', {
      style: 'border:1px solid var(--border,#D8D8D0);padding:12px 14px;margin-bottom:12px;display:flex;align-items:center;gap:10px;background:var(--ivory,#FAF9F6);'
    });
    var tplInp = h('input', {
      type: 'text', placeholder: 'Nom du template…',
      value: draft.title || '',
      style: 'flex:1;padding:8px;border:1px solid var(--border);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;background:var(--ivory);min-width:0;',
      onclick: function(e) { e.stopPropagation(); }
    });
    tplRow.appendChild(tplInp);
    tplRow.appendChild(h('button', {
      style: 'flex-shrink:0;padding:8px 14px;background:var(--green,#3E5C3A);color:#fff;border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;white-space:nowrap;',
      onclick: function() {
        var name = tplInp.value.trim() || draft.title;
        if (!name) { tplInp.focus(); return; }
        window.CUSTOM_SESSION.saveAsTemplate(name);
        if (window.showToast) window.showToast('Template « ' + name + ' » sauvegardé.', 'success', 2500);
        if (window.render) window.render();
      }
    }, 'Sauvegarder'));
    container.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:6px;'
    }, 'Refaire cette séance plus tard'));
    container.appendChild(tplRow);
  }

  container.appendChild(h('button', {
    style: 'display:block;width:100%;padding:16px;background:var(--ink-900,#0A0A09);color:var(--paper,#FAF9F6);border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;min-height:52px;',
    onclick: function() {
      window.CUSTOM_SESSION.clearDraft();
      var S2 = window.S;
      S2._csQuery = '';
      S2._csSkipMuscleSelect = false;
      S2._csSelectedGroups = [];
      S2.sStep = 0;
      S2.view = 'today';
      if (window.render) window.render();
    }
  }, '← Retour au tableau de bord'));

  container.appendChild(h('button', {
    style: 'display:block;width:100%;padding:11px;margin-top:8px;background:transparent;border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;color:var(--black,#0A0A09);',
    onclick: function() {
      window.CUSTOM_SESSION.clearDraft();
      var S3 = window.S;
      S3._csQuery = '';
      S3._csSkipMuscleSelect = false;
      S3._csSelectedGroups = [];
      window.CUSTOM_SESSION.ensureDraft();
      if (window.render) window.render();
    }
  }, '+ Nouvelle séance libre'));
}

// ─────────────────────────────────────────────
//  ÉTAPE 10a : bloc en mode BUILD
// ─────────────────────────────────────────────
function _csRenderDraftBlock(block) {
  var h = window.h;
  var S = window.S;
  var wrap = h('div', { style: 'border:1px solid var(--border,#D8D8D0);background:var(--ivory,#FAF9F6);margin-bottom:10px;border-radius:2px;overflow:hidden;' });

  if (block.type === 'exercise') {
    // ── header ──
    var hRow = h('div', { style: 'display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border-bottom:1px solid var(--border,#D8D8D0);background:var(--ivory2,#F4F4F0);' });
    var lft = h('div', { style: 'flex:1;min-width:0;' });
    lft.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:13px;color:var(--black,#0A0A09);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' }, block.n));
    lft.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);margin-top:2px;' }, (block.m || '') + (block.eq ? ' · ' + block.eq : '')));
    hRow.appendChild(lft);
    hRow.appendChild(h('button', {
      style: 'background:none;border:none;cursor:pointer;font-size:18px;color:var(--grey,#6B6B65);padding:4px 8px;min-width:36px;min-height:36px;',
      onclick: (function(bid) { return function() { window.CUSTOM_SESSION.removeBlock(bid); if (window.render) window.render(); }; })(block.id)
    }, '×'));
    wrap.appendChild(hRow);

    // ── contrôles séries/reps ──
    var cfgRow = h('div', { style: 'padding:10px 12px;display:flex;flex-wrap:wrap;gap:14px;align-items:center;' });
    cfgRow.appendChild(_csNumCtrl('Séries', parseInt(block.sets) || 4, 1, 10, 1,
      function(v) { block.sets = v; window.CUSTOM_SESSION.saveDraft(); if (window.render) window.render(); }));
    cfgRow.appendChild(_csNumCtrl('Reps', parseInt(block.reps) || 10, 1, 50, 1,
      function(v) { block.reps = v; window.CUSTOM_SESSION.saveDraft(); if (window.render) window.render(); }));
    wrap.appendChild(cfgRow);

    // ── sélecteur temps de repos ──
    var restRow = h('div', { style: 'padding:7px 12px;border-top:1px solid var(--border,#D8D8D0);display:flex;align-items:center;gap:8px;flex-wrap:wrap;' });
    restRow.appendChild(h('span', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);flex-shrink:0;'
    }, 'Repos'));
    var restPresets = [
      { label: '1\'',    val: '60s'  },
      { label: '1\'30', val: '90s'  },
      { label: '2\'',   val: '120s' },
      { label: '3\'',   val: '180s' }
    ];
    restPresets.forEach(function(p) {
      var isSel = (block.rest === p.val);
      restRow.appendChild(h('button', {
        style: 'padding:5px 10px;min-height:30px;border:1px solid ' + (isSel ? 'var(--ink-900,#0A0A09)' : 'var(--border,#D8D8D0)') + ';background:' + (isSel ? 'var(--ink-900,#0A0A09)' : 'transparent') + ';color:' + (isSel ? 'var(--paper,#FAF9F6)' : 'var(--ink-500,#6B6B65)') + ';font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;cursor:pointer;border-radius:2px;',
        onclick: (function(pVal) { return function() {
          block.rest = pVal;
          window.CUSTOM_SESSION.saveDraft();
          if (window.render) window.render();
        }; })(p.val)
      }, p.label));
    });
    wrap.appendChild(restRow);

    // ── suggestion de poids ──
    var sugW = null;
    try {
      // 1. historique récent
      var today0 = new Date().toISOString().slice(0, 10);
      var log0 = (S.muscuSessionLog) || {};
      var dates0 = Object.keys(log0).filter(function(d){ return d < today0; }).sort().reverse();
      for (var di = 0; di < Math.min(dates0.length, 14) && !sugW; di++) {
        var dl = log0[dates0[di]];
        if (dl && dl[block.n] && Array.isArray(dl[block.n])) {
          var valid0 = dl[block.n].filter(function(s){ return s.actualWeight && s.actualWeight > 0; });
          if (valid0.length) sugW = valid0[0].actualWeight;
        }
      }
      // 2. getSuggestedWeight (exporté par app-sport.js)
      if (!sugW && typeof window.getSuggestedWeight === 'function') {
        sugW = window.getSuggestedWeight(block.n, parseInt(block.reps) || 10, null);
      }
    } catch(e) {}

    if (sugW && sugW > 0) {
      var sugRow = h('div', {
        style: 'padding:7px 12px;border-top:1px solid var(--border,#D8D8D0);display:flex;align-items:center;justify-content:space-between;background:rgba(62,92,58,0.04);'
      });
      sugRow.appendChild(h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--green,#3E5C3A);'
      }, 'Suggestion : ' + sugW + ' kg'));
      sugRow.appendChild(h('button', {
        style: 'background:var(--green,#3E5C3A);color:#fff;border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;padding:4px 10px;cursor:pointer;border-radius:2px;',
        onclick: (function(b, sw) { return function() { b.targetWeight = sw; window.CUSTOM_SESSION.saveDraft(); if (window.render) window.render(); }; })(block, sugW)
      }, 'Utiliser ' + sugW + ' kg'));
      wrap.appendChild(sugRow);
    }

    // ── charge cible ──
    var wtRow = h('div', { style: 'padding:9px 12px;border-top:1px solid var(--border,#D8D8D0);display:flex;align-items:center;gap:8px;' });
    wtRow.appendChild(h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);min-width:80px;' }, 'Charge cible'));
    var wInp = h('input', {
      type: 'number', step: '0.5', min: '0', max: '500', inputmode: 'decimal',
      value: block.targetWeight != null ? String(block.targetWeight) : '',
      placeholder: 'kg',
      style: 'width:68px;padding:8px;border:1px solid var(--border);border-radius:2px;font-family:Georgia;font-size:16px;text-align:center;background:var(--ivory);-webkit-appearance:none;',
      onclick: function(e) { e.stopPropagation(); },
      onchange: (function(b) { return function(e) { var v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0) { b.targetWeight = v; window.CUSTOM_SESSION.saveDraft(); } }; })(block)
    });
    var wMinus = h('button', {
      style: 'min-width:36px;min-height:36px;background:transparent;border:1px solid var(--border);border-radius:2px;font-size:16px;cursor:pointer;',
      onclick: (function(b2, inp) { return function(e) { e.stopPropagation(); var nv = Math.max(0, Math.round((( parseFloat(inp.value) || 0) - 2.5) * 2) / 2); inp.value = String(nv); b2.targetWeight = nv; window.CUSTOM_SESSION.saveDraft(); }; })(block, wInp)
    }, '−');
    var wPlus = h('button', {
      style: 'min-width:36px;min-height:36px;background:transparent;border:1px solid var(--border);border-radius:2px;font-size:16px;cursor:pointer;',
      onclick: (function(b3, inp) { return function(e) { e.stopPropagation(); var nv = Math.round(((parseFloat(inp.value) || 0) + 2.5) * 2) / 2; inp.value = String(nv); b3.targetWeight = nv; window.CUSTOM_SESSION.saveDraft(); }; })(block, wInp)
    }, '+');
    wtRow.appendChild(wMinus);
    wtRow.appendChild(wInp);
    wtRow.appendChild(wPlus);
    wtRow.appendChild(h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);' }, 'kg'));
    wrap.appendChild(wtRow);

  } else if (block.type === 'cardio') {
    var chRow = h('div', { style: 'display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border-bottom:1px solid var(--border,#D8D8D0);background:var(--ivory2,#F4F4F0);' });
    var clft = h('div', {});
    clft.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:13px;color:var(--black,#0A0A09);' }, block.label || block.subtype));
    clft.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);margin-top:2px;' }, 'Cardio'));
    chRow.appendChild(clft);
    chRow.appendChild(h('button', {
      style: 'background:none;border:none;cursor:pointer;font-size:18px;color:var(--grey,#6B6B65);padding:4px 8px;min-width:36px;min-height:36px;',
      onclick: (function(bid2) { return function() { window.CUSTOM_SESSION.removeBlock(bid2); if (window.render) window.render(); }; })(block.id)
    }, '×'));
    wrap.appendChild(chRow);

    var ccfgRow = h('div', { style: 'padding:10px 12px;display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start;' });
    ccfgRow.appendChild(_csNumCtrl('Durée (min)', block.duration || 20, 1, 120, 5,
      function(v) { block.duration = v; window.CUSTOM_SESSION.saveDraft(); if (window.render) window.render(); }));
    if (block.subtype === 'tapis' || block.subtype === 'velo') {
      ccfgRow.appendChild(_csNumCtrl('Vitesse (km/h)', block.speed || 6, 1, 30, 0.5,
        function(v) { block.speed = v; window.CUSTOM_SESSION.saveDraft(); if (window.render) window.render(); }));
    }
    if (block.subtype === 'tapis') {
      ccfgRow.appendChild(_csNumCtrl('Inclinaison (%)', block.incline || 0, 0, 30, 1,
        function(v) { block.incline = v; window.CUSTOM_SESSION.saveDraft(); if (window.render) window.render(); }));
    }
    wrap.appendChild(ccfgRow);
  }

  return wrap;
}

// ─────────────────────────────────────────────
//  ÉTAPE 10b : bloc exercice en mode ACTIVE
// ─────────────────────────────────────────────
function _csRenderActiveExBlock(block) {
  var h = window.h;
  if (!block || !Array.isArray(block.loggedSets)) {
    var empty = h('div', { style: 'border:1px solid var(--border,#D8D8D0);margin-bottom:12px;padding:10px 12px;background:var(--ivory,#FAF9F6);border-radius:2px;' });
    empty.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:13px;' }, block && block.n || 'Exercice'));
    return empty;
  }
  var validCnt = block.loggedSets.filter(function(s) { return s.validated; }).length;
  var allDone = validCnt === block.loggedSets.length;

  var wrap = h('div', { style: 'border:1px solid var(--border,#D8D8D0);margin-bottom:12px;background:var(--ivory,#FAF9F6);border-radius:2px;overflow:hidden;' });

  var hdr2 = h('div', {
    style: 'padding:9px 12px;border-bottom:1px solid var(--border,#D8D8D0);display:flex;align-items:center;justify-content:space-between;background:' + (allDone ? 'rgba(62,92,58,0.06)' : 'var(--ivory2,#F4F4F0)') + ';'
  });
  hdr2.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:13px;color:var(--black,#0A0A09);' }, block.n));
  hdr2.appendChild(allDone
    ? h('span', { style: 'color:var(--green,#3E5C3A);font-size:16px;' }, '✓')
    : h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);' }, validCnt + '/' + block.loggedSets.length));
  wrap.appendChild(hdr2);

  if (block.targetWeight && block.targetWeight > 0) {
    wrap.appendChild(h('div', {
      style: 'padding:5px 12px;background:rgba(62,92,58,0.05);border-bottom:1px solid var(--border,#D8D8D0);font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--green,#3E5C3A);'
    }, 'Charge cible : ' + block.targetWeight + ' kg'));
  }

  // Référence dernière session (dates pré-calculées par _csRenderActive)
  var _lref = (function() {
    var log = ((window.S && window.S.muscuSessionLog) || {});
    var dates = (window.S && window.S._csActiveDates) ||
      Object.keys(log).filter(function(d) { return d < new Date().toISOString().slice(0, 10); }).sort().reverse();
    for (var i = 0; i < Math.min(dates.length, 14); i++) {
      var day = log[dates[i]];
      if (!day || !day[block.n] || !Array.isArray(day[block.n])) continue;
      var validSets = day[block.n].filter(function(s) { return s.validated && s.actualWeight; });
      if (!validSets.length) continue;
      var maxW = validSets.reduce(function(m, s) { return Math.max(m, s.actualWeight || 0); }, 0);
      var avgR = Math.round(validSets.reduce(function(sum, s) { return sum + (s.actualReps || 0); }, 0) / validSets.length);
      var ago = Math.round((Date.now() - new Date(dates[i]).getTime()) / 86400000);
      return { weight: maxW, sets: validSets.length, reps: avgR, days: ago };
    }
    return null;
  })();
  if (_lref) {
    var refRow = window.h('div', {
      style: 'padding:5px 12px;background:rgba(10,10,9,0.03);border-bottom:1px solid var(--border,#D8D8D0);font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);display:flex;justify-content:space-between;'
    });
    refRow.appendChild(window.h('span', {}, 'Réf. (' + (_lref.days === 1 ? 'hier' : 'il y a ' + _lref.days + 'j') + ')'));
    refRow.appendChild(window.h('span', { style: 'font-family:Georgia,serif;' },
      _lref.weight + ' kg · ' + _lref.sets + '×' + _lref.reps + ' reps'));
    wrap.appendChild(refRow);
  }

  var setsWrap = h('div', { style: 'padding:6px 12px;' });
  block.loggedSets.forEach(function(s, si) {
    setsWrap.appendChild(_csRenderActiveSet(block, s, si));
  });
  wrap.appendChild(setsWrap);
  return wrap;
}

// ─────────────────────────────────────────────
//  ÉTAPE 10c : une série en mode ACTIVE
// ─────────────────────────────────────────────
function _csRenderActiveSet(block, set, si) {
  var h = window.h;
  var row = h('div', {
    style: 'display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border,#D8D8D0);' + (set.validated ? 'opacity:0.65;' : '')
  });

  // badge numéro / check
  row.appendChild(h('div', {
    style: 'min-width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;flex-shrink:0;' +
      (set.validated ? 'background:var(--green,#3E5C3A);color:#fff;' : 'background:var(--border,#D8D8D0);color:var(--black,#0A0A09);')
  }, set.validated ? '✓' : String(si + 1)));

  var wInp2 = h('input', {
    type: 'number', step: '0.5', min: '0', max: '500', inputmode: 'decimal',
    value: (set.weight !== null && set.weight !== undefined && set.weight !== '') ? String(set.weight) : (block.targetWeight != null ? String(block.targetWeight) : ''),
    placeholder: 'kg',
    disabled: set.validated,
    style: 'width:62px;padding:8px;border:1px solid var(--border);border-radius:2px;font-family:Georgia;font-size:14px;text-align:center;background:var(--ivory);-webkit-appearance:none;',
    onclick: function(e) { e.stopPropagation(); },
    oninput: (function(s2) { return function(e) { s2.weight = e.target.value; }; })(set)
  });
  row.appendChild(wInp2);
  row.appendChild(h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);' }, 'kg'));

  var rInp2 = h('input', {
    type: 'number', min: '0', max: '100', inputmode: 'numeric',
    value: (set.reps !== null && set.reps !== undefined && set.reps !== '') ? String(set.reps) : (block.reps ? String(block.reps) : ''),
    placeholder: 'reps',
    disabled: set.validated,
    style: 'width:52px;padding:8px;border:1px solid var(--border);border-radius:2px;font-family:Georgia;font-size:14px;text-align:center;background:var(--ivory);-webkit-appearance:none;',
    onclick: function(e) { e.stopPropagation(); },
    oninput: (function(s3) { return function(e) { s3.reps = e.target.value; }; })(set)
  });
  row.appendChild(rInp2);
  row.appendChild(h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);' }, 'reps'));

  row.appendChild(h('button', {
    style: 'flex-shrink:0;padding:7px 11px;min-width:54px;min-height:34px;border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:1px;cursor:pointer;' +
      (set.validated ? 'background:var(--green,#3E5C3A);color:#fff;' : 'background:var(--black,#0A0A09);color:var(--paper,#FAF9F6);'),
    onclick: (function(bid, idx, wI, rI) { return function() {
      var draft2 = window.CUSTOM_SESSION.ensureDraft();
      var blk = null;
      for (var x = 0; x < draft2.blocks.length; x++) { if (draft2.blocks[x].id === bid) { blk = draft2.blocks[x]; break; } }
      if (blk && blk.loggedSets && blk.loggedSets[idx]) {
        blk.loggedSets[idx].weight = parseFloat(wI.value) || null;
        blk.loggedSets[idx].reps   = parseInt(rI.value)   || null;
      }
      window.CUSTOM_SESSION.validateSet(bid, idx);
      // Timer de repos
      if (blk && window.RestTimer && typeof window.RestTimer.start === 'function') {
        var allDone3 = draft2.blocks.every(function(b3) {
          return b3.type !== 'exercise' || !Array.isArray(b3.loggedSets) ||
            b3.loggedSets.every(function(s3) { return s3.validated; });
        });
        if (!allDone3) {
          var restSec = (typeof window.parseRestTime === 'function' && blk.rest)
            ? window.parseRestTime(blk.rest) : 90;
          window.RestTimer.start(restSec, blk.n, idx + 1);
        }
      }
      if (window.render) window.render();
    }; })(block.id, si, wInp2, rInp2)
  }, set.validated ? '✓ OK' : 'Valider'));

  return row;
}

// ─────────────────────────────────────────────
//  ÉTAPE 10d : bloc cardio en mode ACTIVE
// ─────────────────────────────────────────────
function _csRenderActiveCardioBlock(block) {
  var h = window.h;
  var wrap = h('div', { style: 'border:1px solid var(--border,#D8D8D0);margin-bottom:12px;background:var(--ivory,#FAF9F6);border-radius:2px;overflow:hidden;' });
  wrap.appendChild(h('div', {
    style: 'padding:9px 12px;border-bottom:1px solid var(--border,#D8D8D0);background:rgba(62,92,58,0.03);'
  }, (function() {
    var d = window.h;
    var div = d('div', {});
    div.appendChild(d('div', { style: 'font-family:Georgia,serif;font-size:13px;color:var(--black,#0A0A09);' }, block.label || 'Cardio'));
    div.appendChild(d('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);margin-top:2px;' },
      (block.duration || 0) + ' min' + (block.speed ? ' · ' + block.speed + ' km/h' : '') + (block.incline ? ' · ' + block.incline + '%' : '')));
    return div;
  })()));
  var weight2 = (window.S && window.S.weight) ? parseFloat(window.S.weight) : 70;
  var metMap = { tapis: 7, velo: 6, rameur: 8, elliptique: 5.5, corde: 10 };
  var met2 = metMap[block.subtype] || 6;
  var kcalEst = Math.round((met2 * weight2 * 3.5 / 200) * (block.duration || 20));
  wrap.appendChild(h('div', {
    style: 'padding:8px 12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);'
  }, '≈ ' + kcalEst + ' kcal estimées'));
  return wrap;
}

// ─────────────────────────────────────────────
//  ÉTAPE 10e : helpers addExercise + addCardio
// ─────────────────────────────────────────────
function _csAddExercise(ex) {
  var parts = String(ex.sets || '4×10').split('×');
  var setsN = parseInt(parts[0]) || 4;
  var repsN = parts.length > 1 ? parts[1].trim() : '10';
  window.CUSTOM_SESSION.addBlock({
    type: 'exercise',
    n: ex.n, m: ex.m || '', eq: ex.eq || '',
    sets: setsN, reps: repsN, rest: ex.rest || '90s',
    targetWeight: null, loggedSets: []
  });
}

function _csAddCardio(subtype, label) {
  window.CUSTOM_SESSION.addBlock({
    type:     'cardio',
    subtype:  subtype,
    label:    label,
    duration: 20,
    speed:    (subtype === 'tapis') ? 6 : (subtype === 'velo') ? 20 : null,
    incline:  (subtype === 'tapis') ? 0 : null
  });
}

// ─────────────────────────────────────────────
//  ÉTAPE 10f : stepper numérique générique
// ─────────────────────────────────────────────
function _csNumCtrl(label, value, min, max, step, onChange) {
  var h = window.h;
  var cur = (typeof value === 'number') ? value : (parseFloat(value) || min);
  var wrap = h('div', { style: 'display:flex;flex-direction:column;align-items:center;gap:4px;' });
  wrap.appendChild(h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);'
  }, label));
  var ctrl = h('div', { style: 'display:flex;align-items:center;gap:4px;' });
  var disp = h('div', { style: 'min-width:40px;text-align:center;font-family:Georgia,serif;font-size:15px;' }, String(cur));
  ctrl.appendChild(h('button', {
    style: 'width:32px;height:32px;background:transparent;border:1px solid var(--border);border-radius:2px;font-size:16px;cursor:pointer;',
    onclick: function() {
      cur = Math.max(min, Math.round((cur - step) * 1000) / 1000);
      disp.textContent = String(cur);
      onChange(cur);
    }
  }, '−'));
  ctrl.appendChild(disp);
  ctrl.appendChild(h('button', {
    style: 'width:32px;height:32px;background:transparent;border:1px solid var(--border);border-radius:2px;font-size:16px;cursor:pointer;',
    onclick: function() {
      cur = Math.min(max, Math.round((cur + step) * 1000) / 1000);
      disp.textContent = String(cur);
      onChange(cur);
    }
  }, '+'));
  wrap.appendChild(ctrl);
  return wrap;
}

})();



