#!/usr/bin/env node
'use strict';
// Fusionne les fichiers registry-batchN.json en un seul registre,
// puis intègre automatiquement dans app/exercise-videos.js.
//
// Usage: node scripts/merge-registry-batches.js [--dry-run] [--no-patch]

var fs   = require('fs');
var path = require('path');

var args = {};
process.argv.slice(2).forEach(function(a) {
  var m = a.match(/^--([^=]+)(?:=(.+))?$/);
  if (m) args[m[1]] = m[2] !== undefined ? m[2] : true;
});

var DRY_RUN  = !!args['dry-run'];
var NO_PATCH = !!args['no-patch'];
var ROOT = path.join(__dirname, '..');

// ── Charger les batches disponibles ──────────────────────────────────────────
var merged = {};
var batchFiles = fs.readdirSync(ROOT)
  .filter(function(f) { return /^registry-batch\d+\.json$/.test(f); })
  .sort();

if (batchFiles.length === 0) {
  console.error('Aucun fichier registry-batchN.json trouvé dans le répertoire racine.');
  process.exit(1);
}

console.log('Fichiers batch trouvés: ' + batchFiles.join(', '));

batchFiles.forEach(function(f) {
  try {
    var data = JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
    var count = 0;
    Object.entries(data).forEach(function(kv) {
      // Ne remplacer que si le nouveau score est meilleur
      var key = kv[0], newEntry = kv[1];
      if (!merged[key]) {
        merged[key] = newEntry;
        count++;
      } else {
        // Merger niveau par niveau, garder le meilleur score
        ['fr_beginner','en_any','advanced','cf'].forEach(function(lv) {
          var existing = merged[key][lv];
          var incoming = newEntry[lv];
          if (!incoming || !incoming.url) return;
          if (!existing || !existing.url || (incoming.score || 0) > (existing.score || 0)) {
            merged[key][lv] = incoming;
          }
        });
      }
    });
    console.log('  ' + f + ': ' + count + ' nouveaux exercices chargés');
  } catch(e) {
    console.warn('  SKIP ' + f + ': ' + e.message);
  }
});

var total = Object.keys(merged).length;
var withVideo = Object.values(merged).filter(function(e) {
  return Object.values(e).some(function(v) { return v && v.url; });
}).length;

console.log('\nTotal entrées fusionnées: ' + total);
console.log('Avec vidéo directe: ' + withVideo);

if (DRY_RUN) {
  console.log('\nDRY RUN — aucune modification.');
  return;
}

// ── Lire l'existant dans exercise-videos.js ───────────────────────────────────
global.window = { isEnglish: function() { return true; } };
var srcPath = path.join(ROOT, 'app', 'exercise-videos.js');
eval(fs.readFileSync(srcPath, 'utf8'));
var existing = window.EXERCISE_VIDEOS._DIRECT_REGISTRY;

// Merger avec l'existant (les entrées vérifiées manuellement ont priorité)
var final = {};
Object.assign(final, existing);
Object.entries(merged).forEach(function(kv) {
  var key = kv[0], entry = kv[1];
  if (!final[key]) {
    final[key] = entry;
  } else {
    ['fr_beginner','en_any','advanced','cf'].forEach(function(lv) {
      var existing = final[key][lv];
      var incoming = entry[lv];
      if (!incoming || !incoming.url) return;
      // Ne pas écraser les entrées verified:true
      if (existing && existing.verified) return;
      // Écraser si score meilleur
      if (!existing || !existing.url || (incoming.score || 0) > (existing.score || 0)) {
        final[key][lv] = incoming;
      }
    });
  }
});

// ── Générer le nouveau bloc DIRECT_VIDEO_REGISTRY ─────────────────────────────
var lines = ['  var DIRECT_VIDEO_REGISTRY = {'];
Object.entries(final).sort(function(a, b) { return a[0].localeCompare(b[0]); }).forEach(function(kv) {
  var key = kv[0], entry = kv[1];
  var levels = ['fr_beginner','en_any','advanced','cf'];
  var hasAny = levels.some(function(lv) { return entry[lv] && entry[lv].url; });
  if (!hasAny) return;  // skip empty entries

  lines.push("    '" + key + "': {");
  levels.forEach(function(lv) {
    if (!(lv in entry)) return;
    var v = entry[lv];
    if (!v || !v.url) {
      lines.push('      ' + lv + ': null,');
    } else {
      lines.push("      " + lv + ": { url: '" + v.url + "', verified: " + (v.verified ? 'true' : 'false') + ", source: '" + (v.source||'?') + "', score: " + (v.score||0) + " },");
    }
  });
  lines.push('    },');
});
lines.push('  };');
var newBlock = lines.join('\n');

if (NO_PATCH) {
  var snippetPath = path.join(ROOT, 'registry-merged-snippet.js');
  fs.writeFileSync(snippetPath, newBlock);
  console.log('\nSnippet sauvegardé: registry-merged-snippet.js');
  console.log('Remplacer manuellement le bloc DIRECT_VIDEO_REGISTRY dans app/exercise-videos.js');
  return;
}

// ── Patch exercise-videos.js directement ─────────────────────────────────────
var src = fs.readFileSync(srcPath, 'utf8');
var startMark = '  var DIRECT_VIDEO_REGISTRY = {';
var endMark = '  };';

var startIdx = src.indexOf(startMark);
if (startIdx === -1) {
  console.error('ERR: DIRECT_VIDEO_REGISTRY introuvable dans exercise-videos.js');
  process.exit(1);
}

// Trouver la fermeture correspondante
var depth = 0, i = startIdx + startMark.length;
// On cherche le { de démarrage
var braceStart = src.indexOf('{', startIdx);
depth = 1; i = braceStart + 1;
while (i < src.length && depth > 0) {
  if (src[i] === '{') depth++;
  else if (src[i] === '}') depth--;
  i++;
}
var endIdx = i;  // après le } de fermeture

var before = src.slice(0, startIdx);
var after = src.slice(endIdx);
// Trim leading semicolon from after
after = after.replace(/^\s*;/, '');

var patched = before + newBlock + '\n' + after;

// Mettre à jour le compteur directRegistrySize
var finalCount = Object.keys(final).filter(function(k) {
  return Object.values(final[k]).some(function(v) { return v && v.url; });
}).length;
patched = patched.replace(/directRegistrySize:\s*\d+/, 'directRegistrySize: ' + finalCount);

// Mettre à jour la version
patched = patched.replace(/version:\s*'5\.\d+'/, "version: '5.6'");

fs.writeFileSync(srcPath, patched);

console.log('\napp/exercise-videos.js patché avec succès.');
console.log('Entrées avec vidéo directe: ' + finalCount);
console.log('Version: 5.6');
console.log('\nEtapes suivantes:');
console.log('  node -e "global.window={isEnglish:function(){return true;}};eval(require(\'fs\').readFileSync(\'app/exercise-videos.js\',\'utf8\'));console.log(window.EXERCISE_VIDEOS.auditRegistry())"');
console.log('  cd app && cat app-core.js app-main.js app-sport.js app-nutrition.js > bundle.js');
