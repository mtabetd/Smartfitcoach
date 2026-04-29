'use strict';
// ─── DAILY DECISION ENGINE v2 ─────────────────────────────────────────────────
// Moteur de décision quotidien — SmartFitCoach v2
//
// AMÉLIORATIONS vs V1 :
//   · Hiérarchie de priorité explicite  (safety > progression > frequency > goal)
//   · Règle A sensible au temps         (cap post-high uniquement si daysSince < 3)
//   · Logique de progression            (2 sessions moderate → high autorisé)
//   · Phase d'entraînement              (taper / restart / base / build / peak)
//   · UX fat_loss corrigée              (high → 'hiit', pas 'strength')
//   · Mobilité active vs récupération   ('mobility' si train+low, 'recovery' si rest)
//   · Explication transparente          (fatigue ajustée → expliquée dans reason)
//   · Historique 3 sessions             (last3SessionsIntensity[])
//
// Garanties (inchangées vs V1) :
//   · Fonctions pures — aucun side effect
//   · Déterministe — même input → même output
//   · Internals exportés pour tests unitaires
// ─────────────────────────────────────────────────────────────────────────────

(function (root) {

  // ── Tables de correspondance ─────────────────────────────────────────────────
  var INTENSITY_RANK = { low: 0, moderate: 1, high: 2 };
  var RANK_INTENSITY = ['low', 'moderate', 'high'];
  var VALID_GOALS    = ['fat_loss', 'muscle_gain', 'maintenance'];
  var VALID_PHASES   = ['base', 'build', 'peak', 'taper', 'restart'];
  var VALID_INTENS   = ['low', 'moderate', 'high'];

  // ── 1. Validation ─────────────────────────────────────────────────────────────
  function _validate(inputs) {
    if (!inputs || typeof inputs !== 'object') {
      throw new TypeError('DDEv2: inputs must be a plain object');
    }
    var f = inputs.fatigueLevel;
    if (typeof f !== 'number' || f < 1 || f > 5 || f !== Math.floor(f)) {
      throw new RangeError('DDEv2: fatigueLevel must be integer 1–5, got: ' + f);
    }

    // last3SessionsIntensity : string (compat V1) ou array de 1-3 strings
    var l3 = inputs.last3SessionsIntensity;
    if (typeof l3 === 'string') {
      if (VALID_INTENS.indexOf(l3) === -1) {
        throw new RangeError('DDEv2: last3SessionsIntensity string must be low|moderate|high');
      }
    } else if (Array.isArray(l3)) {
      if (l3.length === 0) throw new RangeError('DDEv2: last3SessionsIntensity array must not be empty');
      l3.slice(0, 3).forEach(function (v) {
        if (VALID_INTENS.indexOf(v) === -1) {
          throw new RangeError('DDEv2: last3SessionsIntensity values must be low|moderate|high, got: ' + v);
        }
      });
    } else {
      throw new TypeError('DDEv2: last3SessionsIntensity must be a string or array');
    }

    if (!inputs.lastSessionDate) {
      throw new TypeError('DDEv2: lastSessionDate is required');
    }
    if (VALID_GOALS.indexOf(inputs.goal) === -1) {
      throw new RangeError('DDEv2: goal must be fat_loss|muscle_gain|maintenance');
    }
    var tf = inputs.trainingFrequency;
    if (typeof tf !== 'number' || tf < 1 || tf > 7 || tf !== Math.floor(tf)) {
      throw new RangeError('DDEv2: trainingFrequency must be integer 1–7, got: ' + tf);
    }
    if (inputs.sleepQuality !== undefined && inputs.sleepQuality !== null) {
      var sq = inputs.sleepQuality;
      if (typeof sq !== 'number' || sq < 1 || sq > 5 || sq !== Math.floor(sq)) {
        throw new RangeError('DDEv2: sleepQuality must be integer 1–5, got: ' + sq);
      }
    }
    if (inputs.trainingPhase !== undefined && inputs.trainingPhase !== null) {
      if (VALID_PHASES.indexOf(inputs.trainingPhase) === -1) {
        throw new RangeError('DDEv2: trainingPhase must be base|build|peak|taper|restart');
      }
    }
  }

  // ── 2. Jours calendaires depuis la dernière séance ───────────────────────────
  function _daysSince(lastSessionDate) {
    var last   = new Date(lastSessionDate);
    var today  = new Date();
    var dLast  = new Date(last.getFullYear(),  last.getMonth(),  last.getDate());
    var dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.max(0, Math.round((dToday - dLast) / 86400000));
  }

  // ── 3. Normalise last3SessionsIntensity (compat string V1) ───────────────────
  function _normalizeLast3(val) {
    if (typeof val === 'string')  return [val];
    if (Array.isArray(val))       return val.slice(0, 3);
    return ['moderate'];
  }

  // ── 4. Fatigue effective ──────────────────────────────────────────────────────
  // Ajuste la fatigue brute avec la qualité du sommeil et les jours de repos.
  // Identique V1 — logique validée, comportement inchangé.
  function _computeFatigue(fatigueLevel, sleepQuality, daysSince) {
    var e = fatigueLevel;
    if (typeof sleepQuality === 'number' && sleepQuality <= 2) e += 1;
    if (daysSince >= 2) e -= 1;
    if (daysSince >= 4) e -= 1;
    return Math.max(1, Math.min(5, e));
  }

  // ── 5. Décision repos / entraînement ─────────────────────────────────────────
  // Retourne { decision, priority, reason }
  function _computeDecision(effectiveFatigue, trainingFrequency, daysSince) {
    if (daysSince === 0) {
      return { decision: 'rest', priority: 'safety', reason: 'Already trained today' };
    }
    if (effectiveFatigue >= 5) {
      return { decision: 'rest', priority: 'safety', reason: 'Extreme fatigue (' + effectiveFatigue + '/5)' };
    }
    if (effectiveFatigue >= 4) {
      if (trainingFrequency <= 2) {
        return { decision: 'train', priority: 'frequency_consistency',
                 reason: 'Low frequency (' + trainingFrequency + '/week): regularity maintained despite high fatigue' };
      }
      return { decision: 'rest', priority: 'safety',
               reason: 'High fatigue (' + effectiveFatigue + '/5) requires recovery' };
    }
    return { decision: 'train', priority: null, reason: null };
  }

  // ── 6. Signal de progression ──────────────────────────────────────────────────
  // Vérifie si l'historique des 3 dernières séances justifie une montée en intensité.
  // Retourne { triggered, reason }
  //
  // Règles :
  //   · Standard  : 2 sessions consécutives moderate → progression possible
  //   · Phase build : 1 session moderate suffit (phase d'accumulation)
  //   · Bloqué si fatigue effective ≥ 4 (hard safety gate)
  function _applyProgressionRules(last3, effectiveFatigue, trainingPhase) {
    // Hard gate : jamais de progression à haute fatigue
    if (effectiveFatigue >= 4) {
      return { triggered: false, reason: null };
    }

    var twoConsecModerate = last3.length >= 2 &&
      last3[0] === 'moderate' && last3[1] === 'moderate';

    var buildPhaseReady = trainingPhase === 'build' &&
      last3.length >= 1 && last3[0] === 'moderate';

    if (twoConsecModerate) {
      return { triggered: true, reason: '2 consecutive moderate sessions → ready to progress to high' };
    }
    if (buildPhaseReady) {
      return { triggered: true, reason: 'Build phase: moderate session logged → progression threshold met' };
    }

    return { triggered: false, reason: null };
  }

  // ── 7. Plafond d'intensité avec hiérarchie de priorité ───────────────────────
  //
  // CAPS RIGIDES (rien ne les écrase) :
  //   Safety   : fatigue ≥4, Règle A post-high (daysSince <3), freq≥4 + fatigue≥3
  //   Phase    : taper → moderate, restart → moderate
  //
  // CAP SOUPLE (la progression peut l'écraser) :
  //   fatigue = 3 + freq < 4 → moderate (levé si progressionTriggered)
  //
  // Retourne { maxRank, priorityApplied, capReason }
  function _applySafetyRules(effectiveFatigue, daysSince, lastIntensity, trainingFrequency, trainingPhase, progressionTriggered) {
    var maxRank = 2;          // démarre à 'high'
    var priority = null;
    var capReason = null;

    // ── Caps de phase (goal_alignment) ──────────────────────────────────────
    if (trainingPhase === 'taper') {
      maxRank   = Math.min(maxRank, 1);
      priority  = 'goal_alignment';
      capReason = 'taper phase: intensity capped at moderate';
    } else if (trainingPhase === 'restart') {
      maxRank   = Math.min(maxRank, 1);
      priority  = 'goal_alignment';
      capReason = 'restart phase: gradual comeback, max moderate';
    }

    // ── Règle A — sensible au temps (V2 fix) ────────────────────────────────
    // Cap post-high uniquement si daysSince < 3 (72h physiologiques)
    // Après 3 jours, la session high précédente ne limite plus.
    if (lastIntensity === 'high' && daysSince < 3) {
      if (maxRank > 1) {
        maxRank   = 1;
        priority  = 'safety';
        capReason = 'post-high recovery cap (last high session: ' + daysSince + ' day(s) ago, <72h)';
      }
    }

    // ── Cap haute fréquence + fatigue (safety, rigide) ───────────────────────
    // À ≥4 séances/semaine, fatigue 3 est un signal d'accumulation → on protège.
    if (trainingFrequency >= 4 && effectiveFatigue >= 3) {
      if (maxRank > 0) {
        maxRank   = 0;
        priority  = 'frequency_consistency';
        capReason = 'dense schedule (' + trainingFrequency + '/week) + fatigue ' + effectiveFatigue + '/5: recovery session';
      }
    }

    // ── Cap fatigue élevée (safety, rigide) ──────────────────────────────────
    if (effectiveFatigue >= 4) {
      maxRank   = 0;
      priority  = 'safety';
      capReason = 'high effective fatigue (' + effectiveFatigue + '/5): low intensity only';
    }

    // ── Cap fatigue modérée (safety, SOUPLE — la progression peut l'écraser) ─
    // Condition : fatigue = 3, fréquence basse
    // Appliqué systématiquement, puis écrasé si la progression est déclenchée.
    else if (effectiveFatigue === 3 && trainingFrequency < 4) {
      if (maxRank > 1) {
        maxRank   = 1;
        priority  = priority || 'safety';
        capReason = capReason || 'moderate fatigue: soft cap at moderate';
      }
    }

    // Si la progression est déclenchée et que c'est le soft cap qui limitait
    // (priority = 'safety', maxRank = 1 = moderate), la progression l'écrase.
    // Les caps rigides (taper → goal_alignment, fréquence → frequency_consistency)
    // ne sont pas affectés car ils produisent une priorité différente ou maxRank < 1.
    if (progressionTriggered && effectiveFatigue === 3 && trainingFrequency < 4 &&
        priority === 'safety' && maxRank === 1) {
      priority  = 'progression_logic';
      capReason = 'Progression overrides moderate fatigue soft cap → high intensity unlocked';
      maxRank   = 2;
    }

    return {
      maxRank:         maxRank,
      priorityApplied: priority || 'goal_alignment',
      capReason:       capReason || null
    };
  }

  // ── 8. Type de séance ────────────────────────────────────────────────────────
  //
  // V2 ADDITIONS :
  //   · 'hiit'     : fat_loss + high (EPOC + correspond à l'image mentale utilisateur)
  //   · 'mobility' : train + low    (récupération active, différent du repos complet)
  //   · 'recovery' : rest uniquement
  function _selectSessionType(decision, intensity, goal) {
    if (decision === 'rest') return 'recovery';

    if (intensity === 'low')  return 'mobility';   // V2 : 'mobility' au lieu de 'recovery'

    if (goal === 'muscle_gain') return 'strength';

    if (goal === 'fat_loss') {
      return intensity === 'high' ? 'hiit' : 'cardio';  // V2 FIX : high → 'hiit'
    }

    // maintenance
    return intensity === 'high' ? 'strength' : 'cardio';
  }

  // ── 9. Raison explicable ─────────────────────────────────────────────────────
  //
  // V2 FIX : explique l'ajustement de fatigue quand rawFatigue ≠ effectiveFatigue
  function _buildReason(decObj, intensity, sessionType, effectiveFatigue, rawFatigue, daysSince, priorityApplied, progressionTriggered, capReason, inputs) {
    var parts = [];
    var phase = inputs.trainingPhase || 'build';

    // ── 1. Ajustement de fatigue (transparence) ──────────────────────────────
    if (rawFatigue !== effectiveFatigue) {
      var causes = [];
      if (typeof inputs.sleepQuality === 'number' && inputs.sleepQuality <= 2) {
        causes.push('poor sleep (' + inputs.sleepQuality + '/5) +1');
      }
      if (daysSince >= 2) causes.push(daysSince + ' rest days −' + (daysSince >= 4 ? '2' : '1'));
      parts.push(
        'Fatigue adjusted: ' + rawFatigue + ' → ' + effectiveFatigue + '/5' +
        (causes.length ? ' (' + causes.join(', ') + ')' : '')
      );
    }

    // ── 2. Décision principale ────────────────────────────────────────────────
    if (decObj.decision === 'rest') {
      parts.push(decObj.reason || 'Rest recommended');
      return parts.join('. ') + '.';
    }

    // ── 3. Raison basée sur la priorité appliquée ─────────────────────────────
    switch (priorityApplied) {
      case 'safety':
        parts.push(capReason || 'Safety constraint applied');
        break;
      case 'progression_logic':
        parts.push(
          progressionTriggered
            ? 'Progression triggered: body adapted to moderate load, intensity upgraded to ' + intensity
            : 'Progression logic applied'
        );
        break;
      case 'frequency_consistency':
        if (decObj.priority === 'frequency_consistency') {
          parts.push(decObj.reason); // low freq regularity
        } else {
          parts.push(capReason || 'Training frequency constraint applied');
        }
        break;
      case 'goal_alignment':
        if (phase === 'taper') {
          parts.push('Taper phase: conserving energy before competition');
        } else if (phase === 'restart') {
          parts.push('restart/comeback phase: gradual return to training');
        } else {
          parts.push('Session aligned with goal: ' + inputs.goal.replace('_', ' '));
        }
        break;
    }

    // ── 4. Résumé de la recommandation ───────────────────────────────────────
    var typeLabel = {
      strength: 'Strength session',
      cardio:   'Cardio session',
      hiit:     'HIIT session',
      mobility: 'Mobility/active recovery session',
      recovery: 'Rest day'
    };
    parts.push((typeLabel[sessionType] || sessionType) + ' at ' + intensity + ' intensity');

    return parts.filter(Boolean).join('. ') + '.';
  }

  // ── MOTEUR PRINCIPAL ──────────────────────────────────────────────────────────

  /**
   * decideDailyPlanV2 — Daily Decision Engine v2
   *
   * @param {Object} inputs
   * @param {number}               inputs.fatigueLevel            1–5
   * @param {string|string[]}      inputs.last3SessionsIntensity  1-3 valeurs (low|moderate|high)
   * @param {Date|number|string}   inputs.lastSessionDate
   * @param {string}               inputs.goal                    fat_loss|muscle_gain|maintenance
   * @param {number}               inputs.trainingFrequency       1–7
   * @param {number}               [inputs.sleepQuality]          1–5
   * @param {string}               [inputs.trainingPhase]         base|build|peak|taper|restart
   *
   * @returns {{
   *   decision:               'train'|'rest',
   *   recommendedIntensity:   'low'|'moderate'|'high',
   *   recommendedSessionType: 'strength'|'cardio'|'hiit'|'mobility'|'recovery',
   *   fatigueEffective:       number,
   *   priorityApplied:        'safety'|'progression_logic'|'frequency_consistency'|'goal_alignment',
   *   progressionTriggered:   boolean,
   *   reason:                 string,
   *   _debug:                 object
   * }}
   */
  function decideDailyPlanV2(inputs) {
    _validate(inputs);

    var days      = _daysSince(inputs.lastSessionDate);
    var last3     = _normalizeLast3(inputs.last3SessionsIntensity);
    var phase     = inputs.trainingPhase || 'build';
    var effective = _computeFatigue(inputs.fatigueLevel, inputs.sleepQuality, days);

    // 1. Décision repos / entraînement
    var decObj    = _computeDecision(effective, inputs.trainingFrequency, days);

    // 2. Signal de progression (calculé seulement si on s'entraîne)
    var progression = { triggered: false, reason: null };
    if (decObj.decision === 'train') {
      progression = _applyProgressionRules(last3, effective, phase);
    }

    // 3. Plafond d'intensité (hiérarchie complète)
    var ceiling = _applySafetyRules(
      effective, days, last3[0],
      inputs.trainingFrequency, phase, progression.triggered
    );

    // 4. Intensité finale
    var intensity = (decObj.decision === 'rest') ? 'low' : RANK_INTENSITY[ceiling.maxRank];

    // 5. Type de séance
    var sessType = _selectSessionType(decObj.decision, intensity, inputs.goal);

    // 6. Priorité finale : la décision repos prime sur le ceiling si elle a une priorité
    var priorityApplied = decObj.priority || ceiling.priorityApplied;

    // 7. Raison explicable
    var reason = _buildReason(
      decObj, intensity, sessType,
      effective, inputs.fatigueLevel,
      days, priorityApplied, progression.triggered,
      ceiling.capReason, inputs
    );

    return {
      decision:               decObj.decision,
      recommendedIntensity:   intensity,
      recommendedSessionType: sessType,
      fatigueEffective:       effective,
      priorityApplied:        priorityApplied,
      progressionTriggered:   progression.triggered,
      reason:                 reason,
      _debug: {
        rawFatigue:          inputs.fatigueLevel,
        effectiveFatigue:    effective,
        daysSince:           days,
        last3:               last3,
        phase:               phase,
        maxAllowedIntensity: RANK_INTENSITY[ceiling.maxRank],
        capReason:           ceiling.capReason,
        progressionSignal:   progression.reason
      }
    };
  }

  // ── Export (UMD) ──────────────────────────────────────────────────────────────
  var DDEv2 = {
    decideDailyPlanV2:      decideDailyPlanV2,
    _daysSince:             _daysSince,
    _normalizeLast3:        _normalizeLast3,
    _computeFatigue:        _computeFatigue,
    _computeDecision:       _computeDecision,
    _applyProgressionRules: _applyProgressionRules,
    _applySafetyRules:      _applySafetyRules,
    _selectSessionType:     _selectSessionType
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DDEv2;
  } else {
    root.DailyDecisionEngineV2 = DDEv2;
  }

}(typeof window !== 'undefined' ? window : global));
