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

    function byScore(a, b) {
      // 1. Score textuel décroissant (pertinence de la recherche)
      if (b.score !== a.score) return b.score - a.score;
      // 2. Non-bodyweight avant bodyweight (poids du corps en dernier)
      var isBW = window.isBodyweightExercise || function(ex) {
        return /^(poids du corps|bodyweight|aucun|none)$/i.test(ex.eq || '');
      };
      var abw = isBW(a.item) ? 1 : 0, bbw = isBW(b.item) ? 1 : 0;
      if (abw !== bbw) return abw - bbw;
      // 3. Score équipement croissant : barre(1) > haltères(2) > câble(3) > autre(4) > machine(5)
      var aeq = _csEqScore(a.item.eq), beq = _csEqScore(b.item.eq);
      if (aeq !== beq) return aeq - beq;
      // 4. Tri alphabétique en dernier recours
      return a._alpha.localeCompare(b._alpha);
    }
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
    var _en = window.isEnglish && window.isEnglish();
    return {
      id:        'custom-' + now.toISOString().slice(0, 10),
      title:     _en ? ('Workout ' + mm + '/' + dd) : ('Séance du ' + dd + '/' + mm),
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
      if (window.showToast) window.showToast((window.isEnglish && window.isEnglish()) ? 'Storage full — draft not saved.' : 'Stockage plein — brouillon non sauvegardé.', 'error', 3000);
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
    var removedIdx = -1, removedBlock = null;
    for (var i = 0; i < draft.blocks.length; i++) {
      if (draft.blocks[i].id === blockId) {
        removedIdx = i;
        removedBlock = JSON.parse(JSON.stringify(draft.blocks[i]));
        break;
      }
    }
    draft.blocks = draft.blocks.filter(function(b) { return b.id !== blockId; });
    this.saveDraft();
    if (removedBlock !== null) _csShowUndo(removedIdx, removedBlock);
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

  _getBestWeightForExercise: function(block) {
    if (block.targetWeight != null && parseFloat(block.targetWeight) > 0) return block.targetWeight;
    var S = window.S;
    if (S && S.muscuSessionLog && block.n) {
      var today = new Date().toISOString().slice(0, 10);
      var log = S.muscuSessionLog || {};
      var dates = Object.keys(log).filter(function(d) { return d < today; }).sort().reverse().slice(0, 14);
      var maxWeight = null;
      for (var i = 0; i < dates.length; i++) {
        var dayLog = log[dates[i]];
        if (dayLog && dayLog[block.n] && Array.isArray(dayLog[block.n])) {
          var validSets = dayLog[block.n].filter(function(s) { return s.actualWeight && parseFloat(s.actualWeight) > 0; });
          if (validSets.length > 0) {
            var dayMax = Math.max.apply(null, validSets.map(function(s) { return parseFloat(s.actualWeight) || 0; }));
            if (dayMax > 0) maxWeight = maxWeight === null ? dayMax : Math.max(maxWeight, dayMax);
          }
        }
      }
      if (maxWeight !== null && maxWeight > 0) return maxWeight;
    }
    return null;
  },

  startSession: function() {
    var self = this;
    var draft = this.ensureDraft();
    draft.startTime = Date.now();
    draft.view = 'active';
    draft.blocks.forEach(function(b) {
      if (b.type !== 'exercise') return;
      if (!Array.isArray(b.loggedSets)) b.loggedSets = [];
      var targetSets = parseInt(b.sets) || 4;
      var bestWeight = self._getBestWeightForExercise(b);
      while (b.loggedSets.length < targetSets) {
        b.loggedSets.push({
          weight: bestWeight != null ? bestWeight : '',
          reps: (function() {
            var r = b.reps;
            if (r === undefined || r === null || r === '') return '';
            var str = String(r);
            // "8-12" ou "10-15" → borne inférieure (input type=number refuse les plages)
            var range = str.match(/^(\d+)\s*[-–]\s*\d+$/);
            return range ? range[1] : str;
          })(),
          validated: false
        });
      }
      b.loggedSets = b.loggedSets.slice(0, targetSets);
      // Generate warm-up sets for heavy exercises (≥ 40 kg)
      var bwNum = bestWeight ? parseFloat(bestWeight) : 0;
      b.warmupSets = bwNum >= 40 ? _csGenerateWarmup(bwNum) : [];
      // Reset RPE for this session
      b._rpe = 0;
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

    // Auto 1RM update in muscuStrengthProfile from best set per exercise
    if (!S.muscuStrengthProfile) S.muscuStrengthProfile = {};
    draft.blocks.forEach(function(b5) {
      if (b5.type !== 'exercise' || !Array.isArray(b5.loggedSets)) return;
      var vs5 = b5.loggedSets.filter(function(s5) { return s5.validated && parseFloat(s5.weight) > 0 && parseInt(s5.reps) > 0; });
      if (!vs5.length) return;
      var best1RM = 0, bestW5 = 0, bestR5 = 0;
      vs5.forEach(function(s5) {
        var est = _csEstimate1RM(s5.weight, s5.reps);
        if (est > best1RM) { best1RM = est; bestW5 = parseFloat(s5.weight); bestR5 = parseInt(s5.reps); }
      });
      if (best1RM > 0) {
        var key5 = (b5.n || '').toLowerCase()
          .replace(/[éèê]/g,'e').replace(/[àâ]/g,'a').replace(/[ôö]/g,'o').replace(/ç/g,'c').replace(/[ùûü]/g,'u')
          .replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
        var existing1RM = parseFloat(S.muscuStrengthProfile[key5 + '_1rm']) || 0;
        if (best1RM > existing1RM) {
          S.muscuStrengthProfile[key5]          = bestW5;
          S.muscuStrengthProfile[key5 + '_reps'] = bestR5;
          S.muscuStrengthProfile[key5 + '_1rm']  = best1RM;
        }
      }
    });
    try { localStorage.setItem('mtd_muscu_strength_' + this._uid(), JSON.stringify(S.muscuStrengthProfile)); } catch(e3) {}

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

    // SFCSymbiosis — nutrition bridge (CRITICAL)
    // Met à jour trainingLoad + sportProgramStart depuis la séance libre
    // Ajustement RPE : avg RPE ≥ 7 → heavy, ≤ 4 → light
    if (window.SFCSymbiosis && window.S) {
      var _symEx = (draft._engineExercises && draft._engineExercises.length)
        ? draft._engineExercises
        : draft.blocks.filter(function(b){ return b.type === 'exercise'; })
            .map(function(b){ return { n: b.n, tags: b.tags || [], m: b.m || '' }; });
      var _symGrps = draft._groups || [];
      window.SFCSymbiosis.notifySession(_symEx, _symGrps);
      // Affiner le load selon RPE collecté pendant la séance
      var _rpeBlocks = draft.blocks.filter(function(b){ return b.type === 'exercise' && b._rpe > 0; });
      if (_rpeBlocks.length > 0) {
        var _avgRpe = _rpeBlocks.reduce(function(sum, b){ return sum + (b._rpe || 0); }, 0) / _rpeBlocks.length;
        if (_avgRpe >= 7) window.S.trainingLoad = 'heavy';
        else if (_avgRpe <= 4) window.S.trainingLoad = 'light';
      }
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
    var weight = (window.S && window.S.weight) ? (parseFloat(window.S.weight) || 70) : 70;
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
  { key: 'abs',       label: 'Abdos',     keywords: ['abdominaux', 'abdo', 'transverse', 'oblique', 'grand droit'] },
  { key: 'arms',      label: 'Bras',      keywords: ['biceps', 'triceps', 'avant-bras', 'brachialis', 'brachial'] },
  { key: 'cardio',    label: 'Cardio',    keywords: [] }
];

// ─────────────────────────────────────────────
//  Famille de mouvement — déduplication
// ─────────────────────────────────────────────
function _csFamilyKey(name, normFn) {
  var n = normFn ? normFn(name) : (name || '').toLowerCase();
  // Tirages verticaux (poulie / machine)
  if (/tirage.vertical|lat.pull|pulldown/.test(n))                        return 'tirage_vertical';
  // Tractions (barre / poids du corps)
  if (/traction|chin.?up|pull.?up/.test(n))                               return 'traction';
  // Tirages horizontaux — rowing
  if (/rowing|row\b/.test(n))                                              return 'horizontal_pull';
  // Développé plat (avec banc — pas floor press)
  if (/developpe.couche|chest.press|pec.press|bench.press/.test(n))       return 'developpe_plat';
  // Développé incliné
  if (/developpe.inclin|incline.press|incline.halt/.test(n))              return 'developpe_incline';
  // Développé décliné
  if (/developpe.decline|decline.press/.test(n))                          return 'developpe_decline';
  // Autres développés / floor press / presse pec
  if (/developpe|floor.press|presse.pec/.test(n))                         return 'press_autre';
  // Hip thrust / glute bridge
  if (/hip.thrust|glute.bridge|banded.hip/.test(n))                       return 'hip_thrust';
  // Pompes
  if (/pompe|push.?up/.test(n))                                            return 'pompes';
  // Dips
  if (/dips?/.test(n))                                                     return 'dips';
  // Écarté / fly
  if (/ecarte|fly\b|flye|crossover|pec.deck|butterfly/.test(n))           return 'ecarte';
  // Curl biceps
  if (/curl/.test(n))                                                      return 'curl';
  // Extensions triceps
  if (/extension.triceps|tricep.extension|pushdown|barre.fron|skull/.test(n)) return 'tricep_ext';
  // Squat
  if (/squat/.test(n))                                                     return 'squat';
  // Fentes / lunges
  if (/fente|lunge/.test(n))                                               return 'fente';
  // Soulevé de terre / deadlift / RDL
  if (/souleve|deadlift|rdl/.test(n))                                      return 'deadlift';
  // Leg press / presse cuisses
  if (/leg.press|presse.a.cuisse|hack.squat/.test(n))                     return 'leg_press';
  // Leg curl
  if (/leg.curl|ischios/.test(n))                                          return 'leg_curl';
  // Développé militaire / OHP
  if (/militaire|shoulder.press|press.strict|strict.press|arnold/.test(n)) return 'ohp';
  // Élévations latérales
  if (/elevation.later|lateral.raise/.test(n))                             return 'lateral_raise';
  // Arrière épaule / face pull / rear delt
  if (/face.pull|rear.delt|oiseau|elevation.poster|inverse/.test(n))      return 'rear_delt';
  // Mollets
  if (/calf.raise|mollet/.test(n))                                         return 'calf';
  // Gainage / planche
  if (/planche|gainage|hollow|dead.bug|bird.?dog/.test(n))                return 'planche';
  // Crunch / abdominaux
  if (/crunch|abdos|relevé.de.genoux|relevé.de.jamb/.test(n))            return 'crunch';
  // Rotation
  if (/russian.twist|woodchop|rotation|pallof/.test(n))                   return 'rotation';
  // Fallback : premier mot significatif
  return (n.replace(/[^a-z ]/g, '').trim().split(/\s+/)[0]) || n;
}

// Score d'équipement : barre > haltères > câble > autre > machine
// machine est testé EN PREMIER pour éviter "T-bar machine + barre" → barre score
function _csEqScore(eq) {
  var e = (eq || '').toLowerCase()
    .replace(/[éèê]/g, 'e').replace(/[àâ]/g, 'a').replace(/[ôö]/g, 'o').replace(/ç/g, 'c');
  if (/machine/.test(e))  return 5;   // machine guidée (priorité test la plus haute pour éviter faux positif barre)
  if (/cable|poulie/.test(e)) return 3; // câble / poulie
  if (/\bbarre\b|trap[-. ]?bar|t[-. ]?bar|landmine|hex[-. ]?bar|barbell|ez[-. ]?bar/.test(e)) return 1; // barre + variantes
  if (/haltere/.test(e))  return 2;   // haltères
  return 4;                            // autre équipement (anneaux, élastique, barres parallèles…)
}

// Détection d'exercice au poids du corps (regex élargie pour couvrir les variantes hybrides)
if (!window.isBodyweightExercise) {
  window.isBodyweightExercise = function(ex) {
    var eq = (ex.eq || '').toLowerCase();
    return /poids.du.corps|bodyweight|aucun|none|anneaux|gymnast|traction.pure|pull.?up|chin.?up|dips?|push.?up/.test(eq);
  };
}

// Ordre préféré de familles par groupe musculaire
// Assure un programme équilibré quelle que soit la base d'exercices
var _CS_GROUP_FAMILIES = {
  'glutes':    ['hip_thrust', 'deadlift', 'squat', 'lateral_raise'],
  'back':      ['horizontal_pull', 'tirage_vertical', 'traction', 'rear_delt'],
  'chest':     ['developpe_plat', 'developpe_incline', 'ecarte', 'dips'],
  'legs':      ['squat', 'deadlift', 'leg_press', 'leg_curl'],
  'shoulders': ['ohp', 'lateral_raise', 'rear_delt', 'horizontal_pull'],
  'abs':       ['planche', 'crunch', 'rotation', 'leg_curl'],
  'arms':      ['curl', 'tricep_ext', 'dips', 'traction']
};

// ─────────────────────────────────────────────
//  Helpers profil → cfg sfcBuildMuscuDay
// ─────────────────────────────────────────────

// Build medRx array from S.medical — même logique que app-sport.js
function _csBuildMedRx(S) {
  var rx = [];
  if (!Array.isArray(S.medical) || !S.medical.length) return rx;
  var mL = S.medical.map(function(m){ return String(m).toLowerCase(); });
  if (mL.indexOf('osteoporose') !== -1 || mL.indexOf('osteoporosis') !== -1)
    rx.push(/squat\s+barre|back\s+squat|front\s+squat|soulev[eé]\s+de\s+terre|deadlift|romanian|good\s+morning|crunch|sit.?up|ab\s+wheel|jefferson|hyperextension|box\s+jump|jump\s+squat|burpee|corde|jumping\s+jacks|\bpower\s+clean\b|\bclean\b|\bsnatch\b|arrach[eé]|[eé]paul[eé]|hang\s+clean|hack\s+squat|zercher/i);
  if (mL.indexOf('hypertension') !== -1 || mL.indexOf('hta') !== -1 || mL.indexOf('hta_severe') !== -1)
    rx.push(/soulev[eé]\s+de\s+terre|deadlift|squat\s+barre|back\s+squat|front\s+squat|d[eé]velopp[eé]\s+militaire\s+barre|d[eé]velopp[eé]\s+couch[eé]\s+barre|bench\s+press\s+(?:barre|barbell)|behind.?neck|derri[eè]re\s+nuque|\bsnatch\b|arrach[eé]|clean|[eé]paul[eé]|jerk|thruster|l.?sit|dragon\s+flag|windshield|hack\s+squat/i);
  if (mL.indexOf('cardio') !== -1 || mL.indexOf('insuffisance_card') !== -1)
    rx.push(/soulev[eé]\s+de\s+terre|deadlift|squat\s+barre\s+lourd|\bsnatch\b|\bclean\b|burpee|box\s+jump|hiit/i);
  if (mL.indexOf('polyarthrite') !== -1 || mL.indexOf('rheumatoid') !== -1 || mL.indexOf('arthrite') !== -1)
    rx.push(/soulev[eé]\s+de\s+terre|deadlift|arrach[eé]|snatch|clean|jump\s+squat|box\s+jump|burpee|squat\s+barre/i);
  if (mL.indexOf('fibromyalgie') !== -1)
    rx.push(/soulev[eé]\s+de\s+terre|deadlift|squat\s+barre|burpee|box\s+jump|jump\s+squat|pompes\s+plyo/i);
  if (mL.indexOf('irc') !== -1)
    rx.push(/soulev[eé]\s+de\s+terre|deadlift|squat\s+barre|back\s+squat|front\s+squat|\bsnatch\b|arrach[eé]|\bclean\b|[eé]paul[eé]|jerk|thruster|burpee|box\s+jump|jump\s+squat/i);
  return rx;
}

// Groupes musculaires travaillés dans les N derniers jours (via muscuSessionLog)
// Retourne { groupKey: daysAgo } — daysAgo = 1 signifie hier
function _csGetRecentGroups() {
  var S = window.S;
  if (!S || !S.muscuSessionLog) return {};
  window.EXERCISE_SEARCH._buildDB();
  var db = window.EXERCISE_SEARCH._DB || [];
  var norm = function(s) { return window.EXERCISE_SEARCH._normalize(s); };
  var nameToGroup = {};
  db.forEach(function(ex) { nameToGroup[norm(ex.n)] = ex.group; });

  var recent = {};
  var log = S.muscuSessionLog;
  for (var d = 1; d <= 5; d++) {
    var dt = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
    var dayLog = log[dt];
    if (!dayLog) continue;
    Object.keys(dayLog).forEach(function(exName) {
      var grp = nameToGroup[norm(exName)];
      if (!grp) return;
      var csKey = (grp === 'biceps' || grp === 'triceps') ? 'arms' : grp;
      if (recent[csKey] === undefined || recent[csKey] > d) recent[csKey] = d;
    });
  }
  return recent;
}

// Groupes recommandés en fonction de ce qui a été travaillé récemment
function _csGetRecommendedGroups(recentGrps) {
  var COMPLEMENTS = {
    chest:     ['back', 'shoulders'],
    back:      ['chest', 'arms'],
    legs:      ['glutes', 'abs'],
    glutes:    ['legs', 'abs'],
    shoulders: ['chest', 'arms'],
    arms:      ['back', 'chest'],
    abs:       ['legs', 'glutes']
  };
  var recommended = {};
  Object.keys(recentGrps).forEach(function(g) {
    var daysAgo = recentGrps[g];
    if (daysAgo <= 2) {
      (COMPLEMENTS[g] || []).forEach(function(c) {
        if (!recentGrps[c] || recentGrps[c] > 2) recommended[c] = true;
      });
    }
  });
  return recommended;
}

// Libellé contextuel de la séance générée
function _csGetSessionLabel(groupKeys, S) {
  var isEN = window.isEnglish && window.isEnglish();
  var goals = (S && S.sportGoals) || [];
  var hasShred    = goals.indexOf('shred') !== -1;
  var hasStrength = goals.indexOf('strength') !== -1 || goals.indexOf('force') !== -1;
  var goalLabel   = isEN ? 'Hypertrophy' : 'Hypertrophie';
  if (hasShred)    goalLabel = isEN ? 'Fat loss' : 'Perte de gras';
  else if (hasStrength) goalLabel = isEN ? 'Strength' : 'Force';

  var _lEN = { glutes:'Glutes', back:'Back', chest:'Chest', legs:'Legs', shoulders:'Shoulders', abs:'Abs', arms:'Arms', cardio:'Cardio' };
  var _lFR = { glutes:'Fessiers', back:'Dos', chest:'Pecs', legs:'Jambes', shoulders:'Épaules', abs:'Abdos', arms:'Bras', cardio:'Cardio' };
  var labels = groupKeys.filter(function(k){ return k !== 'cardio'; }).map(function(k){ return (isEN ? _lEN : _lFR)[k] || k; });
  var grpLabel = labels.join(' + ');

  return isEN
    ? 'Smart session — ' + (grpLabel || 'Full body') + ' — ' + goalLabel
    : 'Séance intelligente — ' + (grpLabel || 'Full body') + ' — ' + goalLabel;
}

// ─────────────────────────────────────────────
//  Génération de séance — moteur sfcBuildMuscuDay
// ─────────────────────────────────────────────
function _csGenerateSessionFromMuscles(groups) {
  var S = window.S;

  // Mapping groupes UI → clés EXERCISES
  var engineGroups = [];
  var hasCardio = false;
  groups.forEach(function(grp) {
    if (grp.key === 'cardio')    { hasCardio = true; return; }
    if (grp.key === 'arms')      { engineGroups.push('biceps'); engineGroups.push('triceps'); return; }
    engineGroups.push(grp.key);
  });

  // Cardio seul (sans muscu)
  if (hasCardio && !engineGroups.length) {
    _csAddCardio('tapis', 'Tapis de course');
    var draft0 = window.CUSTOM_SESSION.ensureDraft();
    draft0._groups = ['cardio'];
    window.CUSTOM_SESSION.saveDraft();
    return;
  }

  // Fallback si moteur principal absent
  if (!window.sfcBuildMuscuDay || !window.EXERCISES) {
    _csGenerateSessionFallback(groups);
    return;
  }

  // ── Paramètres profil ──────────────────────────────────────────────────
  var goals      = S.sportGoals || [];
  var hasShred   = goals.indexOf('shred') !== -1;
  var hasStr     = goals.indexOf('strength') !== -1 || goals.indexOf('force') !== -1;
  var isBeginner = S.sportLevel === 'beginner' || !S.sportLevel;
  var maxLv      = isBeginner ? 2 : 3;

  // ── SFCSymbiosis : contexte périodisation + nutrition + fatigue ───────
  var _weekIdx   = window.SFCSymbiosis ? window.SFCSymbiosis.getWeekIndex()      : 1;
  var _perio     = window.SFCSymbiosis ? window.SFCSymbiosis.getPeriodizationCfg(_weekIdx) : null;
  var _nutri     = window.SFCSymbiosis ? window.SFCSymbiosis.getNutritionState()  : null;
  var _fatigue   = window.SFCSymbiosis ? window.SFCSymbiosis.getFatigueScore()    : null;

  // durMax : base périodisation → ajustement nutrition → ajustement fatigue
  var durMax = _perio ? _perio.durMax : 6;
  if (_nutri  && _nutri.volumeFactor < 1.0)  durMax = Math.max(3, Math.round(durMax * _nutri.volumeFactor));
  if (_nutri  && _nutri.volumeFactor > 1.0)  durMax = Math.min(8, Math.round(durMax * _nutri.volumeFactor));
  if (_fatigue && _fatigue.restRecommended)  durMax = Math.max(3, Math.round(durMax * 0.75));
  // Cap absolu séance libre : 6 exercices hors déload
  durMax = Math.min(durMax, 6);

  // durSets : périodisation en priorité, puis hasStr
  var durSets = _perio ? _perio.durSets : (hasStr ? 5 : 4);

  // restOverride : priorité objectif sport, puis périodisation (sauf S4 deload)
  var restOverride = null, repSuffix = '';
  if (hasShred)    { restOverride = '45-60s'; repSuffix = ' (haute intensité)'; }
  else if (hasStr) { restOverride = '180-240s'; }
  else if (_perio && _perio.restOverride) { restOverride = _perio.restOverride; }

  // cycleFactor : fatigue → réduction de séries
  var cycleFactor = _fatigue ? _fatigue.cycleFactor : 1.0;

  // weekUsed : exercices des 48h + contexte semaine (Problem 3)
  var weekUsed = {};
  if (S.muscuSessionLog) {
    var _norm = window.EXERCISE_SEARCH._normalize || function(s){ return (s||'').toLowerCase(); };
    for (var _d = 0; _d <= 1; _d++) {
      var _dt = new Date(Date.now() - _d * 86400000).toISOString().slice(0, 10);
      var _dl = S.muscuSessionLog[_dt] || {};
      Object.keys(_dl).forEach(function(n){ weekUsed[_norm(n)] = true; });
    }
  }

  // ── Appel moteur principal ─────────────────────────────────────────────
  var exercises = window.sfcBuildMuscuDay(engineGroups, {
    exercises:    window.EXERCISES,
    filterMedical: (typeof filterExerciseByMedical === 'function') ? filterExerciseByMedical : null,
    equipment:    S.sportEquipment || S.equipment || 'gym',
    isBeginner:   isBeginner,
    maxLv:        maxLv,
    durMax:       durMax,
    durSets:      durSets,
    pregTri:      null,
    pregForbidden: [],
    pregnancyWeek: S.pregnancyWeek || 0,
    muscuMedical: S.muscuMedical || {},
    medRx:        _csBuildMedRx(S),
    weekUsed:     weekUsed,
    restOverride: restOverride,
    hasShred:     hasShred,
    hasStrength:  hasStr,
    repSuffix:    repSuffix,
    supersetNote: '',
    cycleFactor:  cycleFactor,
    weekIndex:    _weekIdx
  });

  // ── Ajout au draft ────────────────────────────────────────────────────
  exercises.forEach(function(ex) { _csAddExercise(ex); });

  // Cardio en complément si sélectionné
  if (hasCardio) _csAddCardio('tapis', 'Tapis de course');

  // ── Stocker pour SFCSymbiosis + label UX ─────────────────────────────
  var draft = window.CUSTOM_SESSION.ensureDraft();
  draft._groups         = engineGroups.slice();
  draft._engineExercises = exercises.slice();

  // Label enrichi avec contexte périodisation / nutrition / fatigue
  var _periLabel  = _perio  ? _perio.note  : null;
  var _nutriLabel = _nutri  && _nutri.note ? _nutri.note   : null;
  var _fatLabel   = _fatigue && _fatigue.note ? _fatigue.note : null;
  draft._sessionLabel  = _csGetSessionLabel(groups.map(function(g){ return g.key; }), S);
  draft._sessionCtxNotes = [_periLabel, _nutriLabel, _fatLabel].filter(Boolean);
  window.CUSTOM_SESSION.saveDraft();
}

// Fallback legacy (keywords) si sfcBuildMuscuDay indisponible
function _csGenerateSessionFallback(groups) {
  window.EXERCISE_SEARCH._buildDB();
  var db   = window.EXERCISE_SEARCH._DB || [];
  var S    = window.S;
  var norm = function(s) { return window.EXERCISE_SEARCH._normalize(s); };
  var recentEx = {};
  var log = (S && S.muscuSessionLog) || {};
  Object.keys(log).sort().reverse().slice(0, 30).forEach(function(d) {
    Object.keys(log[d] || {}).forEach(function(n) { recentEx[norm(n)] = true; });
  });
  var usedNames = {};
  groups.forEach(function(grp) {
    if (grp.key === 'cardio') { _csAddCardio('tapis', 'Tapis de course'); return; }
    if (!grp.keywords || !grp.keywords.length) return;
    var matching = db.filter(function(ex) {
      if (usedNames[norm(ex.n)]) return false;
      var mNorm = norm(ex.m || '');
      return grp.keywords.some(function(kw) { return mNorm.indexOf(kw) !== -1; });
    });
    var isBW = window.isBodyweightExercise || function(ex) { return /^(poids du corps|bodyweight|aucun|none)$/i.test(ex.eq||''); };
    matching.sort(function(a, b) {
      var abw = isBW(a)?1:0, bbw = isBW(b)?1:0;
      if (abw !== bbw) return abw - bbw;
      var aeq = _csEqScore(a.eq), beq = _csEqScore(b.eq);
      if (aeq !== beq) return aeq - beq;
      var ah = recentEx[norm(a.n)]?1:0, bh = recentEx[norm(b.n)]?1:0;
      if (ah !== bh) return bh - ah;
      return (a.lv||2) - (b.lv||2);
    });
    var preferredFamilies = _CS_GROUP_FAMILIES[grp.key] || [];
    var grpFamilies = {}, grpPicked = 0;
    for (var _pi = 0; _pi < preferredFamilies.length && grpPicked < 4; _pi++) {
      var tf = preferredFamilies[_pi];
      if (grpFamilies[tf]) continue;
      for (var _mi = 0; _mi < matching.length; _mi++) {
        var _ex = matching[_mi];
        if (usedNames[norm(_ex.n)] || _csFamilyKey(_ex.n, norm) !== tf) continue;
        grpFamilies[tf] = true; usedNames[norm(_ex.n)] = true; _csAddExercise(_ex); grpPicked++; break;
      }
    }
    for (var _fi = 0; _fi < matching.length && grpPicked < 4; _fi++) {
      var _ex2 = matching[_fi];
      if (usedNames[norm(_ex2.n)]) continue;
      var _fam2 = _csFamilyKey(_ex2.n, norm);
      if (grpFamilies[_fam2]) continue;
      grpFamilies[_fam2] = true; usedNames[norm(_ex2.n)] = true; _csAddExercise(_ex2); grpPicked++;
    }
  });
}

// ─────────────────────────────────────────────
//  Sélecteur de groupes musculaires
// ─────────────────────────────────────────────
function _csRenderMuscleSelector(container, draft) {
  var h = window.h;
  var S = window.S;
  if (!Array.isArray(S._csSelectedGroups)) S._csSelectedGroups = [];

  var _msEN = window.isEnglish && window.isEnglish();

  // Contexte récent : groupes travaillés + recommandations
  var _recentGrps = _csGetRecentGroups();
  var _recommGrps = _csGetRecommendedGroups(_recentGrps);

  container.appendChild(h('div', {
    style: 'font-family:Georgia,serif;font-size:18px;font-weight:normal;color:var(--black,#0A0A09);margin-bottom:4px;'
  }, _msEN ? 'Which muscles to train?' : 'Quels muscles travailler ?'));

  // Bannière recommandation si contexte disponible
  var _recommKeys = Object.keys(_recommGrps);
  if (_recommKeys.length > 0) {
    var _lEN = { glutes:'Glutes', back:'Back', chest:'Chest', legs:'Legs', shoulders:'Shoulders', abs:'Abs', arms:'Arms' };
    var _lFR = { glutes:'Fessiers', back:'Dos', chest:'Pecs', legs:'Jambes', shoulders:'Épaules', abs:'Abdos', arms:'Bras' };
    var _rLabels = _recommKeys.slice(0, 2).map(function(k){ return (_msEN ? _lEN : _lFR)[k] || k; });
    container.appendChild(h('div', {
      style: 'margin:6px 0 12px;padding:8px 12px;background:rgba(62,92,58,0.06);border-left:2px solid var(--green,#3E5C3A);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--green,#3E5C3A);line-height:1.5;'
    }, (_msEN ? '💡 Recommended today: ' : '💡 Recommandé aujourd\'hui : ') + _rLabels.join(' + ')));
  } else {
    container.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);margin-bottom:16px;line-height:1.5;'
    }, _msEN ? 'Select one or more groups — up to 3 for a 60–90 min session.' : 'Sélectionnez 1 à 3 groupes pour une séance de 60–90 min.'));
  }

  var grid = h('div', {
    style: 'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;'
  });

  var _msLabelsEN = { glutes: 'Glutes', back: 'Back', chest: 'Chest', legs: 'Legs', shoulders: 'Shoulders', abs: 'Abs', arms: 'Arms', cardio: 'Cardio' };
  _CS_MUSCLE_GROUPS.forEach(function(grp) {
    var sel       = S._csSelectedGroups.indexOf(grp.key) !== -1;
    var isRecent  = _recentGrps[grp.key] !== undefined && _recentGrps[grp.key] <= 2;
    var isRecomm  = !!_recommGrps[grp.key];
    var _grpLabel = _msEN ? (_msLabelsEN[grp.key] || grp.label) : grp.label;

    var borderColor = sel ? 'var(--green,#3E5C3A)' : isRecomm ? 'var(--tabac,#6A4A1A)' : 'var(--border,#D8D8D0)';
    var bgColor     = sel ? 'rgba(62,92,58,0.08)' : isRecomm ? 'rgba(106,74,26,0.05)' : 'var(--ivory,#FAF9F6)';
    var txtColor    = sel ? 'var(--green,#3E5C3A)' : 'var(--black,#0A0A09)';

    var btn = h('button', {
      style: [
        'padding:14px 10px 10px;',
        'border:2px solid ' + borderColor + ';',
        'background:' + bgColor + ';',
        'border-radius:2px;cursor:pointer;text-align:center;',
        'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;',
        'color:' + txtColor + ';',
        'min-height:64px;position:relative;',
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
    btn.appendChild(h('div', {}, _grpLabel));
    // Badge contextuel
    if (isRecomm && !sel) {
      btn.appendChild(h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:8px;letter-spacing:1px;text-transform:uppercase;color:var(--tabac,#6A4A1A);margin-top:3px;'
      }, _msEN ? '✓ recommended' : '✓ recommandé'));
    } else if (isRecent && !sel) {
      var _dAgo = _recentGrps[grp.key];
      btn.appendChild(h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:8px;letter-spacing:1px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-top:3px;opacity:0.7;'
      }, _msEN ? (_dAgo === 1 ? 'trained yesterday' : _dAgo + 'd ago') : (_dAgo === 1 ? 'hier' : 'il y a ' + _dAgo + 'j')));
    }
    grid.appendChild(btn);
  });

  container.appendChild(grid);

  // Avertissement volume si trop de groupes
  var selCount = S._csSelectedGroups.filter(function(k){ return k !== 'cardio'; }).length;
  if (selCount > 3) {
    container.appendChild(h('div', {
      style: 'padding:8px 12px;margin-bottom:10px;background:rgba(232,111,30,0.08);border:1px solid rgba(232,111,30,0.3);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#c85a00;'
    }, _msEN
      ? '⚠ ' + selCount + ' groups selected — session capped at 6 exercises (~90 min). Reduce groups for better focus.'
      : '⚠ ' + selCount + ' groupes sélectionnés — séance limitée à 6 exercices (~90 min). Réduisez les groupes pour plus de focus.'));
  }

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
  }, hasSel ? (_msEN ? '→ Generate my session' : '→ Générer ma séance') : (_msEN ? 'Select at least one group' : 'Sélectionnez au moins un groupe')));

  container.appendChild(h('button', {
    style: 'display:block;width:100%;padding:10px;background:transparent;border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);cursor:pointer;',
    onclick: function() {
      S._csSkipMuscleSelect = true;
      S._csSelectedGroups = [];
      if (window.render) window.render();
    }
  }, _msEN ? 'Build freely without suggestions →' : 'Construire librement sans suggestion →'));
}

// ─────────────────────────────────────────────
//  ÉTAPE 8 : vue BUILD
// ─────────────────────────────────────────────
function _csRenderBuild(container, draft) {
  var h = window.h;
  var S = window.S;
  var _bEN = window.isEnglish && window.isEnglish();

  // ── En-tête ──
  var hdr = h('div', { style: 'margin-bottom:16px;' });
  hdr.appendChild(h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:5px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:6px;'
  }, _bEN ? 'FREE WORKOUT' : 'SÉANCE LIBRE'));
  hdr.appendChild(h('div', {
    style: 'font-family:Georgia,serif;font-size:22px;font-weight:normal;color:var(--black,#0A0A09);margin-bottom:4px;'
  }, draft.title));
  var _genGroups = (S._csSelectedGroups && S._csSelectedGroups.length && S._csSkipMuscleSelect);
  var _subtitleText = draft.blocks.length === 0
    ? (_bEN ? 'Search for an exercise or add a cardio block.' : 'Recherchez un exercice ou ajoutez un bloc cardio.')
    : _genGroups
      ? draft.blocks.length + ' ' + window.locPlural(draft.blocks.length, {fr:{one:'exercice suggéré',other:'exercices suggérés'},en:{one:'suggested exercise',other:'suggested exercises'}}) + (window.isEnglish && window.isEnglish() ? ' · Edit freely before starting.' : ' · Modifiez librement avant de démarrer.')
      : draft.blocks.length + ' ' + window.locPlural(draft.blocks.length, {fr:{one:'bloc',other:'blocs'},en:{one:'block',other:'blocks'}}) + (window.isEnglish && window.isEnglish() ? ' · Tap Start when ready.' : ' · Appuyez sur Démarrer quand vous êtes prêt.');
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
    }, _bEN ? 'Cancel' : 'Annuler'));
    return;
  }

  // ── Bandeau "séance générée" si groupes sélectionnés mais 0 résultats ──
  if (S._csSkipMuscleSelect && S._csSelectedGroups && S._csSelectedGroups.length > 0 && draft.blocks.length === 0) {
    container.appendChild(h('div', {
      style: 'padding:10px 14px;margin-bottom:12px;background:rgba(10,10,9,0.04);border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);'
    }, _bEN ? 'No exercises found for these muscle groups. Add exercises manually below.' : 'Aucun exercice trouvé pour ces groupes musculaires. Ajoutez vos exercices manuellement ci-dessous.'));
  }

  // ── Liste des blocs du brouillon (EN PREMIER — l'utilisateur voit sa séance immédiatement) ──
  if (draft.blocks.length > 0) {
    // Bandeau intelligent : label séance + volume + nutrition impact
    if (draft._sessionLabel) {
      var _slBanner = h('div', {
        style: 'padding:10px 14px;margin-bottom:14px;background:rgba(10,10,9,0.04);border-left:3px solid var(--black,#0A0A09);font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--black,#0A0A09);line-height:1.6;'
      });
      _slBanner.appendChild(h('div', {
        style: 'font-size:12px;font-weight:600;margin-bottom:3px;'
      }, draft._sessionLabel));
      var _exCount = draft.blocks.filter(function(b){ return b.type === 'exercise'; }).length;
      var _nutritionNote = window.SFCSymbiosis
        ? (_bEN ? '⚡ Nutrition will auto-adjust after this session.' : '⚡ La nutrition s\'ajustera automatiquement après cette séance.')
        : '';
      _slBanner.appendChild(h('div', {
        style: 'font-size:10px;color:var(--grey,#6B6B65);'
      }, _exCount + ' ' + (_bEN ? 'exercises · ~' + (_exCount * 12) + ' min · ' : 'exercices · ~' + (_exCount * 12) + ' min · ') + _nutritionNote));
      container.appendChild(_slBanner);
    }

    container.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:8px;'
    }, _bEN ? 'MY WORKOUT' : 'MA SÉANCE'));
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
  }, canStart ? (_bEN ? '▶ Start workout' : '▶ Démarrer la séance') : (_bEN ? 'Add at least one exercise' : 'Ajoutez au moins un exercice')));

  // ── Sauvegarder comme template depuis BUILD (sans avoir besoin de finir la séance) ──
  if (canStart) {
    if (!S._csBuildTplOpen) {
      container.appendChild(h('button', {
        style: 'display:block;width:100%;padding:9px;margin-top:6px;background:transparent;border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;color:var(--grey,#6B6B65);',
        onclick: function() { S._csBuildTplOpen = true; if (window.render) window.render(); }
      }, _bEN ? '↗ Save as template' : '↗ Sauvegarder comme template'));
    } else {
      var _bTplRow = h('div', { style: 'display:flex;gap:8px;align-items:center;margin-top:6px;padding:8px;border:1px solid var(--border,#D8D8D0);border-radius:2px;background:var(--ivory,#FAF9F6);' });
      var _bTplInput = h('input', {
        type: 'text', placeholder: _bEN ? 'Session name…' : 'Nom de la séance…',
        style: 'flex:1;padding:8px;border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;background:var(--ivory,#FAF9F6);min-width:0;'
      });
      _bTplRow.appendChild(_bTplInput);
      _bTplRow.appendChild(h('button', {
        style: 'flex-shrink:0;padding:8px 14px;background:var(--green,#3E5C3A);color:#fff;border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;cursor:pointer;white-space:nowrap;',
        onclick: function() {
          var name = _bTplInput.value.trim();
          if (!name) return;
          window.CUSTOM_SESSION.saveAsTemplate(name);
          if (window.showToast) window.showToast('« ' + name + ' » ' + (_bEN ? 'saved.' : 'sauvegardé.'), 'success', 2500);
          S._csBuildTplOpen = false;
          if (window.render) window.render();
        }
      }, _bEN ? 'Save' : 'Sauvegarder'));
      _bTplRow.appendChild(h('button', {
        style: 'flex-shrink:0;padding:8px 10px;background:transparent;border:1px solid var(--border,#D8D8D0);border-radius:2px;cursor:pointer;font-size:14px;color:var(--grey,#6B6B65);',
        onclick: function() { S._csBuildTplOpen = false; if (window.render) window.render(); }
      }, '×'));
      container.appendChild(_bTplRow);
    }
  }

  // ── Structure hint for empty free-build sessions ──
  if (draft.blocks.length === 0 && S._csSkipMuscleSelect) {
    var _hintCard = h('div', {
      style: 'padding:12px 14px;margin-bottom:14px;border:1px solid var(--border,#D8D8D0);border-radius:2px;background:var(--ivory2,#F4F4F0);'
    });
    _hintCard.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:4px;'
    }, _bEN ? 'SUGGESTED STRUCTURE' : 'STRUCTURE SUGGÉRÉE'));
    _hintCard.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--black,#0A0A09);line-height:1.5;'
    }, _bEN ? '3 compound movements (Squat, Bench press, Row...) + 2 isolation exercises.' : '3 mouvements composés (Squat, Développé couché, Rowing...) + 2 exercices d\'isolation.'));
    container.appendChild(_hintCard);
  }

  // ── Séparateur visuel "Ajouter" (uniquement si séance non vide) ──
  if (draft.blocks.length > 0) {
    var _sep = h('div', { style: 'display:flex;align-items:center;gap:10px;margin:22px 0 16px;' });
    _sep.appendChild(h('div', { style: 'flex:1;height:1px;background:var(--border,#D8D8D0);' }));
    _sep.appendChild(h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);white-space:nowrap;flex-shrink:0;' }, _bEN ? 'ADD AN EXERCISE' : 'Ajouter un exercice'));
    _sep.appendChild(h('div', { style: 'flex:1;height:1px;background:var(--border,#D8D8D0);' }));
    container.appendChild(_sep);
  }

  // ── Barre de recherche ──
  var srchWrap = h('div', { style: 'position:relative;margin-bottom:12px;' });
  srchWrap.appendChild(h('div', {
    style: 'position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--grey,#6B6B65);font-size:16px;pointer-events:none;'
  }, '⌕'));
  var srchInput = h('input', {
    type: 'search', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'off',
    placeholder: _bEN ? 'Squat, glutes, hip thrust…' : 'Squat, fessiers, hip thrust…',
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
      var _emptyMsg = (window.isEnglish && window.isEnglish())
        ? 'No exercise found for "' + q + '"'
        : 'Aucun exercice pour "' + q + '"';
      resBox.appendChild(h('div', {
        style: 'padding:14px;text-align:center;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey,#6B6B65);'
      }, _emptyMsg));
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
  }, _bEN ? 'ADD A CARDIO BLOCK' : 'AJOUTER UN BLOC CARDIO'));
  var cardioRow = h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;' });
  var cardioTypes = _bEN ? [
    { key: 'tapis',       label: 'Treadmill' },
    { key: 'velo',        label: 'Bike' },
    { key: 'rameur',      label: 'Rowing machine' },
    { key: 'elliptique',  label: 'Elliptical' },
    { key: 'corde',       label: 'Jump rope' }
  ] : [
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
      }, _bEN ? 'MY SAVED WORKOUTS' : 'MES SÉANCES SAUVEGARDÉES'));
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
          (tpl.blocks || []).filter(function(b) { return b.type === 'exercise'; }).length + ' ' + (_bEN ? 'exercises' : 'exercices') + ' · ' + tpl.date));
        tRow.appendChild(tLeft);
        tRow.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--green,#3E5C3A);margin-left:10px;' }, _bEN ? 'Load →' : 'Charger →'));
        container.appendChild(tRow);
      });
    }
  }

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
  }, _bEN ? 'Cancel' : 'Annuler'));
}
// ─────────────────────────────────────────────
//  ÉTAPE 9a : vue ACTIVE
// ─────────────────────────────────────────────
function _csRenderActive(container, draft) {
  var h = window.h;
  var S = window.S;
  var _aEN = window.isEnglish && window.isEnglish();

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
  }, _aEN ? 'WORKOUT IN PROGRESS' : 'SÉANCE EN COURS'));
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
    }, doneSets + '/' + totalSets + ' ' + (_aEN ? 'sets done' : 'séries validées')));
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
  }, allDone ? (_aEN ? '✓ Finish workout' : '✓ Terminer la séance') : (_aEN ? 'Finish workout →' : 'Terminer la séance →')));

  // Abandon
  container.appendChild(h('button', {
    style: 'display:block;width:100%;padding:10px;margin-top:8px;background:transparent;border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;color:var(--grey,#6B6B65);',
    onclick: function() {
      var _abandonMsg = _aEN ? 'Abandon workout? Validated sets are kept.' : 'Abandonner la séance ? Les séries validées sont conservées.';
      if (!(window.sfcConfirm ? window.sfcConfirm(_abandonMsg) : confirm(_abandonMsg))) return;
      if (window._csChronoInterval) { clearInterval(window._csChronoInterval); window._csChronoInterval = null; }
      var elapsed2 = draft.startTime ? Math.max(1, Math.round((Date.now() - draft.startTime) / 60000)) : 5;
      window.CUSTOM_SESSION.finishSession(elapsed2);
      if (window.render) window.render();
    }
  }, _aEN ? 'Abandon' : 'Abandonner'));
}

// ─────────────────────────────────────────────
//  ÉTAPE 9b : vue DONE
// ─────────────────────────────────────────────
function _csRenderDone(container, draft) {
  var h = window.h;
  var S = window.S;
  var _dEN = window.isEnglish && window.isEnglish();
  var kcal = window.CUSTOM_SESSION.calcKcal(draft);

  // Header succès
  var hdrDone = h('div', { style: 'text-align:center;padding:20px 0 12px;' });
  hdrDone.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:28px;margin-bottom:8px;' }, '✓'));
  hdrDone.appendChild(h('div', {
    style: 'font-family:Georgia,serif;font-size:21px;font-weight:normal;color:var(--black,#0A0A09);margin-bottom:4px;'
  }, _dEN ? 'Workout complete' : 'Séance terminée'));
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
  statsGrid.appendChild(_sc(exCount, _dEN ? 'Exercises' : 'Exercices', false));
  statsGrid.appendChild(_sc((draft.durationMins || 0) + "'", _dEN ? 'Duration' : 'Durée', false));
  statsGrid.appendChild(_sc(kcal.total + ' kcal', _dEN ? 'Burned' : 'Dépense', true));
  container.appendChild(statsGrid);

  // Coach Card — analysis, PRs, next targets, plateau warnings
  _csRenderCoachCard(draft, container);

  // Récap exercices
  var exBlocks = draft.blocks.filter(function(b) { return b.type === 'exercise' && Array.isArray(b.loggedSets); });
  if (exBlocks.length > 0) {
    var recapBox = h('div', { style: 'border:1px solid var(--border,#D8D8D0);margin-bottom:14px;background:var(--ivory,#FAF9F6);' });
    recapBox.appendChild(h('div', {
      style: 'padding:7px 12px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);border-bottom:1px solid var(--border,#D8D8D0);'
    }, _dEN ? 'Exercise recap' : 'Récap. des exercices'));
    exBlocks.forEach(function(b) {
      var valid = b.loggedSets.filter(function(s) { return s.validated; });
      if (!valid.length) return;
      var r = h('div', { style: 'padding:7px 12px;border-bottom:1px solid var(--border,#D8D8D0);' });
      var _rTop = h('div', { style: 'display:flex;justify-content:space-between;align-items:center;' });
      var _rName = h('div', { style: 'flex:1;min-width:0;' });
      _rName.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' }, b.n));
      // Sparkline
      var _sparkD = (window.S && window.S.muscuProgressionHistory && b.n && window.S.muscuProgressionHistory[b.n]) ? window.S.muscuProgressionHistory[b.n].slice(-5) : [];
      if (_sparkD.length > 0) {
        _rName.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:var(--green,#3E5C3A);margin-top:2px;' }, '↗ ' + _sparkD.map(function(p){ return (p.weight||0)+' kg'; }).join(' → ')));
      }
      _rTop.appendChild(_rName);
      var _maxW = valid.reduce(function(m, s) { return Math.max(m, parseFloat(s.weight)||0); }, 0);
      var _wTxt = _maxW > 0 ? ' — ' + _maxW + ' kg' : '';
      _rTop.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin-left:8px;white-space:nowrap;display:flex;align-items:center;gap:6px;' },
        valid.length + ' ' + (_dEN ? 'sets' : 'séries') + _wTxt));
      _rTop.appendChild(h('span', { style: 'color:var(--green,#3E5C3A);font-size:14px;margin-left:6px;flex-shrink:0;' }, '✓'));
      r.appendChild(_rTop);
      // Note
      if (b.notes && b.notes.trim()) {
        r.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);font-style:italic;margin-top:3px;' }, '💡 ' + b.notes));
      }
      recapBox.appendChild(r);
    });
    container.appendChild(recapBox);
  }

  // Durée éditable
  var durRow = h('div', { style: 'display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid var(--border,#D8D8D0);margin-bottom:12px;' });
  durRow.appendChild(h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);flex:1;' }, _dEN ? 'Actual duration' : 'Durée réelle'));
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
  kcalBox.appendChild(_kr(_dEN ? 'Workout burn' : 'Dépense séance', kcal.base + ' kcal', false, null));
  kcalBox.appendChild(_kr('EPOC +24h', '+' + kcal.epoc + ' kcal', false, 'var(--orange,#E86F1E)'));
  var tot = h('div', { style: 'display:flex;justify-content:space-between;border-top:1px solid var(--border,#D8D8D0);padding-top:8px;' });
  tot.appendChild(h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;font-weight:bold;' }, _dEN ? 'Estimated total' : 'Total estimé'));
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
      type: 'text', placeholder: _dEN ? 'Template name…' : 'Nom du template…',
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
        if (window.showToast) window.showToast((_dEN ? 'Template «' : 'Template «') + ' ' + name + ' » ' + (_dEN ? 'saved.' : 'sauvegardé.'), 'success', 2500);
        if (window.render) window.render();
      }
    }, _dEN ? 'Save' : 'Sauvegarder'));
    container.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:6px;'
    }, _dEN ? 'REPEAT THIS WORKOUT LATER' : 'Refaire cette séance plus tard'));
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
  }, _dEN ? '← Back to dashboard' : '← Retour au tableau de bord'));

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
  }, _dEN ? '+ New free workout' : '+ Nouvelle séance libre'));
}

// ─────────────────────────────────────────────
//  Undo snackbar (removeBlock)
// ─────────────────────────────────────────────
var _csUndoTimer = null;
function _csShowUndo(removedIdx, removedBlock) {
  var _old = document.getElementById('cs-undo-bar');
  if (_old && _old.parentNode) _old.parentNode.removeChild(_old);
  if (_csUndoTimer) { clearTimeout(_csUndoTimer); _csUndoTimer = null; }

  var bar = document.createElement('div');
  bar.id = 'cs-undo-bar';
  bar.style.cssText = 'position:fixed;bottom:72px;left:50%;transform:translateX(-50%);' +
    'background:#0A0A09;color:#FAF9F6;padding:10px 16px;border-radius:4px;' +
    'display:flex;align-items:center;gap:14px;z-index:9999;' +
    'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;white-space:nowrap;' +
    'box-shadow:0 4px 16px rgba(0,0,0,0.25);';
  var _undoEN = window.isEnglish && window.isEnglish();
  bar.appendChild(document.createTextNode((removedBlock.n || removedBlock.label || (_undoEN ? 'Block' : 'Bloc')) + ' ' + (_undoEN ? 'removed' : 'retiré')));

  var btn = document.createElement('button');
  btn.textContent = _undoEN ? 'Undo' : 'Annuler';
  btn.style.cssText = 'background:none;border:1px solid rgba(250,249,246,0.4);color:#FAF9F6;' +
    'padding:4px 10px;border-radius:2px;cursor:pointer;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:1px;';
  btn.onclick = function() {
    clearTimeout(_csUndoTimer);
    if (bar.parentNode) bar.parentNode.removeChild(bar);
    var _d = window.CUSTOM_SESSION.ensureDraft();
    var _safeIdx = Math.min(removedIdx, _d.blocks.length);
    _d.blocks.splice(_safeIdx, 0, removedBlock);
    window.CUSTOM_SESSION.saveDraft();
    if (window.render) window.render();
  };
  bar.appendChild(btn);
  document.body.appendChild(bar);

  _csUndoTimer = setTimeout(function() {
    if (bar.parentNode) bar.parentNode.removeChild(bar);
    _csUndoTimer = null;
  }, 4000);
}

// ─────────────────────────────────────────────
//  ÉTAPE 10a : bloc en mode BUILD
// ─────────────────────────────────────────────
function _csRenderDraftBlock(block) {
  var h = window.h;
  var S = window.S;
  var _dbEN = window.isEnglish && window.isEnglish();
  var wrap = h('div', { style: 'border:1px solid var(--border,#D8D8D0);background:var(--ivory,#FAF9F6);margin-bottom:10px;border-radius:2px;overflow:hidden;' });

  if (block.type === 'exercise') {
    // ── header ──
    var hRow = h('div', { style: 'display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border-bottom:1px solid var(--border,#D8D8D0);background:var(--ivory2,#F4F4F0);' });
    var lft = h('div', { style: 'flex:1;min-width:0;' });
    lft.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:13px;color:var(--black,#0A0A09);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' }, block.n));
    lft.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);margin-top:2px;' }, (block.m || '') + (block.eq ? ' · ' + block.eq : '')));
    // ── Sparkline progression (5 dernières sessions) ──
    var _spark = (S && S.muscuProgressionHistory && block.n && S.muscuProgressionHistory[block.n]) ? S.muscuProgressionHistory[block.n].slice(-5) : [];
    if (_spark.length > 0) {
      var _sparkTxt = _spark.map(function(p) { return (p.weight || 0) + ' kg'; }).join(' → ');
      lft.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:var(--green,#3E5C3A);margin-top:3px;letter-spacing:0.3px;' }, '↗ ' + _sparkTxt));
    }
    hRow.appendChild(lft);
    // ── Boutons : ↑ ↓ ⧉ × ──
    var _draft0 = window.CUSTOM_SESSION.ensureDraft();
    var _bIdx = _draft0.blocks.findIndex(function(b) { return b.id === block.id; });
    var _isFirst = _bIdx === 0, _isLast = _bIdx === _draft0.blocks.length - 1;
    var _btnBox = h('div', { style: 'display:flex;align-items:center;gap:0;flex-shrink:0;' });
    var _btnStyle = function(disabled) { return 'background:none;border:none;cursor:' + (disabled ? 'default' : 'pointer') + ';font-size:14px;color:' + (disabled ? 'var(--border,#D8D8D0)' : 'var(--grey,#6B6B65)') + ';padding:4px 5px;min-width:30px;min-height:36px;'; };
    _btnBox.appendChild(h('button', { style: _btnStyle(_isFirst), disabled: _isFirst, title: 'Monter',
      onclick: _isFirst ? null : (function(bid) { return function() { window.CUSTOM_SESSION.moveBlock(bid, 'up'); if (window.render) window.render(); }; })(block.id) }, '↑'));
    _btnBox.appendChild(h('button', { style: _btnStyle(_isLast), disabled: _isLast, title: 'Descendre',
      onclick: _isLast ? null : (function(bid) { return function() { window.CUSTOM_SESSION.moveBlock(bid, 'down'); if (window.render) window.render(); }; })(block.id) }, '↓'));
    var _dupBtnEl = h('button', {
      style: 'background:none;border:none;cursor:pointer;padding:2px 4px;min-width:34px;min-height:36px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0px;',
      title: 'Dupliquer',
      onclick: (function(b0) { return function() {
        var _cl = JSON.parse(JSON.stringify(b0));
        _cl.id = 'b' + Date.now() + '_' + Math.floor(Math.random() * 9999);
        _cl.loggedSets = [];
        var _d0 = window.CUSTOM_SESSION.ensureDraft();
        var _ix = _d0.blocks.findIndex(function(x) { return x.id === b0.id; });
        _d0.blocks.splice(_ix + 1, 0, _cl);
        window.CUSTOM_SESSION.saveDraft();
        if (window.render) window.render();
      }; })(block)
    });
    _dupBtnEl.appendChild(h('span', { style: 'font-size:13px;color:var(--grey,#6B6B65);line-height:1.2;' }, '⊕'));
    _dupBtnEl.appendChild(h('span', { style: 'font-size:7px;color:var(--grey,#6B6B65);letter-spacing:0.3px;line-height:1;' }, 'dup'));
    _btnBox.appendChild(_dupBtnEl);
    _btnBox.appendChild(h('button', { style: 'background:none;border:none;cursor:pointer;font-size:17px;color:var(--grey,#6B6B65);padding:4px 6px;min-width:30px;min-height:36px;', title: 'Supprimer',
      onclick: (function(bid) { return function() { window.CUSTOM_SESSION.removeBlock(bid); if (window.render) window.render(); }; })(block.id) }, '×'));
    hRow.appendChild(_btnBox);
    wrap.appendChild(hRow);

    // ── contrôles séries/reps ──
    var cfgRow = h('div', { style: 'padding:10px 12px;display:flex;flex-wrap:wrap;gap:14px;align-items:center;' });
    cfgRow.appendChild(_csNumCtrl(_dbEN ? 'Sets' : 'Séries', parseInt(block.sets) || 4, 1, 10, 1,
      function(v) { block.sets = v; window.CUSTOM_SESSION.saveDraft(); if (window.render) window.render(); }));
    cfgRow.appendChild(_csNumCtrl('Reps', parseInt(block.reps) || 10, 1, 50, 1,
      function(v) { block.reps = v; window.CUSTOM_SESSION.saveDraft(); if (window.render) window.render(); }));
    wrap.appendChild(cfgRow);

    // ── sélecteur temps de repos ──
    var restRow = h('div', { style: 'padding:7px 12px;border-top:1px solid var(--border,#D8D8D0);display:flex;align-items:center;gap:8px;flex-wrap:wrap;' });
    restRow.appendChild(h('span', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);flex-shrink:0;'
    }, _dbEN ? 'Rest' : 'Repos'));
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
          if (valid0.length) sugW = Math.max.apply(null, valid0.map(function(s) { return parseFloat(s.actualWeight) || 0; }));
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
      }, (_dbEN ? 'Suggestion: ' : 'Suggestion : ') + sugW + ' kg'));
      sugRow.appendChild(h('button', {
        style: 'background:var(--green,#3E5C3A);color:#fff;border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;padding:4px 10px;cursor:pointer;border-radius:2px;',
        onclick: (function(b, sw) { return function() { b.targetWeight = sw; window.CUSTOM_SESSION.saveDraft(); if (window.render) window.render(); }; })(block, sugW)
      }, (_dbEN ? 'Use ' : 'Utiliser ') + sugW + ' kg'));
      wrap.appendChild(sugRow);
    }

    // ── charge cible ──
    var _bwBlock = window.isBodyweightExercise ? window.isBodyweightExercise(block) : (block.eq === 'Poids du corps');
    var wtRow = h('div', { style: 'padding:9px 12px;border-top:1px solid var(--border,#D8D8D0);display:flex;align-items:center;gap:8px;' });
    wtRow.appendChild(h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);min-width:80px;' }, _bwBlock ? (_dbEN ? 'Weight (opt.)' : 'Lest (opt.)') : (_dbEN ? 'Target weight' : 'Charge cible')));
    var wInp = h('input', {
      type: 'number', step: '0.5', min: '0', max: '500', inputmode: 'decimal',
      value: block.targetWeight != null ? String(block.targetWeight) : '',
      placeholder: _bwBlock ? (_dbEN ? 'vest' : 'lest') : 'kg',
      style: 'width:68px;padding:8px;border:1px solid var(--border);border-radius:2px;font-family:Georgia;font-size:16px;text-align:center;background:var(--ivory);-webkit-appearance:none;' + (_bwBlock ? 'opacity:0.7;' : ''),
      onclick: function(e) { e.stopPropagation(); },
      onchange: (function(b) { return function(e) { var v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0) { b.targetWeight = v; window.CUSTOM_SESSION.saveDraft(); } }; })(block)
    });
    var wMinus = h('button', {
      style: 'min-width:36px;min-height:36px;background:transparent;border:1px solid var(--border);border-radius:2px;font-size:16px;cursor:pointer;',
      onclick: (function(b2, inp) { return function(e) { e.stopPropagation(); var nv = Math.max(0, Math.round((( parseFloat(inp.value) || 0) - 2.5) * 2) / 2); inp.value = String(nv); b2.targetWeight = nv; window.CUSTOM_SESSION.saveDraft(); }; })(block, wInp)
    }, '−');
    var wPlus = h('button', {
      style: 'min-width:36px;min-height:36px;background:transparent;border:1px solid var(--border);border-radius:2px;font-size:16px;cursor:pointer;',
      onclick: (function(b3, inp) { return function(e) { e.stopPropagation(); var nv = Math.min(500, Math.round(((parseFloat(inp.value) || 0) + 2.5) * 2) / 2); inp.value = String(nv); b3.targetWeight = nv; window.CUSTOM_SESSION.saveDraft(); }; })(block, wInp)
    }, '+');
    wtRow.appendChild(wMinus);
    wtRow.appendChild(wInp);
    wtRow.appendChild(wPlus);
    wtRow.appendChild(h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);' }, 'kg'));
    wrap.appendChild(wtRow);

    // ── Note optionnelle ──
    var _noteRow = h('div', { style: 'padding:7px 12px;border-top:1px solid var(--border,#D8D8D0);display:flex;align-items:center;gap:8px;' });
    _noteRow.appendChild(h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);min-width:44px;flex-shrink:0;' }, _dbEN ? 'Note' : 'Note'));
    var _noteInp = h('input', {
      type: 'text', maxlength: '120',
      placeholder: _dbEN ? 'E.g. keep back flat, feel the chest…' : 'Ex: garder le dos plat, sentir les pecs…',
      value: block.notes || '',
      style: 'flex:1;padding:6px 8px;border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;background:var(--ivory,#FAF9F6);color:var(--black,#0A0A09);',
      onclick: function(e) { e.stopPropagation(); },
      oninput: (function(b) { return function(e) { b.notes = e.target.value; window.CUSTOM_SESSION.saveDraft(); }; })(block)
    });
    _noteRow.appendChild(_noteInp);
    wrap.appendChild(_noteRow);

  } else if (block.type === 'cardio') {
    var chRow = h('div', { style: 'display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border-bottom:1px solid var(--border,#D8D8D0);background:var(--ivory2,#F4F4F0);' });
    var clft = h('div', {});
    clft.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:13px;color:var(--black,#0A0A09);' }, block.label || block.subtype));
    clft.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);margin-top:2px;' }, 'Cardio')); // 'Cardio' is the same in both languages
    chRow.appendChild(clft);
    var _cDraft = window.CUSTOM_SESSION.ensureDraft();
    var _cIdx = _cDraft.blocks.findIndex(function(b) { return b.id === block.id; });
    var _cFirst = _cIdx === 0, _cLast = _cIdx === _cDraft.blocks.length - 1;
    var _cBtnBox = h('div', { style: 'display:flex;align-items:center;gap:0;flex-shrink:0;' });
    var _cBtnS = function(dis) { return 'background:none;border:none;cursor:' + (dis?'default':'pointer') + ';font-size:14px;color:' + (dis?'var(--border,#D8D8D0)':'var(--grey,#6B6B65)') + ';padding:4px 5px;min-width:30px;min-height:36px;'; };
    _cBtnBox.appendChild(h('button', { style: _cBtnS(_cFirst), disabled: _cFirst,
      onclick: _cFirst ? null : (function(bid) { return function() { window.CUSTOM_SESSION.moveBlock(bid, 'up'); if (window.render) window.render(); }; })(block.id) }, '↑'));
    _cBtnBox.appendChild(h('button', { style: _cBtnS(_cLast), disabled: _cLast,
      onclick: _cLast ? null : (function(bid) { return function() { window.CUSTOM_SESSION.moveBlock(bid, 'down'); if (window.render) window.render(); }; })(block.id) }, '↓'));
    _cBtnBox.appendChild(h('button', { style: 'background:none;border:none;cursor:pointer;font-size:17px;color:var(--grey,#6B6B65);padding:4px 6px;min-width:30px;min-height:36px;',
      onclick: (function(bid2) { return function() { window.CUSTOM_SESSION.removeBlock(bid2); if (window.render) window.render(); }; })(block.id) }, '×'));
    chRow.appendChild(_cBtnBox);
    wrap.appendChild(chRow);

    var ccfgRow = h('div', { style: 'padding:10px 12px;display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start;' });
    ccfgRow.appendChild(_csNumCtrl(_dbEN ? 'Duration (min)' : 'Durée (min)', block.duration || 20, 1, 120, 5,
      function(v) { block.duration = v; window.CUSTOM_SESSION.saveDraft(); if (window.render) window.render(); }));
    if (block.subtype === 'tapis' || block.subtype === 'velo') {
      ccfgRow.appendChild(_csNumCtrl(_dbEN ? 'Speed (km/h)' : 'Vitesse (km/h)', block.speed || 6, 1, 30, 0.5,
        function(v) { block.speed = v; window.CUSTOM_SESSION.saveDraft(); if (window.render) window.render(); }));
    }
    if (block.subtype === 'tapis') {
      ccfgRow.appendChild(_csNumCtrl(_dbEN ? 'Incline (%)' : 'Inclinaison (%)', block.incline || 0, 0, 30, 1,
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
  var _hdrLeft = h('div', { style: 'flex:1;min-width:0;' });
  var _hdrNameRow = h('div', { style: 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;' });
  _hdrNameRow.appendChild(h('div', { style: 'font-family:Georgia,serif;font-size:13px;color:var(--black,#0A0A09);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' }, block.n));
  // Plateau badge
  if (_csIsOnPlateau(block.n)) {
    _hdrNameRow.appendChild(h('span', {
      title: (window.isEnglish && window.isEnglish()) ? 'Plateau detected' : 'Plateau détecté',
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:8px;letter-spacing:1px;padding:2px 5px;background:var(--orange,#E86F1E);color:#fff;border-radius:2px;white-space:nowrap;flex-shrink:0;'
    }, 'PLATEAU'));
  }
  _hdrLeft.appendChild(_hdrNameRow);
  var _sparkA = (window.S && window.S.muscuProgressionHistory && block.n && window.S.muscuProgressionHistory[block.n]) ? window.S.muscuProgressionHistory[block.n].slice(-5) : [];
  if (_sparkA.length > 0) {
    _hdrLeft.appendChild(h('div', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:var(--green,#3E5C3A);margin-top:2px;' }, '↗ ' + _sparkA.map(function(p){ return (p.weight||0)+' kg'; }).join(' → ')));
  }
  hdr2.appendChild(_hdrLeft);
  hdr2.appendChild(allDone
    ? h('span', { style: 'color:var(--green,#3E5C3A);font-size:16px;flex-shrink:0;' }, '✓')
    : h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);flex-shrink:0;' }, validCnt + '/' + block.loggedSets.length));
  wrap.appendChild(hdr2);

  if (block.targetWeight && block.targetWeight > 0) {
    wrap.appendChild(h('div', {
      style: 'padding:5px 12px;background:rgba(62,92,58,0.05);border-bottom:1px solid var(--border,#D8D8D0);font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--green,#3E5C3A);'
    }, ((window.isEnglish && window.isEnglish()) ? 'Target: ' : 'Charge cible : ') + block.targetWeight + ' kg'));
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
    var _refEN = window.isEnglish && window.isEnglish();
    refRow.appendChild(window.h('span', {}, _refEN
      ? ('Ref. (' + (_lref.days === 1 ? 'yesterday' : _lref.days + 'd ago') + ')')
      : ('Réf. (' + (_lref.days === 1 ? 'hier' : 'il y a ' + _lref.days + 'j') + ')')));
    refRow.appendChild(window.h('span', { style: 'font-family:Georgia,serif;' },
      _lref.weight + ' kg · ' + _lref.sets + '×' + _lref.reps + ' reps'));
    wrap.appendChild(refRow);
  }

  // ── Note de l'exercice ──
  if (block.notes && block.notes.trim()) {
    wrap.appendChild(h('div', {
      style: 'padding:5px 12px;background:rgba(10,10,9,0.03);border-bottom:1px solid var(--border,#D8D8D0);font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);font-style:italic;'
    }, '💡 ' + block.notes));
  }

  // ── Valider toutes les séries d'un coup ──
  if (!allDone && block.loggedSets.length > 1) {
    var _vtRow = h('div', { style: 'padding:6px 12px;border-bottom:1px solid var(--border,#D8D8D0);' });
    _vtRow.appendChild(h('button', {
      style: 'width:100%;padding:8px;background:transparent;color:var(--green,#3E5C3A);border:1px solid var(--green,#3E5C3A);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:1px;cursor:pointer;',
      onclick: (function(bid) { return function() {
        var _d = window.CUSTOM_SESSION.ensureDraft();
        for (var _bi = 0; _bi < _d.blocks.length; _bi++) {
          if (_d.blocks[_bi].id !== bid) continue;
          var _blk = _d.blocks[_bi];
          for (var _si = 0; _si < _blk.loggedSets.length; _si++) {
            if (!_blk.loggedSets[_si].validated) window.CUSTOM_SESSION.validateSet(bid, _si);
          }
          break;
        }
        if (window.render) window.render();
      }; })(block.id)
    }, (window.isEnglish && window.isEnglish())
        ? ('✓ Validate all ' + block.loggedSets.length + ' sets')
        : ('✓ Valider les ' + block.loggedSets.length + ' séries')));
    wrap.appendChild(_vtRow);
  }

  // Warm-up sets (shown before working sets when weight ≥ 40 kg)
  if (Array.isArray(block.warmupSets) && block.warmupSets.length > 0) {
    wrap.appendChild(_csRenderWarmupRows(block.warmupSets, block.id));
  }

  var setsWrap = h('div', { style: 'padding:6px 12px;' });
  block.loggedSets.forEach(function(s, si) {
    setsWrap.appendChild(_csRenderActiveSet(block, s, si));
  });
  wrap.appendChild(setsWrap);

  // RPE widget appears once all working sets are validated
  _csRenderRPEWidget(block, wrap);

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

  var _isBodyweight = window.isBodyweightExercise ? window.isBodyweightExercise(block) : (block.eq === 'Poids du corps');
  var wInp2 = h('input', {
    id: 'cs-winp-' + block.id + '-' + si,
    type: 'number', step: '0.5', min: '0', max: '500', inputmode: 'decimal',
    value: (set.weight !== null && set.weight !== undefined && set.weight !== '') ? String(set.weight) : (block.targetWeight != null ? String(block.targetWeight) : ''),
    placeholder: _isBodyweight ? ((window.isEnglish && window.isEnglish()) ? 'vest' : 'lest') : 'kg',
    disabled: set.validated,
    style: 'width:62px;padding:8px;border:1px solid var(--border);border-radius:2px;font-family:Georgia;font-size:14px;text-align:center;background:var(--ivory);-webkit-appearance:none;' + (_isBodyweight ? 'opacity:0.6;' : ''),
    onclick: function(e) { e.stopPropagation(); },
    oninput: (function(s2, blk2, idx) { return function(e) {
      var newVal = e.target.value;
      s2.weight = newVal;
      // Propagate to all subsequent non-validated sets in this block
      if (blk2 && Array.isArray(blk2.loggedSets)) {
        for (var _pj = idx + 1; _pj < blk2.loggedSets.length; _pj++) {
          if (!blk2.loggedSets[_pj].validated) {
            blk2.loggedSets[_pj].weight = newVal;
            var _pinp = document.getElementById('cs-winp-' + blk2.id + '-' + _pj);
            if (_pinp && !_pinp.disabled) _pinp.value = newVal;
          }
        }
      }
    }; })(set, block, si)
  });
  row.appendChild(wInp2);
  row.appendChild(h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);' }, _isBodyweight ? 'kg (opt.)' : 'kg')); // kg is the same in both languages

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
  row.appendChild(h('span', { style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);' }, 'reps')); // 'reps' is the same in both languages

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
  }, set.validated ? '✓ OK' : ((window.isEnglish && window.isEnglish()) ? 'Log' : 'Valider')));

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
  }, '≈ ' + kcalEst + ' ' + ((window.isEnglish && window.isEnglish()) ? 'kcal estimated' : 'kcal estimées')));
  return wrap;
}

// ─────────────────────────────────────────────
//  PROGRESSION INTELLIGENCE — helpers
// ─────────────────────────────────────────────

// Round to nearest 2.5 kg plate increment
function _csRound25(w) {
  return Math.round((parseFloat(w) || 0) / 2.5) * 2.5;
}

// 1RM estimation: Brzycki (≤6 reps) + Epley (>10 reps), average for 7–10
function _csEstimate1RM(weight, reps) {
  var w = parseFloat(weight) || 0, r = parseInt(reps) || 1;
  if (w <= 0) return 0;
  if (r === 1) return w;
  var brzycki = w * 36 / (37 - r);
  var epley   = w * (1 + r / 30);
  if (r <= 6)  return _csRound25(brzycki);
  if (r <= 10) return _csRound25((brzycki + epley) / 2);
  return _csRound25(epley);
}

// Classify movement: compound_lower, compound_upper, isolation
function _csGetExerciseType(name, muscle) {
  var n = (name || '').toLowerCase()
    .replace(/[éèê]/g,'e').replace(/[àâ]/g,'a').replace(/[ôö]/g,'o').replace(/ç/g,'c');
  if (/squat|deadlift|souleve|leg.press|fente|lunge|hip.thrust|rdl/.test(n)) return 'compound_lower';
  if (/developpe|bench|row|rowing|tirage|traction|pull.?up|chin.?up|dips?|militaire|ohp|shoulder.press|press.strict/.test(n)) return 'compound_upper';
  return 'isolation';
}

// Adaptive rest from exercise type
function _csGetDefaultRest(ex) {
  var t = _csGetExerciseType(ex.n, ex.m);
  if (t === 'compound_lower') return '180s';
  if (t === 'compound_upper') return '120s';
  return '60s';
}

// Plateau detection: last 3 history entries at same weight
function _csIsOnPlateau(exerciseName) {
  var S = window.S;
  var hist = (S && S.muscuProgressionHistory && S.muscuProgressionHistory[exerciseName]) || [];
  if (hist.length < 3) return false;
  var last = hist.slice(-3);
  return last[0].weight === last[1].weight && last[1].weight === last[2].weight;
}

// Double progression + RPE autoregulation → next work weight
// allSetsSucceeded: true if all sets hit targetReps
function _freeSessionNextWeight(exerciseName, allSetsSucceeded, bestWeight, bestReps, targetReps, rpe, exerciseType) {
  var w = parseFloat(bestWeight) || 0;
  if (w <= 0) return null;
  var type = exerciseType || _csGetExerciseType(exerciseName, '');
  var rpeVal = parseInt(rpe) || 0;

  // RPE 10 → deload −2.5%
  if (rpeVal === 10) return _csRound25(w * 0.975);

  // RPE 9 → maintain weight regardless of reps
  if (rpeVal === 9) return w;

  // All sets hit target reps → add weight
  if (allSetsSucceeded) {
    var inc = type === 'compound_lower' ? 5 : type === 'compound_upper' ? 2.5 : 1.25;
    // RPE ≤ 6 → felt too easy, double the increment
    if (rpeVal > 0 && rpeVal <= 6) inc *= 2;
    return _csRound25(w + inc);
  }

  // Reps not fully met → keep weight
  return w;
}

// Warm-up protocol: 40%×10, 55%×6, 70%×4, 85%×2 (only if work weight ≥ 40 kg)
function _csGenerateWarmup(workWeight) {
  var w = parseFloat(workWeight) || 0;
  if (w < 40) return [];
  return [
    { weight: _csRound25(w * 0.40), reps: 10 },
    { weight: _csRound25(w * 0.55), reps: 6  },
    { weight: _csRound25(w * 0.70), reps: 4  },
    { weight: _csRound25(w * 0.85), reps: 2  }
  ].filter(function(s) { return s.weight > 0 && s.weight < w; });
}

// Render warm-up rows inside the active exercise block
function _csRenderWarmupRows(warmupSets, blockId) {
  var h = window.h;
  var _wEN = window.isEnglish && window.isEnglish();
  var wrap = h('div', {
    style: 'padding:4px 12px 6px;border-bottom:1px solid var(--border,#D8D8D0);background:rgba(62,92,58,0.03);'
  });
  wrap.appendChild(h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:8px;letter-spacing:3px;text-transform:uppercase;color:var(--green,#3E5C3A);margin-bottom:6px;padding-top:4px;'
  }, _wEN ? 'WARM-UP SETS' : 'ÉCHAUFFEMENT'));
  warmupSets.forEach(function(ws, wi) {
    var row = h('div', {
      id: 'cs-wu-' + blockId + '-' + wi,
      style: 'display:flex;align-items:center;gap:10px;padding:4px 0;opacity:' + (ws.validated ? '0.45' : '0.85') + ';'
    });
    row.appendChild(h('div', {
      style: 'min-width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;flex-shrink:0;border:1px solid var(--green,#3E5C3A);color:var(--green,#3E5C3A);background:' + (ws.validated ? 'rgba(62,92,58,0.15)' : 'transparent') + ';'
    }, ws.validated ? '✓' : ('W' + (wi + 1))));
    row.appendChild(h('span', {
      style: 'font-family:Georgia,serif;font-size:13px;color:var(--green,#3E5C3A);min-width:54px;'
    }, ws.weight + ' kg'));
    row.appendChild(h('span', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);flex:1;'
    }, '× ' + ws.reps + ' reps'));
    if (!ws.validated) {
      row.appendChild(h('button', {
        style: 'padding:4px 10px;background:transparent;border:1px solid var(--green,#3E5C3A);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;cursor:pointer;color:var(--green,#3E5C3A);white-space:nowrap;',
        onclick: (function(ws2, rowEl) { return function() {
          ws2.validated = true;
          rowEl.style.opacity = '0.45';
          var badge = rowEl.firstChild;
          if (badge) { badge.textContent = '✓'; badge.style.background = 'rgba(62,92,58,0.15)'; }
          var btn = rowEl.lastChild;
          if (btn && btn.tagName === 'BUTTON') btn.style.display = 'none';
        }; })(ws, row)
      }, _wEN ? 'Done' : 'OK'));
    }
    wrap.appendChild(row);
  });
  return wrap;
}

// RPE widget rendered below all validated sets (appears when last set is ticked)
function _csRenderRPEWidget(block, container) {
  var h = window.h;
  var _rEN = window.isEnglish && window.isEnglish();
  if (!Array.isArray(block.loggedSets) || !block.loggedSets.length) return;
  var allValidated = block.loggedSets.every(function(s) { return s.validated; });
  if (!allValidated) return;

  var currentRPE = block._rpe || 0;

  var rpeWrap = h('div', {
    style: 'padding:10px 12px;border-top:1px solid var(--border,#D8D8D0);background:rgba(10,10,9,0.02);'
  });
  rpeWrap.appendChild(h('div', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:8px;'
  }, _rEN ? 'PERCEIVED EFFORT (RPE)' : 'EFFORT PERÇU (RPE)'));

  var rpeLabels = _rEN
    ? { 6: 'Easy', 7: 'Moderate', 8: 'Ideal', 9: 'Very hard', 10: 'Max — deload' }
    : { 6: 'Facile', 7: 'Modéré', 8: 'Idéal', 9: 'Très dur', 10: 'Max — décharge' };

  var rpeRow = h('div', { style: 'display:flex;gap:5px;margin-bottom:8px;' });
  [6,7,8,9,10].forEach(function(rpe) {
    var isSel = currentRPE === rpe;
    rpeRow.appendChild(h('button', {
      style: [
        'flex:1;padding:8px 2px;min-height:40px;',
        'border:1px solid ' + (isSel ? 'var(--ink-900,#0A0A09)' : 'var(--border,#D8D8D0)') + ';',
        'background:' + (isSel ? 'var(--ink-900,#0A0A09)' : 'transparent') + ';',
        'color:' + (isSel ? 'var(--paper,#FAF9F6)' : 'var(--grey,#6B6B65)') + ';',
        'border-radius:2px;font-family:Georgia,serif;font-size:15px;cursor:pointer;',
        'display:flex;flex-direction:column;align-items:center;gap:2px;'
      ].join(''),
      onclick: (function(rpeVal, blkRef) { return function() {
        blkRef._rpe = rpeVal;
        window.CUSTOM_SESSION.saveDraft();
        if (window.render) window.render();
      }; })(rpe, block)
    }, String(rpe)));
  });
  rpeWrap.appendChild(rpeRow);

  if (currentRPE > 0) {
    rpeWrap.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);text-align:center;margin-bottom:8px;'
    }, 'RPE ' + currentRPE + ' — ' + (rpeLabels[currentRPE] || '')));

    // Compute next weight suggestion
    var vs = block.loggedSets.filter(function(s) { return s.validated && parseFloat(s.weight) > 0; });
    if (vs.length) {
      var maxW = vs.reduce(function(m,s) { return Math.max(m, parseFloat(s.weight)||0); }, 0);
      var tr = parseInt(block.reps) || 10;
      var allHit = vs.every(function(s) { return (parseInt(s.reps)||0) >= tr; });
      var nextW = _freeSessionNextWeight(block.n, allHit, maxW, 0, tr, currentRPE, _csGetExerciseType(block.n, block.m));
      if (nextW && nextW >= 0) {
        var diff = nextW - maxW;
        var col = diff > 0 ? 'var(--green,#3E5C3A)' : diff < 0 ? 'var(--orange,#E86F1E)' : 'var(--grey,#6B6B65)';
        var arrow = diff > 0 ? ' ↑' : diff < 0 ? ' ↓' : ' →';
        var nextEl = h('div', {
          style: 'display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--ivory,#FAF9F6);border:1px solid var(--border,#D8D8D0);border-radius:2px;'
        });
        nextEl.appendChild(h('span', {
          style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey,#6B6B65);'
        }, _rEN ? 'Next session →' : 'Prochaine séance →'));
        nextEl.appendChild(h('span', {
          style: 'font-family:Georgia,serif;font-size:16px;font-weight:normal;color:' + col + ';'
        }, nextW + ' kg' + arrow));
        rpeWrap.appendChild(nextEl);
      }
    }
  }

  container.appendChild(rpeWrap);
}

// Coach Card for DONE view — volume, PRs, next targets, plateau warnings, coach tip
function _csRenderCoachCard(draft, container) {
  var h = window.h;
  var S = window.S;
  var _cEN = window.isEnglish && window.isEnglish();

  var exBlocks = draft.blocks.filter(function(b) { return b.type === 'exercise' && Array.isArray(b.loggedSets); });
  if (!exBlocks.length) return;

  var totalVolume = 0, prs = [], nextWeights = [], plateauWarnings = [];
  var prevVolumeMap = {};

  // Gather stats per exercise
  exBlocks.forEach(function(b) {
    var vs = b.loggedSets.filter(function(s) { return s.validated && parseFloat(s.weight) > 0 && parseInt(s.reps) > 0; });
    if (!vs.length) return;

    // Volume this session
    var vol = vs.reduce(function(sum,s) { return sum + (parseFloat(s.weight)||0) * (parseInt(s.reps)||0); }, 0);
    totalVolume += vol;

    // Max weight this session
    var maxW = vs.reduce(function(m,s) { return Math.max(m, parseFloat(s.weight)||0); }, 0);

    // Previous max weight (any past session)
    var log = (S && S.muscuSessionLog) || {};
    var today = new Date().toISOString().slice(0, 10);
    var prevMax = 0;
    Object.keys(log).filter(function(d) { return d < today; }).sort().reverse().slice(0, 30).forEach(function(d) {
      var day = log[d];
      if (day && day[b.n] && Array.isArray(day[b.n])) {
        day[b.n].forEach(function(s) { if ((s.actualWeight||0) > prevMax) prevMax = s.actualWeight; });
      }
    });
    if (maxW > prevMax && prevMax > 0) prs.push({ n: b.n, w: maxW, prev: prevMax });

    // Next weight from RPE
    var rpe = b._rpe || 0;
    var tr = parseInt(b.reps) || 10;
    var allHit = vs.every(function(s) { return (parseInt(s.reps)||0) >= tr; });
    var nextW = _freeSessionNextWeight(b.n, allHit, maxW, 0, tr, rpe, _csGetExerciseType(b.n, b.m));
    if (nextW && nextW > 0) nextWeights.push({ n: b.n, current: maxW, next: nextW, rpe: rpe });

    // Plateau
    if (_csIsOnPlateau(b.n)) plateauWarnings.push(b.n);
  });

  var card = h('div', {
    style: 'border:1px solid var(--border,#D8D8D0);border-radius:2px;margin-bottom:14px;overflow:hidden;'
  });

  // Header
  var cardHdr = h('div', {
    style: 'padding:10px 14px;background:var(--ink-900,#0A0A09);display:flex;align-items:center;gap:10px;'
  });
  cardHdr.appendChild(h('span', {
    style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:var(--paper,#FAF9F6);'
  }, _cEN ? 'COACH ANALYSIS' : 'ANALYSE DU COACH'));
  card.appendChild(cardHdr);

  // PRs section
  if (prs.length > 0) {
    var prSec = h('div', { style: 'padding:10px 14px;border-bottom:1px solid var(--border,#D8D8D0);background:rgba(62,92,58,0.04);' });
    prSec.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--green,#3E5C3A);margin-bottom:8px;'
    }, _cEN ? '🏆 PERSONAL RECORDS' : '🏆 RECORDS PERSONNELS'));
    prs.forEach(function(pr) {
      var prRow = h('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;' });
      prRow.appendChild(h('span', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:58%;'
      }, pr.n));
      prRow.appendChild(h('span', {
        style: 'font-family:Georgia,serif;font-size:13px;color:var(--green,#3E5C3A);white-space:nowrap;'
      }, pr.prev + ' → ' + pr.w + ' kg ↑'));
      prSec.appendChild(prRow);
    });
    card.appendChild(prSec);
  }

  // Next targets table
  if (nextWeights.length > 0) {
    var nwSec = h('div', { style: 'padding:10px 14px;border-bottom:1px solid var(--border,#D8D8D0);' });
    nwSec.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);margin-bottom:8px;'
    }, _cEN ? 'NEXT SESSION TARGETS' : 'OBJECTIFS PROCHAINE SÉANCE'));
    nextWeights.forEach(function(nw) {
      var diff = nw.next - nw.current;
      var col = diff > 0 ? 'var(--green,#3E5C3A)' : diff < 0 ? 'var(--orange,#E86F1E)' : 'var(--grey,#6B6B65)';
      var arrow = diff > 0 ? ' ↑' : diff < 0 ? ' ↓' : ' →';
      var nwRow = h('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;' });
      nwRow.appendChild(h('span', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:58%;color:var(--black,#0A0A09);'
      }, nw.n));
      nwRow.appendChild(h('span', { style: 'font-family:Georgia,serif;font-size:14px;color:' + col + ';white-space:nowrap;' },
        nw.next + ' kg' + arrow + (nw.rpe ? ' (RPE ' + nw.rpe + ')' : '')));
      nwSec.appendChild(nwRow);
    });
    card.appendChild(nwSec);
  }

  // Plateau warnings
  if (plateauWarnings.length > 0) {
    var platSec = h('div', { style: 'padding:10px 14px;border-bottom:1px solid var(--border,#D8D8D0);background:rgba(232,111,30,0.04);' });
    platSec.appendChild(h('div', {
      style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--orange,#E86F1E);margin-bottom:6px;'
    }, _cEN ? '⚠ PLATEAU DETECTED' : '⚠ PLATEAU DÉTECTÉ'));
    plateauWarnings.forEach(function(n) {
      platSec.appendChild(h('div', {
        style: 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--black,#0A0A09);margin-bottom:4px;line-height:1.4;'
      }, _cEN
        ? n + ' — 3 sessions at same weight. Try adding reps or +1.25 kg.'
        : n + ' — 3 séances au même poids. Essayez d\'augmenter les reps ou ajouter +1,25 kg.'));
    });
    card.appendChild(platSec);
  }

  // Coach tip
  var tip = '';
  if (prs.length > 0) {
    tip = _cEN
      ? 'Outstanding! You broke ' + prs.length + ' personal record' + (prs.length > 1 ? 's' : '') + '. Prioritize sleep and protein in the next 24–48 h for optimal recovery.'
      : 'Excellent ! ' + prs.length + ' record' + (prs.length > 1 ? 's personnel' + (prs.length > 1 ? 's' : '') + ' battu' + (prs.length > 1 ? 's' : '') : ' personnel battu') + '. Priorisez le sommeil et les protéines dans les 24–48 h pour maximiser la récupération.';
  } else if (plateauWarnings.length > 0) {
    tip = _cEN
      ? 'Plateaus are normal. Try changing the rep range, reducing rest time by 15 s, or introducing a variation of the exercise to break through.'
      : 'Les plateaux font partie du processus. Essayez de changer les reps, de réduire le repos de 15 s, ou d\'introduire une variante pour progresser.';
  } else if (totalVolume > 0) {
    tip = _cEN
      ? 'Total volume: ' + Math.round(totalVolume) + ' kg lifted. Consistency with progressive overload is the most proven driver of strength gains.'
      : 'Volume total : ' + Math.round(totalVolume) + ' kg soulevés. La régularité avec surcharge progressive est la voie la plus éprouvée pour progresser.';
  }

  if (tip) {
    var tipEl = h('div', {
      style: 'padding:10px 14px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--black,#0A0A09);line-height:1.55;'
    });
    var boldSpan = document.createElement('span');
    boldSpan.style.fontWeight = 'bold';
    boldSpan.textContent = _cEN ? 'Coach : ' : 'Coach : ';
    tipEl.appendChild(boldSpan);
    tipEl.appendChild(document.createTextNode(tip));
    card.appendChild(tipEl);
  }

  container.appendChild(card);
}

// ─────────────────────────────────────────────
//  ÉTAPE 10e : helpers addExercise + addCardio
// ─────────────────────────────────────────────
function _csAddExercise(ex) {
  var parts = String(ex.sets || '4×10').split('×');
  var setsN = parseInt(parts[0]) || 4;
  var repsN = parts.length > 1 ? parts[1].trim() : '10';
  // Use adaptive rest time based on exercise type when no explicit rest defined
  var defaultRest = ex.rest || _csGetDefaultRest(ex);
  window.CUSTOM_SESSION.addBlock({
    type: 'exercise',
    n: ex.n, m: ex.m || '', eq: ex.eq || '',
    sets: setsN, reps: repsN, rest: defaultRest,
    targetWeight: null, loggedSets: [], notes: ''
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



