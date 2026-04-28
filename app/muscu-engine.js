/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */

/**
 * muscu-engine.js — Source unique de vérité du pipeline de génération muscu.
 *
 * UMD : fonctionne en browser (window.sfcBuildMuscuDay) et en Node.js
 * (require('./muscu-engine.js').sfcBuildMuscuDay).
 *
 * Dépendances à passer dans cfg :
 *   cfg.exercises         — window.EXERCISES (ou équivalent Node.js)
 *   cfg.filterMedical     — filterExerciseByMedical(ex, profile) | null
 */
;(function (global, factory) {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    global.sfcBuildMuscuDay = factory().sfcBuildMuscuDay;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this),
function () {
  'use strict';

  // ── Clé de normalisation ────────────────────────────────────────────────
  function _normKey(name) {
    return (name||'')
      .toLowerCase()
      .replace(/[àáâãäå]/g,'a').replace(/[èéêë]/g,'e')
      .replace(/[ìíîï]/g,'i').replace(/[òóôõö]/g,'o')
      .replace(/[ùúûü]/g,'u').replace(/[ç]/g,'c')
      .replace(/\s*\(.*?\)\s*/g,' ')
      .replace(/\b(machine|barre|halteres?|halteères?|c[aâ]ble|ez|unilateral|unilat[eé]ral|bilateral|lest[eé]|strict|inclin[eé])\b/gi,' ')
      .replace(/[\-_\/]/g,' ')
      .replace(/\s+/g,' ').trim();
  }

  // ── Clé mouvement (dédup intra-séance) ──────────────────────────────────
  // Plus agressive que normKey : strip aussi les qualificatifs positionnels
  // pour que "Rowing T-bar" et "T-bar Row Machine" → même empreinte.
  function _movKey(name) {
    var STOP = /\b(seated|assis|standing|debout|couche[e]?|prone|incline[e]?|decline[e]?|haut|bas|avant|arriere|derriere|pieds|pied|large|serre[e]?|etroit[e]?|neutre|du|de|la|le|les|au|aux|par|sur|sous|poids|corps|supination|pronation|prise)\b/g;
    return _normKey(name)
      .replace(/ing\b/g, '')   // rowing→row, pressing→press
      .replace(STOP, '')
      .replace(/\s+/g, ' ').trim();
  }

  function _movTokens(mk) {
    return mk.split(' ').filter(function(t){ return t.length > 2; }).sort();
  }

  // Renvoie true si le candidat duplique un exercice déjà dans selMKs :
  // — via champ `f` (famille DB explicite)
  // — OU via chevauchement de ≥2 tokens significatifs
  function _isMovDup(cand, selMKs) {
    var fam = cand.f || null;
    var ct  = _movTokens(_movKey(cand.n));
    for (var _mi = 0; _mi < selMKs.length; _mi++) {
      if (fam && selMKs[_mi].f && fam === selMKs[_mi].f) return true;
      if (ct.length < 2) continue;
      var et = selMKs[_mi].toks;
      var shorter = ct.length <= et.length ? ct : et;
      if (shorter.length < 2) continue;
      var ls = {};
      (ct.length <= et.length ? et : ct).forEach(function(t){ ls[t] = true; });
      if (shorter.every(function(t){ return !!ls[t]; })) return true;
    }
    return false;
  }

  // ── Détection poids-du-corps ─────────────────────────────────────────────
  function _isBwEx(ex) {
    var eq = (ex.eq||'').toLowerCase().trim(), tg = ex.tags || [];
    return /^poids du corps$/i.test(eq) || tg.indexOf('poids-du-corps') !== -1
        || /barre de traction|barres?\s*parall[èe]les|barre fixe|barre ou poign/.test(eq);
  }

  // ════════════════════════════════════════════════════════════════════════
  // sfcBuildMuscuDay — Pipeline 8 étapes
  //
  // @param {string[]} grps  — groupes musculaires du jour (ex: ['chest','triceps'])
  // @param {Object}   cfg   — configuration complète :
  //   .exercises           {Object}   — dictionnaire EXERCISES[group][]
  //   .filterMedical       {Function} — filterExerciseByMedical(ex, profile) | null
  //   .equipment           {string}   — 'gym' | 'home' | 'dumbbells' | 'none'
  //   .isBeginner          {boolean}
  //   .maxLv               {number}
  //   .durMax              {number}   — nombre max d'exercices
  //   .durSets             {number}   — séries par défaut
  //   .pregTri             {string}   — trimestre grossesse | null
  //   .pregForbidden       {string[]} — mots-clés interdits grossesse
  //   .pregnancyWeek       {number}
  //   .muscuMedical        {Object}   — profil médical muscu
  //   .medRx               {RegExp[]} — filtres médicaux S.medical
  //   .weekUsed            {Object}   — map {normKey: true} des exos déjà utilisés cette semaine
  //   .restOverride        {string}   — forcer repos (ex: '60s')
  //   .hasShred            {boolean}  — objectif perte de gras (reps hautes)
  //   .hasStrength         {boolean}  — objectif force (reps basses)
  //   .repSuffix           {string}   — suffixe séries (ex: ' tempo 3-1-2')
  //   .supersetNote        {string}   — note superset
  //   .cycleFactor         {number}   — facteur intensité cycle (0–1)
  //
  // @returns {Object[]} exercices sélectionnés, annotés _tierKey, sets ajustés
  // ════════════════════════════════════════════════════════════════════════
  function sfcBuildMuscuDay(grps, cfg) {
    var _isGym = !cfg.equipment || cfg.equipment === 'gym';
    var _exDB  = cfg.exercises || {};

    // ── 1 Pool plat ────────────────────────────────────────────────────────
    var _flat = [], _pidx = {};
    grps.forEach(function(g) {
      (_exDB[g] || []).forEach(function(ex) {
        var k = _normKey(ex.n);
        if (_pidx[k]) {
          if (_pidx[k]._grps.indexOf(g) === -1) _pidx[k]._grps.push(g);
        } else {
          var _c = Object.assign({}, ex); _c._grp = g; _c._grps = [g];
          _flat.push(_c); _pidx[k] = _c;
        }
      });
    });

    // ── 2 Filtrage ──────────────────────────────────────────────────────────
    var _f = _flat.filter(function(ex) {
      var eq = (ex.eq||'').toLowerCase(), nm = (ex.n||'').toLowerCase();
      if ((ex.lv||1) > cfg.maxLv) return false;
      if (cfg.equipment && cfg.equipment !== 'gym') {
        if (cfg.equipment === 'home') {
          if (/machine|c[aâ]ble|poulie|presse|smith|station|pec deck|convergente|landmine|t-bar|hack squat/.test(eq+' '+nm)) return false;
          if (!/poids du corps|poids de corps|sans mat|sol|élastique|elastique|halt[eè]re|kettlebell|\bkb\b|banc|barre fixe|barre de traction|aucun/.test(eq+' '+nm)) return false;
        } else if (cfg.equipment === 'dumbbells' || cfg.equipment === 'home_dumbbells') {
          if (/c[aâ]ble|poulie|machine|t-bar|landmine|convergente|pec deck|barre de traction/.test(eq)) return false;
          if (/^barre\b/.test(eq) && !/ou halt|halt[èe]res ou barre/.test(eq)) return false;
        } else if (cfg.equipment === 'none') {
          if (/\bbarre\s*\+|\bbanc\b|machine|smith|pec deck|convergente|landmine|\bt[-\s]?bar\b|c[âa]ble|poulie|hack squat|\brack\b|kettlebell|\bkb\b|halt[èe]res?|\bhaltere\b|\bdisque\b|gh[rd]|chaise romaine|roulette|swiss ball|ab\s+dolly|roue abdominale|trap bar|hex bar/i.test(eq)) return false;
          if (!/poids du corps|poids de corps|sans mat|sol|aucun|barre de traction|barres parall|parall[èe]les|élastique|elastique|gainage|planche|pompe|dips|traction|squat libre|fentes libres|burpee|mountain climber|crunch/.test(eq+' '+nm)) return false;
        }
      }
      if (cfg.pregTri) {
        if (cfg.pregForbidden && cfg.pregForbidden.some(function(fw){ return nm.indexOf(fw.toLowerCase()) !== -1; })) return false;
        if (typeof cfg.pregnancyWeek === 'number' && cfg.pregnancyWeek >= 14 &&
          /d[eé]velopp[eé] couch[eé]|developpe couche|bench press|leg press|presse[\s-]?cuisses|crunch|sit.?up|d[eé]clin[eé]|decline|hip thrust|glute bridge sol|box jump|nordic curl|soulev[eé] de terre|deadlift/.test(nm)) return false;
      }
      if (cfg.muscuMedical && cfg.muscuMedical.done && typeof cfg.filterMedical === 'function') {
        if (!cfg.filterMedical(ex, cfg.muscuMedical)) return false;
      }
      if (cfg.medRx) {
        for (var _ri = 0; _ri < cfg.medRx.length; _ri++) { if (cfg.medRx[_ri].test(nm)) return false; }
      }
      if (cfg.isBeginner && /svend|upright row|hanging knee|zercher|jm press|kroc row|meadows|reverse nordic|copenhagen|jefferson curl|cuban press|arnold press|pistol squat|sissy squat|nordic ham|weighted dips|muscle.?up/i.test(nm)) return false;
      return true;
    });

    // Fallbacks pool trop restreint
    if (!_f.length && cfg.equipment === 'none') {
      _f = _flat.filter(function(ex) {
        return !/machine|c[âa]ble|poulie|pec deck|smith|convergente|\bbarre\s*\+|hack squat|\bt[-\s]?bar\b|landmine/i.test((ex.eq||'').toLowerCase());
      });
    }
    if (!_f.length) {
      _f = _flat.filter(function(ex) {
        if (cfg.muscuMedical && cfg.muscuMedical.done && typeof cfg.filterMedical === 'function')
          return cfg.filterMedical(ex, cfg.muscuMedical);
        return true;
      });
      if (_f.length) console.warn('[SFC] sfcBuildMuscuDay: fallback médical seul', grps);
    }
    if (!_f.length) {
      _f = _flat.slice();
      console.warn('[SFC] sfcBuildMuscuDay: pool totalement vide, fallback brut', grps);
    }

    // Dédup cross-jour : frais d'abord
    var _weekUsed = cfg.weekUsed || {};
    var _fr = _f.filter(function(ex){ return !_weekUsed[_normKey(ex.n)]; });
    var _rp = _f.filter(function(ex){ return  _weekUsed[_normKey(ex.n)]; });
    var _pool = _fr.length >= cfg.durMax ? _fr : (_fr.length > 0 ? _fr.concat(_rp) : _f);

    // ── 3 Classification _tierKey (une seule fois) ─────────────────────────
    _pool.forEach(function(ex) {
      var tg = ex.tags || [], bw = (_isGym && _isBwEx(ex)) ? 1 : 0, base;
      if (cfg.isBeginner) {
        if (tg.indexOf('machine') !== -1 || tg.indexOf('beginner-friendly') !== -1) base = 0;
        else if (/^poids du corps$/i.test((ex.eq||'').trim())) base = 4;
        else base = 2;
        base += (tg.indexOf('compose') !== -1) ? 0 : 1;
      } else {
        if      (tg.indexOf('fondamental')  !== -1) base = 0;
        else if (tg.indexOf('finisher')     !== -1) base = 10;
        else if (tg.indexOf('isolation')    !== -1) base = 8;
        else if (tg.indexOf('compose')      !== -1)
          base = (tg.indexOf('force') !== -1 || tg.indexOf('powerlifting') !== -1) ? 2 : 4;
        else base = 6;
        base += bw;
      }
      ex._tierKey = base;
    });

    // ── 4 TRI GLOBAL UNIQUE ───────────────────────────────────────────────
    _pool.sort(function(a, b) {
      if (a._tierKey !== b._tierKey) return a._tierKey - b._tierKey;
      if ((b.lv||1) !== (a.lv||1))   return (b.lv||1) - (a.lv||1);
      return (a.n||'').localeCompare(b.n||'');
    });

    // ── 5 Sélection quota-aware + coverage-aware ──────────────────────────
    // Quota : hypertrophie/recomposition intermédiaire+ → réserver des slots isolation.
    // Invariant : composés TOUJOURS avant isolations dans la liste finale.
    // Fix FORCE : profil force plafonné à 6 exercices (séance réaliste ~75-90 min).
    var _durEff = (cfg.hasStrength && cfg.durMax > 6) ? 6 : cfg.durMax;
    var _minIso = (!cfg.isBeginner && !cfg.hasStrength)
      ? (_durEff >= 7 ? 2 : 1)
      : 0;
    var _compSlots = _durEff - _minIso;

    var _poolComp = [], _poolIso = [];
    _pool.forEach(function(ex) {
      if (ex._tierKey >= 8 && ex._tierKey < 10) _poolIso.push(ex);
      else _poolComp.push(ex);
    });

    var _selComp = [], _selIso = [], _sn = {}, _cov = {};
    var _selMKs = []; // [{toks, f}] — empreintes mouvements sélectionnés dans la séance
    grps.forEach(function(g){ _cov[g] = false; });

    // Passe 1 : composés
    for (var _i = 0; _i < _poolComp.length && _selComp.length < _compSlots; _i++) {
      var _e = _poolComp[_i], _k = _normKey(_e.n);
      if (_sn[_k]) continue;
      if (_isMovDup(_e, _selMKs)) continue;
      var _slots = _compSlots - _selComp.length;
      var _unc   = grps.filter(function(g){ return !_cov[g]; }).length;
      if (_slots <= _unc && !_e._grps.some(function(g){ return !_cov[g]; })) continue;
      _selComp.push(_e); _sn[_k] = true;
      _e._grps.forEach(function(g){ _cov[g] = true; });
      _weekUsed[_k] = true;
      _selMKs.push({ toks: _movTokens(_movKey(_e.n)), f: _e.f||null });
    }

    // Passe 2 : isolations
    var _isoAdded = 0;
    for (var _j = 0; _j < _poolIso.length && _isoAdded < _minIso; _j++) {
      var _e2 = _poolIso[_j], _k2 = _normKey(_e2.n);
      if (_sn[_k2]) continue;
      if (_isMovDup(_e2, _selMKs)) continue;
      _selIso.push(_e2); _sn[_k2] = true;
      _e2._grps.forEach(function(g){ _cov[g] = true; });
      _weekUsed[_k2] = true;
      _selMKs.push({ toks: _movTokens(_movKey(_e2.n)), f: _e2.f||null });
      _isoAdded++;
    }

    // Fallback composés (pool insuffisant) — toujours AVANT selIso dans le résultat
    var _needed = _durEff - _selComp.length - _selIso.length;
    for (var _fi = 0; _fi < _poolComp.length && _needed > 0; _fi++) {
      var _ef = _poolComp[_fi], _kf = _normKey(_ef.n);
      if (_sn[_kf]) continue;
      if (_isMovDup(_ef, _selMKs)) continue;
      _selComp.push(_ef); _sn[_kf] = true;
      _ef._grps.forEach(function(g){ _cov[g] = true; });
      _weekUsed[_kf] = true;
      _selMKs.push({ toks: _movTokens(_movKey(_ef.n)), f: _ef.f||null });
      _needed--;
    }

    var _sel = _selComp.concat(_selIso);

    // ── 6 Modificateurs de but ────────────────────────────────────────────
    _sel = _sel.map(function(ex, idx) {
      ex = Object.assign({}, ex);
      if (cfg.restOverride) ex.rest = cfg.restOverride;
      if (ex.sets && typeof ex.sets === 'string') {
        if (cfg.hasShred) {
          ex.sets = ex.sets
            .replace(/(×|x)(\d+)-(\d+)/, function(_, sep, r1, r2){ return sep+Math.max(12,parseInt(r1)+2)+'-'+Math.max(15,parseInt(r2)+3); })
            .replace(/(×|x)(\d+)(?![-\d])/, function(_, sep, r){ return sep+Math.max(12,parseInt(r)+3); });
        } else if (cfg.hasStrength) {
          ex.sets = ex.sets
            .replace(/(×|x)(\d+)-(\d+)/, function(_, sep, r1, r2){ return sep+Math.max(3,Math.min(5,parseInt(r1)))+'-'+Math.max(5,Math.min(6,parseInt(r2))); })
            .replace(/(×|x)(\d+)(?![-\d])/, function(_, sep, r){ var nr=parseInt(r); return sep+(nr>6?Math.max(3,nr-3):r); });
        }
      }
      if (cfg.isBeginner && (ex.lv||1) >= 2) {
        var rs = parseInt((ex.rest||'90s').replace(/[^0-9]/g,'')) || 90;
        ex.rest = Math.min(rs+30, 180)+'s';
      }
      if (cfg.pregTri) ex.rest = '90-120s';
      if (cfg.cycleFactor && cfg.cycleFactor < 0.9 && typeof ex.sets === 'string') {
        ex.sets = ex.sets.replace(/^(\d+)/, function(m, n){ return String(Math.max(2, Math.round(parseInt(n)*cfg.cycleFactor))); });
      }
      if (cfg.repSuffix && ex.sets) ex.sets = ex.sets + cfg.repSuffix;
      if (cfg.supersetNote && idx > 0 && idx % 2 === 0 && ex.n) ex.n = ex.n + cfg.supersetNote;
      return ex;
    });

    // ── 7 Ajustement séries par tier ──────────────────────────────────────
    _sel.forEach(function(ex) {
      if (typeof ex.sets !== 'string') return;
      var tg = ex.tags || [];
      var s = (tg.indexOf('finisher')  !== -1) ? Math.max(2, cfg.durSets-2)
            : (tg.indexOf('isolation') !== -1) ? Math.max(2, cfg.durSets-1)
            : cfg.durSets;
      ex.sets = ex.sets.replace(/^\d+/, String(s));
    });

    // ── 8 Validation ──────────────────────────────────────────────────────
    var _dv = {};
    _sel.forEach(function(ex) {
      var k = (ex.n||'').toLowerCase().trim();
      if (_dv[k]) console.error('[SFC] Doublon dans la séance:', ex.n, grps);
      _dv[k] = true;
    });
    grps.forEach(function(g) {
      if (!_cov[g]) console.warn('[SFC] Groupe non couvert:', g, grps);
    });

    return _sel;
  }

  return { sfcBuildMuscuDay: sfcBuildMuscuDay, _normKey: _normKey };
});
