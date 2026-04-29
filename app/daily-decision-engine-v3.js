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

  // ── Session type diversity layer (Module 5b) ───────────────────────────────
  //
  // Replaces _selectSessionType when lastSessionTypes history is present.
  // Prevents monotony: session type alternates intelligently by fatigue level.
  //
  // Mapping (when history present):
  //   rest            → recovery  (always)
  //   intensity=low   → recovery  (high fatigue — safety, cannot be overridden)
  //   intensity=mod   → hypertrophy / conditioning  (alternate on prev session)
  //   intensity=high + momentum>=6 → strength / conditioning  (alternate)
  //   intensity=high + momentum<6  → goal-based fallback (_selectSessionType)
  //
  // Diversity guard: if last 2 sessions identical and candidate would repeat → force alternate.
  // No history → falls through to _selectSessionType (backward safety).
  //
  // @param  {string}       decision
  // @param  {string}       intensity        'low' | 'moderate' | 'high'
  // @param  {string}       goal
  // @param  {number|null}  momentumScore    0–10 or null
  // @param  {string[]|null} lastSessionTypes last ≤3 session types, oldest first
  function _selectSessionTypeDiverse(decision, intensity, goal, momentumScore, lastSessionTypes) {
    if (decision === 'rest') return 'recovery';

    var last = (Array.isArray(lastSessionTypes) && lastSessionTypes.length > 0)
      ? lastSessionTypes : null;

    // No history → preserve existing logic
    if (!last) return _selectSessionType(decision, intensity, goal);

    // Fatigue safety: low intensity always recovery, diversity cannot override this
    if (intensity === 'low') return 'recovery';

    var prev1 = last[last.length - 1];
    var prev2 = last.length >= 2 ? last[last.length - 2] : null;
    var candidate;

    if (intensity === 'moderate') {
      candidate = (prev1 === 'hypertrophy') ? 'conditioning' : 'hypertrophy';
    } else {
      // intensity === 'high'
      var highMomentum = typeof momentumScore === 'number' && momentumScore >= 6;
      if (highMomentum) {
        candidate = (prev1 === 'strength') ? 'conditioning' : 'strength';
      } else {
        candidate = _selectSessionType(decision, intensity, goal);
      }
    }

    // Diversity guard: last 2 identical and candidate would create triple → force alternate
    if (prev2 !== null && prev1 === prev2 && candidate === prev1) {
      var altMap = {
        hypertrophy:  'conditioning',
        conditioning: (intensity === 'high') ? 'strength' : 'hypertrophy',
        strength:     'conditioning',
        hiit:         'conditioning',
        cardio:       'conditioning',
        mobility:     'recovery'
      };
      candidate = altMap[candidate] || 'conditioning';
    }

    return candidate;
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
      strength:     'Strength session',
      hypertrophy:  'Hypertrophy session',
      conditioning: 'Conditioning session',
      cardio:       'Cardio session',
      hiit:         'HIIT session',
      mobility:     'Mobility/active recovery session',
      recovery:     'Rest day'
    };
    parts.push((typeLabel[sessionType] || sessionType) + ' at ' + intensity + ' intensity');

    return parts.filter(Boolean).join('. ') + '.';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // V3 MODULE 1 — userProfile : validation + normalisation
  // V3 MODULE 2 — momentumScore
  // V3 MODULE 3 — behavior profile detection
  // V3 MODULE 4 — adaptive caps (intensity ceiling adjusted by profile+momentum)
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
  //   overtraining : avgFatigueLast7Days >= 6
  //                  OR (avgFatigueLast7Days >= 4 AND trainingFrequencyLast7Days >= 6)
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
    // Fix 2: raised threshold — avgFat>=4+freq>=4 classified too many disciplined athletes
    if (avgFat !== null && freq7 !== null &&
        (avgFat >= 6 || (avgFat >= 4 && freq7 >= 6))) {
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

  // ── Module 4 : Adaptive Caps ────────────────────────────────────────────────
  //
  // Ajuste le plafond d'intensité calculé par V2 en fonction du profileType
  // et du momentumScore. Appelé APRÈS _applySafetyRules, AVANT le calcul
  // de l'intensité finale.
  //
  // Règles (reductions autorisées même si priorityApplied === 'safety' ;
  //         boosts interdits si priorityApplied === 'safety') :
  //
  //   overtraining  → maxRank - 1 (jamais high)
  //   inconsistent  → cap à moderate (maxRank ≤ 1)
  //   cautious      → cap à moderate (maxRank ≤ 1)
  //   disciplined   → +1 rank (max high) si momentum ≥ 7, rank ≥ 1, !safety
  //   beginner      → cap à moderate si momentum < 4 ET rank > 1
  //
  // adaptationReason est non-null seulement si le rang a réellement changé
  // (ou si boost/cap s'est appliqué).
  // Retourne {maxRank, adaptationReason}.
  // Sans profil ou sur décision 'rest' → pas de changement, reason null.
  function _applyAdaptiveCaps(maxRank, priorityApplied, profileType, momentumScore, hasProfile, decision) {
    // Rest day: no intensity changes, reason depends only on profile presence
    if (decision === 'rest') {
      return { maxRank: maxRank, adaptationReason: hasProfile ? 'Rest day — recovery prioritized' : null };
    }

    // Fix 1: no user profile → bootstrap safety cap (max moderate, unknown user treated as beginner-safe)
    if (!hasProfile) {
      var safeRank = Math.min(maxRank, 1);
      return {
        maxRank:          safeRank,
        adaptationReason: (safeRank < maxRank) ? 'No user profile — beginner-safe cap applied' : null
      };
    }

    var newRank  = maxRank;
    var reason   = null;
    var isSafety = (priorityApplied === 'safety');

    if (profileType === 'overtraining') {
      newRank = Math.max(0, newRank - 1);
      reason  = 'Intensity reduced due to overtraining risk';

    } else if (profileType === 'inconsistent') {
      if (newRank > 1) newRank = 1;
      reason = 'Conservative intensity due to inconsistent training pattern';

    } else if (profileType === 'cautious') {
      if (newRank > 1) newRank = 1;
      reason = 'Moderate intensity for safe progression';

    } else if (profileType === 'disciplined') {
      if (!isSafety && momentumScore !== null && momentumScore >= 7 && newRank >= 1) {
        var boosted = Math.min(newRank + 1, 2);
        if (boosted !== newRank) {
          newRank = boosted;
          reason  = 'Intensity increased due to strong momentum';
        }
      }

    } else if (profileType === 'beginner') {
      if (momentumScore !== null && momentumScore < 4 && newRank > 1) {
        newRank = 1;
      }
      reason = 'Beginner-friendly intensity applied';
    }

    return { maxRank: newRank, adaptationReason: reason };
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

  // ═══════════════════════════════════════════════════════════════════════════
  // V3 MODULE 5 — Coaching Message Layer
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Traduit les sorties du moteur en messages UX premium.
  // Fonction pure — ne modifie aucun champ moteur.
  // Déterministe, aucun appel IA, aucun effet de bord.
  // Strings isolées par cas pour traduction FR/EN future.
  //
  // @param  {Object} engineOutput  Sortie complète de decideDailyPlanV3
  // @return {{ headline, shortMessage, coachingExplanation, userAction, tone }}
  //   tone : "reassuring" | "motivating" | "protective" | "performance"
  function _buildCoachingMessage(engineOutput) {
    var out         = engineOutput || {};
    var decision    = out.decision                || 'train';
    var intensity   = out.recommendedIntensity    || 'moderate';
    var sessionType = out.recommendedSessionType  || 'cardio';
    var fatigue     = typeof out.fatigueEffective === 'number' ? out.fatigueEffective : 3;
    var priority    = out.priorityApplied         || 'goal_alignment';
    var momentum    = (out.momentumScore !== undefined && out.momentumScore !== null)
                      ? out.momentumScore : null;
    var profile     = out.profileType             || 'beginner';

    var sessLabel = ({
      strength:     'musculation',
      hypertrophy:  'hypertrophie',
      conditioning: 'conditionnement',
      cardio:       'cardio',
      hiit:         'HIIT',
      mobility:     'mobilité',
      recovery:     'récupération'
    })[sessionType] || sessionType;

    var intLabel = ({
      low:      'faible',
      moderate: 'modérée',
      high:     'élevée'
    })[intensity] || intensity;

    // ── Repos ───────────────────────────────────────────────────────────────
    if (decision === 'rest') {
      var restExpl;
      if (fatigue >= 5) {
        restExpl = 'Ton niveau de fatigue est élevé. Forcer une séance aujourd\'hui ralentirait ta progression sur les semaines à venir.';
      } else if (fatigue >= 4) {
        restExpl = 'Ta fatigue actuelle dépasse le seuil sécurisé pour l\'entraînement. Une journée de repos préserve ta capacité à performer demain.';
      } else {
        restExpl = 'Ton programme inclut une récupération aujourd\'hui. C\'est un choix stratégique — pas un recul.';
      }
      return {
        headline:            'Séance de récupération au programme',
        shortMessage:        'Ton corps consolide les progrès. Aujourd\'hui, le repos fait partie du plan.',
        coachingExplanation: restExpl,
        userAction:          'Hydrate-toi, étire-toi légèrement, et prépare mentalement ta prochaine séance.',
        tone:                'protective'
      };
    }

    // ── Overtraining ────────────────────────────────────────────────────────
    if (profile === 'overtraining') {
      return {
        headline:            'Intensité adaptée pour protéger tes résultats',
        shortMessage:        'On réduit l\'intensité pour protéger ta progression, pas pour ralentir tes résultats.',
        coachingExplanation: 'Ton historique récent indique une accumulation de fatigue. Une séance de ' + sessLabel + ' à intensité ' + intLabel + ' aujourd\'hui permet à ton corps de consolider les adaptations en cours — sans sacrifier les prochaines semaines.',
        userAction:          'Concentre-toi sur la qualité d\'exécution plutôt que sur l\'effort. Intensité ' + intLabel + ', durée réduite si besoin.',
        tone:                'protective'
      };
    }

    // ── Inconsistant ────────────────────────────────────────────────────────
    if (profile === 'inconsistent') {
      return {
        headline:            'Reprise en douceur',
        shortMessage:        'Une séance aujourd\'hui, même courte, relance ta dynamique.',
        coachingExplanation: 'La régularité se construit une séance à la fois. L\'objectif aujourd\'hui n\'est pas la performance — c\'est simplement d\'y aller. Chaque présence compte.',
        userAction:          'Lance-toi pour une séance de ' + sessLabel + '. La durée importe moins que le fait de commencer.',
        tone:                'reassuring'
      };
    }

    // ── Cautious ────────────────────────────────────────────────────────────
    if (profile === 'cautious') {
      return {
        headline:            'Progression graduelle',
        shortMessage:        'Une intensité maîtrisée aujourd\'hui, pour mieux performer demain.',
        coachingExplanation: 'Ton niveau de fatigue récent invite à la progressivité. Cette séance de ' + sessLabel + ' est conçue pour maintenir l\'élan sans créer de surcharge.',
        userAction:          'Réalise la séance en écoutant tes sensations. L\'écoute de ton corps est une compétence d\'athlète.',
        tone:                'protective'
      };
    }

    // ── Disciplined ─────────────────────────────────────────────────────────
    if (profile === 'disciplined') {
      if (momentum !== null && momentum >= 7) {
        return {
          headline:            'Ta régularité ouvre une séance ambitieuse',
          shortMessage:        'Ta régularité ouvre une séance plus ambitieuse aujourd\'hui.',
          coachingExplanation: 'Ton niveau de constance et ton élan ces 7 derniers jours sont excellents. Les conditions sont réunies pour une séance de ' + sessLabel + ' à intensité ' + intLabel + '.',
          userAction:          'Exploite cette séance pleinement. C\'est le bon moment pour progresser.',
          tone:                'performance'
        };
      }
      return {
        headline:            'Séance solide — tu as le niveau',
        shortMessage:        'Ta régularité porte ses fruits. Continue sur cette lancée.',
        coachingExplanation: 'Ton engagement régulier se reflète dans tes données. Aujourd\'hui est une bonne occasion de consolider cette progression avec une séance de ' + sessLabel + '.',
        userAction:          'Réalise ta séance avec concentration et précision.',
        tone:                'performance'
      };
    }

    // ── Momentum élevé (profil non spécifique) ───────────────────────────────
    if (momentum !== null && momentum >= 7) {
      return {
        headline:            'Élan fort — séance de qualité',
        shortMessage:        'Ton dynamisme récent soutient une séance productive.',
        coachingExplanation: 'Tes indicateurs des 7 derniers jours montrent un bon rythme. Profite de cet élan pour une séance de ' + sessLabel + ' à intensité ' + intLabel + '.',
        userAction:          'Capitalise sur cet élan. Cette séance est une opportunité de progression.',
        tone:                'motivating'
      };
    }

    // ── Momentum faible ──────────────────────────────────────────────────────
    if (momentum !== null && momentum <= 3) {
      return {
        headline:            'Reprise simple et sans pression',
        shortMessage:        'Aujourd\'hui, l\'essentiel est de bouger. Rien de plus.',
        coachingExplanation: 'Le rythme d\'entraînement récent a été limité. Cette séance de ' + sessLabel + ' est conçue pour relancer la dynamique, sans objectif de performance.',
        userAction:          'Démarre simplement. Une séance courte et légère suffit à réenclencher l\'élan.',
        tone:                'reassuring'
      };
    }

    // ── Sécurité ─────────────────────────────────────────────────────────────
    if (priority === 'safety') {
      return {
        headline:            'Séance adaptée — progression protégée',
        shortMessage:        'L\'intensité a été ajustée pour préserver ta progression sur la durée.',
        coachingExplanation: 'Une contrainte de sécurité a encadré l\'intensité d\'aujourd\'hui. C\'est une décision qui protège ta capacité à t\'entraîner régulièrement sur les semaines à venir.',
        userAction:          'Réalise cette séance de ' + sessLabel + ' en te concentrant sur la qualité plutôt que l\'effort.',
        tone:                'protective'
      };
    }

    // ── Défaut ───────────────────────────────────────────────────────────────
    return {
      headline:            'Séance du jour',
      shortMessage:        'Séance de ' + sessLabel + ' à intensité ' + intLabel + ' au programme.',
      coachingExplanation: 'Les conditions sont réunies pour une bonne séance aujourd\'hui. Tes indicateurs sont dans la norme.',
      userAction:          'Donne le meilleur de toi, à ton rythme.',
      tone:                'motivating'
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // V3 MODULE 6 — User Progress & Momentum History Layer
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Input  : userHistory { last7Decisions: string[], last7Momentum: number[] }
  // Output : historyInsights { streak, consistencyScore, momentumTrend, weeklySummary }
  //
  // Pure function — no side effects, deterministic, additive only.
  // Feeds UX only — does NOT influence engine decisions.
  //
  // @param  {Object|null}  userHistory
  // @return {{ streak, consistencyScore, momentumTrend, weeklySummary }}
  function _buildHistoryInsights(userHistory) {
    var NULL_RESULT = { streak: null, consistencyScore: null, momentumTrend: null, weeklySummary: null };
    if (!userHistory || typeof userHistory !== 'object') return NULL_RESULT;

    var decisions = Array.isArray(userHistory.last7Decisions) ? userHistory.last7Decisions : null;
    var momentum  = Array.isArray(userHistory.last7Momentum)  ? userHistory.last7Momentum  : null;

    // ── 1. Streak ─────────────────────────────────────────────────────────────
    // Count consecutive "train" entries from most recent backward.
    var streak = null;
    if (decisions !== null) {
      streak = 0;
      for (var i = decisions.length - 1; i >= 0; i--) {
        if (decisions[i] === 'train') streak++;
        else break;
      }
    }

    // ── 2. Consistency Score (0–10) ───────────────────────────────────────────
    var consistencyScore = null;
    if (decisions !== null) {
      var trainCount = 0;
      for (var j = 0; j < decisions.length; j++) {
        if (decisions[j] === 'train') trainCount++;
      }
      if      (trainCount <= 1)  consistencyScore = 2;
      else if (trainCount <= 3)  consistencyScore = 4;
      else if (trainCount <= 5)  consistencyScore = 6;
      else if (trainCount === 6) consistencyScore = 8;
      else                       consistencyScore = 10; // 7
    }

    // ── 3. Momentum Trend ─────────────────────────────────────────────────────
    var momentumTrend = null;
    if (momentum !== null && momentum.length >= 2) {
      var last = momentum[momentum.length - 1];
      var prev = momentum.slice(0, momentum.length - 1);
      var sum = 0;
      for (var k = 0; k < prev.length; k++) sum += prev[k];
      var avg = sum / prev.length;
      if      (last >= avg + 1) momentumTrend = 'up';
      else if (last <= avg - 1) momentumTrend = 'down';
      else                      momentumTrend = 'stable';
    }

    // ── 4. Weekly Summary (max 2 sentences, French, premium) ─────────────────
    var phrases = [];
    if (streak !== null && streak >= 4)
      phrases.push('Très bonne régularité ces derniers jours.');
    if (consistencyScore !== null && consistencyScore >= 8)
      phrases.push('Ton rythme est solide et structuré.');
    if (consistencyScore !== null && consistencyScore <= 4)
      phrases.push('On relance progressivement la dynamique.');
    if (momentumTrend === 'up')
      phrases.push('Ta dynamique est en progression.');
    if (momentumTrend === 'down')
      phrases.push('Légère baisse de rythme, on ajuste intelligemment.');
    var weeklySummary = phrases.length > 0 ? phrases.slice(0, 2).join(' ') : null;

    return {
      streak:           streak,
      consistencyScore: consistencyScore,
      momentumTrend:    momentumTrend,
      weeklySummary:    weeklySummary
    };
  }

  // ── Module 7 : Predictive Intelligence Layer ──────────────────────────────────
  //
  // Computes forward-looking predictions from userProfile and userHistory.
  // ADDITIVE ONLY — pure function, no side effects, no impact on prior modules.
  // Internally reuses _buildHistoryInsights to derive momentumTrend and streak.
  //
  // @param  {Object|null}  userProfile   Optional V3 userProfile
  // @param  {Object|null}  userHistory   Optional V3 userHistory
  // @return {{ next2Days, fatigueRisk, recommendation }}
  function _buildPredictionInsights(userProfile, userHistory) {
    var safeProfile = (userProfile && typeof userProfile === 'object') ? userProfile : null;
    var safeHistory = (userHistory && typeof userHistory === 'object') ? userHistory : null;

    // Reuse Module 6 internally for momentumTrend + streak
    var histInsights  = _buildHistoryInsights(safeHistory);
    var momentumTrend = histInsights.momentumTrend;
    var streak        = histInsights.streak;

    // ── 1. next2Days ──────────────────────────────────────────────────────────
    // Requires both a valid history object AND a computable momentumTrend (≥2 entries)
    var next2Days = null;
    if (safeHistory !== null && momentumTrend !== null) {
      var decisions    = Array.isArray(safeHistory.last7Decisions) ? safeHistory.last7Decisions : [];
      var lastDecision = decisions.length > 0 ? decisions[decisions.length - 1] : null;
      if (momentumTrend === 'up' && lastDecision === 'train') {
        next2Days = 'increase';
      } else if (momentumTrend === 'down') {
        next2Days = 'decrease';
      } else {
        next2Days = 'stable';
      }
    }

    // ── 2. fatigueRisk ────────────────────────────────────────────────────────
    // null when no profile; null when profile has no relevant numeric fields
    var fatigueRisk = null;
    if (safeProfile !== null) {
      var avgFatigue = typeof safeProfile.avgFatigueLast7Days        === 'number' ? safeProfile.avgFatigueLast7Days        : null;
      var freq7      = typeof safeProfile.trainingFrequencyLast7Days === 'number' ? safeProfile.trainingFrequencyLast7Days : null;
      if (avgFatigue !== null || freq7 !== null) {
        if ((avgFatigue !== null && avgFatigue >= 6) ||
            (freq7 !== null && freq7 >= 6 && streak !== null && streak >= 3)) {
          fatigueRisk = 'high';
        } else if ((avgFatigue !== null && avgFatigue >= 4) ||
                   (freq7 !== null && freq7 >= 4)) {
          fatigueRisk = 'moderate';
        } else {
          fatigueRisk = 'low';
        }
      }
    }

    // ── 3. recommendation (5 cases; fatigue priority > momentum) ─────────────
    var recommendation;
    if (fatigueRisk === 'high') {
      recommendation = "Priorise la récupération ces deux prochains jours. Ton corps en a besoin.";
    } else if (fatigueRisk === 'moderate') {
      recommendation = "Maintiens un effort mesuré — ton corps gère une charge soutenue.";
    } else if (next2Days === 'increase') {
      recommendation = "Ta dynamique est favorable — profites-en pour élever l'intensité.";
    } else if (next2Days === 'decrease') {
      recommendation = "Le rythme tend à fléchir. Consolide la régularité avant d'accélérer.";
    } else {
      recommendation = "Reste régulier. La constance est le fondement de tout progrès.";
    }

    return {
      next2Days:      next2Days,
      fatigueRisk:    fatigueRisk,
      recommendation: recommendation
    };
  }

  // ── Module 8 : Perceived Intelligence Layer ───────────────────────────────────
  //
  // Transforms raw engine signals into a high-end personalized coaching message.
  // UX only — pure, additive, deterministic, no side effects.
  //
  // @param  {Object}  engineOutput  Partial or full engine output object
  // @return {string}  premiumCoachingMessage (2–3 lines, French, premium tone)
  function _buildPremiumCoachingMessage(engineOutput) {
    var out         = (engineOutput && typeof engineOutput === 'object') ? engineOutput : {};
    var decision    = out.decision    || 'train';
    var momentum    = (typeof out.momentumScore === 'number') ? out.momentumScore : null;
    var profileType = out.profileType || null;
    var pred        = (out.predictionInsights && typeof out.predictionInsights === 'object') ? out.predictionInsights : {};
    var fatigueRisk = pred.fatigueRisk || null;
    var next2Days   = pred.next2Days   || null;

    // ── 1. Current State (1 line, priority: fatigue > momentum > profile > default) ─
    var stateLine;
    if (fatigueRisk === 'high') {
      stateLine = "La fatigue commence à limiter ton potentiel aujourd'hui.";
    } else if (momentum !== null && momentum >= 7) {
      stateLine = "Tu es dans une dynamique où chaque séance compte.";
    } else if (profileType === 'inconsistent') {
      stateLine = "Sans régularité, la progression reste instable.";
    } else {
      stateLine = "L'équilibre est bon, mais encore perfectible.";
    }

    // ── 2. Trajectory (1 line; omitted when next2Days is null) ───────────────────
    var trajectoryLine = null;
    if (next2Days === 'increase') {
      trajectoryLine = "Tu peux te permettre d'aller plus loin.";
    } else if (next2Days === 'decrease') {
      trajectoryLine = "Si rien ne change, la progression risque de s'éroder.";
    } else if (next2Days === 'stable') {
      trajectoryLine = "Tu sécurises tes acquis.";
    }

    // ── 3. Action (1 line) ────────────────────────────────────────────────────────
    var actionLine = (decision === 'rest')
      ? "Aujourd'hui, on laisse le corps reconstruire."
      : "Aujourd'hui, on exploite la séance avec précision.";

    // ── Assembly (2–3 lines max, no null) ─────────────────────────────────────────
    var lines = [stateLine];
    if (trajectoryLine !== null) lines.push(trajectoryLine);
    lines.push(actionLine);

    return lines.join('\n');
  }

  // ── Module 9 (UI) : SmartFitCoach Card ───────────────────────────────────────
  //
  // Renders a premium text card from V3 engine output.
  // Pure rendering — no logic, additive only, deterministic, fail-safe.
  //
  // @param  {Object}       engineOutput  Partial or full V3 output object
  // @return {string|null}  Formatted card string; null if any error occurs
  function _buildSmartFitCoachCard(engineOutput) {
    try {
      var out         = (engineOutput && typeof engineOutput === 'object') ? engineOutput : {};
      var decision    = out.decision               || 'train';
      var sessType    = out.recommendedSessionType || '-';
      var intensity   = out.recommendedIntensity   || '-';
      var momentum    = (typeof out.momentumScore === 'number') ? out.momentumScore : null;
      var profileType = out.profileType            || '-';
      var coachMsg    = (typeof out.premiumCoachingMessage === 'string' && out.premiumCoachingMessage.length > 0)
                        ? out.premiumCoachingMessage : '-';

      var momentumStr = (momentum !== null) ? (momentum + ' / 10') : '-';
      var actionText  = (decision === 'rest')
        ? "Laisser le corps récupérer pleinement."
        : "Effectuer la séance prévue avec précision.";

      // ── Intelligence rows (labels padded to 14 chars, colon-aligned) ──────────
      // Séance(6)+8sp=14 | Intensité(9)+5sp=14 | Momentum(8)+6sp=14 | Profil(6)+8sp=14
      var rows = [
        'Séance        : ' + sessType,
        'Intensité     : ' + intensity,
        'Momentum      : ' + momentumStr,
        'Profil        : ' + profileType
      ].join('\n');

      // ── Assembly — one empty line between each of the 4 sections ─────────────
      return [
        'SMARTFITCOACH TODAY',
        '',
        rows,
        '',
        coachMsg,
        '',
        'Action du jour',
        actionText
      ].join('\n');

    } catch (e) {
      return null;
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

    if (!inputs.lastSessionDate || isNaN(new Date(inputs.lastSessionDate).getTime())) {
      throw new TypeError('DDEv3: lastSessionDate must be a valid date string, got: ' + inputs.lastSessionDate);
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
   * decideDailyPlanV3 — Daily Decision Engine v3
   *
   * Tous les inputs V2 sont acceptés, plus :
   * @param {Object}  [inputs.userProfile]
   * @param {number}  [inputs.userProfile.avgFatigueLast7Days]          1.0–5.0
   * @param {number}  [inputs.userProfile.trainingFrequencyLast7Days]    0–7 (entier)
   * @param {Array}   [inputs.userProfile.last7SessionsIntensity]        max 7 éléments
   * @param {number}  [inputs.userProfile.adherenceScore]                0.0–1.0
   * @param {Array}   [inputs.userProfile.lastSessionTypeHistory]        optionnel
   *
   * Champs V3 ajoutés en sortie :
   *   momentumScore    {number|null}   0–10  (null si pas de userProfile)
   *   profileType      {string}        profil comportemental détecté
   *   adaptationReason {string|null}   explication de l'ajustement adaptatif
   *
   * Note : recommendedIntensity peut différer de V2 quand Module 4 s'active.
   *        priorityApplied reflète toujours la logique V2 (inchangé).
   *        _debug.maxAllowedIntensity = plafond V2 pré-adaptatif.
   */
  function decideDailyPlanV3(inputs) {
    _validate(inputs);

    // ── Pipeline V2 (identique) ───────────────────────────────────────────────
    var days      = _daysSince(inputs.lastSessionDate);
    var last3     = _normalizeLast3(inputs.last3SessionsIntensity);
    var phase     = inputs.trainingPhase || 'build';
    var effective = _computeFatigue(inputs.fatigueLevel, inputs.sleepQuality, days);

    var decObj = _computeDecision(effective, inputs.trainingFrequency, days);

    // Fix 3: raw fatigueLevel at maximum (5/5) forces rest — no priority can override
    if (inputs.fatigueLevel >= 5 && decObj.decision !== 'rest') {
      decObj = { decision: 'rest', priority: 'safety', reason: 'Forced rest: raw fatigueLevel at maximum (5/5)' };
    }

    var progression = { triggered: false, reason: null };
    if (decObj.decision === 'train') {
      progression = _applyProgressionRules(last3, effective, phase);
    }

    var ceiling         = _applySafetyRules(
      effective, days, last3[0],
      inputs.trainingFrequency, phase, progression.triggered
    );
    var priorityApplied = decObj.priority || ceiling.priorityApplied;

    // ── Module 2 : momentumScore ──────────────────────────────────────────────
    var momentum = _computeMomentumScore(inputs.userProfile || null);

    // ── Module 3 : profileType ────────────────────────────────────────────────
    var profile = _detectProfileType(inputs.userProfile || null, momentum);

    // ── Module 4 : adaptive caps ──────────────────────────────────────────────
    var hasProfile = (inputs.userProfile !== undefined && inputs.userProfile !== null);
    var adaptive   = _applyAdaptiveCaps(
      ceiling.maxRank, priorityApplied, profile, momentum, hasProfile, decObj.decision
    );

    // ── Intensity / session type / reason (plafond adaptatif) ─────────────────
    var intensity = (decObj.decision === 'rest') ? 'low' : RANK_INTENSITY[adaptive.maxRank];
    var _lastSessTypes = (inputs.userHistory && Array.isArray(inputs.userHistory.lastSessionTypes))
      ? inputs.userHistory.lastSessionTypes.slice(-3) : null;
    var sessType  = _selectSessionTypeDiverse(decObj.decision, intensity, inputs.goal, momentum, _lastSessTypes);
    var reason    = _buildReason(
      decObj, intensity, sessType,
      effective, inputs.fatigueLevel,
      days, priorityApplied, progression.triggered,
      ceiling.capReason, inputs
    );

    // ── Module 6 : history insights ──────────────────────────────────────────
    var historyInsights = _buildHistoryInsights(inputs.userHistory || null);

    // ── Module 7 : predictive intelligence ───────────────────────────────────
    var predictionInsights = _buildPredictionInsights(inputs.userProfile || null, inputs.userHistory || null);

    // ── Module 8 : perceived intelligence ────────────────────────────────────
    var premiumCoachingMessage = _buildPremiumCoachingMessage({
      decision:           decObj.decision,
      momentumScore:      momentum,
      profileType:        profile,
      predictionInsights: predictionInsights,
      historyInsights:    historyInsights
    });

    // ── Module 9 (UI) : SmartFitCoach card ───────────────────────────────────
    var smartfitcoachCard = _buildSmartFitCoachCard({
      decision:               decObj.decision,
      recommendedIntensity:   intensity,
      recommendedSessionType: sessType,
      momentumScore:          momentum,
      profileType:            profile,
      premiumCoachingMessage: premiumCoachingMessage
    });

    // ── Sortie V3 ─────────────────────────────────────────────────────────────
    return {
      // ── V2 fields (priorityApplied/fatigueEffective/progressionTriggered
      //    toujours identiques à V2 ; intensity/sessionType/reason peuvent
      //    différer si Module 4 ajuste le plafond) ──────────────────────────
      decision:               decObj.decision,
      recommendedIntensity:   intensity,
      recommendedSessionType: sessType,
      fatigueEffective:       effective,
      priorityApplied:        priorityApplied,
      progressionTriggered:   progression.triggered,
      reason:                 reason,
      // ── V3 fields ─────────────────────────────────────────────────────────
      momentumScore:          momentum,                   // Module 2 ✓
      profileType:            profile,                    // Module 3 ✓
      adaptationReason:       adaptive.adaptationReason, // Module 4 ✓
      historyInsights:        historyInsights,            // Module 6 ✓
      predictionInsights:     predictionInsights,         // Module 7 ✓
      premiumCoachingMessage: premiumCoachingMessage,     // Module 8 ✓
      smartfitcoachCard:      smartfitcoachCard,          // Module 9 (UI) ✓
      _debug: {
        rawFatigue:          inputs.fatigueLevel,
        effectiveFatigue:    effective,
        daysSince:           days,
        last3:               last3,
        phase:               phase,
        maxAllowedIntensity: RANK_INTENSITY[ceiling.maxRank], // plafond V2 pré-adaptatif
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
    // V3 Module 5b (diversity layer)
    _selectSessionTypeDiverse:        _selectSessionTypeDiverse,
    // V3 Module 1
    _validateUserProfile:             _validateUserProfile,
    _normalizeLast7SessionsIntensity: _normalizeLast7SessionsIntensity,
    _normalizeLastSessionTypeHistory: _normalizeLastSessionTypeHistory,
    // V3 Module 2
    _computeMomentumScore:            _computeMomentumScore,
    // V3 Module 3
    _detectProfileType:               _detectProfileType,
    // V3 Module 4
    _applyAdaptiveCaps:               _applyAdaptiveCaps,
    // V3 Module 5
    _buildCoachingMessage:            _buildCoachingMessage,
    // V3 Module 6
    _buildHistoryInsights:            _buildHistoryInsights,
    // V3 Module 7
    _buildPredictionInsights:         _buildPredictionInsights,
    // V3 Module 8
    _buildPremiumCoachingMessage:     _buildPremiumCoachingMessage,
    // V3 Module 9 (UI)
    _buildSmartFitCoachCard:          _buildSmartFitCoachCard
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DDEv3;
  } else {
    root.DailyDecisionEngineV3 = DDEv3;
  }

}(typeof window !== 'undefined' ? window : global));
