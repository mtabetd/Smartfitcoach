#!/usr/bin/env node
'use strict';

// ─── VIDEO REGISTRY GENERATOR v2.0 ───────────────────────────────────────────
// Génère DIRECT_VIDEO_REGISTRY via YouTube Data API v3.
// Stratégie : 1 canal par exercice → ~101 unités API/exercice (100 search + 1 videos.list).
// Quota free tier : 10 000 unités/jour → ~99 exercices/jour.
//
// Usage :
//   node scripts/generate-video-registry.js --key=YOUR_API_KEY [options]
//
// Options :
//   --key=KEY           YouTube Data API v3 key (ou YOUTUBE_API_KEY env)
//   --muscu             Exercices CURATED_QUERIES (musculation)
//   --cf                Exercices CF_QUERIES (CrossFit/Hyrox)
//   --fr                Inclure canal TiboInShape (fr_beginner) en plus d'AthleanX
//   --offset=N          Ignorer les N premiers exercices (reprise partielle)
//   --limit=N           Traiter au plus N exercices
//   --threshold=N       Score minimum (défaut : 60)
//   --output=FILE       Fichier JSON de sortie (défaut : registry-output-v2.json)
//   --checkpoint=FILE   Fichier de checkpoint pour reprise (défaut : registry-checkpoint.json)
//   --resume            Reprendre depuis le checkpoint existant
//   --dry-run           Afficher les requêtes sans appeler l'API
//   --verbose           Log détaillé
// ─────────────────────────────────────────────────────────────────────────────

var https  = require('https');
var fs     = require('fs');
var path   = require('path');

// ── Charger .env si présent (avant tout accès à process.env) ─────────────────
(function loadEnv() {
  var envPath = path.join(__dirname, '..', '.env');
  try {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(function(line) {
      var m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    });
  } catch(e) { /* .env absent — ok */ }
})();

// ── Parse CLI args ────────────────────────────────────────────────────────────
var args = {};
process.argv.slice(2).forEach(function(a) {
  var m = a.match(/^--([^=]+)(?:=(.+))?$/);
  if (m) args[m[1]] = m[2] !== undefined ? m[2] : true;
});

// Sécurité : préférer env var à --key= (les args CLI sont visibles dans ps aux)
if (args.key && !process.env.YOUTUBE_API_KEY) {
  console.warn('WARN: Préférer YOUTUBE_API_KEY env var à --key= (visible dans ps aux/process list).');
}
var API_KEY   = process.env.YOUTUBE_API_KEY || args.key;
var DO_MUSCU  = !!args.muscu;
var DO_CF     = !!args.cf;
var DO_FR     = !!args.fr;
var OFFSET    = parseInt(args.offset  || '0',  10);
var LIMIT     = parseInt(args.limit   || '9999', 10);
var THRESHOLD = parseInt(args.threshold || '60', 10);
var OUTPUT    = args.output     || 'registry-output-v2.json';
var CKPT_FILE = args.checkpoint || 'registry-checkpoint.json';
var RESUME    = !!args.resume;
var DRY_RUN   = !!args['dry-run'];
var VERBOSE   = !!args.verbose;

if (!DO_MUSCU && !DO_CF) { DO_MUSCU = true; }

if (!API_KEY && !DRY_RUN) {
  console.error('ERR --key=API_KEY requis (ou YOUTUBE_API_KEY env var)');
  process.exit(1);
}

// ── Charger exercise-videos.js pour extraire les queries ─────────────────────
global.window = { isEnglish: function() { return true; } };
var src = fs.readFileSync(path.join(__dirname, '..', 'app', 'exercise-videos.js'), 'utf8');
eval(src);
var ev = window.EXERCISE_VIDEOS;
var CURATED_QUERIES  = ev._CURATED_QUERIES;
var CF_QUERIES       = ev._CF_QUERIES;
var EXISTING_REG     = ev._DIRECT_REGISTRY;

// ── Channel IDs (résolus une fois au démarrage) ───────────────────────────────
// Hardcodés pour économiser le quota ; vérifiés 2026-05.
var CHANNEL_IDS = {
  athleanx:   'UCe0TLA0EsQbE-MjuHXevj2A',
  tiboInShape: null,  // résolu dynamiquement
  crossfit:   'UCtcQ6TPwXAYgZ1Mcl3M1vng'
};

// ── Utilitaires ───────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

function log() {
  if (VERBOSE) console.log.apply(console, arguments);
}

function apiGet(endpoint, params) {
  return new Promise(function(resolve, reject) {
    var qs = Object.entries(Object.assign({ key: API_KEY }, params))
      .map(function(kv) { return encodeURIComponent(kv[0]) + '=' + encodeURIComponent(kv[1]); })
      .join('&');
    var url = 'https://www.googleapis.com/youtube/v3/' + endpoint + '?' + qs;
    log('  GET', url.replace(API_KEY, 'KEY'));
    https.get(url, function(res) {
      var data = '';
      res.on('data', function(c) { data += c; });
      res.on('end', function() {
        try {
          var parsed = JSON.parse(data);
          if (parsed.error) {
            var e = parsed.error;
            reject(new Error('YouTube API ' + e.code + ': ' + e.message));
          } else {
            resolve(parsed);
          }
        } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// ── Résolution channel handle → ID ───────────────────────────────────────────
async function resolveChannelId(handle) {
  var res = await apiGet('channels', { part: 'id', forHandle: handle });
  if (res.items && res.items.length > 0) return res.items[0].id;
  throw new Error('Channel not found: @' + handle);
}

// ── Parse durée ISO 8601 en secondes ─────────────────────────────────────────
function parseDuration(iso) {
  var m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1]||0)*3600) + (parseInt(m[2]||0)*60) + parseInt(m[3]||0);
}

// ── Extraction des termes clés (retire les mots pédagogiques génériques) ──────
var STOP_WORDS = new Set(['proper','form','technique','tutorial','how','to','exercise',
  'training','workout','guide','demonstration','correct','perfect','with','for',
  'beginners','beginner','and','the','a','an','using','best','complete','full',
  'simple','easy','quick','tips','from','crossfit','reps','sets','barbell','dumbbell',
  'cable','machine','resistance','band','bodyweight','weighted','single','arm','leg',
  'unilateral','bilateral','standing','seated','lying','prone','supine','overhead',
  'incline','decline','close','grip','wide','neutral','underhand','overhand',
  'sumo','conventional','romanian','rdl','db','bb','hz','kg','lbs']);

function extractKeywords(query) {
  return query.toLowerCase().split(/\s+/)
    .map(function(w) { return w.replace(/[^a-z0-9]/g, ''); })
    .filter(function(w) { return w.length > 2 && !STOP_WORDS.has(w); });
}

// ── Scoring vidéo premium ─────────────────────────────────────────────────────
var BAD_TERMS = ['motivation','transformation','challenge','vlog','podcast',
  'interview','compilation','reaction','before and after','results diet',
  'top 10','top 5','mistakes','30 day','weight loss','insane','amazing',
  'shocking','subscribe','life changing','these foods','how i lost','body fat',
  'bulk','cut','shred','aesthetic','physique','natty','gains','grind','hustle',
  'beast mode','no days off','blood sweat','push yourself','mind muscle'];

function scoreVideo(snippet, contentDetails, statistics, query) {
  var score = 0;
  var title = (snippet.title || '').toLowerCase();
  var dur = parseDuration(contentDetails && contentDetails.duration || 'PT0S');
  var views = parseInt((statistics && statistics.viewCount) || '0', 10);
  var keywords = extractKeywords(query);

  // 1. Pertinence du titre (0–50 pts)
  var matched = keywords.filter(function(w) { return title.includes(w); }).length;
  score += Math.round((matched / Math.max(keywords.length, 1)) * 50);

  // 2. Durée — Short idéal (0–40 pts)
  if (dur > 0 && dur <= 60)   score += 40;
  else if (dur <= 120)         score += 30;
  else if (dur <= 240)         score += 20;
  else if (dur <= 480)         score += 10;
  else if (dur <= 600)         score += 5;
  else                         score -= 10;

  // 3. Mots pédagogiques dans le titre (+15 pts max)
  if (title.includes('form') || title.includes('technique')) score += 8;
  if (title.includes('tutorial') || title.includes('tuto'))  score += 6;
  if (title.includes('how to') || title.includes('comment')) score += 5;
  if (title.includes('proper') || title.includes('correct')) score += 4;
  if (title.includes('beginner') || title.includes('basics'))score += 3;

  // 4. Popularité (signal qualité) (0–10 pts)
  if (views > 1000000)       score += 10;
  else if (views > 500000)   score += 7;
  else if (views > 100000)   score += 5;
  else if (views > 50000)    score += 3;

  // 5. Malus clickbait / garbage (-20 pts chacun)
  BAD_TERMS.forEach(function(t) { if (title.includes(t)) score -= 20; });

  return Math.max(0, Math.min(100, score));
}

// ── Rechercher la meilleure vidéo pour un exercice ────────────────────────────
async function findBestVideo(exerciseKey, query, channelId, source, usedIds) {
  if (DRY_RUN) {
    console.log('  [DRY] would search channel=' + source + ' query=' + query);
    return null;
  }

  // search.list : 100 unités
  var searchRes = await apiGet('search', {
    part:       'id,snippet',
    channelId:  channelId,
    q:          query,
    type:       'video',
    maxResults: 10,
    order:      'relevance',
    safeSearch: 'none'
  });

  var items = searchRes.items || [];
  if (items.length === 0) return null;

  var videoIds = items.map(function(i) { return i.id.videoId; }).join(',');

  // videos.list : 1 unité pour jusqu'à 50 IDs
  var detailRes = await apiGet('videos', {
    part: 'id,snippet,contentDetails,statistics',
    id:   videoIds
  });

  var details = {};
  (detailRes.items || []).forEach(function(v) { details[v.id] = v; });

  // Scorer toutes les vidéos et sélectionner la meilleure non-dupliquée
  var candidates = items
    .map(function(item) {
      var id = item.id.videoId;
      var detail = details[id];
      if (!detail) return null;
      if (usedIds.has(id)) {
        log('  SKIP duplicate id=' + id);
        return null;
      }
      var score = scoreVideo(
        detail.snippet,
        detail.contentDetails,
        detail.statistics,
        query
      );
      var dur = parseDuration(detail.contentDetails && detail.contentDetails.duration || 'PT0S');
      var isShort = dur > 0 && dur <= 60;
      var urlType = isShort ? 'shorts' : 'watch';
      var url = isShort
        ? 'https://www.youtube.com/shorts/' + id
        : 'https://www.youtube.com/watch?v=' + id;
      return { id: id, score: score, url: url, source: source,
               title: detail.snippet.title, duration: dur };
    })
    .filter(Boolean)
    .sort(function(a, b) { return b.score - a.score; });

  if (VERBOSE && candidates.length > 0) {
    console.log('  Candidates for "' + exerciseKey + '":');
    candidates.slice(0, 3).forEach(function(c) {
      console.log('    score=' + c.score + ' dur=' + c.duration + 's "' + c.title.slice(0, 50) + '"');
    });
  }

  var best = candidates[0];
  if (!best || best.score < THRESHOLD) {
    log('  No video above threshold (' + THRESHOLD + ') for: ' + exerciseKey);
    return null;
  }

  usedIds.add(best.id);
  return { url: best.url, verified: false, source: source, score: best.score };
}

// ── Checkpoint ────────────────────────────────────────────────────────────────
function loadCheckpoint() {
  if (!RESUME) return {};
  try {
    var data = fs.readFileSync(path.join(__dirname, '..', CKPT_FILE), 'utf8');
    var ckpt = JSON.parse(data);
    console.log('Reprise depuis checkpoint : ' + Object.keys(ckpt).length + ' exercices déjà traités.');
    return ckpt;
  } catch(e) { return {}; }
}

function saveCheckpoint(results) {
  fs.writeFileSync(
    path.join(__dirname, '..', CKPT_FILE),
    JSON.stringify(results, null, 2)
  );
}

// ── Programme principal ───────────────────────────────────────────────────────
async function run() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║    VIDEO REGISTRY GENERATOR v2.0 — SmartFitCoach    ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // Résoudre TiboInShape channel ID si --fr
  if (DO_FR && !DRY_RUN) {
    try {
      CHANNEL_IDS.tiboInShape = await resolveChannelId('TiboInShape');
      console.log('TiboInShape ID: ' + CHANNEL_IDS.tiboInShape);
    } catch(e) {
      console.warn('WARN: TiboInShape non trouvé, mode --fr désactivé. ' + e.message);
      DO_FR = false;
    }
    await sleep(200);
  }

  // Construire la liste des exercices à traiter
  var exercises = [];
  if (DO_MUSCU) {
    Object.entries(CURATED_QUERIES).forEach(function(kv) {
      exercises.push({ key: kv[0], query: kv[1], mode: 'muscu' });
    });
  }
  if (DO_CF) {
    Object.entries(CF_QUERIES).forEach(function(kv) {
      exercises.push({ key: kv[0], query: kv[1], mode: 'cf' });
    });
  }

  // Filtrer : sauter les exercices déjà couverts avec un bon score
  var skippedGood = 0;
  exercises = exercises.filter(function(ex) {
    var entry = EXISTING_REG[ex.key];
    if (!entry) return true;
    var levels = ex.mode === 'cf' ? ['cf'] : ['en_any', 'fr_beginner'];
    var hasGood = levels.some(function(lv) {
      return entry[lv] && entry[lv].url && (entry[lv].score || 0) >= THRESHOLD;
    });
    if (hasGood) { skippedGood++; return false; }
    return true;
  });

  // Appliquer offset/limit
  exercises = exercises.slice(OFFSET, OFFSET + LIMIT);

  console.log('Exercices à traiter : ' + exercises.length + ' (skip already good: ' + skippedGood + ')');
  console.log('Quota estimé : ' + (exercises.length * (DO_FR ? 202 : 101)) + ' unités API');
  console.log('Threshold score : ' + THRESHOLD);
  console.log('Mode : ' + (DO_MUSCU ? 'muscu ' : '') + (DO_CF ? 'cf ' : '') + (DO_FR ? '+fr' : 'en_only'));

  if (DRY_RUN) {
    console.log('\nDRY RUN — Requêtes simulées :');
    exercises.slice(0, 15).forEach(function(ex) {
      console.log('  [' + ex.mode + '] ' + ex.key + ' → "' + ex.query + '"');
    });
    if (exercises.length > 15) console.log('  ... et ' + (exercises.length - 15) + ' autres');
    return;
  }

  // Charger checkpoint
  var checkpoint = loadCheckpoint();
  var results = Object.assign({}, checkpoint);

  // Construire le set des IDs déjà utilisés (depuis registre existant + checkpoint)
  var usedIds = new Set();
  Object.values(EXISTING_REG).forEach(function(entry) {
    Object.values(entry).forEach(function(v) {
      if (!v || !v.url) return;
      var m = v.url.match(/(?:watch\?v=|shorts\/)([A-Za-z0-9_-]{11})/);
      if (m) usedIds.add(m[1]);
    });
  });
  Object.values(results).forEach(function(entry) {
    ['en_any','fr_beginner','cf'].forEach(function(lv) {
      var v = entry[lv];
      if (!v || !v.url) return;
      var m = v.url.match(/(?:watch\?v=|shorts\/)([A-Za-z0-9_-]{11})/);
      if (m) usedIds.add(m[1]);
    });
  });

  var found = 0, missing = 0, errors = 0;
  var total = exercises.length;

  for (var i = 0; i < exercises.length; i++) {
    var ex = exercises[i];

    // Sauter si déjà dans le checkpoint
    if (results[ex.key] && !RESUME) {
      log('Skip (checkpoint): ' + ex.key);
      continue;
    }

    var pct = Math.round((i+1)/total*100);
    process.stdout.write('[' + (i+1) + '/' + total + ' ' + pct + '%] ' + ex.key + ' ... ');

    try {
      var entry = {};

      if (ex.mode === 'cf') {
        var cfVideo = await findBestVideo(ex.key, ex.query, CHANNEL_IDS.crossfit, 'CrossFit', usedIds);
        if (cfVideo) entry.cf = cfVideo;
        await sleep(300);
      } else {
        // EN : AthleanX
        var enVideo = await findBestVideo(ex.key, ex.query, CHANNEL_IDS.athleanx, 'AthleanX', usedIds);
        if (enVideo) entry.en_any = enVideo;
        await sleep(300);
        // FR : TiboInShape (optionnel)
        if (DO_FR && CHANNEL_IDS.tiboInShape) {
          var frQuery = ev._FR_QUERIES[ex.key] || ex.query;
          var frVideo = await findBestVideo(ex.key, frQuery, CHANNEL_IDS.tiboInShape, 'TiboInShape', usedIds);
          if (frVideo) entry.fr_beginner = frVideo;
          await sleep(300);
        }
      }

      var hasVideo = Object.values(entry).some(function(v) { return v && v.url; });
      if (hasVideo) {
        results[ex.key] = entry;
        found++;
        console.log('OK (en:' + (entry.en_any ? entry.en_any.score : '-') + ' fr:' + (entry.fr_beginner ? entry.fr_beginner.score : '-') + ' cf:' + (entry.cf ? entry.cf.score : '-') + ')');
      } else {
        missing++;
        console.log('no video above threshold=' + THRESHOLD);
      }

    } catch(e) {
      errors++;
      var msg = e.message || String(e);
      console.log('ERR ' + msg);
      if (msg.includes('quotaExceeded') || msg.includes('403')) {
        console.error('\nQUOTA EXCEEDED — Arrêt. Relancer demain avec --resume --offset=' + (OFFSET + i));
        saveCheckpoint(results);
        process.exit(2);
      }
    }

    // Checkpoint toutes les 10 entrées
    if ((i + 1) % 10 === 0) saveCheckpoint(results);
  }

  // Sauvegarder le checkpoint final et le résultat
  saveCheckpoint(results);

  var outputPath = path.join(__dirname, '..', OUTPUT);
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  // Générer le snippet JS à intégrer dans exercise-videos.js
  var snippetPath = outputPath.replace('.json', '-snippet.js');
  var lines = ['  var DIRECT_VIDEO_REGISTRY = {'];
  Object.entries(results).forEach(function(kv) {
    var key = kv[0], entry = kv[1];
    lines.push('    \'' + key + '\': {');
    ['fr_beginner','en_any','advanced','cf'].forEach(function(lv) {
      if (!(lv in entry)) return;
      var v = entry[lv];
      if (!v) {
        lines.push('      ' + lv + ': null,');
      } else {
        lines.push('      ' + lv + ': { url: \'' + v.url + '\', verified: false, source: \'' + v.source + '\', score: ' + v.score + ' },');
      }
    });
    lines.push('    },');
  });
  lines.push('  };');
  fs.writeFileSync(snippetPath, lines.join('\n'));

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║                     RÉSULTAT                        ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  Traités      : ' + String(total).padEnd(35) + '║');
  console.log('║  Vidéos OK    : ' + String(found).padEnd(35) + '║');
  console.log('║  Sans vidéo   : ' + String(missing).padEnd(35) + '║');
  console.log('║  Erreurs      : ' + String(errors).padEnd(35) + '║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('\nFichier JSON    : ' + OUTPUT);
  console.log('Snippet JS      : ' + OUTPUT.replace('.json', '-snippet.js'));
  console.log('Checkpoint      : ' + CKPT_FILE);
  console.log('\nPour intégrer dans exercise-videos.js : copier le snippet entre les lignes DIRECT_VIDEO_REGISTRY.\n');
}

run().catch(function(e) {
  console.error('FATAL:', e.message);
  process.exit(1);
});
