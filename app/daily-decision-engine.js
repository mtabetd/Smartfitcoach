'use strict';
// ─── DAILY DECISION ENGINE v1 ─────────────────────────────────────────────────
// Moteur de décision quotidien — SmartFitCoach
//
// Règles métier :
//   · Fatigue ≥4          → repos (ou session légère si fréquence ≤2)
//   · Fatigue = 3         → max moderate
//   · Après session high  → max moderate le lendemain
//   · Fréquence ≥4/sem.  → gestion fatigue plus stricte (fatigue 3 → low)
//   · Sommeil ≤2/5        → +1 fatigue effective
//   · ≥2 jours de repos   → −1 fatigue effective
//
// Garanties :
//   · Fonctions pures — aucun side effect
//   · Déterministe — même input → même output
//   · Testable unitairement (internals exportés)
// ─────────────────────────────────────────────────────────────────────────────

(function (root) {

  // ── Tables de correspondance ────────────────────────────────────────────────
  var INTENSITY_RANK = { low: 0, moderate: 1, high: 2 };
  var RANK_INTENSITY = ['low', 'moderate', 'high'];
  var VALID_GOALS    = ['fat_loss', 'muscle_gain', 'maintenance'];

  // ── 1. Validation des inputs ────────────────────────────────────────────────
  function _validate(inputs) {
    if (!inputs || typeof inputs !== 'object') {
      throw new TypeError('DDE: inputs must be a plain object');
    }
    var f = inputs.fatigueLevel;
    if (typeof f !== 'number' || f < 1 || f > 5 || f !== Math.floor(f)) {
      throw new RangeError('DDE: fatigueLevel must be integer 1–5, got: ' + f);
    }
    if (!Object.prototype.hasOwnProperty.call(INTENSITY_RANK, inputs.lastSessionIntensity)) {
      throw new RangeError('DDE: lastSessionIntensity must be low|moderate|high');
    }
    if (!inputs.lastSessionDate) {
      throw new TypeError('DDE: lastSessionDate is required (Date, timestamp or ISO string)');
    }
    if (VALID_GOALS.indexOf(inputs.goal) === -1) {
      throw new RangeError('DDE: goal must be fat_loss|muscle_gain|maintenance');
    }
    var tf = inputs.trainingFrequency;
    if (typeof tf !== 'number' || tf < 1 || tf > 7 || tf !== Math.floor(tf)) {
      throw new RangeError('DDE: trainingFrequency must be integer 1–7, got: ' + tf);
    }
    if (inputs.sleepQuality !== undefined && inputs.sleepQuality !== null) {
      var sq = inputs.sleepQuality;
      if (typeof sq !== 'number' || sq < 1 || sq > 5 || sq !== Math.floor(sq)) {
        throw new RangeError('DDE: sleepQuality must be integer 1–5, got: ' + sq);
      }
    }
  }

  // ── 2. Jours depuis la dernière séance (jours calendaires entiers) ──────────
  function _daysSince(lastSessionDate) {
    var last  = new Date(lastSessionDate);
    var today = new Date();
    var dLast  = new Date(last.getFullYear(),  last.getMonth(),  last.getDate());
    var dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    var diff   = Math.round((dToday - dLast) / 86400000);
    return Math.max(0, diff); // date future → 0 (traitée comme "déjà fait aujourd'hui")
  }

  // ── 3. Fatigue effective ───────────────────────────────────────────────────
  // Ajuste la fatigue brute avec la qualité du sommeil et les jours de repos.
  function _effectiveFatigue(fatigueLevel, sleepQuality, daysSince) {
    var e = fatigueLevel;
    if (typeof sleepQuality === 'number' && sleepQuality <= 2) e += 1; // mauvais sommeil → +1
    if (daysSince >= 2) e -= 1;   // ≥2 jours de repos → récupération partielle
    if (daysSince >= 4) e -= 1;   // ≥4 jours de repos → récupération supplémentaire
    return Math.max(1, Math.min(5, e));
  }

  // ── 4. Intensité maximale autorisée ───────────────────────────────────────
  // Applique toutes les règles de plafonnement d'intensité.
  function _maxIntensity(lastSessionIntensity, effectiveFatigue, trainingFrequency) {
    var rank = 2; // démarre à 'high', réduit selon les règles

    // Règle A : après high → max moderate
    if (lastSessionIntensity === 'high') rank = Math.min(rank, 1);

    // Règle B : fatigue très haute → max low
    if (effectiveFatigue >= 4) {
      rank = Math.min(rank, 0);
    }
    // Règle C : fatigue modérée → max moderate
    else if (effectiveFatigue === 3) {
      rank = Math.min(rank, 1);
      // Règle D : haute fréquence (≥4/sem) + fatigue 3 → max low (récupération stricte)
      if (trainingFrequency >= 4) rank = Math.min(rank, 0);
    }

    return RANK_INTENSITY[rank];
  }

  // ── 5. Décision : s'entraîner ou se reposer ─────────────────────────────
  function _decision(effectiveFatigue, trainingFrequency, daysSince) {
    // Déjà entraîné aujourd'hui
    if (daysSince === 0) return 'rest';

    // Fatigue extrême → repos systématique (sans exception)
    if (effectiveFatigue >= 5) return 'rest';

    // Fatigue haute (4) : repos sauf si faible fréquence (régularité prioritaire)
    if (effectiveFatigue === 4) {
      return trainingFrequency <= 2 ? 'train' : 'rest';
    }

    // Fatigue ≤3 → s'entraîner
    return 'train';
  }

  // ── 6. Type de séance recommandé ─────────────────────────────────────────
  function _sessionType(decision, intensity, goal) {
    if (decision === 'rest' || intensity === 'low') return 'recovery';
    if (goal === 'muscle_gain')  return 'strength';
    // fat_loss : strength à high (EPOC), cardio à moderate
    if (goal === 'fat_loss')     return intensity === 'high' ? 'strength' : 'cardio';
    // maintenance : strength à high, cardio sinon
    return intensity === 'high' ? 'strength' : 'cardio';
  }

  // ── 7. Explication lisible (raison de la décision) ───────────────────────
  function _buildReason(decision, intensity, sessionType, effectiveFatigue, daysSince, inputs) {
    if (daysSince === 0) {
      return 'You already trained today — rest and recover.';
    }

    if (decision === 'rest') {
      var why = [];
      if (effectiveFatigue >= 5)         why.push('fatigue is very high (' + inputs.fatigueLevel + '/5)');
      else if (effectiveFatigue >= 4)    why.push('fatigue is elevated (' + inputs.fatigueLevel + '/5)');
      if (inputs.sleepQuality && inputs.sleepQuality <= 2) {
        why.push('poor sleep quality (' + inputs.sleepQuality + '/5)');
      }
      if (inputs.trainingFrequency >= 4) why.push('high training frequency requires strict recovery');
      return 'Rest day — ' + (why.join(', ') || 'recovery needed') + '.';
    }

    // Séance recommandée
    var parts = [];
    if (inputs.lastSessionIntensity === 'high') {
      parts.push('Last session was high intensity — capped at ' + intensity + ' today');
    } else if (effectiveFatigue <= 2) {
      var restNote = daysSince >= 2 ? ' (' + daysSince + ' rest days → recovered)' : '';
      parts.push('Low fatigue' + restNote);
    } else {
      parts.push('Moderate fatigue — intensity set to ' + intensity);
    }
    if (inputs.trainingFrequency <= 2) {
      parts.push('low training frequency: regularity prioritized');
    }
    parts.push(sessionType + ' session recommended');
    return parts.join(' · ') + '.';
  }

  // ── MOTEUR PRINCIPAL ────────────────────────────────────────────────────────

  /**
   * decideDailyPlan — Daily Decision Engine v1
   *
   * @param {Object} inputs
   * @param {number}            inputs.fatigueLevel         1–5 (1=frais, 5=épuisé)
   * @param {string}            inputs.lastSessionIntensity 'low'|'moderate'|'high'
   * @param {Date|number|string} inputs.lastSessionDate      date de la dernière séance
   * @param {string}            inputs.goal                 'fat_loss'|'muscle_gain'|'maintenance'
   * @param {number}            inputs.trainingFrequency    séances/semaine (1–7)
   * @param {number}            [inputs.sleepQuality]       1–5 (optionnel)
   *
   * @returns {{
   *   decision:               'train'|'rest',
   *   intensity:              'low'|'moderate'|'high',
   *   recommendedSessionType: 'strength'|'cardio'|'recovery',
   *   reason:                 string,
   *   _debug:                 { effectiveFatigue, daysSinceLastSession, maxAllowedIntensity }
   * }}
   */
  function decideDailyPlan(inputs) {
    _validate(inputs);

    var days      = _daysSince(inputs.lastSessionDate);
    var effective = _effectiveFatigue(inputs.fatigueLevel, inputs.sleepQuality, days);
    var maxInten  = _maxIntensity(inputs.lastSessionIntensity, effective, inputs.trainingFrequency);
    var dec       = _decision(effective, inputs.trainingFrequency, days);
    var intensity = (dec === 'rest') ? 'low' : maxInten;
    var sessType  = _sessionType(dec, intensity, inputs.goal);
    var reason    = _buildReason(dec, intensity, sessType, effective, days, inputs);

    return {
      decision:               dec,
      intensity:              intensity,
      recommendedSessionType: sessType,
      reason:                 reason,
      _debug: {
        effectiveFatigue:     effective,
        daysSinceLastSession: days,
        maxAllowedIntensity:  maxInten
      }
    };
  }

  // ── Export (UMD — fonctionne en browser et Node.js) ────────────────────────
  var DDE = {
    decideDailyPlan:   decideDailyPlan,
    // Internals exportés pour les tests unitaires
    _daysSince:        _daysSince,
    _effectiveFatigue: _effectiveFatigue,
    _maxIntensity:     _maxIntensity,
    _decision:         _decision,
    _sessionType:      _sessionType
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DDE;
  } else {
    root.DailyDecisionEngine = DDE;
  }

}(typeof window !== 'undefined' ? window : global));
