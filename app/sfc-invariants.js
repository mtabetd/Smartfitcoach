/**
 * SmartFitCoach — sfc-invariants.js
 * Moteur d'invariants runtime — vérifie en temps réel que les contrats
 * critiques nutrition / sport / sync / premium sont respectés.
 *
 * Sources scientifiques :
 *   - ISSN 2017   : calories minimales par sexe
 *   - ACSM 2009   : lipides ≥ 15 % des kcal
 *   - IOM 2005    : glucides ≥ 130 g/j (cerveau)
 *   - Helms 2014  : carb cycling
 *   - ACOG 2020   : exercices grossesse T3
 *
 * Usage :
 *   SFCInvariant.setMode('throw');          // dev / test
 *   SFCInvariant.checkNutrition(result, S); // après computeNutritionState()
 *   SFCInvariant.checkSport(program, S);    // après generateSportProgram()
 *   SFCInvariant.checkSync(state);          // avant saveProfile / autosync
 *   SFCInvariant.checkPremium(state);       // à l'évaluation des droits
 */
'use strict';
(function () {

  // ─── Mode d'exécution ────────────────────────────────────────────────────────
  // 'throw' : dev / test — lève une erreur immédiatement
  // 'warn'  : production — log + buffer uniquement
  var _mode = (
    typeof process !== 'undefined' &&
    process.env &&
    process.env.NODE_ENV === 'test'
  ) ? 'throw' : 'warn';

  // ─── Buffer de violations (monitoring) ───────────────────────────────────────
  var _violations = [];

  // ─── Plans premium reconnus (miroir de _SFC_PREMIUM_PLANS dans app-core.js) ──
  var PREMIUM_PLANS = ['unlimited', 'lifetime', 'premium', 'legend', 'champion', 'athlete', 'admin', 'paid'];

  // ─── Regex exercices interdits grossesse T3 (ACOG 2020) ──────────────────────
  var _PREG_T3_FORBIDDEN = /deadlift|bench|saut|jump|burpee/i;

  // ─── Helpers internes ────────────────────────────────────────────────────────

  /**
   * Cœur du moteur : évalue une condition et déclenche la violation si faux.
   * @param {boolean}  condition   – Invariant doit être vrai pour passer.
   * @param {string}   invariantId – Identifiant court, ex. "NUT-01".
   * @param {string}   message     – Description lisible de la violation.
   * @param {object}   [context]   – Données de debug (valeurs mesurées, profil…).
   * @returns {boolean} La valeur de condition (pratique pour les assertions chaînées).
   */
  function _assert(condition, invariantId, message, context) {
    if (!condition) {
      var entry = {
        id:  invariantId,
        msg: message,
        ctx: context || {},
        ts:  Date.now()
      };
      _violations.push(entry);

      // Bridge monitoring externe (SFCMonitor côté navigateur)
      if (typeof window !== 'undefined' && window.SFCMonitor && typeof window.SFCMonitor.reportInvariant === 'function') {
        try { window.SFCMonitor.reportInvariant(entry); } catch (_e) {}
      }

      if (_mode === 'throw') {
        throw new Error('[SFCInvariant] ' + invariantId + ': ' + message);
      }
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[SFCInvariant]', invariantId, message, context);
      }
    }
    return !!condition;
  }

  /** Retourne true si le profil est une femme (sexe = 'femme' ou 'female'). */
  function _isFemale(profile) {
    if (!profile) return false;
    var s = (profile.sex || '').toLowerCase();
    return s === 'femme' || s === 'female' || s === 'f';
  }

  /** Retourne true si le profil indique une grossesse. */
  function _isPregnant(profile) {
    return !!(profile && profile.pregnant);
  }

  // ─── checkNutrition ──────────────────────────────────────────────────────────
  /**
   * Vérifie les invariants nutritionnels sur un résultat computeNutritionState().
   *
   * @param {object} result  – Objet retourné par computeNutritionState / NutritionMaster :
   *   { caloriesTarget, proteinGrams, fatGrams, carbsGrams, caloriesCheck }
   * @param {object} profile – État utilisateur (S) :
   *   { sex, weight, pregnant, sportGoals, … }
   * @param {object} [opts]  – Options avancées :
   *   { carbCyclingType: 'heavy'|'rest', baseCarbsGrams: number }
   */
  function checkNutrition(result, profile, opts) {
    if (!result)  { _assert(false, 'NUT-00', 'checkNutrition: result est null/undefined', {}); return; }
    if (!profile) { _assert(false, 'NUT-00', 'checkNutrition: profile est null/undefined', {}); return; }

    var cal   = result.caloriesTarget;
    var prot  = result.proteinGrams;
    var fat   = result.fatGrams;
    var carbs = result.carbsGrams;
    var check = result.caloriesCheck;
    var w     = profile.weight || profile.weightKg || 0;

    // NUT-01 — Calories minimales (ISSN 2017)
    if (_isPregnant(profile)) {
      _assert(
        cal >= 1800,
        'NUT-01',
        'caloriesTarget (' + cal + ') < 1800 kcal pour femme enceinte (ISSN 2017)',
        { caloriesTarget: cal, pregnant: true }
      );
    } else if (_isFemale(profile)) {
      _assert(
        cal >= 1400,
        'NUT-01',
        'caloriesTarget (' + cal + ') < 1400 kcal pour femme (ISSN 2017)',
        { caloriesTarget: cal, sex: profile.sex }
      );
    } else {
      _assert(
        cal >= 1500,
        'NUT-01',
        'caloriesTarget (' + cal + ') < 1500 kcal pour homme (ISSN 2017)',
        { caloriesTarget: cal, sex: profile.sex }
      );
    }

    // NUT-02 — Protéines ≥ 1.6 g/kg pour muscle / cut / shred (ISSN 2017)
    var _goals = profile.sportGoals || [];
    var _needsHighProt = (
      _goals.indexOf('muscle') !== -1 ||
      _goals.indexOf('cut')    !== -1 ||
      _goals.indexOf('shred')  !== -1
    );
    if (_needsHighProt && w > 0) {
      var _minProt = 1.6 * w;
      _assert(
        prot >= _minProt,
        'NUT-02',
        'proteinGrams (' + prot + ') < 1.6 × ' + w + ' kg = ' + _minProt + ' g (ISSN 2017)',
        { proteinGrams: prot, minRequired: _minProt, weightKg: w, sportGoals: _goals }
      );
    }

    // NUT-03 — Lipides ≥ 15 % des kcal (ACSM 2009)
    if (cal > 0) {
      var _fatPct = (fat * 9) / cal;
      _assert(
        _fatPct >= 0.15,
        'NUT-03',
        'fatGrams × 9 / caloriesTarget = ' + (_fatPct * 100).toFixed(1) + '% < 15% (ACSM 2009)',
        { fatGrams: fat, caloriesTarget: cal, fatPct: _fatPct }
      );
    }

    // NUT-04 — Glucides ≥ 130 g (IOM 2005)
    _assert(
      carbs >= 130,
      'NUT-04',
      'carbsGrams (' + carbs + ') < 130 g — plancher cérébral IOM 2005',
      { carbsGrams: carbs }
    );

    // NUT-05 — Neutralité calorique ±5 % (contrôle cohérence macros)
    if (typeof check === 'number' && cal > 0) {
      var _drift = Math.abs(check - cal) / cal;
      _assert(
        _drift <= 0.05,
        'NUT-05',
        'caloriesCheck (' + check + ') diverge de caloriesTarget (' + cal + ') de ' +
          (_drift * 100).toFixed(1) + '% > 5%',
        { caloriesCheck: check, caloriesTarget: cal, driftPct: _drift }
      );
    }

    // NUT-06 — Carb cycling : heavy day → carbsGrams doit augmenter
    if (opts && opts.carbCyclingType === 'heavy') {
      var _base = opts.baseCarbsGrams;
      if (typeof _base === 'number') {
        _assert(
          carbs > _base,
          'NUT-06',
          'Carb cycling heavy : carbsGrams (' + carbs + ') devrait être > base (' + _base + ')',
          { carbsGrams: carbs, baseCarbsGrams: _base }
        );
      }
    }

    // NUT-07 — Carb cycling : rest day → carbsGrams doit baisser ou atteindre plancher 130
    if (opts && opts.carbCyclingType === 'rest') {
      var _baseR = opts.baseCarbsGrams;
      if (typeof _baseR === 'number') {
        _assert(
          carbs < _baseR || carbs === 130,
          'NUT-07',
          'Carb cycling rest : carbsGrams (' + carbs + ') devrait être < base (' + _baseR + ') ou === 130',
          { carbsGrams: carbs, baseCarbsGrams: _baseR }
        );
      }
    }
  }

  // ─── checkSport ──────────────────────────────────────────────────────────────
  /**
   * Vérifie les invariants du plan sportif généré.
   *
   * @param {Array}  program – Tableau de jours retourné par generateSportProgram().
   *   Chaque entrée : { exercises: [{ n: string, sets: string, ... }], rest?: boolean }
   * @param {object} profile – État utilisateur (S).
   * @param {object} [opts]  – Options :
   *   { muscuCycleDeload: boolean, sfcSymbiosisDeload: boolean,
   *     sessionDuration: '45min'|'1h',
   *     trainingDay: boolean, heavyDayStreakPrev: number, heavyDayStreakNew: number }
   */
  function checkSport(program, profile, opts) {
    if (!profile) { _assert(false, 'SPT-00', 'checkSport: profile est null/undefined', {}); return; }
    opts = opts || {};

    // SPT-01 — Pas de double deload (muscuCycle=deload ET SFCSymbiosis=deload simultanément)
    if (opts.muscuCycleDeload === true && opts.sfcSymbiosisDeload === true) {
      _assert(
        false,
        'SPT-01',
        'Double deload détecté : muscuCycle ET SFCSymbiosis sont tous deux en phase deload',
        { muscuCycleDeload: opts.muscuCycleDeload, sfcSymbiosisDeload: opts.sfcSymbiosisDeload }
      );
    }

    // SPT-02 — Volume minimum par session
    if (program && Array.isArray(program)) {
      var _duration = opts.sessionDuration || (profile && profile.sportSessionDuration) || '1h';
      var _minEx    = _duration === '45min' ? 3 : 4;

      program.forEach(function (day, idx) {
        if (day && day.rest) return; // jour de repos → pas de vérification volume
        var _exCount = Array.isArray(day && day.exercises) ? day.exercises.length : 0;
        _assert(
          _exCount >= _minEx,
          'SPT-02',
          'Jour ' + (idx + 1) + ' : ' + _exCount + ' exercices < minimum ' + _minEx +
            ' pour séance ' + _duration,
          { dayIndex: idx, exerciseCount: _exCount, minRequired: _minEx, duration: _duration }
        );
      });
    }

    // SPT-03 — Grossesse T3 : aucun exercice interdit (ACOG 2020)
    var _pregTri = profile.pregnancyTrimester || (profile.pregnancyWeek >= 28 ? 3 : null);
    if (_isPregnant(profile) && _pregTri === 3 && program && Array.isArray(program)) {
      program.forEach(function (day, dayIdx) {
        if (!day || day.rest) return;
        (day.exercises || []).forEach(function (ex) {
          var _name = ex.n || ex.name || '';
          _assert(
            !_PREG_T3_FORBIDDEN.test(_name),
            'SPT-03',
            'Grossesse T3 : exercice interdit "' + _name + '" (ACOG 2020 — deadlift/bench/saut/jump/burpee)',
            { exerciseName: _name, dayIndex: dayIdx, pregnancyTrimester: 3 }
          );
        });
      });
    }

    // SPT-04 — Plan sportif non vide si sportType défini
    if (profile.sportType) {
      _assert(
        Array.isArray(program) && program.length > 0,
        'SPT-04',
        'sportType "' + profile.sportType + '" défini mais plan sportif vide ou absent',
        { sportType: profile.sportType, programLength: program ? program.length : 0 }
      );
    }

    // SPT-05 — heavyDayStreak ne s'incrémente que si trainingDay === true
    if (
      typeof opts.heavyDayStreakPrev === 'number' &&
      typeof opts.heavyDayStreakNew  === 'number'
    ) {
      var _incremented = opts.heavyDayStreakNew > opts.heavyDayStreakPrev;
      if (_incremented) {
        _assert(
          opts.trainingDay === true,
          'SPT-05',
          'heavyDayStreak a augmenté (' + opts.heavyDayStreakPrev + ' → ' + opts.heavyDayStreakNew +
            ') alors que trainingDay !== true',
          {
            heavyDayStreakPrev: opts.heavyDayStreakPrev,
            heavyDayStreakNew:  opts.heavyDayStreakNew,
            trainingDay:        opts.trainingDay
          }
        );
      }
    }
  }

  // ─── checkSync ───────────────────────────────────────────────────────────────
  /**
   * Vérifie les invariants de synchronisation / persistance.
   *
   * @param {object} state – État runtime :
   *   { _loadCorrupted, _profileDirty, first_login_date, first_login_date_prev,
   *     subscription_end, isPremiumActive }
   */
  function checkSync(state) {
    if (!state) { _assert(false, 'SYN-00', 'checkSync: state est null/undefined', {}); return; }

    // SYN-01 — saveProfile bloquée si _loadCorrupted === true
    if (state._attemptingSave) {
      _assert(
        state._loadCorrupted !== true,
        'SYN-01',
        'saveProfile tentée alors que _loadCorrupted === true — opération doit être bloquée',
        { _loadCorrupted: state._loadCorrupted }
      );
    }

    // SYN-02 — Autosync skip si _profileDirty === false
    if (state._attemptingAutosync) {
      _assert(
        state._profileDirty !== false,
        'SYN-02',
        'Autosync déclenché alors que _profileDirty === false — opération doit être ignorée',
        { _profileDirty: state._profileDirty }
      );
    }

    // SYN-03 — first_login_date ne peut pas régresser dans le temps
    if (
      state.first_login_date !== undefined &&
      state.first_login_date !== null &&
      state.first_login_date_prev !== undefined &&
      state.first_login_date_prev !== null
    ) {
      var _newDate  = new Date(state.first_login_date).getTime();
      var _prevDate = new Date(state.first_login_date_prev).getTime();
      _assert(
        !isNaN(_newDate) && !isNaN(_prevDate) && _newDate >= _prevDate,
        'SYN-03',
        'first_login_date a régressé : ' + state.first_login_date_prev + ' → ' + state.first_login_date,
        { first_login_date: state.first_login_date, first_login_date_prev: state.first_login_date_prev }
      );
    }

    // SYN-04 — subscription_end ne peut pas être dans le passé pour un utilisateur premium actif
    if (state.isPremiumActive && state.subscription_end) {
      var _subEnd = new Date(state.subscription_end).getTime();
      var _now    = Date.now();
      _assert(
        !isNaN(_subEnd) && _subEnd > _now,
        'SYN-04',
        'subscription_end (' + state.subscription_end + ') est dans le passé pour un utilisateur premium actif',
        { subscription_end: state.subscription_end, now: new Date(_now).toISOString() }
      );
    }
  }

  // ─── checkPremium ────────────────────────────────────────────────────────────
  /**
   * Vérifie les invariants du système premium.
   *
   * @param {object} state – État runtime :
   *   { _subStatusReady, subscriptionPlan, isPremiumResult,
   *     requirePremiumResult, isProduction, hasAdminClient }
   */
  function checkPremium(state) {
    if (!state) { _assert(false, 'PRM-00', 'checkPremium: state est null/undefined', {}); return; }

    // PRM-01 — isPremium() retourne false si _subStatusReady !== true
    //          ET subscriptionPlan n'est pas dans PREMIUM_PLANS
    var _planIsRecognised = (
      typeof state.subscriptionPlan === 'string' &&
      PREMIUM_PLANS.indexOf(state.subscriptionPlan) !== -1
    );
    if (!_planIsRecognised && state._subStatusReady !== true) {
      _assert(
        state.isPremiumResult === false,
        'PRM-01',
        'isPremium() a retourné true alors que _subStatusReady !== true et plan "' +
          state.subscriptionPlan + '" non reconnu (fail-closed)',
        { _subStatusReady: state._subStatusReady, subscriptionPlan: state.subscriptionPlan, isPremiumResult: state.isPremiumResult }
      );
    }

    // PRM-02 — requirePremium() refuse toujours en production si admin client absent
    if (state.isProduction === true && state.hasAdminClient === false) {
      _assert(
        state.requirePremiumResult === 503 || state.requirePremiumResult === 'error',
        'PRM-02',
        'requirePremium() doit refuser (503) en production quand admin client est absent',
        { isProduction: state.isProduction, hasAdminClient: state.hasAdminClient, requirePremiumResult: state.requirePremiumResult }
      );
    }
  }

  // ─── API publique ─────────────────────────────────────────────────────────────
  var SFCInvariant = {
    /**
     * Vérifie les invariants nutritionnels.
     * @see checkNutrition
     */
    checkNutrition: checkNutrition,

    /**
     * Vérifie les invariants du plan sportif.
     * @see checkSport
     */
    checkSport: checkSport,

    /**
     * Vérifie les invariants de synchronisation/persistance.
     * @see checkSync
     */
    checkSync: checkSync,

    /**
     * Vérifie les invariants du système premium.
     * @see checkPremium
     */
    checkPremium: checkPremium,

    /**
     * Retourne une copie du buffer de violations accumulées.
     * @returns {Array<{id,msg,ctx,ts}>}
     */
    getViolations: function () {
      return _violations.slice();
    },

    /**
     * Vide le buffer de violations.
     */
    clearViolations: function () {
      _violations = [];
    },

    /**
     * Change le mode d'exécution.
     * @param {'warn'|'throw'} m
     */
    setMode: function (m) {
      if (m === 'throw' || m === 'warn') {
        _mode = m;
      }
    },

    /**
     * Retourne le mode courant.
     * @returns {'warn'|'throw'}
     */
    getMode: function () {
      return _mode;
    },

    /**
     * Liste des plans premium reconnus (lecture seule).
     */
    PREMIUM_PLANS: PREMIUM_PLANS.slice()
  };

  // ─── Export ───────────────────────────────────────────────────────────────────
  if (typeof window !== 'undefined') window.SFCInvariant = SFCInvariant;
  if (typeof module !== 'undefined') module.exports = SFCInvariant;

})();
