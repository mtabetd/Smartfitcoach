#!/usr/bin/env node
'use strict';

// ─── RECIPE QA — ENTERPRISE QUALITY GATE ─────────────────────────────────────
// Scanne toutes les recettes, détecte les anomalies, compare les snapshots.
//
// Usage : node scripts/recipe-qa.js [options]
//   --snapshot   Créer / comparer le snapshot de référence
//   --fix        Afficher les auto-corrections applicables (sans écrire)
//   --verbose    Afficher chaque warning
//   --report=F   Écrire un rapport JSON dans le fichier F
//
// Codes de sortie :
//   0  — DB propre (ou warnings seulement)
//   1  — Erreurs critiques détectées
// ─────────────────────────────────────────────────────────────────────────────

var fs   = require('fs');
var path = require('path');
var vm   = require('vm');

// ── OPTIONS ───────────────────────────────────────────────────────────────────
var argv = process.argv.slice(2);
var OPT  = {
  snapshot: argv.indexOf('--snapshot') >= 0,
  fix:      argv.indexOf('--fix')      >= 0,
  verbose:  argv.indexOf('--verbose')  >= 0,
  report:   (argv.find(function(a) { return /^--report=/.test(a); }) || '').replace('--report=', '') || null
};

// ── BROWSER MOCK ──────────────────────────────────────────────────────────────
global.window = global;
global.localStorage = {
  _store: {},
  getItem:    function(k)    { return this._store[k] !== undefined ? this._store[k] : null; },
  setItem:    function(k, v) { this._store[k] = String(v); },
  removeItem: function(k)    { delete this._store[k]; },
  get length() { return Object.keys(this._store).length; },
  key:        function(i)    { return Object.keys(this._store)[i] || null; }
};
var _fakeEl = function() {
  return { style: {}, appendChild: function() {}, addEventListener: function() {},
    removeEventListener: function() {}, innerHTML: '', textContent: '',
    classList: { add: function() {}, remove: function() {}, contains: function() { return false; } } };
};
global.document = {
  createElement: _fakeEl, getElementById: function() { return null; },
  querySelector: function() { return null; }, querySelectorAll: function() { return []; },
  addEventListener: function() {}, removeEventListener: function() {},
  body: _fakeEl(), head: _fakeEl()
};
Object.defineProperty(global, 'navigator', {
  value: { language: 'fr-FR', onLine: true }, writable: true, configurable: true
});
global.fetch = function() { return Promise.resolve({ json: function() { return Promise.resolve({}); } }); };
global.requestAnimationFrame = function(cb) { return setTimeout(cb, 16); };
if (!global.performance) global.performance = { now: function() { return Date.now(); } };
global.isEnglish = function() { return false; };

// ── LOAD MODULES ──────────────────────────────────────────────────────────────
var ROOT = path.join(__dirname, '..');
function loadModule(rel) {
  try {
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
  } catch(e) {
    console.error('[FATAL] Impossible de charger ' + rel + ' : ' + e.message);
    process.exit(1);
  }
}

loadModule('app/recipe-registry.js');
loadModule('app/recipe-engine.js');
loadModule('app/recipe-validator.js');

var RE  = window.RecipeEngine;
var RV  = window.RecipeValidator;
if (!RE || !RE.RECIPES_DB) { console.error('[FATAL] RecipeEngine non chargé'); process.exit(1); }
if (!RV)                   { console.error('[FATAL] RecipeValidator non chargé'); process.exit(1); }

var DB = RE.RECIPES_DB;

// ── SNAPSHOT ──────────────────────────────────────────────────────────────────
var SNAP_DIR  = path.join(ROOT, 'tests', 'snapshots');
var SNAP_FILE = path.join(SNAP_DIR, 'recipe-snapshot.json');

// ── HELPERS ───────────────────────────────────────────────────────────────────
function pad(n, w) { return String(n).padStart(w || 5); }
function hr(c)     { return (c || '─').repeat(63); }
function header(t) { console.log('\n' + hr('═') + '\n ' + t + '\n' + hr('─')); }

// ── PHASE 1 — VALIDATION ─────────────────────────────────────────────────────
console.log('\n' + hr('═'));
console.log(' RECIPE QA — SMARTFITCOACH INTEGRITY GATE');
console.log(hr('═'));
console.log(' Base: ' + DB.length + ' recettes | ' + new Date().toISOString().slice(0, 19).replace('T', ' '));
console.log(hr('─'));

process.stdout.write('\n[1/5] Validation en cours… ');
var validation = RV.validateDatabase(DB);
console.log('OK');

// ── PHASE 2 — AUTO-FIX PREVIEW ────────────────────────────────────────────────
var fixSuggestions = [];
if (OPT.fix) {
  process.stdout.write('[2/5] Calcul auto-fix… ');
  validation.results.forEach(function(r) {
    var recipe = DB.find(function(d) { return (d.id || d._id) === r.id; });
    if (!recipe) return;
    var res = RV.autoFix(recipe);
    fixSuggestions = fixSuggestions.concat(res.changes);
  });
  console.log(fixSuggestions.length + ' correction(s) disponible(s)');
  if (fixSuggestions.length > 0) {
    fixSuggestions.slice(0, 10).forEach(function(c) { console.log('  ✓ ' + c); });
    if (fixSuggestions.length > 10) console.log('  … et ' + (fixSuggestions.length - 10) + ' autres');
  }
} else {
  console.log('[2/5] Auto-fix: désactivé (--fix pour afficher les suggestions)');
}

// ── PHASE 3 — STATISTIQUES ───────────────────────────────────────────────────
process.stdout.write('[3/5] Calcul statistiques… ');

var rFormat  = DB.filter(function(r) { return /^R\d+$/.test(r.id  || ''); });
var lCompact = DB.filter(function(r) { return /^L\d+$/.test(r._id || ''); });
var lExt     = DB.filter(function(r) { return !r._id && /^L\d+$/.test(r.id || ''); });

var calSum = 0, protSum = 0, carbSum = 0, fatSum = 0, calCount = 0;
rFormat.forEach(function(r) {
  var bn = r.baseNutrition, s = r.servings || 1;
  if (bn && bn.calories > 0) {
    calSum  += bn.calories / s;
    protSum += (bn.proteinGrams || 0) / s;
    carbSum += (bn.carbsGrams   || 0) / s;
    fatSum  += (bn.fatGrams     || 0) / s;
    calCount++;
  }
});

var unitDist = {};
rFormat.forEach(function(r) {
  (r.ingredients || []).forEach(function(ing) {
    var u = (ing.unit || 'unknown').toLowerCase();
    unitDist[u] = (unitDist[u] || 0) + 1;
  });
});

var ingTotal = Object.keys(unitDist).reduce(function(sum, k) { return sum + unitDist[k]; }, 0);

var stats = {
  generated:           new Date().toISOString(),
  totalRecipes:        DB.length,
  rFormatCount:        rFormat.length,
  lCompactCount:       lCompact.length,
  lExtendedCount:      lExt.length,
  avgCalPerServing:    calCount > 0 ? Math.round(calSum  / calCount)      : 0,
  avgProtPerServing:   calCount > 0 ? Math.round(protSum / calCount * 10) / 10 : 0,
  avgCarbPerServing:   calCount > 0 ? Math.round(carbSum / calCount * 10) / 10 : 0,
  avgFatPerServing:    calCount > 0 ? Math.round(fatSum  / calCount * 10) / 10 : 0,
  totalIngEntries:     ingTotal,
  unitDistribution:    unitDist,
  validationSummary:   {
    totalErrors:   validation.totalErrors,
    totalWarnings: validation.totalWarnings,
    invalidCount:  validation.invalidCount
  }
};

console.log('OK');
console.log('  R-format (complet)    ' + pad(stats.rFormatCount));
console.log('  L-compact             ' + pad(stats.lCompactCount));
console.log('  L-étendu (migré)      ' + pad(stats.lExtendedCount));
console.log('  Moy. kcal/portion     ' + pad(stats.avgCalPerServing) + ' kcal');
console.log('  Moy. protéines/ptn    ' + stats.avgProtPerServing + ' g');
var unitStr = Object.keys(unitDist).sort(function(a, b) { return unitDist[b] - unitDist[a]; })
  .slice(0, 6).map(function(k) { return k + ':' + unitDist[k]; }).join('  ');
console.log('  Top unités            ' + unitStr);

// ── PHASE 4 — SNAPSHOT ───────────────────────────────────────────────────────
process.stdout.write('[4/5] Snapshot… ');

var snapDivergences = [];
if (fs.existsSync(SNAP_FILE)) {
  var prev = JSON.parse(fs.readFileSync(SNAP_FILE, 'utf8'));
  if (prev.totalRecipes !== stats.totalRecipes)
    snapDivergences.push('totalRecipes: ' + prev.totalRecipes + ' → ' + stats.totalRecipes);
  if (prev.rFormatCount !== stats.rFormatCount)
    snapDivergences.push('rFormatCount: ' + prev.rFormatCount + ' → ' + stats.rFormatCount);
  if (Math.abs((prev.avgCalPerServing || 0) - stats.avgCalPerServing) > 15)
    snapDivergences.push('avgCalPerServing: ' + prev.avgCalPerServing + ' → ' + stats.avgCalPerServing);
  if (prev.validationSummary && prev.validationSummary.totalErrors !== stats.validationSummary.totalErrors)
    snapDivergences.push('totalErrors: ' + prev.validationSummary.totalErrors + ' → ' + stats.validationSummary.totalErrors);
}

if (OPT.snapshot || !fs.existsSync(SNAP_FILE)) {
  if (!fs.existsSync(SNAP_DIR)) fs.mkdirSync(SNAP_DIR, { recursive: true });
  fs.writeFileSync(SNAP_FILE, JSON.stringify(stats, null, 2));
  console.log('snapshot sauvegardé');
} else {
  console.log(snapDivergences.length === 0 ? 'conforme' : snapDivergences.length + ' divergence(s)');
}
if (snapDivergences.length > 0) {
  snapDivergences.forEach(function(d) { console.log('  ⚠ SNAPSHOT DIVERGE : ' + d); });
}

// ── PHASE 5 — RAPPORT ────────────────────────────────────────────────────────
console.log('[5/5] Rapport…\n');
console.log(RV.generateReport(validation));

if (OPT.verbose && validation.totalWarnings > 0) {
  console.log('\n TOUS LES WARNINGS :');
  validation.results.forEach(function(r) {
    r.warnings.forEach(function(w) { console.log('  ⚠ [' + w.code + '] ' + w.message); });
  });
}

if (OPT.report) {
  var reportObj = {
    stats: stats,
    snapDivergences: snapDivergences,
    fixSuggestions: fixSuggestions,
    validation: {
      totalErrors:   validation.totalErrors,
      totalWarnings: validation.totalWarnings,
      invalidCount:  validation.invalidCount,
      invalidRecipes: validation.invalidRecipes,
      issues: validation.results
        .filter(function(r) { return r.issues.length > 0; })
        .map(function(r) { return { id: r.id, errors: r.errors, warnings: r.warnings }; })
    }
  };
  fs.writeFileSync(OPT.report, JSON.stringify(reportObj, null, 2));
  console.log('Rapport JSON : ' + OPT.report);
}

// ── EXIT ──────────────────────────────────────────────────────────────────────
if (validation.totalErrors > 0) {
  console.error('\n✗ QA FAILED — ' + validation.totalErrors + ' erreur(s) critique(s) dans ' + validation.invalidCount + ' recette(s)');
  process.exit(1);
} else if (snapDivergences.length > 0) {
  console.log('\n⚠ QA PASSED — divergences snapshot détectées (relancer avec --snapshot pour valider)');
  process.exit(0);
} else if (validation.totalWarnings > 0) {
  console.log('\n✓ QA PASSED — ' + validation.totalWarnings + ' warning(s) non bloquant(s)');
  process.exit(0);
} else {
  console.log('\n✓ QA PASSED — DB propre, aucune anomalie');
  process.exit(0);
}
