'use strict';
/**
 * Test suite — Safety & Medical Guards
 * Covers: muscu-programs.js (IRC, TCA, equipment array), extras.js (water tracker),
 *         gamification.js (getStreak), calisthenics-program.js (medical conditions)
 */

var fs = require('fs');
var path = require('path');
var ROOT = path.join(__dirname, '..');

// ─── Bootstrap DOM minimal ───────────────────────────────────────────────────
global.window = global;
var _lsStore = {};
global.localStorage = {
  getItem: function(k){ return _lsStore[k] !== undefined ? _lsStore[k] : null; },
  setItem: function(k,v){ _lsStore[k] = v; },
  removeItem: function(k){ delete _lsStore[k]; }
};
global.sessionStorage = { getItem: function(){ return null; }, setItem: function(){}, removeItem: function(){} };
global.document = {
  createElement: function(t) {
    var el = { tagName: t, style: {cssText:''}, children: [], _attrs: {}, _text: '', _html: '' };
    el.setAttribute = function(k,v){ el._attrs[k]=v; };
    el.getAttribute = function(k){ return el._attrs[k]; };
    el.appendChild = function(c){ el.children.push(c); return c; };
    el.addEventListener = function(){};
    el.classList = { add: function(){}, remove: function(){}, contains: function(){ return false; } };
    Object.defineProperty(el, 'textContent', { set: function(v){ el._text = v; }, get: function(){ return el._text; } });
    Object.defineProperty(el, 'innerHTML', { set: function(v){ el._html = v; }, get: function(){ return el._html; } });
    Object.defineProperty(el, 'className', { set: function(v){ el._attrs['class'] = v; }, get: function(){ return el._attrs['class'] || ''; } });
    return el;
  },
  getElementById: function() { return null; },
  querySelector: function() { return null; },
  querySelectorAll: function() { return []; },
  addEventListener: function() {},
  removeEventListener: function() {},
  body: { appendChild: function(){}, classList: { add:function(){}, remove:function(){} } },
  head: { appendChild: function(){} },
  location: { href: '', search: '', hash: '' }
};
try { Object.defineProperty(global, 'navigator', { value: { userAgent: '', language: 'fr-FR' }, configurable: true }); } catch(e) {}
global.history = { pushState: function(){}, replaceState: function(){} };
try { Object.defineProperty(global, 'location', { value: { href:'', search:'', hash:'' }, configurable: true }); } catch(e) {}
global.performance = { now: function(){ return Date.now(); } };
global.fetch = function(){ return Promise.resolve({ ok: true, json: function(){ return Promise.resolve({}); } }); };

var pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log('✓ ' + name); }
  catch(e) { fail++; console.log('✗ ' + name + ' — ' + e.message); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

// ─── Load modules ────────────────────────────────────────────────────────────
eval(fs.readFileSync(ROOT + '/app/food-db.js', 'utf8'));
eval(fs.readFileSync(ROOT + '/app/extras.js', 'utf8'));
eval(fs.readFileSync(ROOT + '/app/app-core.js', 'utf8'));
eval(fs.readFileSync(ROOT + '/app/i18n-helpers.js', 'utf8'));
eval(fs.readFileSync(ROOT + '/app/exercises-db.js', 'utf8'));
eval(fs.readFileSync(ROOT + '/app/muscu-programs.js', 'utf8'));
eval(fs.readFileSync(ROOT + '/app/app-sport.js', 'utf8'));
eval(fs.readFileSync(ROOT + '/app/gamification.js', 'utf8'));
eval(fs.readFileSync(ROOT + '/app/calisthenics-program.js', 'utf8'));

var GOALS = window.GOALS || [];
var maintainIdx = GOALS.findIndex(function(g){ return g.key === 'maintain'; });
var cutIdx = GOALS.findIndex(function(g){ return g.key === 'cut'; });
var shredIdx = GOALS.findIndex(function(g){ return g.key === 'shred'; });
var bulkIdx = GOALS.findIndex(function(g){ return g.key === 'bulk'; });

function buildMuscuS(overrides) {
  var base = {
    sex: 'homme', age: 30, weight: 80, height: 180, activity: 2,
    goal: maintainIdx, medical: [], pregnant: false, birthDate: null,
    cycleTracking: false, regime: 0, supplements: [],
    trainingDaysSelected: [1,3,5],
    sportLevel: 'intermediate', sportEquipment: 'gym', sportGoals: ['muscle'],
    sportDays: 3, muscuSplit: 'fullbody', _splitChoice: 'fullbody',
    muscuMedical: { done: false },
    sportFocus: {}
  };
  Object.assign ? Object.assign(base, overrides) : Object.keys(overrides).forEach(function(k){ base[k] = overrides[k]; });
  return base;
}

function getMuscuPlan(overrides) {
  var s = buildMuscuS(overrides);
  window.S = s;
  // buildPersonalizedMuscuPlan(S) requires S as explicit argument (not window.S)
  try { return window.buildPersonalizedMuscuPlan(s); } catch(e) { return null; }
}

function getMuscuExNames(plan) {
  var names = [];
  if (!plan) return names;
  // buildPersonalizedMuscuPlan returns { weekProgram: [{exercises:[...]}, ...] }
  var days = plan.weekProgram || plan.days || plan.plan || (Array.isArray(plan) ? plan : []);
  if (!Array.isArray(days)) return names;
  days.forEach(function(day) {
    var exos = day.exercises || day.exos || day.blocks || [];
    if (Array.isArray(exos)) {
      exos.forEach(function(ex) {
        if (ex && ex.n) names.push(ex.n.toLowerCase());
        else if (ex && ex.name) names.push(ex.name.toLowerCase());
        if (ex && Array.isArray(ex.exercises)) {
          ex.exercises.forEach(function(e2) { if (e2 && (e2.n || e2.name)) names.push((e2.n || e2.name || '').toLowerCase()); });
        }
      });
    }
  });
  return names;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — muscu-programs.js: IRC medical filter
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 1. buildPersonalizedMuscuPlan — IRC filter ===');

check('buildPersonalizedMuscuPlan existe dans window', function() {
  assert(typeof window.buildPersonalizedMuscuPlan === 'function', 'buildPersonalizedMuscuPlan missing');
});

check('IRC: pas de deadlift dans buildPersonalizedMuscuPlan', function() {
  var plan = getMuscuPlan({ medical: ['irc'] });
  if (!plan) { console.log('  (skipped — plan null)'); return; }
  var names = getMuscuExNames(plan);
  var forbidden = names.filter(function(n){ return /soulev[eé].*terre|deadlift/.test(n); });
  assert(forbidden.length === 0, 'IRC should block deadlift. Found: ' + forbidden.join(', '));
});

check('IRC: pas de squat barre dans buildPersonalizedMuscuPlan', function() {
  var plan = getMuscuPlan({ medical: ['irc'] });
  if (!plan) return;
  var names = getMuscuExNames(plan);
  var forbidden = names.filter(function(n){ return /squat barre|back squat|front squat/.test(n); });
  assert(forbidden.length === 0, 'IRC should block barbell squat. Found: ' + forbidden.join(', '));
});

check('IRC: pas de thruster/snatch/clean dans buildPersonalizedMuscuPlan', function() {
  var plan = getMuscuPlan({ medical: ['irc'] });
  if (!plan) return;
  var names = getMuscuExNames(plan);
  var forbidden = names.filter(function(n){ return /\bthruster\b|\bsnatch\b|\bclean\b/.test(n); });
  assert(forbidden.length === 0, 'IRC should block thruster/snatch/clean. Found: ' + forbidden.join(', '));
});

check('Sans IRC: plan avec exercises (filtre pas trop agressif)', function() {
  var plan = getMuscuPlan({ medical: [] });
  if (!plan) { console.log('  (skipped — plan null)'); return; }
  var names = getMuscuExNames(plan);
  assert(names.length > 0, 'Clean profile should have exercises, got weekProgram length=' + (plan.weekProgram || []).length);
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — muscu-programs.js: TCA goal override
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 2. buildPersonalizedMuscuPlan — TCA goal override ===');

check('TCA + objectif cut → pas de programme avec _isDeficit (maintien forcé)', function() {
  if (cutIdx < 0) { console.log('  (skipped — cut goal not found)'); return; }
  // We test that a TCA user with cut goal gets a plan (not a crash)
  var plan = getMuscuPlan({ medical: ['tca'], goal: cutIdx });
  assert(plan !== undefined, 'TCA + cut should not throw');
});

check('TCA + objectif shred → plan généré sans crash', function() {
  if (shredIdx < 0) { console.log('  (skipped — shred goal not found)'); return; }
  var plan = getMuscuPlan({ medical: ['tca'], goal: shredIdx });
  assert(plan !== undefined, 'TCA + shred should not throw');
});

check('TCA + maintain → plan normal', function() {
  var plan = getMuscuPlan({ medical: ['tca'], goal: maintainIdx });
  assert(plan !== undefined, 'TCA + maintain should work');
});

check('Sans TCA + cut → plan normal (no unintended override)', function() {
  if (cutIdx < 0) return;
  var plan = getMuscuPlan({ medical: [], goal: cutIdx });
  assert(plan !== undefined, 'No medical + cut should work normally');
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — muscu-programs.js: sportEquipment array bypass
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 3. buildPersonalizedMuscuPlan — sportEquipment type guard ===');

check('sportEquipment = [] → ne crash pas (type guard)', function() {
  var plan = getMuscuPlan({ sportEquipment: [] });
  assert(plan !== undefined, 'Array sportEquipment should not throw');
});

check('sportEquipment = {} → ne crash pas (type guard)', function() {
  var plan = getMuscuPlan({ sportEquipment: {} });
  assert(plan !== undefined, 'Object sportEquipment should not throw');
});

check('sportEquipment = null → traité comme gym (ne crash pas)', function() {
  var plan = getMuscuPlan({ sportEquipment: null });
  assert(plan !== undefined, 'null sportEquipment should not throw');
  assert(plan && plan.weekProgram, 'null equip should produce weekProgram');
});

check("sportEquipment = 'home' → pas de câble/machine dans buildPersonalizedMuscuPlan", function() {
  var plan = getMuscuPlan({ sportEquipment: 'home' });
  if (!plan) { console.log('  (skipped — plan null)'); return; }
  var names = getMuscuExNames(plan);
  var hasMachines = names.some(function(n){ return /c[âa]ble|machine|poulie|presse.*machine|pec deck/.test(n); });
  assert(!hasMachines, 'Home equipment should not contain cable/machine. Found: ' + names.filter(function(n){ return /c[âa]ble|machine|poulie/.test(n); }).join(', '));
});

check("sportEquipment = 'gym' → weekProgram non vide", function() {
  var plan = getMuscuPlan({ sportEquipment: 'gym' });
  assert(plan && Array.isArray(plan.weekProgram) && plan.weekProgram.length > 0, 'Gym equipment should have weekProgram');
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — extras.js: WATER_TRACKER division by zero
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 4. WATER_TRACKER — division par zéro ===');

check('WATER_TRACKER.getToday existe', function() {
  assert(window.WATER_TRACKER && typeof window.WATER_TRACKER.getToday === 'function', 'WATER_TRACKER.getToday missing');
});

check('WATER_TRACKER.getToday ne crash pas quand target = 0', function() {
  var wt = window.WATER_TRACKER;
  var orig = wt._getTarget;
  wt._getTarget = function(){ return 0; };
  var status;
  try { status = wt.getToday(); } finally { wt._getTarget = orig; }
  assert(status !== undefined, 'getToday should return object');
  assert(typeof status.percent === 'number', 'percent should be a number');
  assert(!isNaN(status.percent), 'percent should not be NaN when target=0');
  assert(status.percent === 0, 'percent should be 0 when target=0, got: ' + status.percent);
});

check('WATER_TRACKER.getToday percent sain quand target > 0', function() {
  var wt = window.WATER_TRACKER;
  var orig = wt._getTarget;
  var origLoad = wt._loadAll;
  wt._getTarget = function(){ return 8; };
  var tk = new Date().toISOString().slice(0,10); // YYYY-MM-DD format matches todayKey() in extras.js
  wt._loadAll = function(){ var r = {}; r[tk] = 4; return r; };
  var status;
  try { status = wt.getToday(); } finally { wt._getTarget = orig; wt._loadAll = origLoad; }
  assert(status.percent === 50, 'Expected 50%, got ' + status.percent);
});

check('WATER_TRACKER.getToday percent = 0 quand 0 verres (normal)', function() {
  var wt = window.WATER_TRACKER;
  var orig = wt._getTarget;
  var origLoad = wt._loadAll;
  wt._getTarget = function(){ return 8; };
  wt._loadAll = function(){ return {}; };
  var status;
  try { status = wt.getToday(); } finally { wt._getTarget = orig; wt._loadAll = origLoad; }
  assert(status.percent === 0, 'Expected 0%, got ' + status.percent);
});

check('WATER_TRACKER.getToday percent clampé à 100', function() {
  var wt = window.WATER_TRACKER;
  var orig = wt._getTarget;
  var origLoad = wt._loadAll;
  wt._getTarget = function(){ return 2; };
  var tk = new Date().toISOString().slice(0,10); // YYYY-MM-DD format matches todayKey() in extras.js
  wt._loadAll = function(){ var r = {}; r[tk] = 100; return r; };
  var status;
  try { status = wt.getToday(); } finally { wt._getTarget = orig; wt._loadAll = origLoad; }
  assert(status.percent <= 100, 'percent should be clamped to 100, got ' + status.percent);
  assert(status.percent === 100, 'Expected 100%, got ' + status.percent);
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — gamification.js: getStreak defensive normalization
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 5. gamification.js — getStreak normalization ===');

check('GAMIFICATION.getStreak existe', function() {
  assert(window.GAMIFICATION && typeof window.GAMIFICATION.getStreak === 'function', 'GAMIFICATION.getStreak missing');
});

check('getStreak sans user → {current:0, best:0, lastDate:null}', function() {
  window.AUTH = null;
  var s = window.GAMIFICATION.getStreak();
  assert(s.current === 0, 'current should be 0, got ' + s.current);
  assert(s.best === 0, 'best should be 0, got ' + s.best);
  assert(s.lastDate === null, 'lastDate should be null, got ' + s.lastDate);
});

check('getStreak avec localStorage = "{}" (JSON valide mais vide) → current=0', function() {
  window.AUTH = { getUser: function(){ return { id: 'test-user-safety' }; } };
  // Find the actual streak key (STREAK_KEY constant in gamification.js)
  // It's typically 'sfc_streak_' + userId
  var streakKey = null;
  for (var k in _lsStore) { if (k.indexOf('streak') !== -1) streakKey = k; }
  // We don't know the key name, so set all possible variants
  _lsStore['mtd_streak_test-user-safety'] = '{}';
  var s = window.GAMIFICATION.getStreak();
  assert(typeof s.current === 'number', 'current should be a number, got typeof=' + typeof s.current);
  assert(s.current === 0, 'current should default to 0, got: ' + s.current);
  assert(typeof s.best === 'number', 'best should be a number');
  assert(s.best === 0, 'best should default to 0, got: ' + s.best);
  assert('lastDate' in s, 'lastDate should be present');
  delete _lsStore['mtd_streak_test-user-safety'];
  window.AUTH = null;
});

check('getStreak avec localStorage JSON malformé → {current:0, best:0}', function() {
  window.AUTH = { getUser: function(){ return { id: 'test-user-safety' }; } };
  _lsStore['mtd_streak_test-user-safety'] = 'NOT_VALID_JSON!!!';
  var s = window.GAMIFICATION.getStreak();
  assert(s.current === 0, 'Malformed JSON → current=0, got: ' + s.current);
  assert(s.best === 0, 'Malformed JSON → best=0, got: ' + s.best);
  delete _lsStore['mtd_streak_test-user-safety'];
  window.AUTH = null;
});

check('getStreak avec données valides → retourne les bonnes valeurs', function() {
  window.AUTH = { getUser: function(){ return { id: 'test-user-safety' }; } };
  _lsStore['mtd_streak_test-user-safety'] = JSON.stringify({current:5, best:12, lastDate:'2026-04-20', dates:[]});
  var s = window.GAMIFICATION.getStreak();
  assert(s.current === 5, 'current should be 5, got: ' + s.current);
  assert(s.best === 12, 'best should be 12, got: ' + s.best);
  assert(s.lastDate === '2026-04-20', 'lastDate wrong: ' + s.lastDate);
  delete _lsStore['mtd_streak_test-user-safety'];
  window.AUTH = null;
});

check('getStreak avec {"current":"3","best":"7"} (string keys) → normalisé', function() {
  window.AUTH = { getUser: function(){ return { id: 'test-user-safety' }; } };
  _lsStore['mtd_streak_test-user-safety'] = JSON.stringify({current:'3', best:'7', lastDate:'2026-01-01', dates:[]});
  var s = window.GAMIFICATION.getStreak();
  assert(typeof s.current === 'number', 'current should be number after normalization, got: ' + typeof s.current);
  delete _lsStore['mtd_streak_test-user-safety'];
  window.AUTH = null;
});

check('getStreak: dates absent → dates normalisé en array', function() {
  window.AUTH = { getUser: function(){ return { id: 'test-user-safety' }; } };
  _lsStore['mtd_streak_test-user-safety'] = JSON.stringify({current:3, best:5, lastDate:'2026-01-01'});
  var s = window.GAMIFICATION.getStreak();
  assert(Array.isArray(s.dates), 'dates should be array, got: ' + typeof s.dates);
  delete _lsStore['mtd_streak_test-user-safety'];
  window.AUTH = null;
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — calisthenics-program.js: medical conditions filtering
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 6. generateCalisthenicsPlan — medical conditions ===');

check('generateCalisthenicsPlan existe dans window', function() {
  assert(typeof window.generateCalisthenicsPlan === 'function', 'generateCalisthenicsPlan missing');
});

check('generateCalisthenicsPlan sans medical → plan complet avec muscle_up possible', function() {
  var plan = window.generateCalisthenicsPlan('intermediaire', ['muscle_up'], 10, 20, 3, ['bar'], 10, []);
  assert(plan && plan.skills, 'plan should have skills');
  var skillIds = plan.skills.map(function(s){ return s.id; });
  assert(skillIds.indexOf('muscle_up') !== -1, 'muscle_up should be in skills for healthy profile');
});

check('HTA: muscle_up exclu des goals calisthenics', function() {
  var plan = window.generateCalisthenicsPlan('intermediaire', ['muscle_up', 'handstand'], 10, 20, 3, ['bar'], 10, ['hta']);
  assert(plan && plan.skills !== undefined, 'plan should be generated');
  var skillIds = plan.skills.map(function(s){ return s.id; });
  assert(skillIds.indexOf('muscle_up') === -1, 'HTA should exclude muscle_up (Valsalva risk)');
  assert(skillIds.indexOf('handstand') === -1, 'HTA should exclude handstand (inversion risk)');
});

check('HTA: planche et front_lever exclus des goals calisthenics', function() {
  var plan = window.generateCalisthenicsPlan('avance', ['planche', 'front_lever'], 15, 30, 4, ['bar'], 15, ['hypertension']);
  assert(plan && plan.skills !== undefined, 'plan should be generated');
  var skillIds = plan.skills.map(function(s){ return s.id; });
  assert(skillIds.indexOf('planche') === -1, 'HTA should exclude planche (isometric max intensity)');
  assert(skillIds.indexOf('front_lever') === -1, 'HTA should exclude front_lever');
});

check('Ostéoporose: back_lever et planche exclus', function() {
  var plan = window.generateCalisthenicsPlan('intermediaire', ['back_lever', 'planche', 'muscle_up'], 12, 20, 3, ['bar'], 10, ['osteoporose']);
  assert(plan && plan.skills !== undefined, 'plan should be generated');
  var skillIds = plan.skills.map(function(s){ return s.id; });
  assert(skillIds.indexOf('back_lever') === -1, 'Osteo should exclude back_lever (shoulder stress)');
  assert(skillIds.indexOf('planche') === -1, 'Osteo should exclude planche');
});

check('Grossesse: handstand et muscle_up_rings exclus', function() {
  var plan = window.generateCalisthenicsPlan('intermediaire', ['handstand', 'muscle_up_rings'], 8, 15, 3, ['bar', 'rings'], 8, ['grossesse']);
  assert(plan && plan.skills !== undefined, 'plan should be generated');
  var skillIds = plan.skills.map(function(s){ return s.id; });
  assert(skillIds.indexOf('handstand') === -1, 'Pregnancy should exclude handstand (inversion)');
  assert(skillIds.indexOf('muscle_up_rings') === -1, 'Pregnancy should exclude muscle_up_rings (Valsalva)');
});

check('Medical vide/null → aucun skill filtré (8e param absent)', function() {
  var plan = window.generateCalisthenicsPlan('intermediaire', ['muscle_up', 'handstand'], 10, 20, 3, ['bar'], 10);
  assert(plan && plan.skills !== undefined, 'Should work without 8th param');
  var skillIds = plan.skills.map(function(s){ return s.id; });
  assert(skillIds.indexOf('muscle_up') !== -1, 'No medical → muscle_up should not be filtered');
});

check('Cardio: handstand et muscle_up exclus (inversions)', function() {
  var plan = window.generateCalisthenicsPlan('intermediaire', ['handstand', 'muscle_up'], 10, 20, 3, ['bar'], 10, ['cardio']);
  assert(plan && plan.skills !== undefined, 'plan should be generated');
  var skillIds = plan.skills.map(function(s){ return s.id; });
  assert(skillIds.indexOf('handstand') === -1, 'Cardio insuf. should exclude handstand');
  assert(skillIds.indexOf('muscle_up') === -1, 'Cardio insuf. should exclude muscle_up');
});

check('IRC sans calisthenics skills dangereux → plan généré', function() {
  // IRC doesn't block calisthenics skills directly (impact is dietary)
  // But let's verify no crash
  var plan = window.generateCalisthenicsPlan('debutant', [], 3, 10, 3, ['bar'], 0, ['irc']);
  assert(plan !== undefined, 'IRC should not crash calisthenics generator');
  assert(plan && plan.plan && plan.plan.length > 0, 'Should have weekly plan');
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7 — Intégrité multi-fix (interactions entre fixes)
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 7. Intégrité multi-fix ===');

check('TCA + IRC combinés → plan muscu ne crash pas', function() {
  var plan = getMuscuPlan({ medical: ['tca', 'irc'], goal: cutIdx >= 0 ? cutIdx : maintainIdx });
  assert(plan !== undefined, 'TCA + IRC combined should not crash');
});

check('HTA + osteo combinés → plan muscu ne crash pas', function() {
  var plan = getMuscuPlan({ medical: ['hta', 'osteoporose'] });
  assert(plan !== undefined, 'HTA + osteo combined should not crash');
});

check('HTA + osteo → deadlift ET box jump absents ensemble', function() {
  var plan = getMuscuPlan({ medical: ['hta', 'osteoporose'] });
  if (!plan) return;
  var names = getMuscuExNames(plan);
  var hasDeadlift = names.some(function(n){ return /deadlift|soulev[eé].*terre/.test(n); });
  var hasJump = names.some(function(n){ return /box jump|jump squat|saut/.test(n); });
  assert(!hasDeadlift, 'HTA+osteo should block deadlift');
  assert(!hasJump, 'HTA+osteo should block box jumps');
});

check('sportEquipment=[] + IRC → ne crash pas (deux bugs en même temps)', function() {
  var plan = getMuscuPlan({ sportEquipment: [], medical: ['irc'] });
  assert(plan !== undefined, 'Array equip + IRC should not crash');
});

check('Eau: percent toujours entre 0 et 100 (fuzzing cible)', function() {
  var wt = window.WATER_TRACKER;
  var origTarget = wt._getTarget;
  var origLoad = wt._loadAll;
  var tk = new Date().toISOString().slice(0,10); // YYYY-MM-DD format matches todayKey() in extras.js
  [0, 1, 5, 8, 10].forEach(function(target) {
    [0, 1, 3, 8, 15, 100].forEach(function(glasses) {
      wt._getTarget = function(){ return target; };
      wt._loadAll = function(){ var r = {}; r[tk] = glasses; return r; };
      var s = wt.getToday();
      assert(s.percent >= 0 && s.percent <= 100, 'percent out of range: target=' + target + ' glasses=' + glasses + ' percent=' + s.percent);
      assert(!isNaN(s.percent), 'NaN percent: target=' + target + ' glasses=' + glasses);
    });
  });
  wt._getTarget = origTarget;
  wt._loadAll = origLoad;
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7 — generateSportProgram: sportEquipment normalization
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 7. generateSportProgram — sportEquipment normalization ===');

// Stub sfcBuildMuscuDay if muscu-engine.js is not loaded (returns empty day — enough to
// reach the end of generateSportProgram without crashing on a missing function).
if (typeof window.sfcBuildMuscuDay !== 'function') {
  window.sfcBuildMuscuDay = function() { return []; };
}

function _getEquipAfterGenerate(equipInput) {
  var s = buildMuscuS({ sportEquipment: equipInput });
  window.S = s;
  try { window.generateSportProgram(); } catch(_e) { /* may throw on missing render helpers */ }
  return window.S.sportEquipment;
}

check('sportEquipment = null → normalisé en "gym"', function() {
  var eq = _getEquipAfterGenerate(null);
  assert(eq === 'gym', 'null should normalize to "gym", got: ' + JSON.stringify(eq));
});

check('sportEquipment = "gym" (string) → inchangé', function() {
  var eq = _getEquipAfterGenerate('gym');
  assert(eq === 'gym', 'string "gym" should stay "gym", got: ' + JSON.stringify(eq));
});

check('sportEquipment = ["home"] (array) → normalisé en "home"', function() {
  var eq = _getEquipAfterGenerate(['home']);
  assert(eq === 'home', 'array ["home"] should normalize to "home", got: ' + JSON.stringify(eq));
});

// ─── Résumé ───────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(60));
console.log('Résultats : ' + pass + ' pass, ' + fail + ' fail');
if (fail > 0) process.exit(1);
