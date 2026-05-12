#!/usr/bin/env node
'use strict';

// ─── RECIPE INTELLIGENCE REPORT — CLI ────────────────────────────────────────
// Analyse qualitative de toutes les recettes SmartFitCoach.
//
// Usage : node scripts/recipe-intelligence-report.js [options]
//   --top=N       Afficher N meilleures recettes (défaut: 10)
//   --bottom=N    Afficher N recettes à améliorer (défaut: 10)
//   --grade=A|B|C|D  Filtrer par grade
//   --verbose     Afficher tous les flags par recette
//   --report=F    Exporter JSON dans fichier F
//   --diversity   Focus sur l'analyse de diversité
// ─────────────────────────────────────────────────────────────────────────────

var fs   = require('fs');
var path = require('path');
var vm   = require('vm');

// ── ARGS ──────────────────────────────────────────────────────────────────────
var argv = process.argv.slice(2);
function getArg(name, def) {
  var a = argv.find(function(x) { return x.startsWith('--' + name + '='); });
  return a ? a.replace('--' + name + '=', '') : def;
}
var OPT = {
  top:      parseInt(getArg('top',    '10'), 10),
  bottom:   parseInt(getArg('bottom', '10'), 10),
  grade:    getArg('grade', null),
  verbose:  argv.indexOf('--verbose')   >= 0,
  diversity: argv.indexOf('--diversity') >= 0,
  report:   getArg('report', null)
};

// ── BROWSER MOCK ──────────────────────────────────────────────────────────────
global.window = global;
global.localStorage = {
  _store: {}, getItem: function(k) { return this._store[k] !== undefined ? this._store[k] : null; },
  setItem: function(k, v) { this._store[k] = String(v); }, removeItem: function(k) { delete this._store[k]; },
  get length() { return Object.keys(this._store).length; }, key: function(i) { return Object.keys(this._store)[i] || null; }
};
var _f = function() {
  return { style: {}, appendChild: function() {}, addEventListener: function() {},
    removeEventListener: function() {}, innerHTML: '', textContent: '',
    classList: { add: function() {}, remove: function() {}, contains: function() { return false; } } };
};
global.document = { createElement: _f, getElementById: function() { return null; },
  querySelector: function() { return null; }, querySelectorAll: function() { return []; },
  addEventListener: function() {}, removeEventListener: function() {}, body: _f(), head: _f() };
Object.defineProperty(global, 'navigator', { value: { language: 'fr-FR', onLine: true }, writable: true, configurable: true });
global.fetch = function() { return Promise.resolve({ json: function() { return Promise.resolve({}); } }); };
global.requestAnimationFrame = function(cb) { return setTimeout(cb, 16); };
if (!global.performance) global.performance = { now: function() { return Date.now(); } };
global.isEnglish = function() { return false; };

// ── LOAD MODULES ──────────────────────────────────────────────────────────────
var ROOT = path.join(__dirname, '..');
function loadModule(rel) {
  try { vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel }); }
  catch(e) { console.error('[FATAL] ' + rel + ' : ' + e.message); process.exit(1); }
}
loadModule('app/recipe-registry.js');
loadModule('app/recipe-engine.js');
loadModule('app/recipe-intelligence.js');

var RE  = window.RecipeEngine;
var RI  = window.RecipeIntelligence;
if (!RE || !RI) { console.error('[FATAL] Modules non chargés'); process.exit(1); }

var DB = RE.RECIPES_DB;

// ── HELPERS ───────────────────────────────────────────────────────────────────
function hr(c)       { return (c || '─').repeat(63); }
function pad(s, n)   { return String(s).padEnd(n || 40); }
function padL(s, n)  { return String(s).padStart(n || 5); }
function bar(score)  {
  var filled = Math.round(score / 5);
  return '[' + '█'.repeat(filled) + '░'.repeat(20 - filled) + '] ' + padL(score) + '/100';
}
function gradeColor(g) {
  return g === 'A' ? '\x1b[32m' + g + '\x1b[0m' :
         g === 'B' ? '\x1b[36m' + g + '\x1b[0m' :
         g === 'C' ? '\x1b[33m' + g + '\x1b[0m' : '\x1b[31m' + g + '\x1b[0m';
}

// ── ANALYSE ───────────────────────────────────────────────────────────────────
console.log('\n' + hr('═'));
console.log(' RECIPE INTELLIGENCE — SmartFitCoach');
console.log(hr('═'));
console.log(' ' + DB.length + ' recettes chargées | ' + new Date().toISOString().slice(0, 19).replace('T', ' '));
process.stdout.write(hr('─') + '\n Analyse en cours… ');

var analysis = RI.analyzeDatabase(DB);
console.log('OK (' + analysis.analyzed + ' recettes R-format)\n');

// ── VUE D'ENSEMBLE ────────────────────────────────────────────────────────────
var g = analysis.gradeDistribution;
console.log(hr('═'));
console.log(' RÉSUMÉ EXÉCUTIF');
console.log(hr('─'));
console.log(' Score premium moyen   : ' + bar(analysis.avgPremiumScore));
console.log(' Distribution grades   : A=' + g.A + '  B=' + g.B + '  C=' + g.C + '  D=' + g.D);
console.log(' Score diversité       : ' + bar(analysis.diversity.diversityScore));

var pct = function(n) { return Math.round(n / analysis.analyzed * 100) + '%'; };
var fc  = analysis.flagCounts;
console.log('');
console.log(' Alertes cohérence     : ' + (analysis.allFlags.filter(function(f){return f.severity==='warn';}).length) + ' warnings');
console.log(' Sans protéines        : ' + (fc.NO_PROTEIN_SOURCE || 0) + ' recettes (' + pct(fc.NO_PROTEIN_SOURCE || 0) + ')');
console.log(' Sans légumes          : ' + (fc.NO_VEGETABLES || 0)  + ' recettes (' + pct(fc.NO_VEGETABLES || 0) + ')');
console.log(' Portions insuffisantes: ' + (fc.PORTION_FRUSTRATING || 0) + ' recettes');
console.log(' Portions excessives   : ' + (fc.PORTION_EXCESSIVE || 0) + ' recettes');

// ── TOP RECETTES ──────────────────────────────────────────────────────────────
console.log('\n' + hr('─'));
console.log(' TOP ' + OPT.top + ' RECETTES PREMIUM');
console.log(hr('─'));
var top = OPT.grade
  ? analysis.results.filter(function(r){ return r.grade === OPT.grade; }).sort(function(a,b){return b.premiumScore-a.premiumScore;})
  : analysis.topRecipes;
top.slice(0, OPT.top).forEach(function(r) {
  console.log(' ' + gradeColor(r.grade) + ' ' + padL(r.score, 3) + '/100  ' + r.id + '  ' + (r.name || '').substring(0, 42));
});

// ── RECETTES À AMÉLIORER ──────────────────────────────────────────────────────
console.log('\n' + hr('─'));
console.log(' RECETTES À AMÉLIORER (grade D)');
console.log(hr('─'));
var bottom = analysis.results.filter(function(r){ return r.grade === 'D'; })
  .sort(function(a,b){ return a.premiumScore - b.premiumScore; });
if (bottom.length === 0) {
  console.log(' ✓ Aucune recette en grade D');
} else {
  bottom.slice(0, OPT.bottom).forEach(function(r) {
    console.log(' ' + gradeColor(r.grade) + ' ' + padL(r.score, 3) + '/100  ' + r.id + '  ' + (r.name || '').substring(0, 42));
    if (OPT.verbose && r.flags.length > 0) {
      r.flags.forEach(function(f) { console.log('   ↳ [' + f.type + '] ' + f.msg.replace(/^[A-Z]\d+: ?/,'')); });
    }
  });
}

// ── DIVERSITÉ ────────────────────────────────────────────────────────────────
if (OPT.diversity || true) {
  var d = analysis.diversity;
  console.log('\n' + hr('─'));
  console.log(' ANALYSE DIVERSITÉ');
  console.log(hr('─'));
  console.log(' Sources protéiques :');
  Object.keys(d.proteinSourceDistribution)
    .sort(function(a,b){ return d.proteinSourceDistribution[b] - d.proteinSourceDistribution[a]; })
    .forEach(function(k) {
      var n   = d.proteinSourceDistribution[k];
      var pct = Math.round(n / d.totalAnalyzed * 100);
      var b   = '█'.repeat(Math.round(pct / 2.5));
      console.log('  ' + pad(k, 18) + ' ' + padL(n, 4) + ' recettes (' + padL(pct, 3) + '%)  ' + b);
    });

  console.log('\n Ingrédients les plus fréquents (R-format) :');
  d.topIngredients.slice(0, 8).forEach(function(i) {
    var b   = '█'.repeat(Math.round(i.pct / 2.5));
    var flag = i.pct > 50 ? ' ⚠ SURREPRÉSENTÉ' : '';
    console.log('  ' + pad(i.name, 28) + padL(i.pct, 3) + '%  ' + b + flag);
  });
}

// ── VERBOSE : tous les flags ──────────────────────────────────────────────────
if (OPT.verbose) {
  var warnFlags = analysis.allFlags.filter(function(f){ return f.severity === 'warn'; });
  console.log('\n' + hr('─'));
  console.log(' TOUS LES FLAGS COHÉRENCE (' + warnFlags.length + ') :');
  warnFlags.forEach(function(f) { console.log('  ⚠ [' + f.type + '] ' + f.msg); });
}

// ── RAPPORT JSON ──────────────────────────────────────────────────────────────
if (OPT.report) {
  var out = {
    generated:       new Date().toISOString(),
    analyzed:        analysis.analyzed,
    avgPremiumScore: analysis.avgPremiumScore,
    gradeDistribution: analysis.gradeDistribution,
    flagCounts:      analysis.flagCounts,
    diversity:       analysis.diversity,
    topRecipes:      analysis.topRecipes,
    bottomRecipes:   analysis.bottomRecipes,
    results: analysis.results.map(function(r) {
      return { id: r.id, name: r.name, grade: r.grade, premiumScore: r.premiumScore,
               scores: r.scores, flagCount: r.flags.length };
    })
  };
  fs.writeFileSync(OPT.report, JSON.stringify(out, null, 2));
  console.log('\nRapport JSON : ' + OPT.report);
}

// ── RECOMMANDATIONS ───────────────────────────────────────────────────────────
console.log('\n' + hr('─'));
console.log(' RECOMMANDATIONS');
console.log(hr('─'));
if (analysis.avgPremiumScore < 60) console.log(' → Score moyen faible : revoir densité protéique et portions');
if (analysis.avgPremiumScore >= 75) console.log(' ✓ Score moyen excellent — DB de qualité premium');
if (analysis.diversity.overused.length > 2) {
  console.log(' → Diversifier : ' + analysis.diversity.overused.map(function(i){return i.name;}).join(', ') + ' surreprésentés');
}
if ((fc.NO_PROTEIN_SOURCE || 0) > 5) console.log(' → ' + fc.NO_PROTEIN_SOURCE + ' recettes sans protéines identifiées');
if ((fc.PORTION_FRUSTRATING || 0) > 3) console.log(' → ' + fc.PORTION_FRUSTRATING + ' recettes avec portions frustrantes');
if (g.A + g.B > analysis.analyzed * 0.8) console.log(' ✓ Plus de 80% des recettes en grade A/B — standard premium atteint');

console.log('\n' + hr('═') + '\n');
