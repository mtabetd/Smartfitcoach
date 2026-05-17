#!/usr/bin/env node
'use strict';

// ─── VIDEO REGISTRY VALIDATOR v2.0 ───────────────────────────────────────────
// Vérifie que les IDs du DIRECT_VIDEO_REGISTRY sont toujours valides via
// YouTube Data API v3 (videos.list : 1 unité / batch de 50).
//
// Usage :
//   node scripts/validate-video-registry.js --key=YOUR_API_KEY [options]
//
// Options :
//   --key=KEY       YouTube Data API v3 key (ou YOUTUBE_API_KEY env)
//   --fix           Mettre à jour exercise-videos.js pour nullifier les IDs morts
//   --report=FILE   Sauvegarder le rapport JSON dans FILE
//   --dry-run       Afficher ce qui serait validé sans appeler l'API
// ─────────────────────────────────────────────────────────────────────────────

var https  = require('https');
var fs     = require('fs');
var path   = require('path');

// Charger .env si présent
(function loadEnv() {
  var envPath = path.join(__dirname, '..', '.env');
  try {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(function(line) {
      var m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    });
  } catch(e) {}
})();

var args = {};
process.argv.slice(2).forEach(function(a) {
  var m = a.match(/^--([^=]+)(?:=(.+))?$/);
  if (m) args[m[1]] = m[2] !== undefined ? m[2] : true;
});

if (args.key && !process.env.YOUTUBE_API_KEY) {
  console.warn('WARN: Préférer YOUTUBE_API_KEY env var à --key= (visible dans ps aux).');
}
var API_KEY = process.env.YOUTUBE_API_KEY || args.key;
var DRY_RUN = !!args['dry-run'];
var DO_FIX  = !!args.fix;
var REPORT  = args.report || null;
var SRC_PATH = path.join(__dirname, '..', 'app', 'exercise-videos.js');

if (!API_KEY && !DRY_RUN) {
  console.error('ERR --key=API_KEY requis (ou YOUTUBE_API_KEY env var)');
  process.exit(1);
}

// ── Charger le registre ───────────────────────────────────────────────────────
global.window = { isEnglish: function() { return true; } };
eval(fs.readFileSync(SRC_PATH, 'utf8'));
var REGISTRY = window.EXERCISE_VIDEOS._DIRECT_REGISTRY;

// ── Extraire tous les IDs ─────────────────────────────────────────────────────
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
    if (!id) return;
    allEntries.push({ exerciseKey: exKey, level: lv, videoId: id, url: v.url, verified: !!v.verified });
  });
});

// ── API YouTube ───────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

function apiGet(endpoint, params) {
  return new Promise(function(resolve, reject) {
    var qs = Object.entries(Object.assign({ key: API_KEY }, params))
      .map(function(kv) { return encodeURIComponent(kv[0]) + '=' + encodeURIComponent(kv[1]); })
      .join('&');
    https.get('https://www.googleapis.com/youtube/v3/' + endpoint + '?' + qs, function(res) {
      var data = '';
      res.on('data', function(c) { data += c; });
      res.on('end', function() {
        try {
          var p = JSON.parse(data);
          if (p.error) reject(new Error('YouTube API ' + p.error.code + ': ' + p.error.message));
          else resolve(p);
        } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// ── Valider en batches de 50 ──────────────────────────────────────────────────
async function validateBatch(entries) {
  var ids = entries.map(function(e) { return e.videoId; }).join(',');
  var res = await apiGet('videos', { part: 'id,snippet', id: ids });
  var foundIds = new Set((res.items || []).map(function(i) { return i.id; }));
  return entries.map(function(e) {
    return Object.assign({}, e, { alive: foundIds.has(e.videoId) });
  });
}

// ── Appliquer --fix : mettre à null les IDs morts dans exercise-videos.js ─────
function applyFix(deadEntries) {
  var src = fs.readFileSync(SRC_PATH, 'utf8');
  var count = 0;
  deadEntries.forEach(function(d) {
    // Chercher l'URL morte et la remplacer par null dans le JS
    var urlEscaped = d.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var pattern = new RegExp("(\\'" + d.level + "\\'\\s*:\\s*\\{[^}]*url\\s*:\\s*\\')" + urlEscaped.replace(/\//g, '\\/') + "(\\'[^}]*\\})", 'g');
    var before = src;
    src = src.replace(pattern, d.level + ': null');
    if (src !== before) count++;
  });

  if (count > 0) {
    fs.writeFileSync(SRC_PATH, src);
    console.log('\n--fix applique : ' + count + ' entrees nullifiees dans exercise-videos.js');
    console.log('INFO Rebuilder bundle.js apres ce fix : node scripts/build-bundle.js');
  } else {
    console.log('\n--fix : aucun pattern correspondant trouve (verifier manuellement).');
  }
}

// ── Rapport ───────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║    VIDEO REGISTRY VALIDATOR v2.0 — SmartFitCoach    ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  console.log('Entrees dans le registre : ' + allEntries.length);

  if (DRY_RUN) {
    console.log('\nDRY RUN — IDs qui seraient verifies :');
    allEntries.slice(0, 10).forEach(function(e) {
      console.log('  ' + e.exerciseKey + ' [' + e.level + '] -> ' + e.videoId);
    });
    if (allEntries.length > 10) console.log('  ... et ' + (allEntries.length - 10) + ' autres');
    console.log('\nQuota estime : ' + Math.ceil(allEntries.length / 50) + ' unites API (videos.list)');
    return;
  }

  var results = [];
  for (var i = 0; i < allEntries.length; i += 50) {
    var batch = allEntries.slice(i, i + 50);
    process.stdout.write('Batch ' + Math.floor(i/50 + 1) + '/' + Math.ceil(allEntries.length/50) + ' ... ');
    var batchResults = await validateBatch(batch);
    results = results.concat(batchResults);
    var dead = batchResults.filter(function(r) { return !r.alive; }).length;
    console.log('OK (' + dead + ' morts)');
    await sleep(200);
  }

  var alive      = results.filter(function(r) { return r.alive; });
  var dead       = results.filter(function(r) { return !r.alive; });
  var verified   = results.filter(function(r) { return r.verified; });
  var unverified = results.filter(function(r) { return r.alive && !r.verified; });

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║                    RESULTAT                          ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  Total valide      : ' + String(results.length).padEnd(31) + '║');
  console.log('║  Videos vivantes   : ' + String(alive.length).padEnd(31) + '║');
  console.log('║  Videos mortes     : ' + String(dead.length).padEnd(31) + '║');
  console.log('║  Verifiees (QA OK) : ' + String(verified.length).padEnd(31) + '║');
  console.log('║  A verifier (QA)   : ' + String(unverified.length).padEnd(31) + '║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  if (dead.length > 0) {
    console.log('VIDEOS MORTES (ID supprime ou prive) :');
    dead.forEach(function(d) {
      console.log('  X ' + d.exerciseKey + ' [' + d.level + '] -> ' + d.url);
    });
    console.log();
    if (DO_FIX) applyFix(dead);
    else console.log('INFO Relancer avec --fix pour nullifier ces entrees automatiquement.\n');
  }

  if (unverified.length > 0) {
    console.log('A VERIFIER MANUELLEMENT (' + unverified.length + ') :');
    unverified.slice(0, 20).forEach(function(u) {
      console.log('  ? ' + u.exerciseKey + ' [' + u.level + '] -> ' + u.url);
    });
    if (unverified.length > 20) console.log('  ... et ' + (unverified.length - 20) + ' autres');
    console.log();
  }

  if (REPORT) {
    fs.writeFileSync(path.join(__dirname, '..', REPORT), JSON.stringify({ alive, dead, verified, unverified }, null, 2));
    console.log('Rapport sauvegarde : ' + REPORT);
  }

  if (dead.length > 0) {
    console.log('-> Mettre a jour DIRECT_VIDEO_REGISTRY avec les IDs morts.\n');
    process.exit(1);
  }
  console.log('OK Tous les IDs sont valides.\n');
}

run().catch(function(e) {
  console.error('FATAL:', e.message);
  process.exit(1);
});
