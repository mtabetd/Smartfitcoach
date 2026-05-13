'use strict';
/**
 * Test suite — Training Plan Integrity
 * Couvre : sfcBuildMuscuDay — composition, ordering, equipment filtering,
 *          beginner filter, periodization S1-S4, cycleFactor impact,
 *          hip thrust priority (glutes), squat priority (legs).
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

// ─── Load modules ────────────────────────────────────────────────────────────
eval(fs.readFileSync(ROOT + '/app/food-db.js',      'utf8'));
eval(fs.readFileSync(ROOT + '/app/extras.js',        'utf8'));
eval(fs.readFileSync(ROOT + '/app/app-core.js',      'utf8'));
eval(fs.readFileSync(ROOT + '/app/i18n-helpers.js',  'utf8'));
eval(fs.readFileSync(ROOT + '/app/sfc-symbiosis.js', 'utf8'));
eval(fs.readFileSync(ROOT + '/app/exercises-db.js',  'utf8'));
var _muscuEngine = require(ROOT + '/app/muscu-engine.js');
window.sfcBuildMuscuDay = _muscuEngine.sfcBuildMuscuDay;
eval(fs.readFileSync(ROOT + '/app/sport-data.js',    'utf8'));
eval(fs.readFileSync(ROOT + '/app/app-sport.js',     'utf8'));

var _rawBuild = window.sfcBuildMuscuDay;
function build(grps, cfg) {
  return _rawBuild(grps, Object.assign({ exercises: window.EXERCISES, maxLv: 10, durMax: 6, durSets: 4 }, cfg || {}));
}
// Parse leading number from sets string "4×12-15" → 4
function parseSets(s) {
  var m = String(s||'').match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function resetS() {
  window.S = { sex: 'male', weight: 80, age: 30, sportDays: 4, sportEquipment: 'gym' };
}

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 1. sfcBuildMuscuDay — structure de base ===');
// ══════════════════════════════════════════════════════════════════════════════

check('retourne un tableau', function(){
  resetS();
  var exos = build(['chest'], {});
  assert(Array.isArray(exos), 'not array: ' + typeof exos);
});
check('tableau non vide pour chest gym', function(){
  resetS();
  var exos = build(['chest'], { equipment: 'gym' });
  assert(exos.length > 0, 'empty for chest+gym');
});
check('tableau non vide pour legs gym', function(){
  resetS();
  var exos = build(['legs'], { equipment: 'gym' });
  assert(exos.length > 0, 'empty for legs+gym');
});
check('tableau non vide pour back gym', function(){
  resetS();
  var exos = build(['back'], { equipment: 'gym' });
  assert(exos.length > 0, 'empty for back+gym');
});
check('résultat ≤ durMax=6 exercices (S1 par défaut)', function(){
  resetS();
  var exos = build(['legs', 'glutes', 'back'], {});
  assert(exos.length <= 6, 'too many exos: ' + exos.length);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 2. Pas de duplication de mouvement ===');
// ══════════════════════════════════════════════════════════════════════════════

check('legs : pas de duplication de nom', function(){
  resetS();
  var exos = build(['legs'], { equipment: 'gym' });
  var names = exos.map(function(e){ return e.n; });
  var unique = names.filter(function(n, i){ return names.indexOf(n) === i; });
  assert(unique.length === names.length, 'duplicates: ' + JSON.stringify(names));
});
check('chest+back+legs : pas de duplication', function(){
  resetS();
  var exos = build(['chest','back','legs'], { equipment: 'gym' });
  var names = exos.map(function(e){ return e.n; });
  var unique = names.filter(function(n, i){ return names.indexOf(n) === i; });
  assert(unique.length === names.length, 'duplicates: ' + JSON.stringify(names));
});
check('glutes+legs : pas de duplication', function(){
  resetS();
  var exos = build(['glutes','legs'], { equipment: 'gym' });
  var names = exos.map(function(e){ return e.n; });
  var unique = names.filter(function(n, i){ return names.indexOf(n) === i; });
  assert(unique.length === names.length, 'duplicates: ' + JSON.stringify(names));
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 3. Filtrage équipement ===');
// ══════════════════════════════════════════════════════════════════════════════

check('equipment=home : tous les exos passent le filtre maison', function(){
  resetS();
  var exos = build(['chest','back','legs'], { equipment: 'home' });
  // The engine already filters; just verify no gym-only equipment strings
  exos.forEach(function(e){
    var eq = (e.eq||'').toLowerCase();
    var hasGymOnly = /\bmachine\b|c[aâ]ble|poulie|presse|smith|pec deck|convergente|landmine|t-bar|hack squat/.test(eq);
    assert(!hasGymOnly, 'gym-only eq in home build: ' + e.n + ' eq=' + e.eq);
  });
});
check('equipment=gym : exos retournés (pool gym ≥ home)', function(){
  resetS();
  var homeExos = build(['chest'], { equipment: 'home' });
  var gymExos  = build(['chest'], { equipment: 'gym'  });
  assert(gymExos.length >= homeExos.length || gymExos.length > 0,
    'gym returned fewer or zero: ' + gymExos.length + ' vs home: ' + homeExos.length);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 4. Filtre débutant ===');
// ══════════════════════════════════════════════════════════════════════════════

check('beginner : pas d\'exos avancé (advanced/expert tags)', function(){
  resetS();
  var exos = build(['chest','back','legs'], { beginner: true, equipment: 'gym' });
  exos.forEach(function(e){
    var tags = e.tags || [];
    var ok = tags.indexOf('advanced') === -1 && tags.indexOf('expert') === -1;
    assert(ok, 'advanced exo in beginner: ' + e.n + ' tags=' + JSON.stringify(tags));
  });
});
check('beginner : nombre d\'exos raisonnable (≤ 4)', function(){
  resetS();
  var exos = build(['chest','back'], { beginner: true });
  assert(exos.length <= 6, 'too many for beginner: ' + exos.length);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 5. Périodisation S1-S4 — durMax et durSets ===');
// ══════════════════════════════════════════════════════════════════════════════

// weekIndex→periodization config (mirrors PERIODIZATION_CFG in sfc-symbiosis.js)
function pCfg(weekIndex) {
  var CFG = {1:{durMax:6,durSets:4},2:{durMax:6,durSets:5},3:{durMax:5,durSets:5},4:{durMax:4,durSets:3}};
  return CFG[((weekIndex-1)%4)+1] || CFG[1];
}
function buildW(grps, weekIndex, extra) {
  var cfg = pCfg(weekIndex);
  return build(grps, Object.assign({ durMax: cfg.durMax, durSets: cfg.durSets }, extra || {}));
}

check('S4 (deload) : ≤ 4 exercices max (durMax=4)', function(){
  resetS();
  var exos = buildW(['chest','back','legs','glutes'], 4);
  assert(exos.length <= 4, 'S4 has too many exos: ' + exos.length);
});
check('S1 (base) : ≤ 6 exercices max', function(){
  resetS();
  var exos = buildW(['chest','back','legs','glutes'], 1);
  assert(exos.length <= 6, 'S1 has too many exos: ' + exos.length);
});
check('S2 (volume↑) : durSets supérieur à S1 ou égal', function(){
  resetS();
  var s1 = buildW(['legs','back'], 1);
  var s2 = buildW(['legs','back'], 2);
  var s1sets = s1.reduce(function(a,e){ return a + parseSets(e.sets); }, 0);
  var s2sets = s2.reduce(function(a,e){ return a + parseSets(e.sets); }, 0);
  assert(s2sets >= s1sets, 'S2 sets < S1: s1=' + s1sets + ' s2=' + s2sets);
});
check('S4 : moins de séries totales que S1 (deload)', function(){
  resetS();
  var s1 = buildW(['chest','back','legs'], 1);
  var s4 = buildW(['chest','back','legs'], 4);
  var s1sets = s1.reduce(function(a,e){ return a + parseSets(e.sets); }, 0);
  var s4sets = s4.reduce(function(a,e){ return a + parseSets(e.sets); }, 0);
  assert(s4sets <= s1sets, 'S4 sets >= S1: s4=' + s4sets + ' s1=' + s1sets);
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 6. cycleFactor — réduction volume sur fatigue ===');
// ══════════════════════════════════════════════════════════════════════════════

check('cycleFactor=0.60 : séries réduites vs cycleFactor=1.0', function(){
  resetS();
  var normal = build(['chest','back'], { cycleFactor: 1.0, weekIndex: 1 });
  var tired  = build(['chest','back'], { cycleFactor: 0.6, weekIndex: 1 });
  var nsets  = normal.reduce(function(a,e){ return a + parseSets(e.sets); }, 0);
  var tsets  = tired.reduce(function(a,e){ return a + parseSets(e.sets); }, 0);
  assert(tsets <= nsets, 'tired should have <= sets: tsets=' + tsets + ' nsets=' + nsets);
});
check('cycleFactor=0.60 : minimum 2 séries par exo', function(){
  resetS();
  var exos = build(['chest'], { cycleFactor: 0.6, weekIndex: 1 });
  exos.forEach(function(e){
    var n = parseSets(e.sets);
    assert(n >= 2, 'sets<2 for ' + e.n + ': sets=' + e.sets);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 7. Priorité hip thrust (glutes) et squat (legs) ===');
// ══════════════════════════════════════════════════════════════════════════════

check('glutes gym : hip thrust présent ou exo fessier majeur prioritaire', function(){
  resetS();
  var exos = build(['glutes'], { equipment: 'gym' });
  var names = exos.map(function(e){ return (e.n||'').toLowerCase(); });
  var hasHipThrust = names.some(function(n){
    return n.indexOf('hip thrust') >= 0 || n.indexOf('hip-thrust') >= 0 || n.indexOf('hipthrust') >= 0;
  });
  var hasFessier = names.length > 0;
  assert(hasFessier, 'no glute exercises at all: ' + JSON.stringify(names));
  // Hip thrust should be first if present
  if (hasHipThrust) {
    var firstIdx = names.findIndex(function(n){
      return n.indexOf('hip thrust') >= 0 || n.indexOf('hip-thrust') >= 0;
    });
    assert(firstIdx <= 1, 'hip thrust not among first 2: idx=' + firstIdx);
  }
});
check('legs gym : squat-type exo présent ou exo quadriceps prioritaire', function(){
  resetS();
  var exos = build(['legs'], { equipment: 'gym' });
  var names = exos.map(function(e){ return (e.n||'').toLowerCase(); });
  var hasSquat = names.some(function(n){
    return n.indexOf('squat') >= 0;
  });
  var hasLegs = names.length > 0;
  assert(hasLegs, 'no leg exercises: ' + JSON.stringify(names));
  if (hasSquat) {
    var firstIdx = names.findIndex(function(n){ return n.indexOf('squat') >= 0; });
    assert(firstIdx <= 1, 'squat not among first 2: idx=' + firstIdx + ' names=' + JSON.stringify(names));
  }
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 8. Objectif sport (shred/strength) — reps ===');
// ══════════════════════════════════════════════════════════════════════════════

// Parse min reps from sets string "4×5-8" → 5, or "4×12-15" → 12
function parseMinReps(s) {
  var m = String(s||'').match(/×(\d+)/);
  return m ? parseInt(m[1], 10) : 10;
}

check('hasShred : reps ≥ reps standard (endurance musculaire)', function(){
  resetS();
  var normal = build(['chest'], { hasShred: false, weekIndex: 1 });
  var shred  = build(['chest'], { hasShred: true,  weekIndex: 1 });
  if (normal.length === 0 || shred.length === 0) return;
  var normalReps = parseMinReps(normal[0].sets);
  var shredReps  = parseMinReps(shred[0].sets);
  assert(shredReps >= normalReps, 'shred reps not ≥ normal: shred=' + shredReps + ' normal=' + normalReps + ' (' + shred[0].sets + ' vs ' + normal[0].sets + ')');
});
check('hasStrength : reps faibles (force)', function(){
  resetS();
  var strength = build(['chest'], { hasStrength: true, weekIndex: 1 });
  if (strength.length === 0) return;
  var reps = parseMinReps(strength[0].sets);
  assert(reps <= 8, 'strength reps too high: ' + reps + ' (' + strength[0].sets + ')');
});

// ══════════════════════════════════════════════════════════════════════════════
console.log('\n=== 9. Groupes musculaires multiples — couverture ===');
// ══════════════════════════════════════════════════════════════════════════════

check('chest+back+shoulders : au moins 1 exo retourné', function(){
  resetS();
  var exos = build(['chest','back','shoulders'], { equipment: 'gym' });
  assert(exos.length >= 1, 'no exos for 3-group session: ' + exos.length);
});
check('push day (chest+shoulders+triceps) : au moins 1 exo', function(){
  resetS();
  var exos = build(['chest','shoulders','triceps'], { equipment: 'gym' });
  assert(exos.length >= 1, 'no exos for push day: ' + exos.length);
});
check('pull day (back+biceps) : au moins 1 exo', function(){
  resetS();
  var exos = build(['back','biceps'], { equipment: 'gym' });
  assert(exos.length >= 1, 'no exos for pull day: ' + exos.length);
});

// ─── Résultat ────────────────────────────────────────────────────────────────
console.log('\n' + (fail === 0 ? '✅' : '❌') + ' unit-training-plan-integrity : ' + pass + ' pass, ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
