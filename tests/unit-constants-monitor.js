'use strict';
// ─── TESTS UNITAIRES — SFCConstants + SFCMonitor ─────────────────────────────
// Suite A (8 tests) : SFCConstants — valeurs vérifiées contre les sources réelles
// Suite B (8 tests) : SFCMonitor — record, flush, buffer circulaire, getByType, getHighSeverity
// Suite C (9 tests) : intégration — reportInvariant, reportSyncFailure, reportPremiumInconsistency
// Usage : node tests/unit-constants-monitor.js
// ─────────────────────────────────────────────────────────────────────────────

var assert = require('assert');
var path   = require('path');

// ── Chargement des modules ────────────────────────────────────────────────────

// SFCConstants — module browser-compatible, expose via module.exports
var SFCConstants = require(path.join(__dirname, '../app/sfc-constants.js'));

// SFCMonitor — idem
var SFCMonitor   = require(path.join(__dirname, '../app/sfc-monitor.js'));

// ── Helpers ───────────────────────────────────────────────────────────────────

var _passed = 0;
var _failed = 0;
var _errors = [];

function test(label, fn) {
  try {
    fn();
    _passed++;
    console.log('  ✓ ' + label);
  } catch(e) {
    _failed++;
    _errors.push({ label: label, error: e.message });
    console.error('  ✗ ' + label);
    console.error('      ' + e.message);
  }
}

function eq(a, b, msg) {
  assert.strictEqual(a, b, (msg || '') + ' | got=' + JSON.stringify(a) + ' expected=' + JSON.stringify(b));
}

function deepEq(a, b, msg) {
  assert.deepStrictEqual(a, b, msg || '');
}

function ok(val, msg) {
  assert.ok(val, msg || 'expected truthy');
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE A — SFCConstants : valeurs vérifiées vs code source
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nSuite A — SFCConstants (vérification valeurs sources)');

test('A1 : planchers caloriques — femme 1400, homme 1500, grossesse 1800', function() {
  // nutrition-master.js l.72 : KCAL_FLOOR_FEMALE=1400
  // nutrition-master.js l.71 : KCAL_FLOOR_MALE=1500
  // app-core.js l.4876       : Math.max(base,1800) grossesse
  eq(SFCConstants.KCAL_FLOOR_FEMALE,    1400, 'KCAL_FLOOR_FEMALE');
  eq(SFCConstants.KCAL_FLOOR_MALE,      1500, 'KCAL_FLOOR_MALE');
  eq(SFCConstants.KCAL_FLOOR_PREGNANT,  1800, 'KCAL_FLOOR_PREGNANT');
  eq(SFCConstants.KCAL_FLOOR_BREASTFEEDING, 1800, 'KCAL_FLOOR_BREASTFEEDING');
  // Note : la proposition initiale était 1900 pour l'allaitement, mais app-core.js
  // utilise Math.max(base,1800) — 1800 est la valeur réelle.
});

test('A2 : déficit max 500 kcal, surpluses lean_bulk=300, bulk=500', function() {
  // app-core.js l.4879 : Math.max(base, tdeeVal-500) — déficit cap
  // app-core.js l.4883 : Math.min(base, tdeeVal+300) — lean_bulk
  // app-core.js l.4885 : Math.min(base, tdeeVal+500) — bulk
  eq(SFCConstants.DEFICIT_MAX_KCAL,      500, 'DEFICIT_MAX_KCAL');
  eq(SFCConstants.SURPLUS_MAX_KCAL,      300, 'SURPLUS_MAX_KCAL (lean_bulk)');
  eq(SFCConstants.SURPLUS_MAX_BULK_KCAL, 500, 'SURPLUS_MAX_BULK_KCAL');
});

test('A3 : protéines — 1.6 standard, 1.8 muscle, 2.2 max, 0.6 IRC', function() {
  // nutrition-master.js l.31 : PROT_DEFAULT_FEMALE=1.6
  // nutrition-master.js l.30 : PROT_DEFAULT_MALE=1.8
  // nutrition-master.js l.32 : PROT_ELITE_MALE=2.2
  // app-core.js l.5056       : ppk=Math.min(ppk,0.6) IRC
  eq(SFCConstants.PROTEIN_MIN_GPERKG_STANDARD, 1.6, 'PROTEIN_MIN_GPERKG_STANDARD (femme ISSN 2023)');
  eq(SFCConstants.PROTEIN_MIN_GPERKG_MUSCLE,   1.8, 'PROTEIN_MIN_GPERKG_MUSCLE (homme non-élite)');
  eq(SFCConstants.PROTEIN_MAX_GPERKG,          2.2, 'PROTEIN_MAX_GPERKG (ISSN 2023 upper non-élite)');
  eq(SFCConstants.PROTEIN_MAX_GPERKG_IRC,      0.6, 'PROTEIN_MAX_GPERKG_IRC (KDOQI 2020)');
});

test('A4 : lipides — plancher macros 20%, carb-cycling 15%, g/kg 0.8', function() {
  // app-core.js l.5082 : minFatCal=Math.round(c*0.20) — plancher effectif calcMacros
  // app-core.js l.6919 : 0.15/9 — plancher carb cycling seulement
  // nutrition-master.js l.35 : FAT_MIN_PER_KG=0.8
  eq(SFCConstants.FAT_MIN_PCT_KCAL,              0.20, 'FAT_MIN_PCT_KCAL (plancher effectif calcMacros)');
  eq(SFCConstants.FAT_MIN_PCT_KCAL_CARB_CYCLING, 0.15, 'FAT_MIN_PCT_KCAL_CARB_CYCLING');
  eq(SFCConstants.FAT_MIN_GPERKG,                0.8,  'FAT_MIN_GPERKG');
  // CARB_MIN_GDAY
  // nutrition-master.js l.143 : if (carbs < 130) carbs = 130; (IOM 2005)
  eq(SFCConstants.CARB_MIN_GDAY, 130, 'CARB_MIN_GDAY');
});

test('A5 : carb cycling — heavy=0.20, streak=0.25, moderate=0.10, rest=0.10', function() {
  // nutrition-master.js l.37 : CARB_CYCLING_BOOST=0.20
  // app-core.js l.6951       : _carbRate=0.25 (heavyStreak>=2), _carbRate=0.20 (single heavy)
  // app-core.js l.6953       : _carbRate=0.10 (moderate)
  // app-core.js l.6965       : carbRed=Math.round(carbsGrams*0.10) (rest)
  eq(SFCConstants.CARB_CYCLING_BOOST_HEAVY,        0.20, 'CARB_CYCLING_BOOST_HEAVY');
  eq(SFCConstants.CARB_CYCLING_BOOST_HEAVY_STREAK, 0.25, 'CARB_CYCLING_BOOST_HEAVY_STREAK');
  eq(SFCConstants.CARB_CYCLING_BOOST_MODERATE,     0.10, 'CARB_CYCLING_BOOST_MODERATE');
  eq(SFCConstants.CARB_CYCLING_REDUCTION_REST,     0.10, 'CARB_CYCLING_REDUCTION_REST');
});

test('A6 : grossesse — T1=0, T2=340, T3=450 ; allaitement=500', function() {
  // app-core.js l.4382 : calorieExtra:0  (T1)
  // app-core.js l.4411 : calorieExtra:340 (T2)
  // app-core.js l.4440 : calorieExtra:450 (T3)
  // app-core.js l.4873 : allaitExtra=500
  eq(SFCConstants.PREGNANCY_SURPLUS_T1,  0,   'PREGNANCY_SURPLUS_T1');
  eq(SFCConstants.PREGNANCY_SURPLUS_T2,  340, 'PREGNANCY_SURPLUS_T2');
  eq(SFCConstants.PREGNANCY_SURPLUS_T3,  450, 'PREGNANCY_SURPLUS_T3');
  eq(SFCConstants.BREASTFEEDING_SURPLUS, 500, 'BREASTFEEDING_SURPLUS');
});

test('A7 : facteurs activité — 5 niveaux standard + élite 2.1', function() {
  // app-core.js l.1436-1443 : ACTIVITIES array (6 entrées, dont élite 2.1)
  var af = SFCConstants.ACTIVITY_FACTORS;
  eq(af.sedentary,  1.2,   'sedentary');
  eq(af.light,      1.375, 'light');
  eq(af.moderate,   1.55,  'moderate');
  eq(af.active,     1.725, 'active');
  eq(af.veryActive, 1.9,   'veryActive');
  eq(af.elite,      2.1,   'elite — présent dans app-core.js ACTIVITIES l.1442');
});

test('A8 : TRIAL_DAYS=7, PREMIUM_PLANS 8 valeurs, SYNC constants', function() {
  // _user-auth.js l.9       : TRIAL_DAYS=7
  // _user-auth.js l.93      : PREMIUM_PLANS array (8 entrées)
  // app-core.js l.4499      : _SFC_PREMIUM_PLANS (8 entrées identiques)
  // supabase-client.js l.249 : SYNC_EXACT (3 clés)
  // supabase-client.js l.1019: setInterval 120000
  // supabase-client.js l.711 : setTimeout 10000
  eq(SFCConstants.TRIAL_DAYS, 7, 'TRIAL_DAYS');
  deepEq(
    SFCConstants.PREMIUM_PLANS,
    ['unlimited','lifetime','premium','legend','champion','athlete','admin','paid'],
    'PREMIUM_PLANS'
  );
  eq(SFCConstants.SYNC_INTERVAL_MS, 120000, 'SYNC_INTERVAL_MS');
  eq(SFCConstants.SYNC_TIMEOUT_MS,  10000,  'SYNC_TIMEOUT_MS');
  deepEq(
    SFCConstants.SYNC_EXACT_KEYS,
    ['mtd_muscu_program', 'mtd_muscu_ia_progress', 'mtd_muscu_generations'],
    'SYNC_EXACT_KEYS'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE B — SFCMonitor : comportement interne
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nSuite B — SFCMonitor (comportement interne)');

test('B1 : init() configure sessionId et endpoint', function() {
  SFCMonitor.clear();
  SFCMonitor.init({ endpoint: 'https://example.com/monitor', sessionId: 'test-session-42' });
  // On ne peut pas lire _sessionId directement (closure privée), mais on vérifie
  // que les événements enregistrés portent le bon session.
  SFCMonitor.reportSaveFailure({ key: 'test' });
  var evts = SFCMonitor.getEvents();
  eq(evts.length, 1, 'un événement enregistré');
  eq(evts[0].session, 'test-session-42', 'session ID transmis');
});

test('B2 : init() sans sessionId génère un ID automatique (préfixe s_)', function() {
  SFCMonitor.clear();
  SFCMonitor.init({});
  SFCMonitor.reportSaveFailure({ key: 'auto' });
  var evts = SFCMonitor.getEvents();
  ok(typeof evts[0].session === 'string', 'session est une string');
  ok(evts[0].session.indexOf('s_') === 0, 'session commence par s_');
});

test('B3 : record enregistre type, severity, data, ts', function() {
  SFCMonitor.clear();
  SFCMonitor.init({ sessionId: 'b3' });
  var before = Date.now();
  SFCMonitor.reportSaveFailure({ key: 'x', reason: 'network' });
  var after  = Date.now();
  var ev = SFCMonitor.getEvents()[0];
  eq(ev.type,     'save_failure', 'type');
  eq(ev.severity, SFCMonitor.SEVERITY.MEDIUM, 'severity MEDIUM pour save_failure');
  eq(ev.data.key, 'x', 'data.key');
  ok(ev.ts >= before && ev.ts <= after, 'ts dans la fenêtre temporelle');
});

test('B4 : buffer circulaire — max 200 événements, le plus ancien est supprimé', function() {
  SFCMonitor.clear();
  SFCMonitor.init({ sessionId: 'b4' });
  // Remplir 210 événements
  for (var i = 0; i < 210; i++) {
    SFCMonitor.reportSaveFailure({ idx: i });
  }
  var evts = SFCMonitor.getEvents();
  eq(evts.length, 200, 'buffer plafonné à 200');
  // Le premier événement restant doit être idx=10 (les 10 premiers ont été supprimés)
  eq(evts[0].data.idx, 10, 'le plus ancien (idx=10) est le premier restant');
  eq(evts[199].data.idx, 209, 'le plus récent est idx=209');
});

test('B5 : getEventsByType filtre correctement', function() {
  SFCMonitor.clear();
  SFCMonitor.init({ sessionId: 'b5' });
  SFCMonitor.reportSaveFailure({ k: 1 });
  SFCMonitor.reportSyncFailure({ k: 2 });
  SFCMonitor.reportSaveFailure({ k: 3 });
  var saves = SFCMonitor.getEventsByType('save_failure');
  var syncs = SFCMonitor.getEventsByType('sync_failure');
  eq(saves.length, 2, '2 save_failure');
  eq(syncs.length, 1, '1 sync_failure');
  ok(saves.every(function(e) { return e.type === 'save_failure'; }), 'tous save_failure');
});

test('B6 : getHighSeverity retourne HIGH et CRITICAL uniquement', function() {
  SFCMonitor.clear();
  SFCMonitor.init({ sessionId: 'b6' });
  SFCMonitor.reportSaveFailure({ k: 'medium' });          // MEDIUM
  SFCMonitor.reportSyncFailure({ k: 'high' });            // HIGH
  SFCMonitor.reportPremiumInconsistency({ k: 'crit' });   // CRITICAL
  var hi = SFCMonitor.getHighSeverity();
  eq(hi.length, 2, '2 événements HIGH+CRITICAL');
  ok(hi.every(function(e) {
    return e.severity === SFCMonitor.SEVERITY.HIGH || e.severity === SFCMonitor.SEVERITY.CRITICAL;
  }), 'tous HIGH ou CRITICAL');
});

test('B7 : clear() vide le buffer', function() {
  SFCMonitor.clear();
  SFCMonitor.init({ sessionId: 'b7' });
  SFCMonitor.reportSaveFailure({});
  SFCMonitor.reportSyncFailure({});
  eq(SFCMonitor.getEvents().length, 2, '2 événements avant clear');
  SFCMonitor.clear();
  eq(SFCMonitor.getEvents().length, 0, '0 événements après clear');
});

test('B8 : reportNutritionDivergence — sévérité HIGH si |delta|>100, sinon MEDIUM', function() {
  SFCMonitor.clear();
  SFCMonitor.init({ sessionId: 'b8' });
  SFCMonitor.reportNutritionDivergence({ expected: 2000, actual: 2050, delta: 50, profile: 'f' });
  SFCMonitor.reportNutritionDivergence({ expected: 2000, actual: 2150, delta: 150, profile: 'm' });
  SFCMonitor.reportNutritionDivergence({ expected: 2000, actual: 1890, delta: -110, profile: 'f' });
  var evts = SFCMonitor.getEventsByType('nutrition_divergence');
  eq(evts.length, 3, '3 nutrition_divergence');
  eq(evts[0].severity, SFCMonitor.SEVERITY.MEDIUM, 'delta=50 → MEDIUM');
  eq(evts[1].severity, SFCMonitor.SEVERITY.HIGH,   'delta=150 → HIGH');
  eq(evts[2].severity, SFCMonitor.SEVERITY.HIGH,   'delta=-110 → HIGH');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE C — Intégration SFCConstants + SFCMonitor
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nSuite C — Intégration');

test('C1 : reportInvariant produit un événement invariant_violation HIGH', function() {
  SFCMonitor.clear();
  SFCMonitor.init({ sessionId: 'c1' });
  SFCMonitor.reportInvariant({
    code: 'N02',
    message: 'heavyStreak non remis à 0 après repos',
    expected: SFCConstants.HEAVY_STREAK_RESET_ON_REST
  });
  var evts = SFCMonitor.getEvents();
  eq(evts.length, 1, '1 événement');
  eq(evts[0].type,     'invariant_violation', 'type');
  eq(evts[0].severity, SFCMonitor.SEVERITY.HIGH, 'severity HIGH');
  eq(evts[0].data.code, 'N02', 'code N02');
});

test('C2 : reportSyncFailure avec SYNC_EXACT_KEYS — event bien structuré', function() {
  SFCMonitor.clear();
  SFCMonitor.init({ sessionId: 'c2' });
  var failedKey = SFCConstants.SYNC_EXACT_KEYS[0]; // 'mtd_muscu_program'
  SFCMonitor.reportSyncFailure({ key: failedKey, attempt: 1, maxRetry: 3 });
  var evts = SFCMonitor.getEventsByType('sync_failure');
  eq(evts.length, 1, '1 sync_failure');
  eq(evts[0].severity, SFCMonitor.SEVERITY.HIGH, 'sync_failure est HIGH');
  eq(evts[0].data.key, 'mtd_muscu_program', 'clé correcte');
});

test('C3 : reportPremiumInconsistency — CRITICAL, apparaît dans getHighSeverity', function() {
  SFCMonitor.clear();
  SFCMonitor.init({ sessionId: 'c3' });
  SFCMonitor.reportPremiumInconsistency({
    plan: SFCConstants.PREMIUM_PLANS[0], // 'unlimited'
    serverSays: false,
    clientSays: true
  });
  var evts = SFCMonitor.getEvents();
  eq(evts[0].type,     'premium_inconsistency', 'type');
  eq(evts[0].severity, SFCMonitor.SEVERITY.CRITICAL, 'CRITICAL');
  var hi = SFCMonitor.getHighSeverity();
  eq(hi.length, 1, 'apparaît dans getHighSeverity');
  eq(hi[0].data.plan, 'unlimited', 'data.plan correct');
});

test('C4 : tracking session — tous les événements d\'une session partagent le même sessionId', function() {
  SFCMonitor.clear();
  SFCMonitor.init({ sessionId: 'session-xyz' });
  SFCMonitor.reportInvariant({ code: 'X1' });
  SFCMonitor.reportSyncFailure({ key: 'k1' });
  SFCMonitor.reportSaveFailure({ key: 'k2' });
  var evts = SFCMonitor.getEvents();
  eq(evts.length, 3, '3 événements');
  ok(evts.every(function(e) { return e.session === 'session-xyz'; }), 'tous partagent session-xyz');
});

test('C5 : types d\'événements — 6 types distincts correctement enregistrés', function() {
  SFCMonitor.clear();
  SFCMonitor.init({ sessionId: 'c5' });
  SFCMonitor.reportInvariant({ code: 'I1' });
  SFCMonitor.reportSyncFailure({ k: 1 });
  SFCMonitor.reportSaveFailure({ k: 2 });
  SFCMonitor.reportNutritionDivergence({ delta: 50 });
  SFCMonitor.reportPremiumInconsistency({ k: 3 });
  SFCMonitor.reportCorruption({ k: 4 });
  var types = SFCMonitor.getEvents().map(function(e) { return e.type; });
  deepEq(types, [
    'invariant_violation',
    'sync_failure',
    'save_failure',
    'nutrition_divergence',
    'premium_inconsistency',
    'data_corruption'
  ], '6 types dans l\'ordre');
});

test('C6 : reportException — enregistre message et stack, severity HIGH', function() {
  SFCMonitor.clear();
  SFCMonitor.init({ sessionId: 'c6' });
  var err = new Error('calcTarget returned NaN');
  SFCMonitor.reportException(err, 'calcMacros');
  var evts = SFCMonitor.getEventsByType('uncaught_exception');
  eq(evts.length, 1, '1 uncaught_exception');
  eq(evts[0].severity, SFCMonitor.SEVERITY.HIGH, 'HIGH');
  eq(evts[0].data.message, 'calcTarget returned NaN', 'message');
  eq(evts[0].data.context, 'calcMacros', 'context');
  ok(evts[0].data.stack, 'stack présent');
});

test('C7 : getEvents() retourne une copie (mutation externe n\'affecte pas le buffer)', function() {
  SFCMonitor.clear();
  SFCMonitor.init({ sessionId: 'c7' });
  SFCMonitor.reportSaveFailure({ k: 1 });
  var copy1 = SFCMonitor.getEvents();
  copy1.push({ fake: true }); // mutation externe
  var copy2 = SFCMonitor.getEvents();
  eq(copy2.length, 1, 'buffer interne non affecté par la mutation externe');
});

test('C8 : SFCConstants.PREMIUM_PLANS correspond exactement au code serveur et client', function() {
  // Vérification exhaustive que les 8 plans sont bien présents dans les deux sources
  // _user-auth.js l.93 et app-core.js l.4499 (vérification manuelle documentée)
  var expected = ['unlimited','lifetime','premium','legend','champion','athlete','admin','paid'];
  eq(SFCConstants.PREMIUM_PLANS.length, 8, '8 plans premium');
  expected.forEach(function(plan) {
    ok(SFCConstants.PREMIUM_PLANS.indexOf(plan) !== -1, 'plan présent: ' + plan);
  });
});

test('C9 : SFCConstants.MIN_SETS_PER_SESSION correspond à app-sport.js (NSCA)', function() {
  // app-sport.js l.864 : 45min→9, 1h→12, 1h15→15, 1h30→18
  var msp = SFCConstants.MIN_SETS_PER_SESSION;
  eq(msp['45min'], 9,  '45min → 9 sets minimum');
  eq(msp['1h'],    12, '1h   → 12 sets minimum');
  eq(msp['1h15'],  15, '1h15 → 15 sets minimum');
  eq(msp['1h30'],  18, '1h30 → 18 sets minimum');
});

// ─────────────────────────────────────────────────────────────────────────────
// RÉSULTAT FINAL
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n────────────────────────────────────────────────');
console.log('Résultat : ' + _passed + ' passés, ' + _failed + ' échoués');
if (_errors.length > 0) {
  console.error('\nÉchecs détaillés :');
  _errors.forEach(function(e) {
    console.error('  [FAIL] ' + e.label + '\n         ' + e.error);
  });
  process.exit(1);
} else {
  console.log('Tous les tests passent. ✓');
  process.exit(0);
}
