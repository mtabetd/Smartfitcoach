#!/usr/bin/env node
'use strict';

// ─── CLI : RECIPE AUTO-IMPROVE ────────────────────────────────────────────────
// Usage :
//   node scripts/recipe-auto-improve.js [--dry-run] [--top=N] [--report=FILE]
//
// Flags :
//   --dry-run   Analyse et propose sans modifier la base (défaut)
//   --top=N     Traiter les N recettes les plus urgentes (défaut 20)
//   --report=F  Exporter le résultat JSON dans le fichier F
//   --verbose   Afficher le rapport détaillé dans le terminal
// ─────────────────────────────────────────────────────────────────────────────

var fs   = require('fs');
var path = require('path');
var vm   = require('vm');

// ── Browser mock ──────────────────────────────────────────────────────────────
global.window = global;

function loadScript(relPath) {
  var src = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  vm.runInThisContext(src, { filename: relPath });
}

loadScript('app/recipe-ux-engine.js');
loadScript('app/recipe-ux-explainer.js');
loadScript('app/recipe-auto-improver.js');

var RAI = window.RecipeAutoImprover;

// ── Parse args ────────────────────────────────────────────────────────────────
var argv = process.argv.slice(2);
var OPT = {
  dryRun:  true,                 // toujours dry-run pour l'instant
  top:     20,
  report:  null,
  verbose: argv.indexOf('--verbose') >= 0
};

argv.forEach(function(a) {
  if (/^--top=(\d+)$/.test(a))    OPT.top    = parseInt(RegExp.$1, 10);
  if (/^--report=(.+)$/.test(a))  OPT.report = RegExp.$1;
});

// ── Charger la base recettes ──────────────────────────────────────────────────
var DB_PATH = path.join(__dirname, '..', 'app', 'recipes.js');
if (!fs.existsSync(DB_PATH)) {
  console.error('[ERREUR] Base recettes introuvable : ' + DB_PATH);
  process.exit(1);
}

loadScript('app/recipes.js');

var DB = window.AppRecipes || window.recipes || [];
if (!Array.isArray(DB)) DB = DB.recipes || [];

if (!DB.length) {
  console.error('[ERREUR] Base recettes vide ou format non reconnu');
  process.exit(1);
}

console.log('');
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║         RECIPE AUTO-IMPROVER — MODE DRY-RUN                 ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('Base chargée : ' + DB.length + ' recettes');
console.log('Analyse des ' + OPT.top + ' recettes les plus urgentes...');
console.log('');

// ── Dry-run ────────────────────────────────────────────────────────────────────
var result;
try {
  result = RAI.runDryRun(DB, { top: OPT.top });
} catch (e) {
  console.error('[ERREUR] ' + e.message);
  process.exit(1);
}

// ── Rapport terminal ───────────────────────────────────────────────────────────
var report = RAI.generateImprovementReport(result);
if (OPT.verbose) {
  console.log(report);
} else {
  var s = result.summary;
  console.log('✅ AUTO_SAFE appliquées  : ' + s.autoApplied);
  console.log('👁  Revue humaine requise : ' + s.reviewRequired);
  console.log('❌ Refusées (macro)       : ' + s.rejected);
  console.log('');
  if (s.avgScoresBefore && s.avgScoresAfter) {
    var dims = ['satietyUX','foodPleasure','adherence','premiumFeel'];
    dims.forEach(function(d) {
      var b = s.avgScoresBefore[d] || 0, a = s.avgScoresAfter[d] || 0;
      var sym = a > b ? '↑+' + (a - b) : a < b ? '↓' + (a - b) : '→';
      console.log('  ' + d + ' : ' + b + ' → ' + a + ' ' + sym);
    });
  }
}

// ── Export JSON ───────────────────────────────────────────────────────────────
if (OPT.report) {
  var output = { meta: { date: new Date().toISOString(), totalRecipes: DB.length, analyzed: result.analyzed },
                 summary: result.summary, proposals: result.proposals, report: report };
  fs.writeFileSync(OPT.report, JSON.stringify(output, null, 2), 'utf8');
  console.log('\nRapport JSON exporté : ' + OPT.report);
}

console.log('\n[MODE DRY-RUN] Aucune modification n\'a été appliquée à la base.');
