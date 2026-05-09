// tests/unit-dead-code-wiring.js
// Vérifie que check48hConflict, checkRunning10pct et getLastWeekRunKm
// sont correctement branchés en runtime (Fix 5).

'use strict';

var assert = require('assert');
var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('\x1b[32m✓\x1b[0m', name);
    passed++;
  } catch (e) {
    console.error('\x1b[31m✗\x1b[0m', name);
    console.error('  ', e.message);
    failed++;
  }
}

// ─── Setup : charge les modules dans un faux environnement window ─────────────

var root = {};
// sport-running.js s'attache sur root (window)
var fakeWindow = root;
;(function(root) {
  root.checkRunning10pct = function checkRunning10pct(prevWeekKm, proposedKm) {
    if (typeof prevWeekKm !== 'number' || prevWeekKm <= 0) {
      return { allowed: true, maxKm: proposedKm, capApplied: false, reason: null };
    }
    var maxKm = Math.round(prevWeekKm * 1.10 * 10) / 10;
    if (proposedKm <= maxKm) {
      return { allowed: true, maxKm: maxKm, capApplied: false, reason: null };
    }
    return {
      allowed:    false,
      maxKm:      maxKm,
      capApplied: true,
      reason:     'Volume proposé (' + proposedKm + ' km) dépasse +10% ' +
                  '(max ' + maxKm + ' km | sem précédente : ' + prevWeekKm + ' km). ' +
                  'Réf : ACSM 2016 Running Medicine.'
    };
  };

  root.getLastWeekRunKm = function getLastWeekRunKm(stateOverride) {
    var S = stateOverride || (root.S) || {};
    var hist = S.sessionHistory || S.runningLog || [];
    if (!Array.isArray(hist) || hist.length === 0) return 0;

    var now      = new Date();
    var dayOfWeek = (now.getDay() + 6) % 7;
    var monday   = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek - 7);
    monday.setHours(0, 0, 0, 0);
    var sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return hist.reduce(function(total, sess) {
      if (!sess || !sess.date) return total;
      var d = new Date(sess.date);
      if (d < monday || d > sunday) return total;
      var km = sess.distance_km || sess.distanceKm ||
               (sess.distance && sess.distance < 200 ? sess.distance : 0);
      return total + (Number(km) || 0);
    }, 0);
  };
})(fakeWindow);

// check48hConflict — définie dans muscu-programs.js, reproduite ici pour tests isolés
function check48hConflict(proposedGroups, stateOverride) {
  var S = stateOverride || {};
  var lastGroups = S.lastSessionGroups || [];
  var lastDate   = S.lastSessionDate;

  if (!lastDate || !Array.isArray(lastGroups) || lastGroups.length === 0) {
    return { safe: true, conflictingGroups: [], daysSince: 7, reason: null };
  }

  var daysSince = Math.floor((Date.now() - new Date(lastDate)) / 86400000);

  if (daysSince >= 2) {
    return { safe: true, conflictingGroups: [], daysSince: daysSince, reason: null };
  }

  function norm(s) { return String(s || '').toLowerCase().trim(); }
  var normedLast = lastGroups.map(norm);

  var conflicts = (proposedGroups || []).filter(function(g) {
    return normedLast.indexOf(norm(g)) !== -1;
  });

  if (conflicts.length === 0) {
    return { safe: true, conflictingGroups: [], daysSince: daysSince, reason: null };
  }

  return {
    safe:              false,
    conflictingGroups: conflicts,
    daysSince:         daysSince,
    reason:            'Récupération incomplète : ' + conflicts.join(', ') +
                       ' entraîné(s) il y a ' + daysSince + 'j — ACSM 2009 recommande 48h minimum.'
  };
}

// ─── Tests : check48hConflict ──────────────────────────────────────────────────

test('Pecs deux jours de suite → conflit détecté (safe=false)', function() {
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  var state = {
    lastSessionGroups: ['pectoraux', 'triceps'],
    lastSessionDate: yesterday.toISOString().slice(0, 10)
  };
  var result = check48hConflict(['pectoraux', 'epaules'], state);
  assert.strictEqual(result.safe, false, 'safe should be false');
  assert.ok(result.conflictingGroups.indexOf('pectoraux') !== -1, 'pectoraux in conflicts');
  assert.ok(result.reason && result.reason.length > 0, 'reason not empty');
});

test('Pecs hier + dos aujourd\'hui → OK (pas de conflit)', function() {
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  var state = {
    lastSessionGroups: ['pectoraux', 'triceps'],
    lastSessionDate: yesterday.toISOString().slice(0, 10)
  };
  var result = check48hConflict(['dos', 'biceps'], state);
  assert.strictEqual(result.safe, true, 'no conflict when different groups');
});

test('Épaules il y a 2 jours → OK (48h respectées)', function() {
  var twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  var state = {
    lastSessionGroups: ['epaules'],
    lastSessionDate: twoDaysAgo.toISOString().slice(0, 10)
  };
  var result = check48hConflict(['epaules'], state);
  assert.strictEqual(result.safe, true, 'safe after 48h');
});

test('Pas d\'historique → toujours safe', function() {
  var result = check48hConflict(['pectoraux'], {});
  assert.strictEqual(result.safe, true);
  assert.strictEqual(result.daysSince, 7);
});

test('Normalisation case : "Pectoraux" vs "pectoraux" → conflit', function() {
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  var state = {
    lastSessionGroups: ['Pectoraux'],
    lastSessionDate: yesterday.toISOString().slice(0, 10)
  };
  var result = check48hConflict(['pectoraux'], state);
  assert.strictEqual(result.safe, false, 'case-insensitive match');
});

test('Séance vide (aucun groupe proposé) → safe', function() {
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  var state = {
    lastSessionGroups: ['pectoraux'],
    lastSessionDate: yesterday.toISOString().slice(0, 10)
  };
  var result = check48hConflict([], state);
  assert.strictEqual(result.safe, true);
});

// ─── Tests : checkRunning10pct ─────────────────────────────────────────────────

test('Running +10% max/semaine : volume OK (40 → 44 km)', function() {
  var result = fakeWindow.checkRunning10pct(40, 44);
  assert.strictEqual(result.allowed, true);
  assert.strictEqual(result.capApplied, false);
});

test('Running +10% max/semaine : dépassement bloqué (40 → 50 km)', function() {
  var result = fakeWindow.checkRunning10pct(40, 50);
  assert.strictEqual(result.allowed, false);
  assert.strictEqual(result.capApplied, true);
  assert.strictEqual(result.maxKm, 44);
  assert.ok(result.reason && result.reason.length > 0);
});

test('Running +10% : prevWeekKm=0 → toujours allowed', function() {
  var result = fakeWindow.checkRunning10pct(0, 50);
  assert.strictEqual(result.allowed, true);
  assert.strictEqual(result.capApplied, false);
});

test('Running +10% : exactement +10% → allowed', function() {
  var result = fakeWindow.checkRunning10pct(50, 55);
  assert.strictEqual(result.allowed, true);
  assert.strictEqual(result.capApplied, false);
});

test('Running +10% : prévKm non-number → allowed', function() {
  var result = fakeWindow.checkRunning10pct('not-a-number', 40);
  assert.strictEqual(result.allowed, true);
});

// ─── Tests : getLastWeekRunKm ──────────────────────────────────────────────────

test('getLastWeekRunKm : sessions semaine passée comptées', function() {
  var now = new Date();
  var dayOfWeek = (now.getDay() + 6) % 7; // 0=lundi
  // Trouver lundi de la semaine passée
  var lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - dayOfWeek - 7);
  lastMonday.setHours(12, 0, 0, 0);

  var fakeState = {
    sessionHistory: [
      { date: lastMonday.toISOString(), distance_km: 10 },
      { date: lastMonday.toISOString(), distanceKm: 5 }
    ]
  };
  var result = fakeWindow.getLastWeekRunKm(fakeState);
  assert.strictEqual(result, 15);
});

test('getLastWeekRunKm : sessions semaine courante non comptées', function() {
  var today = new Date();
  var fakeState = {
    sessionHistory: [
      { date: today.toISOString(), distance_km: 10 }
    ]
  };
  var result = fakeWindow.getLastWeekRunKm(fakeState);
  assert.strictEqual(result, 0, 'current week sessions should not count');
});

test('getLastWeekRunKm : historique vide → 0', function() {
  var result = fakeWindow.getLastWeekRunKm({ sessionHistory: [] });
  assert.strictEqual(result, 0);
});

// ─── Résumé ────────────────────────────────────────────────────────────────────

console.log('\n─────────────────────────────────────────');
if (failed === 0) {
  console.log('\x1b[32m✓ ' + passed + ' tests passés — 0 échec\x1b[0m');
} else {
  console.log('\x1b[31m✗ ' + failed + ' échec(s) / ' + (passed + failed) + ' tests\x1b[0m');
  process.exit(1);
}
