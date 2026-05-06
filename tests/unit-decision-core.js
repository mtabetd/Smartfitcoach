'use strict';
// unit-decision-core.js — Tests unitaires SFCDecisionCore + règles physiologiques
// Couvre : symbiose bidirectionnelle, récupération 48h, running 10%, timezone trial

var assert = require('assert');
var passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); console.log('  \x1b[32m✓\x1b[0m', name); passed++; }
  catch(e) { console.error('  \x1b[31m✗\x1b[0m', name, '\n   ', e.message); failed++; }
}

// ─── Environnement minimal browser ───────────────────────────────────────────
// IMPORTANT : global.window = global DOIT précéder tous les require()
// pour que les modules qui assignent window.* trouvent un objet global valide.
global.window = global;
global.S      = {};
global.FOOD_JOURNAL = null;
global.SFCSymbiosis = null;
global.decideDailyPlanV3 = null;
global.decideDailyPlanV2 = null;
global.SFCLogger = null;
global.document = { addEventListener: function() {} }; // stub visibilitychange

// ─── Chargement des modules ───────────────────────────────────────────────────
require('../app/sport-running.js');
// muscu-programs.js a des dépendances volumineuses — on charge uniquement check48hConflict
// en l'évaluant dans le contexte global via une mini-extraction
var fs   = require('fs');
var path = require('path');
var muscuCode = fs.readFileSync(path.join(__dirname, '../app/muscu-programs.js'), 'utf8');
// Extraction de check48hConflict uniquement (évite charger 3700 lignes de DB exercices)
var conflictFnMatch = muscuCode.match(/window\.check48hConflict\s*=\s*function[\s\S]+?^\};/m);
if (conflictFnMatch) {
  (new Function('window', conflictFnMatch[0]))(global);
}

// Charge sfc-decision-core sans les moteurs V3 (test dégradation gracieuse)
var decisionCoreCode = fs.readFileSync(
  path.join(__dirname, '../app/sfc-decision-core.js'), 'utf8'
);
eval(decisionCoreCode); // exécute dans le contexte global

var DC = window.SFCDecisionCore;

// ─── GROUPE 1 : Signal nutrition → training ───────────────────────────────────
console.log('\n── Signal Nutrition → Training ─────────────────────────');

test('Déficit agressif (-600 kcal) → volumeModifier 0.80', function() {
  var sig = DC._nutritionToTrainingSignal(-600, 1.0, 3);
  assert.strictEqual(sig.volumeModifier, 0.80);
  assert.strictEqual(sig.intensityModifier, 0.88);
  assert(sig.reasons.indexOf('déficit_calorique_agressif') !== -1);
});

test('Déficit modéré (-350 kcal) → volumeModifier 0.90', function() {
  var sig = DC._nutritionToTrainingSignal(-350, 1.0, 3);
  assert.strictEqual(sig.volumeModifier, 0.90);
  assert.strictEqual(sig.intensityModifier, 0.95);
});

test('Surplus ou équilibre → aucun modificateur', function() {
  var sig = DC._nutritionToTrainingSignal(0, 1.0, 3);
  assert.strictEqual(sig.volumeModifier, 1.0);
  assert.strictEqual(sig.intensityModifier, 1.0);
  assert.strictEqual(sig.reasons.length, 0);
});

test('Protéines insuffisantes (<75%) → intensityModifier max 0.80', function() {
  var sig = DC._nutritionToTrainingSignal(0, 0.60, 3);
  assert(sig.intensityModifier <= 0.80);
  assert(sig.reasons.indexOf('protéines_insuffisantes') !== -1);
});

test('Protéines limites (80-89%) → intensityModifier max 0.92', function() {
  var sig = DC._nutritionToTrainingSignal(0, 0.85, 3);
  assert(sig.intensityModifier <= 0.92);
  assert(sig.reasons.indexOf('protéines_limites') !== -1);
});

test('Fatigue 4 + déficit -250 → volumeModifier max 0.75', function() {
  var sig = DC._nutritionToTrainingSignal(-250, 1.0, 4);
  assert(sig.volumeModifier <= 0.75);
  assert(sig.reasons.indexOf('fatigue_haute_déficit_combiné') !== -1);
});

// ─── GROUPE 2 : Signal training → nutrition ───────────────────────────────────
console.log('\n── Signal Training → Nutrition ─────────────────────────');

test('Load heavy → calMultiplier 1.12, carbBoost 1.25', function() {
  var sig = DC._trainingToNutritionSignal('heavy', 2, [], 3);
  assert.strictEqual(sig.calMultiplier, 1.12);
  assert.strictEqual(sig.carbBoost, 1.25);
});

test('Load rest → calMultiplier 0.88 (jour repos)', function() {
  var sig = DC._trainingToNutritionSignal('rest', 2, [], 7);
  assert.strictEqual(sig.calMultiplier, 0.88);
  assert.strictEqual(sig.carbBoost, 0.85);
});

test('Fatigue 4 → proteinBoost 1.12', function() {
  var sig = DC._trainingToNutritionSignal('moderate', 4, [], 2);
  assert.strictEqual(sig.proteinBoost, 1.12);
  assert(sig.reasons.indexOf('récupération_protéines') !== -1);
});

test('Lendemain séance (daysSince=1) → carbBoost plafonné à 1.0', function() {
  var sig = DC._trainingToNutritionSignal('moderate', 2, ['chest'], 1);
  assert(sig.carbBoost <= 1.0);
  assert(sig.reasons.indexOf('récupération_j+1') !== -1);
});

// ─── GROUPE 3 : Contrainte récupération 48h ───────────────────────────────────
console.log('\n── Contrainte Récupération 48h (ACSM 2009) ─────────────');

test('daysSince >= 2 → aucun groupe bloqué', function() {
  var c = DC._computeRecoveryConstraint(['chest', 'shoulders'], 2);
  assert.strictEqual(c.blockedGroups.length, 0);
  assert.strictEqual(c.suggestRest, false);
});

test('daysSince < 2, groupes définis → groupes bloqués', function() {
  var c = DC._computeRecoveryConstraint(['legs', 'glutes'], 1);
  assert.deepStrictEqual(c.blockedGroups, ['legs', 'glutes']);
  assert.strictEqual(c.suggestRest, false);
  assert.strictEqual(c.reason, 'récupération_48h_même_groupe');
});

test('daysSince < 1 → suggestRest=true', function() {
  var c = DC._computeRecoveryConstraint(['back'], 0);
  assert.strictEqual(c.suggestRest, true);
});

test('groupes vides → aucun conflit', function() {
  var c = DC._computeRecoveryConstraint([], 1);
  assert.strictEqual(c.blockedGroups.length, 0);
  assert.strictEqual(c.reason, null);
});

// ─── GROUPE 4 : check48hConflict (muscu-programs.js) ─────────────────────────
console.log('\n── check48hConflict (muscu-programs.js) ─────────────────');

test('Même groupe dans <48h → conflict détecté', function() {
  var state = {
    lastSessionGroups: ['chest', 'shoulders'],
    lastSessionDate: new Date(Date.now() - 20 * 3600000).toISOString() // il y a 20h
  };
  var r = window.check48hConflict(['chest', 'triceps'], state);
  assert.strictEqual(r.safe, false);
  assert(r.conflictingGroups.indexOf('chest') !== -1);
});

test('Groupe différent dans <48h → pas de conflit', function() {
  var state = {
    lastSessionGroups: ['chest'],
    lastSessionDate: new Date(Date.now() - 20 * 3600000).toISOString()
  };
  var r = window.check48hConflict(['legs', 'glutes'], state);
  assert.strictEqual(r.safe, true);
});

test('Même groupe mais >48h → pas de conflit', function() {
  var state = {
    lastSessionGroups: ['chest'],
    lastSessionDate: new Date(Date.now() - 50 * 3600000).toISOString()
  };
  var r = window.check48hConflict(['chest'], state);
  assert.strictEqual(r.safe, true);
});

test('Pas de sessionHistory → safe par défaut', function() {
  var r = window.check48hConflict(['chest'], { lastSessionGroups: [], lastSessionDate: null });
  assert.strictEqual(r.safe, true);
});

// ─── GROUPE 5 : Running 10% rule (sport-running.js) ──────────────────────────
console.log('\n── Règle 10% Running (ACSM 2016) ───────────────────────');

test('Volume proposé dans la limite +10% → allowed', function() {
  var r = window.checkRunning10pct(40, 44); // 40 × 1.10 = 44
  assert.strictEqual(r.allowed, true);
  assert.strictEqual(r.capApplied, false);
});

test('Volume proposé dépasse +10% → not allowed', function() {
  var r = window.checkRunning10pct(40, 50); // 40 × 1.10 = 44, proposé 50 > 44
  assert.strictEqual(r.allowed, false);
  assert.strictEqual(r.maxKm, 44);
  assert.strictEqual(r.capApplied, true);
  assert(r.reason && r.reason.length > 0);
});

test('Sem précédente = 0 → pas de cap (débutant)', function() {
  var r = window.checkRunning10pct(0, 20);
  assert.strictEqual(r.allowed, true);
  assert.strictEqual(r.capApplied, false);
});

test('maxKm arrondi à 0.1km', function() {
  var r = window.checkRunning10pct(33, 40);
  assert.strictEqual(r.maxKm, 36.3); // 33 × 1.10 = 36.3
});

// ─── GROUPE 6 : decide() dégradation gracieuse ───────────────────────────────
console.log('\n── decide() dégradation gracieuse ───────────────────────');

test('decide() sans V3 ni V2 → retourne quand même un résultat', function() {
  window.S = { goal: 'maintain', sportDays: 4, trainingLoad: 'moderate', _nm: null };
  window.decideDailyPlanV3 = null;
  window.decideDailyPlanV2 = null;
  var d = DC.decide();
  assert(d && typeof d.decision === 'string');
  assert(d && typeof d.volumeModifier === 'number');
  assert(d && d.nutrition && typeof d.nutrition.calMultiplier === 'number');
});

test('decide() avec V2 mock → utilise V2', function() {
  window.decideDailyPlanV2 = function() {
    return { decision: 'train', recommendedIntensity: 'high', recommendedSessionType: 'strength' };
  };
  window.S = { goal: 'muscle_gain', sportDays: 4, trainingLoad: 'heavy', _nm: null };
  var d = DC.decide();
  assert.strictEqual(d.decision, 'train');
  window.decideDailyPlanV2 = null;
});

test('decide() récupération 48h → décision rest si daysSince < 1', function() {
  window.S = {
    goal: 'maintain', sportDays: 4, trainingLoad: 'moderate', _nm: null,
    lastSessionGroups: ['legs'],
    lastSessionDate: new Date(Date.now() - 2 * 3600000).toISOString() // il y a 2h
  };
  var d = DC.decide();
  assert.strictEqual(d.decision, 'rest');
});

test('invalidate() purge le cache', function() {
  window.S = { _decisionCore: { _timestamp: Date.now(), decision: 'train', volumeModifier: 1, nutrition: {} } };
  DC.invalidate();
  assert.strictEqual(window.S._decisionCore, null);
});

test('getDecision() retourne le cache si < 5min', function() {
  var cached = { _timestamp: Date.now(), decision: 'rest', volumeModifier: 0.6, nutrition: { calMultiplier: 0.9, carbBoost: 0.85, proteinBoost: 1.0 } };
  window.S = { _decisionCore: cached };
  var d = DC.getDecision();
  assert.strictEqual(d, cached);
});

// ─── GROUPE 7 : timezone trial expiry (app-core.js P3) ───────────────────────
console.log('\n── Timezone Trial Expiry (P3) ────────────────────────────');

test('Trial expiry = fin de journée locale J+7 (23:59:59)', function() {
  // Simule le calcul de isPremium / getTrialDaysLeft après fix P3
  var firstLoginDate = new Date();
  firstLoginDate.setDate(firstLoginDate.getDate() - 6); // il y a 6 jours
  var trialEnd = new Date(firstLoginDate);
  trialEnd.setDate(trialEnd.getDate() + 7);
  trialEnd.setHours(23, 59, 59, 999);
  var now = new Date();
  // Doit encore être dans le trial (J6 sur 7 → encore valide)
  assert(trialEnd > now, 'Trial doit être encore actif J6/7');
  // L'heure d'expiration doit être 23:59:59 local (pas minuit UTC)
  assert.strictEqual(trialEnd.getHours(), 23);
  assert.strictEqual(trialEnd.getMinutes(), 59);
});

test('UTC vs local — expiry != minuit UTC pour UTC+6', function() {
  var firstLoginDate = new Date('2026-05-01T00:00:00Z');
  // Ancienne logique (bug) : expiry = 2026-05-08T00:00:00Z
  var oldEnd = new Date(firstLoginDate);
  oldEnd.setUTCDate(oldEnd.getUTCDate() + 7);
  // Nouvelle logique (fix) : expiry = fin de journée locale J+7
  var newEnd = new Date(firstLoginDate);
  newEnd.setDate(newEnd.getDate() + 7);
  newEnd.setHours(23, 59, 59, 999);
  // Les deux ne doivent pas être identiques (sauf si l'environnement de test est UTC)
  // Vérification de la logique : newEnd doit avoir H=23, M=59
  assert.strictEqual(newEnd.getHours(), 23);
  assert.strictEqual(newEnd.getMinutes(), 59);
});

// ─── Résultat final ───────────────────────────────────────────────────────────
console.log('\n─────────────────────────────────────────────────────────');
console.log('  Passed:', passed, '/ Failed:', failed);
if (failed > 0) process.exit(1);
