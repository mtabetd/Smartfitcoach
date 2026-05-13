'use strict';
/**
 * Test suite — Sport × Nutrition Symbiosis
 * Couvre : SFCSymbiosis (LOAD_MULTIPLIERS, computeTrainingLoad, getLoadMultipliers,
 *          getFeedbackAdjustment, getNutritionState, getFatigueScore, getWeekIndex,
 *          getPeriodizationCfg, notifySession, processCompletedSession),
 *          SFCDecisionCore bidirectional signals (_nutritionToTrainingSignal,
 *          _trainingToNutritionSignal, _computeRecoveryConstraint).
 */

var fs   = require('fs');
var path = require('path');
var ROOT = path.join(__dirname, '..');

// ─── Bootstrap DOM minimal ───────────────────────────────────────────────────
global.window = global;
global.document = {
  createElement: function(t) { return { style: {}, setAttribute: function(){}, appendChild: function(){}, classList:{add:function(){},remove:function(){}}, tagName: t }; },
  getElementById: function() { return null; },
  querySelector:  function() { return null; },
  querySelectorAll: function() { return []; },
  addEventListener:    function() {},
  removeEventListener: function() {},
  body: { appendChild: function(){}, classList: { add:function(){}, remove:function(){} } },
  head: { appendChild: function(){} },
  location: { href: '', search: '', hash: '' }
};
try { Object.defineProperty(global, 'navigator', { value: { userAgent: '', language: 'fr-FR' }, configurable: true }); } catch(e) {}
global.localStorage  = { getItem: function(){ return null; }, setItem: function(){}, removeItem: function(){} };
global.sessionStorage = { getItem: function(){ return null; }, setItem: function(){}, removeItem: function(){} };
global.history = { pushState: function(){}, replaceState: function(){} };
try { Object.defineProperty(global, 'location', { value: { href:'', search:'', hash:'' }, configurable: true }); } catch(e) {}
global.performance = { now: function(){ return Date.now(); } };

var pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch(e) { fail++; console.log('  ✗ ' + name + ' — ' + e.message); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function approx(a, b, eps) { return Math.abs(a - b) <= (eps || 0.001); }

// ─── Load modules ────────────────────────────────────────────────────────────
eval(fs.readFileSync(ROOT + '/app/food-db.js',        'utf8'));
eval(fs.readFileSync(ROOT + '/app/extras.js',          'utf8'));
eval(fs.readFileSync(ROOT + '/app/app-core.js',        'utf8'));
eval(fs.readFileSync(ROOT + '/app/i18n-helpers.js',    'utf8'));
eval(fs.readFileSync(ROOT + '/app/nutrition-master.js','utf8'));
eval(fs.readFileSync(ROOT + '/app/sfc-symbiosis.js',   'utf8'));
eval(fs.readFileSync(ROOT + '/app/sfc-decision-core.js','utf8'));

var SYM  = window.SFCSymbiosis;
var DC   = window.SFCDecisionCore;
var GOALS = window.GOALS || [];

function goalIdx(key) {
  var i = GOALS.findIndex(function(g){ return g.key === key; });
  return i >= 0 ? i : null;
}
function resetS() {
  window.S = {
    trainingLoad: null, dailyTrainingLoad: null,
    lastSessionGroups: [], lastSessionDate: null, lastSessionCount: 0,
    sportProgramStart: null, sessionFeedback: null,
    muscuSessionLog: {}, customSessionHistory: [],
    _nm: null, goal: null, sex: 'male', weight: 80
  };
}

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 1. LOAD_MULTIPLIERS — valeurs référence ===');
// ══════════════════════════════════════════════════════════════════════════════

check('heavy.cal = 1.10',      function(){ assert(SYM.LOAD_MULTIPLIERS.heavy.cal    === 1.10); });
check('heavy.carbBoost = 1.20',function(){ assert(SYM.LOAD_MULTIPLIERS.heavy.carbBoost === 1.20); });
check('heavy.fatAdjust = 0.92',function(){ assert(SYM.LOAD_MULTIPLIERS.heavy.fatAdjust  === 0.92); });
check('moderate.cal = 1.07',   function(){ assert(SYM.LOAD_MULTIPLIERS.moderate.cal  === 1.07); });
check('moderate.carbBoost = 1.10', function(){ assert(SYM.LOAD_MULTIPLIERS.moderate.carbBoost === 1.10); });
check('light.cal = 1.03',      function(){ assert(SYM.LOAD_MULTIPLIERS.light.cal    === 1.03); });
check('light.carbBoost = 1.00',function(){ assert(SYM.LOAD_MULTIPLIERS.light.carbBoost === 1.00); });
check('rest.cal = 0.90',       function(){ assert(SYM.LOAD_MULTIPLIERS.rest.cal     === 0.90); });
check('rest.carbBoost = 0.90', function(){ assert(SYM.LOAD_MULTIPLIERS.rest.carbBoost  === 0.90); });
check('rest.fatAdjust = 1.08', function(){ assert(SYM.LOAD_MULTIPLIERS.rest.fatAdjust   === 1.08); });

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 2. computeTrainingLoad ===');
// ══════════════════════════════════════════════════════════════════════════════

function makeExos(n, hasCompound) {
  var exos = [];
  for (var i = 0; i < n; i++) {
    exos.push({ tags: hasCompound && i < 4 ? [] : ['isolation'] });
  }
  return exos;
}

check('empty exercises → light', function(){
  assert(SYM.computeTrainingLoad([], ['legs']) === 'light');
});
check('null exercises → light', function(){
  assert(SYM.computeTrainingLoad(null, ['legs']) === 'light');
});
check('6 exos + legs + 4 composés → heavy', function(){
  var exos = makeExos(6, true);
  assert(SYM.computeTrainingLoad(exos, ['legs']) === 'heavy');
});
check('6 exos + chest + 4 composés → heavy', function(){
  var exos = makeExos(6, true);
  assert(SYM.computeTrainingLoad(exos, ['chest']) === 'heavy');
});
check('6 exos + back + 4 composés → heavy', function(){
  var exos = makeExos(6, true);
  assert(SYM.computeTrainingLoad(exos, ['back']) === 'heavy');
});
check('6 exos + glutes + 4 composés → heavy', function(){
  var exos = makeExos(6, true);
  assert(SYM.computeTrainingLoad(exos, ['glutes']) === 'heavy');
});
check('3 exos → light (≤3)', function(){
  var exos = makeExos(3, true);
  assert(SYM.computeTrainingLoad(exos, ['legs']) === 'light');
});
check('no heavy group → light', function(){
  var exos = makeExos(6, true);
  assert(SYM.computeTrainingLoad(exos, ['shoulders', 'biceps']) === 'light');
});
check('5 exos + legs + 3 composés → moderate (not heavy)', function(){
  var exos = [
    {tags:[]}, {tags:[]}, {tags:[]},
    {tags:['isolation']}, {tags:['isolation']}
  ];
  assert(SYM.computeTrainingLoad(exos, ['legs']) === 'moderate');
});
check('4 exos + legs + 4 composés → moderate (not ≥6)', function(){
  var exos = makeExos(4, true);
  assert(SYM.computeTrainingLoad(exos, ['legs']) === 'moderate');
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 3. getLoadMultipliers ===');
// ══════════════════════════════════════════════════════════════════════════════

check('non-training → rest multiplier', function(){
  var m = SYM.getLoadMultipliers(false, 'heavy');
  assert(m.cal === 0.90, 'cal=' + m.cal);
});
check('training + heavy → heavy multiplier', function(){
  var m = SYM.getLoadMultipliers(true, 'heavy');
  assert(m.cal === 1.10, 'cal=' + m.cal);
  assert(m.carbBoost === 1.20, 'carbBoost=' + m.carbBoost);
});
check('training + moderate → moderate multiplier', function(){
  var m = SYM.getLoadMultipliers(true, 'moderate');
  assert(m.cal === 1.07, 'cal=' + m.cal);
});
check('training + light → light multiplier', function(){
  var m = SYM.getLoadMultipliers(true, 'light');
  assert(m.cal === 1.03, 'cal=' + m.cal);
});
check('training + unknown → moderate fallback', function(){
  var m = SYM.getLoadMultipliers(true, 'extreme');
  assert(m.cal === 1.07);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 4. getFeedbackAdjustment ===');
// ══════════════════════════════════════════════════════════════════════════════

check('no sessionFeedback → zero adjustments', function(){
  resetS();
  window.S.sessionFeedback = null;
  var adj = SYM.getFeedbackAdjustment();
  assert(adj.calAdjust === 0 && adj.carbAdjust === 0 && adj.fatAdjust === 0 && adj.reason === null);
});
check('RPE moyen ≥ 8 → fatigue (+5% cal, +5% carb)', function(){
  resetS();
  window.S.sessionFeedback = { '2026-01-01': {rpe:8, feeling:3}, '2026-01-02': {rpe:9, feeling:3} };
  var adj = SYM.getFeedbackAdjustment();
  assert(adj.reason === 'fatigue', 'reason=' + adj.reason);
  assert(approx(adj.calAdjust, 0.05) && approx(adj.carbAdjust, 0.05), 'adj=' + JSON.stringify(adj));
});
check('feeling moyen ≤ 2 → recovery (+3% cal, +5% fat)', function(){
  resetS();
  window.S.sessionFeedback = { '2026-01-01': {rpe:5, feeling:2}, '2026-01-02': {rpe:5, feeling:1} };
  var adj = SYM.getFeedbackAdjustment();
  assert(adj.reason === 'recovery', 'reason=' + adj.reason);
  assert(approx(adj.calAdjust, 0.03) && approx(adj.fatAdjust, 0.05));
});
check('RPE moyen < 8 and feeling > 2 → no adjustment', function(){
  resetS();
  window.S.sessionFeedback = { '2026-01-01': {rpe:6, feeling:4} };
  var adj = SYM.getFeedbackAdjustment();
  assert(adj.reason === null && adj.calAdjust === 0);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 5. getWeekIndex ===');
// ══════════════════════════════════════════════════════════════════════════════

check('no sportProgramStart → 1', function(){
  resetS();
  window.S.sportProgramStart = null;
  assert(SYM.getWeekIndex() === 1);
});
check('invalid date → 1', function(){
  resetS();
  window.S.sportProgramStart = 'not-a-date';
  assert(SYM.getWeekIndex() === 1);
});
check('today = start → week 1', function(){
  resetS();
  window.S.sportProgramStart = new Date().toISOString().slice(0,10);
  assert(SYM.getWeekIndex() === 1);
});
check('7 days ago → week 2', function(){
  resetS();
  var d = new Date(Date.now() - 7 * 86400000);
  window.S.sportProgramStart = d.toISOString().slice(0,10);
  assert(SYM.getWeekIndex() === 2);
});
check('14 days ago → week 3', function(){
  resetS();
  var d = new Date(Date.now() - 14 * 86400000);
  window.S.sportProgramStart = d.toISOString().slice(0,10);
  assert(SYM.getWeekIndex() === 3);
});
check('21 days ago → week 4', function(){
  resetS();
  var d = new Date(Date.now() - 21 * 86400000);
  window.S.sportProgramStart = d.toISOString().slice(0,10);
  assert(SYM.getWeekIndex() === 4);
});
check('28 days ago → week 1 (cycle restart)', function(){
  resetS();
  var d = new Date(Date.now() - 28 * 86400000);
  window.S.sportProgramStart = d.toISOString().slice(0,10);
  assert(SYM.getWeekIndex() === 1);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 6. getPeriodizationCfg ===');
// ══════════════════════════════════════════════════════════════════════════════

check('S1 — durMax:6, durSets:4', function(){
  var cfg = SYM.getPeriodizationCfg(1);
  assert(cfg.durMax === 6 && cfg.durSets === 4, JSON.stringify(cfg));
});
check('S2 — durMax:6, durSets:5 (volume↑)', function(){
  var cfg = SYM.getPeriodizationCfg(2);
  assert(cfg.durMax === 6 && cfg.durSets === 5, JSON.stringify(cfg));
});
check('S3 — durMax:5, durSets:5, restOverride', function(){
  var cfg = SYM.getPeriodizationCfg(3);
  assert(cfg.durMax === 5 && cfg.durSets === 5 && cfg.restOverride === '120-180s', JSON.stringify(cfg));
});
check('S4 — durMax:4, durSets:3 (deload)', function(){
  var cfg = SYM.getPeriodizationCfg(4);
  assert(cfg.durMax === 4 && cfg.durSets === 3 && cfg.restOverride === '60s', JSON.stringify(cfg));
});
check('S5 → normalise en S1 (cycle)', function(){
  var cfg = SYM.getPeriodizationCfg(5);
  assert(cfg.durMax === 6 && cfg.durSets === 4, JSON.stringify(cfg));
});
check('S2 > S1 en nombre de séries (progression)', function(){
  var s1 = SYM.getPeriodizationCfg(1);
  var s2 = SYM.getPeriodizationCfg(2);
  assert(s2.durSets > s1.durSets, 's1.durSets=' + s1.durSets + ' s2.durSets=' + s2.durSets);
});
check('S4 < S1 en volume (deload)', function(){
  var s1 = SYM.getPeriodizationCfg(1);
  var s4 = SYM.getPeriodizationCfg(4);
  assert(s4.durMax < s1.durMax && s4.durSets < s1.durSets);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 7. getNutritionState ===');
// ══════════════════════════════════════════════════════════════════════════════

check('no S → neutral', function(){
  var savedS = window.S;
  window.S = null;
  var ns = SYM.getNutritionState();
  window.S = savedS;
  assert(ns.state === 'neutral' && ns.volumeFactor === 1.0);
});
check('shred → deficit_strong, volumeFactor 0.80', function(){
  resetS();
  var idx = goalIdx('shred');
  if (idx === null) { console.log('  (skip: shred goal not found)'); return; }
  window.S.goal = idx;
  var ns = SYM.getNutritionState();
  assert(ns.state === 'deficit_strong', 'state=' + ns.state);
  assert(approx(ns.volumeFactor, 0.80), 'vf=' + ns.volumeFactor);
});
check('cut → deficit, volumeFactor 0.88', function(){
  resetS();
  var idx = goalIdx('cut');
  if (idx === null) { console.log('  (skip: cut goal not found)'); return; }
  window.S.goal = idx;
  var ns = SYM.getNutritionState();
  assert(ns.state === 'deficit', 'state=' + ns.state);
  assert(approx(ns.volumeFactor, 0.88), 'vf=' + ns.volumeFactor);
});
check('bulk → surplus, volumeFactor 1.08', function(){
  resetS();
  var idx = goalIdx('bulk');
  if (idx === null) { console.log('  (skip: bulk goal not found)'); return; }
  window.S.goal = idx;
  var ns = SYM.getNutritionState();
  assert(ns.state === 'surplus', 'state=' + ns.state);
  assert(approx(ns.volumeFactor, 1.08), 'vf=' + ns.volumeFactor);
});
check('maintain → neutral, volumeFactor 1.0', function(){
  resetS();
  var idx = goalIdx('maintain');
  if (idx === null) { console.log('  (skip: maintain goal not found)'); return; }
  window.S.goal = idx;
  var ns = SYM.getNutritionState();
  assert(ns.state === 'neutral' && approx(ns.volumeFactor, 1.0), 'ns=' + JSON.stringify(ns));
});
check('recomposition → volumeFactor 0.95', function(){
  resetS();
  var idx = goalIdx('recomposition');
  if (idx === null) { console.log('  (skip: recomposition goal not found)'); return; }
  window.S.goal = idx;
  var ns = SYM.getNutritionState();
  assert(approx(ns.volumeFactor, 0.95), 'vf=' + ns.volumeFactor);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 8. getFatigueScore ===');
// ══════════════════════════════════════════════════════════════════════════════

check('empty state → fresh, cycleFactor 1.0', function(){
  resetS();
  var fs = SYM.getFatigueScore();
  assert(fs.level === 'fresh' && approx(fs.cycleFactor, 1.0), JSON.stringify(fs));
});
check('RPE moyen ≥ 8.5 → overtrained, cycleFactor 0.60', function(){
  resetS();
  var keys = ['2026-01-01','2026-01-02','2026-01-03','2026-01-04','2026-01-05'];
  window.S.sessionFeedback = {};
  keys.forEach(function(k){ window.S.sessionFeedback[k] = {rpe:9}; });
  var fs = SYM.getFatigueScore();
  assert(fs.level === 'overtrained' && approx(fs.cycleFactor, 0.60), JSON.stringify(fs));
});
check('RPE moyen 7.5–8.4 → tired, cycleFactor 0.80', function(){
  resetS();
  var keys = ['2026-01-01','2026-01-02','2026-01-03'];
  window.S.sessionFeedback = {};
  keys.forEach(function(k){ window.S.sessionFeedback[k] = {rpe:8}; });
  var fs = SYM.getFatigueScore();
  assert(fs.level === 'tired' && approx(fs.cycleFactor, 0.80), JSON.stringify(fs));
});
check('≥3 jours/semaine → normal, cycleFactor 0.95', function(){
  resetS();
  var yesterday1 = new Date(Date.now() - 1*86400000).toISOString().slice(0,10);
  var yesterday2 = new Date(Date.now() - 2*86400000).toISOString().slice(0,10);
  var yesterday3 = new Date(Date.now() - 3*86400000).toISOString().slice(0,10);
  window.S.customSessionHistory = [
    {date: yesterday1}, {date: yesterday2}, {date: yesterday3}
  ];
  var fs = SYM.getFatigueScore();
  assert(fs.level === 'normal' && approx(fs.cycleFactor, 0.95), JSON.stringify(fs));
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 9. notifySession — merge trainingLoad (MAX) ===');
// ══════════════════════════════════════════════════════════════════════════════

check('notifySession sets trainingLoad from empty', function(){
  resetS();
  var exos = makeExos(6, true);
  SYM.notifySession(exos, ['legs']);
  assert(window.S.trainingLoad === 'heavy', 'tl=' + window.S.trainingLoad);
});
check('notifySession MAX: heavy wins over moderate', function(){
  resetS();
  window.S.trainingLoad = 'moderate';
  var exos = makeExos(6, true);
  SYM.notifySession(exos, ['legs']);
  assert(window.S.trainingLoad === 'heavy');
});
check('notifySession MAX: moderate does not downgrade heavy', function(){
  resetS();
  window.S.trainingLoad = 'heavy';
  var exos = makeExos(2, false);
  SYM.notifySession(exos, ['biceps']);
  assert(window.S.trainingLoad === 'heavy', 'tl=' + window.S.trainingLoad);
});
check('notifySession union: lastSessionGroups merges', function(){
  resetS();
  window.S.lastSessionGroups = ['legs'];
  SYM.notifySession(makeExos(2, false), ['chest']);
  var grps = window.S.lastSessionGroups;
  assert(grps.indexOf('legs') >= 0 && grps.indexOf('chest') >= 0, JSON.stringify(grps));
});
check('notifySession empty exercises → no update', function(){
  resetS();
  window.S.trainingLoad = 'moderate';
  SYM.notifySession([], ['legs']);
  assert(window.S.trainingLoad === 'moderate');
});
check('notifySession sets sportProgramStart if absent', function(){
  resetS();
  SYM.notifySession(makeExos(4, true), ['back']);
  assert(window.S.sportProgramStart !== null && window.S.sportProgramStart !== undefined);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 10. processCompletedSession — idempotence ===');
// ══════════════════════════════════════════════════════════════════════════════

check('processCompletedSession: second call with same sessionId ignored', function(){
  resetS();
  var data = {
    sessionId: 'sess-001',
    date: new Date().toISOString().slice(0,10),
    exercises: makeExos(6, true),
    groups: ['legs'],
    trainingLoad: 'heavy'
  };
  SYM.processCompletedSession(data);
  window.S.trainingLoad = 'light'; // manually downgrade
  SYM.processCompletedSession(data); // second call must be ignored
  assert(window.S.trainingLoad === 'light', 'second call modified state: tl=' + window.S.trainingLoad);
});
check('processCompletedSession: different sessionId processed', function(){
  resetS();
  SYM.processCompletedSession({
    sessionId: 'sess-A', date: new Date().toISOString().slice(0,10),
    exercises: makeExos(3, false), groups: ['biceps']
  });
  SYM.processCompletedSession({
    sessionId: 'sess-B', date: new Date().toISOString().slice(0,10),
    exercises: makeExos(6, true), groups: ['legs']
  });
  assert(window.S.trainingLoad === 'heavy', 'tl=' + window.S.trainingLoad);
});
check('processCompletedSession: no sessionId → ignored', function(){
  resetS();
  SYM.processCompletedSession({ date: '2026-01-01', exercises: makeExos(6, true), groups: ['legs'] });
  assert(window.S.trainingLoad === null);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 11. SFCDecisionCore — signaux bidirectionnels ===');
// ══════════════════════════════════════════════════════════════════════════════

check('_nutritionToTrainingSignal: déficit >500 → vol 0.80, int 0.88', function(){
  var sig = DC._nutritionToTrainingSignal(-600, 1.0, 3);
  assert(approx(sig.volumeModifier, 0.80) && approx(sig.intensityModifier, 0.88),
    JSON.stringify(sig));
});
check('_nutritionToTrainingSignal: déficit 300-500 → vol 0.90, int 0.95', function(){
  var sig = DC._nutritionToTrainingSignal(-400, 1.0, 3);
  assert(approx(sig.volumeModifier, 0.90) && approx(sig.intensityModifier, 0.95),
    JSON.stringify(sig));
});
check('_nutritionToTrainingSignal: aucun déficit → vol 1.0, int 1.0', function(){
  var sig = DC._nutritionToTrainingSignal(0, 1.0, 3);
  assert(approx(sig.volumeModifier, 1.0) && approx(sig.intensityModifier, 1.0),
    JSON.stringify(sig));
});
check('_nutritionToTrainingSignal: protéines < 75% → intensité réduite', function(){
  var sig = DC._nutritionToTrainingSignal(0, 0.70, 3);
  assert(sig.intensityModifier <= 0.80, 'int=' + sig.intensityModifier);
  assert(sig.reasons.indexOf('protéines_insuffisantes') >= 0);
});
check('_nutritionToTrainingSignal: fatigue haute + déficit → vol ≤ 0.75', function(){
  var sig = DC._nutritionToTrainingSignal(-250, 1.0, 4);
  assert(sig.volumeModifier <= 0.75, 'vol=' + sig.volumeModifier);
});
check('_trainingToNutritionSignal: heavy → calMultiplier 1.10', function(){
  var sig = DC._trainingToNutritionSignal('heavy', 3, [], 2);
  assert(approx(sig.calMultiplier, 1.10), 'cal=' + sig.calMultiplier);
  assert(approx(sig.carbBoost, 1.20), 'carb=' + sig.carbBoost);
});
check('_trainingToNutritionSignal: rest → calMultiplier 0.90', function(){
  var sig = DC._trainingToNutritionSignal('rest', 3, [], 2);
  assert(approx(sig.calMultiplier, 0.90), 'cal=' + sig.calMultiplier);
});
check('_trainingToNutritionSignal: fatigue ≥ 4 → proteinBoost 1.12', function(){
  var sig = DC._trainingToNutritionSignal('moderate', 4, [], 2);
  assert(approx(sig.proteinBoost, 1.12), 'prot=' + sig.proteinBoost);
  assert(sig.reasons.indexOf('récupération_protéines') >= 0);
});
check('_trainingToNutritionSignal: daysSince=1 + groups → proteinBoost ≥ 1.08', function(){
  var sig = DC._trainingToNutritionSignal('moderate', 3, ['legs'], 1);
  assert(sig.proteinBoost >= 1.08, 'prot=' + sig.proteinBoost);
  assert(sig.reasons.indexOf('récupération_j+1') >= 0);
});
check('_computeRecoveryConstraint: daysSince < 2 → blockedGroups = lastGroups', function(){
  var rc = DC._computeRecoveryConstraint(['legs', 'glutes'], 1);
  assert(rc.blockedGroups.length === 2 && rc.blockedGroups.indexOf('legs') >= 0);
  assert(rc.reason === 'récupération_48h_même_groupe');
});
check('_computeRecoveryConstraint: daysSince = 0 → suggestRest = true', function(){
  var rc = DC._computeRecoveryConstraint(['legs'], 0);
  assert(rc.suggestRest === true);
});
check('_computeRecoveryConstraint: daysSince ≥ 2 → no blocked groups', function(){
  var rc = DC._computeRecoveryConstraint(['legs'], 2);
  assert(rc.blockedGroups.length === 0 && rc.reason === null);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 12. buildInputContext intégration ===');
// ══════════════════════════════════════════════════════════════════════════════

check('buildInputContext retourne structure valide', function(){
  resetS();
  var ctx = DC.buildInputContext();
  assert(ctx.profile  !== undefined, 'no profile');
  assert(ctx.fatigue  !== undefined, 'no fatigue');
  assert(ctx.training !== undefined, 'no training');
  assert(ctx.nutrition !== undefined, 'no nutrition');
});
check('buildInputContext.training.load = S.trainingLoad', function(){
  resetS();
  window.S.trainingLoad = 'heavy';
  var ctx = DC.buildInputContext();
  assert(ctx.training.load === 'heavy');
});
check('invalidate vide le cache', function(){
  resetS();
  window.S._decisionCore = { _timestamp: Date.now(), decision: 'cached' };
  DC.invalidate();
  assert(window.S._decisionCore === null);
});

// ─── Résultat ────────────────────────────────────────────────────────────────
console.log('\n' + (fail === 0 ? '✅' : '❌') + ' unit-sport-nutrition-symbiosis : ' + pass + ' pass, ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
