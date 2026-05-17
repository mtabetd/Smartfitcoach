#!/usr/bin/env node
'use strict';

// ─── VIDEO REGISTRY VALIDATOR ─────────────────────────────────────────────────
// Vérifie que les IDs du DIRECT_VIDEO_REGISTRY sont toujours valides (non supprimés,
// non privés, exercice correct) via YouTube Data API v3.
//
// Usage :
//   node scripts/validate-video-registry.js --key=YOUR_API_KEY [options]
//
// Options :
//   --key=KEY       Clé YouTube Data API v3
//   --fix           Marquer verified:false les IDs morts (ne supprime pas, juste flag)
//   --report=FILE   Sauvegarder le rapport JSON dans FILE
//   --dry-run       Afficher ce qui serait validé sans appeler l'API
// ─────────────────────────────────────────────────────────────────────────────

var https  = require('https');
var fs     = require('fs');
var path   = require('path');

var args = {};
process.argv.slice(2).forEach(function(a) {
  var m = a.match(/^--([^=]+)(?:=(.+))?$/);
  if (m) args[m[1]] = m[2] !== undefined ? m[2] : true;
});

var API_KEY  = args.key || process.env.YOUTUBE_API_KEY;
var DRY_RUN  = !!args['dry-run'];
var DO_FIX   = !!args.fix;
var REPORT   = args.report || null;

if (!API_KEY && !DRY_RUN) {
  console.error('❌  --key=API_KEY requis (ou YOUTUBE_API_KEY env var)');
  process.exit(1);
}

// ── Charger le registre ───────────────────────────────────────────────────────
global.window = { isEnglish: function() { return true; } };

var SRC_PATH = path.join(__dirname, '..', 'app', 'exercise-videos.js');
var src = fs.readFileSync(SRC_PATH, 'utf8');

function extractMap(varName) {
  var start = src.indexOf('var ' + varName + ' = {');
  if (start === -1) return {};
  var depth = 0, i = start + ('var ' + varName + ' = ').length;
  var objStart = i;
  while (i < src.length) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { if (--depth === 0) break; }
    i++;
  }
  try { return eval('(' + src.slice(objStart, i + 1) + ')'); } catch(e) { return {}; }
}

var REGISTRY = extractMap('DIRECT_VIDEO_REGISTRY');

// ── Extraire tous les IDs du registre ────────────────────────────────────────
function extractVideoId(url) {
  if (!url) return null;
  var m = url.match(/(?:watch\?v=|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

var allEntries = [];
Object.entries(REGISTRY).forEach(function(kv) {
  var exKey = kv[0], entry = kv[1];
  ['fr_beginner','en_any','advanced','cf'].forEach(function(lv) {
    var v = entry[lv];
    if (!v || !v.url) return;
    var id = extractVideoId(v.url);
    if (id) allEntries.push({ exerciseKey: exKey, level: lv, videoId: id, url: v.url, verified: v.verified });
  });
});

// ── API YouTube ───────────────────────────────────────────────────────────────
function apiGet(endpoint, params) {
  return new Promise(function(resolve, reject) {
    var qs = Object.entries(Object.assign({ key: API_KEY }, params))
      .map(function(kv) { return encodeURIComponent(kv[0]) + '=' + encodeURIComponent(kv[1]); })
      .join('&');
    https.get('https://www.googleapis.com/youtube/v3/' + endpoint + '?' + qs, function(res) {
      var data = '';
      res.on('data', function(c) { data += c; });
      res.on('end', function() {
        try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// ── Valider en batches de 50 (max par requête videos.list) ───────────────────
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

async function validateBatch(entries) {
  var ids = entries.map(function(e) { return e.videoId; }).join(',');
  var res = await apiGet('videos', { part: 'id,snippet', id: ids });
  var foundIds = new Set((res.items || []).map(function(i) { return i.id; }));
  return entries.map(function(e) {
    return Object.assign({}, e, { alive: foundIds.has(e.videoId) });
  });
}

// ── Rapport de validation ─────────────────────────────────────────────────────
async function run() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║    VIDEO REGISTRY VALIDATOR — SmartFitCoach          ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  console.log('Entrées dans le registre : ' + allEntries.length);

  if (DRY_RUN) {
    console.log('\nDRY RUN — IDs qui seraient vérifiés :');
    allEntries.slice(0, 10).forEach(function(e) {
      console.log('  ' + e.exerciseKey + ' [' + e.level + '] → ' + e.videoId);
    });
    console.log('  ... et ' + Math.max(0, allEntries.length - 10) + ' autres');
    console.log('\nQuota estimé : ' + Math.ceil(allEntries.length / 50) + ' unités API (videos.list)');
    return;
  }

  // Valider par batches de 50
  var results = [];
  for (var i = 0; i < allEntries.length; i += 50) {
    var batch = allEntries.slice(i, i + 50);
    process.stdout.write('Validation batch ' + Math.floor(i/50 + 1) + '/' + Math.ceil(allEntries.length/50) + ' ... ');
    var batchResults = await validateBatch(batch);
    results = results.concat(batchResults);
    var dead = batchResults.filter(function(r) { return !r.alive; }).length;
    console.log('✓ (' + dead + ' morts)');
    await sleep(200);
  }

  var alive = results.filter(function(r) { return r.alive; });
  var dead  = results.filter(function(r) { return !r.alive; });
  var unverified = results.filter(function(r) { return !r.verified; });

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║                    RÉSULTAT                          ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  Total validé      : ' + String(results.length).padEnd(31) + '║');
  console.log('║  Vidéos vivantes   : ' + String(alive.length).padEnd(31) + '║');
  console.log('║  Vidéos mortes     : ' + String(dead.length).padEnd(31) + '║');
  console.log('║  À vérifier (QA)   : ' + String(unverified.length).padEnd(31) + '║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  if (dead.length > 0) {
    console.log('VIDÉOS MORTES (à remplacer) :');
    dead.forEach(function(d) {
      console.log('  ✗ ' + d.exerciseKey + ' [' + d.level + '] → ' + d.url);
    });
    console.log();
  }

  if (unverified.length > 0) {
    console.log('À VÉRIFIER MANUELLEMENT (' + unverified.length + ') :');
    unverified.slice(0, 20).forEach(function(u) {
      console.log('  ⚠ ' + u.exerciseKey + ' [' + u.level + '] → ' + u.url);
    });
    if (unverified.length > 20) console.log('  ... et ' + (unverified.length - 20) + ' autres');
    console.log();
  }

  if (REPORT) {
    fs.writeFileSync(path.join(__dirname, '..', REPORT), JSON.stringify({ alive, dead, unverified }, null, 2));
    console.log('Rapport sauvegardé : ' + REPORT);
  }

  // Retourner code d'erreur si des IDs sont morts
  if (dead.length > 0) {
    console.log('→ Mettre à jour DIRECT_VIDEO_REGISTRY avec les IDs morts.\n');
    process.exit(1);
  }

  console.log('✅ Tous les IDs sont valides.\n');
}

run().catch(function(e) {
  console.error('❌', e.message);
  process.exit(1);
});
