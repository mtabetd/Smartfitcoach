'use strict';

// ─── TESTS UNITAIRES — MOTIVATION QUOTIDIENNE ────────────────────────────────
// Vérifie :
//   - Horaire Mon-Fri 8h30 / Sam-Dim 10h00
//   - Déterminisme : même date → même phrase
//   - Templates : {prenom}, {streak}, fallback no-prenom
//   - No-duplicate : 30 jours consécutifs n'ont pas (tous) la même phrase
//   - Streak milestones prioritaires
//   - Training/Rest day variations
// Usage : node tests/unit-motivation.js
// ─────────────────────────────────────────────────────────────────────────────

var assert = require('assert');
var fs     = require('fs');
var path   = require('path');
var vm     = require('vm');

global.window = global;
var code = fs.readFileSync(path.join(__dirname, '../app/motivation-library.js'), 'utf8');
vm.runInThisContext(code, { filename: 'motivation-library.js' });

if (!global.MOTIVATION_LIBRARY) {
  console.error('[FATAL] MOTIVATION_LIBRARY non exposé');
  process.exit(1);
}

var M = global.MOTIVATION_LIBRARY;
var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log('  \x1b[32m✓\x1b[0m', name); passed++; }
  catch(e) { console.error('  \x1b[31m✗\x1b[0m', name); console.error('    ', e.message); failed++; }
}
function suite(n) { console.log('\n' + n); }

// ─── 1. HORAIRE ──────────────────────────────────────────────────────────────
suite('Horaire — Mon-Fri 8h30 / Sam-Dim 10h00');

test('Lundi 7h30 → prochaine notif = Lundi 8h30 même jour', function() {
  var mon = new Date('2026-04-13T07:30:00'); // 13/04/2026 est un lundi
  var next = M.getNextMotivationTime(mon);
  assert.strictEqual(next.getDay(), 1); // lundi
  assert.strictEqual(next.getHours(), 8);
  assert.strictEqual(next.getMinutes(), 30);
});

test('Lundi 9h00 → prochaine notif = Mardi 8h30', function() {
  var mon = new Date('2026-04-13T09:00:00');
  var next = M.getNextMotivationTime(mon);
  assert.strictEqual(next.getDay(), 2); // mardi
  assert.strictEqual(next.getHours(), 8);
  assert.strictEqual(next.getMinutes(), 30);
});

test('Vendredi 9h00 → prochaine notif = Samedi 10h00', function() {
  var fri = new Date('2026-04-17T09:00:00');
  var next = M.getNextMotivationTime(fri);
  assert.strictEqual(next.getDay(), 6); // samedi
  assert.strictEqual(next.getHours(), 10);
  assert.strictEqual(next.getMinutes(), 0);
});

test('Samedi 9h00 → prochaine notif = Samedi 10h00 (même jour)', function() {
  var sat = new Date('2026-04-18T09:00:00');
  var next = M.getNextMotivationTime(sat);
  assert.strictEqual(next.getDay(), 6);
  assert.strictEqual(next.getHours(), 10);
  assert.strictEqual(next.getMinutes(), 0);
});

test('Samedi 11h00 → prochaine notif = Dimanche 10h00', function() {
  var sat = new Date('2026-04-18T11:00:00');
  var next = M.getNextMotivationTime(sat);
  assert.strictEqual(next.getDay(), 0); // dimanche
  assert.strictEqual(next.getHours(), 10);
});

test('Dimanche 11h00 → prochaine notif = Lundi 8h30', function() {
  var sun = new Date('2026-04-19T11:00:00');
  var next = M.getNextMotivationTime(sun);
  assert.strictEqual(next.getDay(), 1); // lundi
  assert.strictEqual(next.getHours(), 8);
  assert.strictEqual(next.getMinutes(), 30);
});

test('Lundi 8h30:00 pile → prochaine notif = Mardi 8h30 (pas répète le même jour)', function() {
  var mon = new Date('2026-04-13T08:30:00');
  var next = M.getNextMotivationTime(mon);
  assert.strictEqual(next.getDay(), 2);
});

// ─── 2. DÉTERMINISME ─────────────────────────────────────────────────────────
suite('Déterminisme — même date → même phrase');

test('Même date + même profil → même body (x3 appels)', function() {
  var p = { prenom: 'Jamal', streak: 5, date: '2026-04-13' };
  var a = M.getDailyMotivation(p);
  var b = M.getDailyMotivation(p);
  var c = M.getDailyMotivation(p);
  assert.strictEqual(a.body, b.body);
  assert.strictEqual(b.body, c.body);
});

// ─── 3. TEMPLATES ────────────────────────────────────────────────────────────
suite('Templates — {prenom} géré proprement');

test('Avec prenom → {prenom} remplacé', function() {
  var tpl = 'Prenez un temps pour vous, {prenom}. Vous l\'avez mérité.';
  var out = M.applyTemplate(tpl, { prenom: 'Alice' });
  assert.ok(out.indexOf('Alice') !== -1, 'Alice doit apparaître : ' + out);
  assert.ok(out.indexOf('{prenom}') === -1, 'Template doit être consommé : ' + out);
});

test('Sans prenom → virgule + template supprimés proprement', function() {
  var tpl = 'Prenez un temps pour vous, {prenom}. Vous l\'avez mérité.';
  var out = M.applyTemplate(tpl, { prenom: '' });
  assert.ok(out.indexOf('{prenom}') === -1, 'Template doit disparaître');
  assert.ok(out.indexOf(',.') === -1, 'Virgule orpheline doit être nettoyée : ' + out);
  assert.ok(out.indexOf(',,') === -1, 'Pas de virgule double');
});

test('{streak} remplacé par entier', function() {
  var tpl = 'Vous êtes à {streak} jours.';
  var out = M.applyTemplate(tpl, { streak: 30 });
  assert.strictEqual(out, 'Vous êtes à 30 jours.');
});

// ─── 4. DIVERSITÉ ────────────────────────────────────────────────────────────
suite('Diversité — 30 jours consécutifs ne donnent pas tous la même phrase');

test('30 jours consécutifs → au moins 15 phrases différentes', function() {
  var phrases = new Set();
  var start = new Date('2026-04-01');
  for (var i = 0; i < 30; i++) {
    var d = new Date(start);
    d.setDate(start.getDate() + i);
    var msg = M.getDailyMotivation({ prenom: 'Jamal', streak: 0, date: d });
    phrases.add(msg.body);
  }
  assert.ok(phrases.size >= 15, 'Attendu ≥15 phrases uniques sur 30 jours, reçu ' + phrases.size);
});

test('60 jours consécutifs → au moins 30 phrases différentes', function() {
  var phrases = new Set();
  var start = new Date('2026-04-01');
  for (var i = 0; i < 60; i++) {
    var d = new Date(start);
    d.setDate(start.getDate() + i);
    phrases.add(M.getDailyMotivation({ prenom: 'Alice', streak: 0, date: d }).body);
  }
  assert.ok(phrases.size >= 30, 'Attendu ≥30 phrases uniques sur 60 jours, reçu ' + phrases.size);
});

// ─── 5. STREAK MILESTONES ────────────────────────────────────────────────────
suite('Streak milestones prioritaires');

test('streak = 30 → phrase milestone 30', function() {
  var msg = M.getDailyMotivation({ prenom: 'Alice', streak: 30, date: '2026-04-14' });
  assert.ok(msg._source.indexOf('streak-30') === 0, 'Source doit être streak-30 : ' + msg._source);
});

test('streak = 100 → phrase milestone 100', function() {
  var msg = M.getDailyMotivation({ prenom: 'Alice', streak: 100, date: '2026-04-14' });
  assert.ok(msg._source.indexOf('streak-100') === 0);
});

test('streak = 29 (pas un palier) → rotation weekday', function() {
  var msg = M.getDailyMotivation({ prenom: 'Alice', streak: 29, date: '2026-04-14' });
  assert.ok(msg._source.indexOf('weekday') === 0, 'Source doit être weekday, reçu ' + msg._source);
});

// ─── 6. TRAINING / REST DAY ──────────────────────────────────────────────────
suite('Training / Rest day modificateurs');

test('Training day activé → certains jours renvoient pool training', function() {
  // On teste sur 30 jours : au moins 1 doit venir du pool training
  var sources = new Set();
  for (var i = 0; i < 30; i++) {
    var d = new Date('2026-04-01');
    d.setDate(d.getDate() + i);
    var msg = M.getDailyMotivation({ prenom: 'Jamal', streak: 0, isTrainingDay: true, date: d });
    sources.add(msg._source);
  }
  assert.ok(sources.has('training') || [].some.call(sources, function(s){return s.indexOf('training')===0;}),
    'Au moins un jour doit puiser dans training sur 30 jours — sources: ' + Array.from(sources).join(','));
});

test('Rest day activé → certains jours renvoient pool rest', function() {
  var sources = new Set();
  for (var i = 0; i < 30; i++) {
    var d = new Date('2026-04-01');
    d.setDate(d.getDate() + i);
    var msg = M.getDailyMotivation({ prenom: 'Jamal', streak: 0, isTrainingDay: false, date: d });
    sources.add(msg._source);
  }
  var hasRest = false;
  sources.forEach(function(s) { if (s === 'rest') hasRest = true; });
  assert.ok(hasRest, 'Pool rest attendu sur 30 jours — sources: ' + Array.from(sources).join(','));
});

// ─── 7. WEEKDAY CORRECT ──────────────────────────────────────────────────────
suite('Rotation weekday — bonne phrase pour bon jour');

test('Samedi → phrase samedi (luxe, week-end)', function() {
  // Le pool samedi contient des phrases typiques "Le samedi est un art..." etc.
  var msg = M.getDailyMotivation({ prenom: 'X', streak: 0, date: '2026-04-18' });
  var satPool = M._pools.byWeekday[6];
  assert.ok(satPool.indexOf(msg.body.replace(/^Prenez un temps.*\. /, '').replace(/, X\.? ?/g, ', {prenom}.')) !== -1 ||
           satPool.some(function(p) {
             return p.replace(/\{prenom\}/g, 'X').replace(/,?\s*X/g, ', X') === msg.body ||
                    p.replace(/,?\s*\{prenom\}/g, '') === msg.body ||
                    p.replace(/\{prenom\}/g, 'X') === msg.body;
           }), 'Samedi doit retourner une phrase du pool samedi — reçu: ' + msg.body);
});

// ─── 8. ROBUSTESSE ───────────────────────────────────────────────────────────
suite('Robustesse — entrées cassées');

test('profile vide → retourne body non-vide', function() {
  var msg = M.getDailyMotivation({});
  assert.ok(msg.body && msg.body.length > 10, 'Body minimum : ' + msg.body);
});

test('profile undefined → ne crash pas', function() {
  var msg = M.getDailyMotivation();
  assert.ok(msg.body);
});

test('Date invalide → pas de crash', function() {
  var msg = M.getDailyMotivation({ date: 'bonjour-monde' });
  assert.ok(msg.body);
});

// ─── 9. COMPTEUR PHRASES ─────────────────────────────────────────────────────
suite('Corpus — biblio bien remplie');

test('Au moins 100 phrases au total', function() {
  assert.ok(M._count >= 100, 'Attendu ≥100 phrases, reçu ' + M._count);
});

// ─── 10. BILAN ───────────────────────────────────────────────────────────────
console.log('\n────────────────────────────────────────────────────');
if (failed === 0) {
  console.log('\x1b[32m✓ ' + passed + ' tests passés — 0 échec\x1b[0m');
  process.exit(0);
} else {
  console.log('\x1b[31m✗ ' + failed + ' échec(s) sur ' + (passed + failed) + ' tests\x1b[0m');
  process.exit(1);
}
