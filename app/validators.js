/**
 * SmartFitCoach — Validators (runtime data integrity guards)
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 *
 * Philosophie : ces fonctions tournent AUTOMATIQUEMENT après chaque
 * génération de programme / plan nutrition / swap. Elles détectent les
 * incohérences (doublons, macros fausses, champs manquants) et les
 * auto-corrigent AVANT que l'utilisateur puisse les voir.
 *
 * Chaque validateur retourne : { ok: bool, errors: string[], fixed: bool }
 * - ok = true         → aucune anomalie détectée
 * - fixed = true      → anomalie détectée ET corrigée silencieusement
 * - errors.length > 0 → liste des anomalies (loguées en console.warn)
 */
(function() {
'use strict';

// ══════════════════════════════════════════════════════════════════════
// 1. VALIDATE SPORT PROGRAM — Programme musculation / cardio
// ══════════════════════════════════════════════════════════════════════
//
// Vérifications :
//   a) Structure : tableau non vide, chaque jour a un tableau .exercises
//   b) Doublons intra-jour : aucun exercice ne peut apparaître 2× le même jour
//   c) Champs requis : n, m, sets, rest sur chaque exercice
//   d) Exercices fantômes : n vide / null / undefined
//
// Auto-fix :
//   - Doublons intra-jour : on garde la 1ère occurrence, on supprime les autres
//   - Exercices avec n vide : supprimés
// ──────────────────────────────────────────────────────────────────────
function validateSportProgram(prog) {
  var errors = [];
  var fixed = false;

  if (!Array.isArray(prog)) {
    return { ok: false, errors: ['Programme n\'est pas un tableau'], fixed: false };
  }
  if (prog.length === 0) {
    return { ok: false, errors: ['Programme vide (0 jours)'], fixed: false };
  }

  prog.forEach(function(day, di) {
    if (!day || !Array.isArray(day.exercises)) {
      errors.push('Jour ' + di + ' : structure invalide (exercises manquant)');
      return;
    }

    // Filtrer exercices fantômes (n vide)
    var filtered = day.exercises.filter(function(ex) {
      return ex && typeof ex.n === 'string' && ex.n.trim().length > 0;
    });
    if (filtered.length !== day.exercises.length) {
      errors.push('Jour ' + di + ' : ' + (day.exercises.length - filtered.length) + ' exercice(s) fantôme(s) supprimé(s)');
      day.exercises = filtered;
      fixed = true;
    }

    // Déduplication intra-jour (le bug Rack pull)
    var seen = {};
    var deduped = [];
    var dupRemoved = [];
    day.exercises.forEach(function(ex) {
      var key = (ex.n || '').toLowerCase().trim();
      if (seen[key]) { dupRemoved.push(ex.n); return; }
      seen[key] = true;
      deduped.push(ex);
    });
    if (dupRemoved.length > 0) {
      errors.push('Jour ' + di + ' : doublon(s) supprimé(s) — ' + dupRemoved.join(', '));
      day.exercises = deduped;
      fixed = true;
    }

    // Champs requis sur chaque exercice
    day.exercises.forEach(function(ex, ei) {
      var missing = [];
      if (!ex.n) missing.push('n');
      if (!ex.m) missing.push('m');
      if (!ex.sets) missing.push('sets');
      if (!ex.rest) missing.push('rest');
      if (missing.length > 0) {
        errors.push('Jour ' + di + ' / ex ' + ei + ' (' + (ex.n || '?') + ') : champs manquants — ' + missing.join(', '));
      }
    });
  });

  var ok = errors.length === 0;
  if (!ok && typeof console !== 'undefined' && console.warn) {
    console.warn('[validateSportProgram] ' + errors.length + ' anomalie(s)' + (fixed ? ' (auto-corrigées)' : ''), errors);
  }
  return { ok: ok, errors: errors, fixed: fixed };
}

// ══════════════════════════════════════════════════════════════════════
// 2. VALIDATE WEEK PLAN — Plan nutrition hebdomadaire
// ══════════════════════════════════════════════════════════════════════
//
// Vérifications :
//   a) Structure : tableau non vide (7 jours typiquement), chaque jour est un objet
//   b) Totaux cohérents : kcal/p/g/l du jour = somme des slots
//   c) Macros cohérentes : p*4 + g*4 + l*9 ≈ kcal (à ±10% près)
//   d) Doublons intra-jour : aucun repas avec le même nom dans un jour
//   e) Champs requis : n, k sur chaque meal
//
// Auto-fix :
//   - Totaux incohérents : recalcul automatique
//   - Doublons intra-jour : logué (pas d'auto-fix car ambigu)
// ──────────────────────────────────────────────────────────────────────
var MEAL_SLOTS = ['breakfast', 'lunch', 'snack', 'dinner'];

function validateWeekPlan(plan) {
  var errors = [];
  var fixed = false;

  if (!Array.isArray(plan)) {
    return { ok: false, errors: ['Plan n\'est pas un tableau'], fixed: false };
  }
  if (plan.length === 0) {
    return { ok: false, errors: ['Plan vide (0 jours)'], fixed: false };
  }

  plan.forEach(function(day, di) {
    if (!day || typeof day !== 'object') {
      errors.push('Jour ' + di + ' : pas un objet');
      return;
    }

    // Calcul des sommes réelles
    var sumK = 0, sumP = 0, sumG = 0, sumL = 0;
    var seen = {};
    var dups = [];
    var slotsCount = 0;

    MEAL_SLOTS.forEach(function(slot) {
      var m = day[slot];
      if (!m) return;
      slotsCount++;

      // Champs requis
      if (typeof m.n !== 'string' || m.n.trim().length === 0) {
        errors.push('Jour ' + di + ' / ' + slot + ' : champ n manquant');
      }
      if (typeof m.k !== 'number') {
        errors.push('Jour ' + di + ' / ' + slot + ' (' + (m.n || '?') + ') : champ k manquant ou non numérique');
      }

      sumK += m.k || 0;
      sumP += m.p || 0;
      sumG += m.g || 0;
      sumL += m.l || 0;

      // Doublon intra-jour (même nom de repas dans deux slots)
      var key = (m.n || '').toLowerCase().trim();
      if (key && seen[key]) dups.push(m.n + ' (' + seen[key] + ' ↔ ' + slot + ')');
      else if (key) seen[key] = slot;
    });

    if (dups.length > 0) {
      errors.push('Jour ' + di + ' : doublon(s) de repas — ' + dups.join(', '));
      // Pas d'auto-fix : ambigu de savoir lequel garder
    }

    // Totaux cohérents — auto-fix si écart > 1
    var storedK = day.kcal || 0;
    var storedP = day.p || 0;
    var storedG = day.g || 0;
    var storedL = day.l || 0;

    if (slotsCount > 0) {
      var needsFix = (
        Math.abs(storedK - sumK) > 1 ||
        Math.abs(storedP - sumP) > 1 ||
        Math.abs(storedG - sumG) > 1 ||
        Math.abs(storedL - sumL) > 1
      );
      if (needsFix) {
        errors.push('Jour ' + di + ' : totaux désynchronisés (stockés ' + storedK + '/' + storedP + '/' + storedG + '/' + storedL +
                    ' — calculés ' + sumK + '/' + sumP + '/' + sumG + '/' + sumL + ') — recalcul auto');
        day.kcal = sumK;
        day.p = sumP;
        day.g = sumG;
        day.l = sumL;
        fixed = true;
      }
    }

    // Macros vs kcal (p*4 + g*4 + l*9 ≈ kcal à ±10%)
    if (sumK > 100) {
      var reconstK = sumP * 4 + sumG * 4 + sumL * 9;
      var deviation = Math.abs(reconstK - sumK) / sumK;
      if (deviation > 0.15) {
        errors.push('Jour ' + di + ' : macros incohérentes avec kcal (écart ' + Math.round(deviation * 100) + '%)');
      }
    }
  });

  var ok = errors.length === 0;
  if (!ok && typeof console !== 'undefined' && console.warn) {
    console.warn('[validateWeekPlan] ' + errors.length + ' anomalie(s)' + (fixed ? ' (auto-corrigées)' : ''), errors);
  }
  return { ok: ok, errors: errors, fixed: fixed };
}

// ══════════════════════════════════════════════════════════════════════
// 3. VALIDATE DATA INTEGRITY — Intégrité des données statiques (une fois au boot)
// ══════════════════════════════════════════════════════════════════════
//
// Vérifie les bases de données statiques (EXERCISE_ALTERNATIVES, EXERCISES).
// Tourne une seule fois au démarrage. Toute anomalie est loguée mais NON corrigée
// (la correction doit passer par une modification du code source).
// ──────────────────────────────────────────────────────────────────────
function validateDataIntegrity() {
  var errors = [];
  var warnings = [];

  // 3a. EXERCISE_ALTERNATIVES — pas de doublons croisés
  if (window.EXERCISE_ALTERNATIVES) {
    var EA = window.EXERCISE_ALTERNATIVES;
    var seen = {};
    Object.keys(EA).forEach(function(pool) {
      (EA[pool] || []).forEach(function(ex) {
        var key = (ex.n || '').toLowerCase().trim();
        if (!key) {
          errors.push('EXERCISE_ALTERNATIVES[' + pool + '] : exercice sans nom');
          return;
        }
        if (seen[key]) {
          errors.push('EXERCISE_ALTERNATIVES : doublon "' + ex.n + '" entre pools [' + seen[key] + '] et [' + pool + ']');
        } else {
          seen[key] = pool;
        }
        if (!ex.m || !ex.eq || !ex.sets || !ex.rest) {
          errors.push('EXERCISE_ALTERNATIVES[' + pool + '] : "' + ex.n + '" — champs manquants');
        }
      });
    });
  } else {
    warnings.push('EXERCISE_ALTERNATIVES non exporté');
  }

  // 3b. EXERCISES (base muscu) — structure minimale
  if (window.EXERCISES) {
    Object.keys(window.EXERCISES).forEach(function(group) {
      var list = window.EXERCISES[group] || [];
      list.forEach(function(ex) {
        var name = ex.n || ex.name;
        if (!name) errors.push('EXERCISES[' + group + '] : exercice sans nom');
        if (typeof ex.lv !== 'number') warnings.push('EXERCISES[' + group + '] : "' + name + '" — pas de niveau (lv)');
      });
    });
  }

  if (errors.length > 0 && typeof console !== 'undefined' && console.error) {
    console.error('[validateDataIntegrity] ' + errors.length + ' erreur(s) critique(s) — corrige le code source', errors);
  }
  if (warnings.length > 0 && typeof console !== 'undefined' && console.warn) {
    console.warn('[validateDataIntegrity] ' + warnings.length + ' avertissement(s)', warnings);
  }

  return { ok: errors.length === 0, errors: errors, warnings: warnings };
}

// ══════════════════════════════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════════════════════════════
window.validateSportProgram = validateSportProgram;
window.validateWeekPlan = validateWeekPlan;
window.validateDataIntegrity = validateDataIntegrity;

})();
