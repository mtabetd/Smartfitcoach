'use strict';
// ─── DAILY DECISION ENGINE v3 ─────────────────────────────────────────────────
// Moteur de décision adaptatif — SmartFitCoach v3
//
// MODULE 1 (this file) :
//   · userProfile optionnel — validation + normalisation
//   · Aucune logique adaptative encore (momentum / profil / caps)
//   · Si userProfile absent → sortie strictement identique à V2
//     (sauf 3 champs nouveaux : momentumScore=null, profileType='beginner',
//      adaptationReason=null)
//
// Prochains modules :
//   · Module 2 : momentumScore
//   · Module 3 : profileType detection
//   · Module 4 : adaptive caps
//
// Garanties :
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

  // ═══════════════════════════════════════════════════════════════════════════
  // V2 CORE — copié à l'identique (garantie de non-régression)
  // ═══════════════════════════════════════════════════════════════════════════

  function _daysSince(lastSessionDate) {
    var last   = new Date(lastSessionDate);
    var today  = new Date();
    var dLast  = new Date(last.getFullYear(),  last.getMonth(),  last.getDate());
    var dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.max(0, Math.round((dToday - dLast) / 86400000));
  }

  function _normalizeLast3(val) {
    if (typeof val === 'string')  return [val];
    if (Array.isArray(val))       return val.slice(0, 3);
    return ['moderate'];
  }

  function _computeFatigue(fatigueLevel, sleepQuality, daysSince) {
    var e = fatigueLevel;
    if (typeof sleepQuality === 'number' && sleepQuality <= 2) e += 1;
    if (daysSince >= 2) e -= 1;
    if (daysSince >= 4) e -= 1;
    return Math.max(1, Math.min(5, e));
  }

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

  function _applyProgressionRules(last3, effectiveFatigue, trainingPhase) {
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

  function _applySafetyRules(effectiveFatigue, daysSince, lastIntensity, trainingFrequency, trainingPhase, progressionTriggered) {
    var maxRank  = 2;
    var priority = null;
    var capReason = null;

    if (trainingPhase === 'taper') {
      maxRank   = Math.min(maxRank, 1);
      priority  = 'goal_alignment';
      capReason = 'taper phase: intensity capped at moderate';
    } else if (trainingPhase === 'restart') {
      maxRank   = Math.min(maxRank, 1);
      priority  = 'goal_alignment';
      capReason = 'restart phase: gradual comeback, max moderate';
    }

    if (lastIntensity === 'high' && daysSince < 3) {
      if (maxRank > 1) {
        maxRank   = 1;
        priority  = 'safety';
        capReason = 'post-high recovery cap (last high session: ' + daysSince + ' day(s) ago, <72h)';
      }
    }

    if (trainingFrequency >= 4 && effectiveFatigue >= 3) {
      if (maxRank > 0) {
        maxRank   = 0;
        priority  = 'frequency_consistency';
        capReason = 'dense schedule (' + trainingFrequency + '/week) + fatigue ' + effectiveFatigue + '/5: recovery session';
      }
    }

    if (effectiveFatigue >= 4) {
      maxRank   = 0;
      priority  = 'safety';
      capReason = 'high effective fatigue (' + effectiveFatigue + '/5): low intensity only';
    } else if (effectiveFatigue === 3 && trainingFrequency < 4) {
      if (maxRank > 1) {
        maxRank   = 1;
        priority  = priority || 'safety';
        capReason = capReason || 'moderate fatigue: soft cap at moderate';
      }
    }

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

  function _selectSessionType(decision, intensity, goal) {
    if (decision === 'rest') return 'recovery';
    if (intensity === 'low')  return 'mobility';
    if (goal === 'muscle_gain') return 'strength';
    if (goal === 'fat_loss') {
      return intensity === 'high' ? 'hiit' : 'cardio';
    }
    return intensity === 'high' ? 'strength' : 'cardio';
  }

  function _buildReason(decObj, intensity, sessionType, effectiveFatigue, rawFatigue, daysSince, priorityApplied, progressionTriggered, capReason, inputs) {
    var parts = [];
    var phase = inputs.trainingPhase || 'build';

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

    if (decObj.decision === 'rest') {
      parts.push(decObj.reason || 'Rest recommended');
      return parts.join('. ') + '.';
    }

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
          parts.push(decObj.reason);
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

  // ═══════════════════════════════════════════════════════════════════════════
  // V3 MODULE 1 — userProfile : validation + normalisation
  // V3 MODULE 2 — momentumScore
  // V3 MODULE 3 — behavior profile detection
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Normalisation de last7SessionsIntensity ───────────────────────────────
  // Tronque à 7 éléments, retourne un tableau ([] si absent).
  function _normalizeLast7SessionsIntensity(val) {
    if (!Array.isArray(val)) return [];
    return val.slice(0, 7);
  }

  // ── Normalisation de lastSessionTypeHistory ───────────────────────────────
  // Tronque à 7 éléments, retourne un tableau ([] si absent).
  function _normalizeLastSessionTypeHistory(val) {
    if (!Array.isArray(val)) return [];
    return val.slice(0, 7);
  }

  // ── Module 2 : Momentum Score (0–10) ────────────────────────────────────────
  //
  // Mesure la dynamique d'entraînement à partir de l'historique des 7 derniers jours.
  // Retourne null si aucun profil utilisateur n'est fourni.
  //
  // Règles (baseline = 5) :
  //   +1  trainingFrequencyLast7Days ≥ 3
  //   +1  adherenceScore ≥ 0.8
  //   +1  last7SessionsIntensity contient au moins un 'high'
  //   −1  adherenceScore < 0.5
  //   −1  avgFatigueLast7Days ≥ 4
  //   −2  trainingFrequencyLast7Days === 0
  //   Résultat clampé entre 0 et 10.
  //
  // Les champs manquants dans userProfile sont ignorés (pas de crash).
  function _computeMomentumScore(userProfile) {
    if (!userProfile) return null;

    var score = 5;

    var freq7     = typeof userProfile.trainingFrequencyLast7Days === 'number'
      ? userProfile.trainingFrequencyLast7Days : null;
    var adherence = typeof userProfile.adherenceScore === 'number'
      ? userProfile.adherenceScore : null;
    var avgFat    = typeof userProfile.avgFatigueLast7Days === 'number'
      ? userProfile.avgFatigueLast7Days : null;
    var last7     = Array.isArray(userProfile.last7SessionsIntensity)
      ? userProfile.last7SessionsIntensity : [];

    if (freq7 !== null && freq7 >= 3)       score += 1;
    if (adherence !== null && adherence >= 0.8) score += 1;
    if (last7.indexOf('high') !== -1)       score += 1;

    if (adherence !== null && adherence < 0.5)  score -= 1;
    if (avgFat    !== null && avgFat >= 4)       score -= 1;
    if (freq7     !== null && freq7 === 0)       score -= 2;

    return Math.max(0, Math.min(10, score));
  }

  // ── Module 3 : Détection du profil comportemental ───────────────────────────
  //
  // Retourne l'un des 5 profils selon les données des 7 derniers jours.
  // Retourne 'beginner' si le profil est absent ou si aucune règle ne s'applique.
  //
  // Hiérarchie (ordre de priorité décroissant) :
  //   overtraining > inconsistent > cautious > disciplined > beginner
  //
  // Règles :
  //   overtraining : avgFatigueLast7Days >= 4  AND trainingFrequencyLast7Days >= 4
  //   disciplined  : adherenceScore >= 0.8     AND trainingFrequencyLast7Days >= 3
  //                  AND avgFatigueLast7Days < 4
  //   inconsistent : adherenceScore < 0.5      OR  trainingFrequencyLast7Days <= 1
  //   cautious     : avgFatigueLast7Days >= 3  AND trainingFrequencyLast7Days <= 2
  //   beginner     : défaut (aucune règle satisfaite)
  //
  // Les champs manquants dans userProfile ne sont pas évalués (pas de crash).
  // momentumScore est accepté pour signature cohérente (usage futur Module 4).
  function _detectProfileType(userProfile, momentumScore) {
    if (!userProfile) return 'beginner';

    var freq7     = typeof userProfile.trainingFrequencyLast7Days === 'number'
      ? userProfile.trainingFrequencyLast7Days : null;
    var adherence = typeof userProfile.adherenceScore === 'number'
      ? userProfile.adherenceScore : null;
    var avgFat    = typeof userProfile.avgFatigueLast7Days === 'number'
      ? userProfile.avgFatigueLast7Days : null;

    // 1. overtraining (priorité maximale)
    if (avgFat !== null && freq7 !== null && avgFat >= 4 && freq7 >= 4) {
      return 'overtraining';
    }

    // 2. inconsistent (adhérence faible OU fréquence très basse)
    var inconsistent = (adherence !== null && adherence < 0.5) ||
                       (freq7     !== null && freq7 <= 1);
    if (inconsistent) return 'inconsistent';

    // 3. cautious (fatigue modérée + fréquence faible)
    if (avgFat !== null && freq7 !== null && avgFat >= 3 && freq7 <= 2) {
      return 'cautious';
    }

    // 4. disciplined (adhérence élevée + fréquence régulière + fatigue contrôlée)
    if (adherence !== null && freq7 !== null && avgFat !== null &&
        adherence >= 0.8 && freq7 >= 3 && avgFat < 4) {
      return 'disciplined';
    }

    return 'beginner';
  }

  // ── Validation du profil utilisateur ────────────────────────────────────────
  function _validateUserProfile(profile) {
    if (typeof profile !== 'object' || profile === null) {
      throw new TypeError('DDEv3: userProfile must be a plain object');
    }

    if (profile.avgFatigueLast7Days !== undefined) {
      var af = profile.avgFatigueLast7Days;
      if (typeof af !== 'number' || af < 1 || af > 5) {
        throw new RangeError('DDEv3: avgFatigueLast7Days must be number 1–5, got: ' + af);
      }
    }

    if (profile.trainingFrequencyLast7Days !== undefined) {
      var tf = profile.trainingFrequencyLast7Days;
      if (typeof tf !== 'number' || tf < 0 || tf > 7 || tf !== Math.floor(tf)) {
        throw new RangeError('DDEv3: trainingFrequencyLast7Days must be integer 0–7, got: ' + tf);
      }
    }

    if (profile.adherenceScore !== undefined) {
      var as_ = profile.adherenceScore;
      if (typeof as_ !== 'number' || as_ < 0 || as_ > 1) {
        throw new RangeError('DDEv3: adherenceScore must be number 0–1, got: ' + as_);
      }
    }

    if (profile.last7SessionsIntensity !== undefined) {
      if (!Array.isArray(profile.last7SessionsIntensity)) {
        throw new TypeError('DDEv3: last7SessionsIntensity must be an array');
      }
      profile.last7SessionsIntensity.forEach(function (v, i) {
        if (VALID_INTENS.indexOf(v) === -1) {
          throw new RangeError('DDEv3: last7SessionsIntensity[' + i + '] must be low|moderate|high, got: ' + v);
        }
      });
    }

    if (profile.lastSessionTypeHistory !== undefined &&
        !Array.isArray(profile.lastSessionTypeHistory)) {
      throw new TypeError('DDEv3: lastSessionTypeHistory must be an array');
    }
  }

  // ── Validation globale (V2 core + userProfile optionnel) ─────────────────────
  function _validate(inputs) {
    if (!inputs || typeof inputs !== 'object') {
      throw new TypeError('DDEv3: inputs must be a plain object');
    }
    var f = inputs.fatigueLevel;
    if (typeof f !== 'number' || f < 1 || f > 5 || f !== Math.floor(f)) {
      throw new RangeError('DDEv3: fatigueLevel must be integer 1–5, got: ' + f);
    }

    var l3 = inputs.last3SessionsIntensity;
    if (typeof l3 === 'string') {
      if (VALID_INTENS.indexOf(l3) === -1) {
        throw new RangeError('DDEv3: last3SessionsIntensity string must be low|moderate|high');
      }
    } else if (Array.isArray(l3)) {
      if (l3.length === 0) throw new RangeError('DDEv3: last3SessionsIntensity array must not be empty');
      l3.slice(0, 3).forEach(function (v) {
        if (VALID_INTENS.indexOf(v) === -1) {
          throw new RangeError('DDEv3: last3SessionsIntensity values must be low|moderate|high, got: ' + v);
        }
      });
    } else {
      throw new TypeError('DDEv3: last3SessionsIntensity must be a string or array');
    }

    if (!inputs.lastSessionDate) {
      throw new TypeError('DDEv3: lastSessionDate is required');
    }
    if (VALID_GOALS.indexOf(inputs.goal) === -1) {
      throw new RangeError('DDEv3: goal must be fat_loss|muscle_gain|maintenance');
    }
    var tf = inputs.trainingFrequency;
    if (typeof tf !== 'number' || tf < 1 || tf > 7 || tf !== Math.floor(tf)) {
      throw new RangeError('DDEv3: trainingFrequency must be integer 1–7, got: ' + tf);
    }
    if (inputs.sleepQuality !== undefined && inputs.sleepQuality !== null) {
      var sq = inputs.sleepQuality;
      if (typeof sq !== 'number' || sq < 1 || sq > 5 || sq !== Math.floor(sq)) {
        throw new RangeError('DDEv3: sleepQuality must be integer 1–5, got: ' + sq);
      }
    }
    if (inputs.trainingPhase !== undefined && inputs.trainingPhase !== null) {
      if (VALID_PHASES.indexOf(inputs.trainingPhase) === -1) {
        throw new RangeError('DDEv3: trainingPhase must be base|build|peak|taper|restart');
      }
    }

    // userProfile est optionnel — validé seulement si fourni
    if (inputs.userProfile !== undefined && inputs.userProfile !== null) {
      _validateUserProfile(inputs.userProfile);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOTEUR PRINCIPAL V3
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * decideDailyPlanV3 — Daily Decision Engine v3 (Module 1)
   *
   * Tous les inputs V2 sont acceptés, plus :
   * @param {Object}  [inputs.userProfile]
   * @param {number}  [inputs.userProfile.avgFatigueLast7Days]        1.0–5.0
   * @param {number}  [inputs.userProfile.trainingFrequencyLast7Days]  0–7 (entier)
   * @param {Array}   [inputs.userProfile.last7SessionsIntensity]      max 7 éléments
   * @param {number}  [inputs.userProfile.adherenceScore]              0.0–1.0
   * @param {Array}   [inputs.userProfile.lastSessionTypeHistory]      optionnel
   *
   * Champs V3 ajoutés en sortie :
   *   momentumScore    {number|null}  0–10 (null si pas de userProfile)
   *   profileType      {'beginner'}   (Module 3)
   *   adaptationReason {null}         (Module 4)
   */
  function decideDailyPlanV3(inputs) {
    _validate(inputs);

    // ── Pipeline V2 (identique) ───────────────────────────────────────────────
    var days      = _daysSince(inputs.lastSessionDate);
    var last3     = _normalizeLast3(inputs.last3SessionsIntensity);
    var phase     = inputs.trainingPhase || 'build';
    var effective = _computeFatigue(inputs.fatigueLevel, inputs.sleepQuality, days);

    var decObj = _computeDecision(effective, inputs.trainingFrequency, days);

    var progression = { triggered: false, reason: null };
    if (decObj.decision === 'train') {
      progression = _applyProgressionRules(last3, effective, phase);
    }

    var ceiling = _applySafetyRules(
      effective, days, last3[0],
      inputs.trainingFrequency, phase, progression.triggered
    );

    var intensity       = (decObj.decision === 'rest') ? 'low' : RANK_INTENSITY[ceiling.maxRank];
    var sessType        = _selectSessionType(decObj.decision, intensity, inputs.goal);
    var priorityApplied = decObj.priority || ceiling.priorityApplied;

    var reason = _buildReason(
      decObj, intensity, sessType,
      effective, inputs.fatigueLevel,
      days, priorityApplied, progression.triggered,
      ceiling.capReason, inputs
    );

    // ── Module 2 : momentumScore ──────────────────────────────────────────────
    var momentum = _computeMomentumScore(inputs.userProfile || null);

    // ── Module 3 : profileType ────────────────────────────────────────────────
    var profile = _detectProfileType(inputs.userProfile || null, momentum);

    // ── Sortie V3 ─────────────────────────────────────────────────────────────
    return {
      // ── V2 fields (inchangés) ──────────────────────────────────────────────
      decision:               decObj.decision,
      recommendedIntensity:   intensity,
      recommendedSessionType: sessType,
      fatigueEffective:       effective,
      priorityApplied:        priorityApplied,
      progressionTriggered:   progression.triggered,
      reason:                 reason,
      // ── V3 fields ─────────────────────────────────────────────────────────
      momentumScore:          momentum,           // Module 2 ✓
      profileType:            profile,            // Module 3 ✓
      adaptationReason:       null,               // Module 4 (stub)
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
  var DDEv3 = {
    decideDailyPlanV3:                decideDailyPlanV3,
    // V2 core re-exporté (test compat)
    _daysSince:                       _daysSince,
    _normalizeLast3:                  _normalizeLast3,
    _computeFatigue:                  _computeFatigue,
    _computeDecision:                 _computeDecision,
    _applyProgressionRules:           _applyProgressionRules,
    _applySafetyRules:                _applySafetyRules,
    _selectSessionType:               _selectSessionType,
    // V3 Module 1
    _validateUserProfile:             _validateUserProfile,
    _normalizeLast7SessionsIntensity: _normalizeLast7SessionsIntensity,
    _normalizeLastSessionTypeHistory: _normalizeLastSessionTypeHistory,
    // V3 Module 2
    _computeMomentumScore:            _computeMomentumScore,
    // V3 Module 3
    _detectProfileType:               _detectProfileType
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DDEv3;
  } else {
    root.DailyDecisionEngineV3 = DDEv3;
  }

}(typeof window !== 'undefined' ? window : global));
