#!/usr/bin/env node
'use strict';

// ─── VIDEO REGISTRY GENERATOR ─────────────────────────────────────────────────
// Génère automatiquement le DIRECT_VIDEO_REGISTRY en interrogeant YouTube Data API v3.
//
// Usage :
//   node scripts/generate-video-registry.js --key=YOUR_API_KEY [options]
//
// Options :
//   --key=KEY         Clé YouTube Data API v3 (obligatoire)
//   --offset=N        Commencer à l'exercice N (défaut 0)
//   --limit=N         Traiter N exercices (défaut 50, max 100 par run / quota)
//   --cf              Traiter les mouvements CrossFit uniquement
//   --muscu           Traiter les exercices musculation uniquement (défaut)
//   --dry-run         Afficher les queries sans appeler l'API
//   --output=FILE     Sauvegarder le registre JSON dans FILE (défaut: registry-output.json)
//   --verbose         Afficher les scores détaillés
//
// Obtenir une clé API :
//   1. https://console.cloud.google.com → Créer projet → YouTube Data API v3 → Créer clé
//   2. Gratuit : 10 000 unités/jour (1 recherche = 100 unités → 100 exercices/jour)
//   3. Augmentation quota : simple formulaire Google, accordé en < 48h
//
// Quota estimé :
//   338 exercices muscu × 100 units = 33 800 units → 4 jours (ou quota augmenté)
//   86 mouvements CF × 100 units = 8 600 units → 1 jour
//   Validation IDs existants : 1 unit/batch de 50 → négligeable
// ─────────────────────────────────────────────────────────────────────────────

var https  = require('https');
var fs     = require('fs');
var path   = require('path');
var vm     = require('vm');

// ── Parse CLI args ────────────────────────────────────────────────────────────
var args = {};
process.argv.slice(2).forEach(function(a) {
  var m = a.match(/^--([^=]+)(?:=(.+))?$/);
  if (m) args[m[1]] = m[2] !== undefined ? m[2] : true;
});

var API_KEY  = args.key || process.env.YOUTUBE_API_KEY;
var OFFSET   = parseInt(args.offset || '0', 10);
var LIMIT    = Math.min(parseInt(args.limit || '50', 10), 100);
var DRY_RUN  = !!args['dry-run'];
var VERBOSE  = !!args.verbose;
var CF_ONLY  = !!args.cf;
var OUT_FILE = args.output || 'registry-output.json';

if (!API_KEY && !DRY_RUN) {
  console.error('\n❌  Clé API manquante.');
  console.error('   Usage : node scripts/generate-video-registry.js --key=YOUR_API_KEY');
  console.error('   Obtenir une clé gratuite : https://console.cloud.google.com\n');
  process.exit(1);
}

// ── Charger les maps depuis exercise-videos.js ─────────────────────────────
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

var CURATED_QUERIES = extractMap('CURATED_QUERIES');
var CF_QUERIES      = extractMap('CF_QUERIES');
var EXERCISE_ALIASES= extractMap('EXERCISE_ALIASES');

// ── Canaux de confiance (handles → channel IDs résolus dynamiquement) ──────
// Les channel IDs sont mis en cache après résolution via l'API.
var TRUSTED_CHANNELS = {
  TiboInShape: { handle: 'TiboInShape', id: null, lang: 'fr', levels: [1], priority: 1 },
  AthleanX:    { handle: 'athleanx',    id: null, lang: 'en', levels: [1,2], priority: 2 },
  JeffNippard: { handle: 'JeffNippard', id: null, lang: 'en', levels: [3], priority: 3 },
  CrossFit:    { handle: 'CrossFit',    id: null, lang: 'en', levels: ['cf'], priority: 1 }
};

// ── Scorer une vidéo ──────────────────────────────────────────────────────────
// Retourne un score 0-100. Plus élevé = meilleur candidat.
function scoreVideo(snippet, contentDetails, statistics, exerciseName) {
  var score = 0;
  var title    = (snippet.title || '').toLowerCase();
  var desc     = (snippet.description || '').toLowerCase();
  var duration = parseDuration(contentDetails.duration || 'PT0S');
  var views    = parseInt((statistics && statistics.viewCount) || '0', 10);
  var exNorm   = exerciseName.toLowerCase().replace(/[^a-z0-9 ]/g, '');

  // Correspondance titre
  var exWords = exNorm.split(' ').filter(function(w) { return w.length > 2; });
  var titleMatchCount = exWords.filter(function(w) { return title.includes(w); }).length;
  score += Math.round(titleMatchCount / Math.max(exWords.length, 1) * 40);

  // Mots pédagogiques
  if (title.includes('form') || title.includes('forme'))      score += 15;
  if (title.includes('tutorial') || title.includes('tuto'))   score += 12;
  if (title.includes('technique'))                             score += 12;
  if (title.includes('proper'))                                score += 8;
  if (title.includes('how to'))                                score += 10;
  if (title.includes('beginner'))                              score += 5;
  if (title.includes('correct'))                               score += 6;

  // Durée — idéal 15-90 secondes (Short), bon 90-240 secondes
  if (duration > 0 && duration <= 90)   score += 30;  // Short parfait
  else if (duration <= 240)             score += 20;  // ~4 min
  else if (duration <= 480)             score += 10;  // ~8 min, tolérable
  else if (duration > 600)              score -= 5;   // > 10 min, trop long

  // Popularité
  if (views > 1000000) score += 15;
  else if (views > 100000) score += 10;
  else if (views > 10000)  score += 5;

  // Pénalités — contenu non pédagogique
  var badTerms = ['motivation','transformation','challenge','vlog','podcast',
                  'interview','top 10','top 5','compilation','reaction',
                  'watch this before','mistakes you','science of','explained',
                  'full body','workout routine','30 day','one month'];
  badTerms.forEach(function(t) {
    if (title.includes(t) || desc.includes(t)) score -= 15;
  });

  return Math.max(0, Math.min(100, score));
}

// PT1M30S → secondes
function parseDuration(dur) {
  var m = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1]||0)*3600) + (parseInt(m[2]||0)*60) + parseInt(m[3]||0);
}

// ── API YouTube ───────────────────────────────────────────────────────────────
function apiGet(endpoint, params) {
  return new Promise(function(resolve, reject) {
    var qs = Object.entries(Object.assign({ key: API_KEY }, params))
      .map(function(kv) { return encodeURIComponent(kv[0]) + '=' + encodeURIComponent(kv[1]); })
      .join('&');
    var url = 'https://www.googleapis.com/youtube/v3/' + endpoint + '?' + qs;

    https.get(url, function(res) {
      var data = '';
      res.on('data', function(c) { data += c; });
      res.on('end', function() {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('JSON parse error: ' + data.slice(0, 200))); }
      });
    }).on('error', reject);
  });
}

// Résoudre handle → channelId
function resolveChannelId(handle) {
  return apiGet('channels', { part: 'id', forHandle: handle, maxResults: 1 })
    .then(function(res) {
      if (res.items && res.items[0]) return res.items[0].id;
      // Fallback: search by channel name
      return apiGet('search', { part: 'id', type: 'channel', q: handle, maxResults: 1 })
        .then(function(r) {
          return r.items && r.items[0] ? r.items[0].id.channelId : null;
        });
    });
}

// Rechercher des vidéos dans un canal pour un exercice
function searchVideosInChannel(channelId, queries, opts) {
  opts = opts || {};
  // Essayer chaque query jusqu'à obtenir des résultats
  var tryQuery = function(idx) {
    if (idx >= queries.length) return Promise.resolve([]);
    var params = {
      part:             'id,snippet',
      channelId:        channelId,
      q:                queries[idx],
      type:             'video',
      maxResults:       5,
      order:            'relevance'
    };
    if (opts.shortOnly) params.videoDuration = 'short';

    return apiGet('search', params).then(function(res) {
      if (res.error) {
        console.error('  API error:', JSON.stringify(res.error));
        return [];
      }
      var ids = (res.items || []).map(function(i) { return i.id.videoId; }).filter(Boolean);
      if (ids.length === 0) return tryQuery(idx + 1);
      return ids;
    });
  };
  return tryQuery(0);
}

// Récupérer les détails des vidéos (titre, durée, stats)
function getVideoDetails(ids) {
  if (!ids.length) return Promise.resolve([]);
  return apiGet('videos', {
    part:   'snippet,contentDetails,statistics',
    id:     ids.join(','),
    maxResults: 50
  }).then(function(res) { return res.items || []; });
}

// ── Chercher la meilleure vidéo pour un exercice ──────────────────────────────
function findBestVideo(exerciseName, exerciseQuery, channelKey, opts) {
  opts = opts || {};
  var chan = TRUSTED_CHANNELS[channelKey];
  if (!chan.id) return Promise.resolve(null);

  // Générer plusieurs queries intelligentes
  var queries = buildQueries(exerciseName, exerciseQuery, chan.lang);
  if (VERBOSE) console.log('  Queries: ' + queries.slice(0,2).join(' | '));

  return searchVideosInChannel(chan.id, queries, opts)
    .then(function(ids) {
      if (!ids.length) return null;
      return getVideoDetails(ids);
    })
    .then(function(items) {
      if (!items) return null;
      // Scorer et trier
      var scored = items.map(function(item) {
        var s = scoreVideo(item.snippet, item.contentDetails, item.statistics, exerciseName);
        return { item: item, score: s };
      }).sort(function(a, b) { return b.score - a.score; });

      if (VERBOSE) {
        scored.forEach(function(s) {
          console.log('    [' + s.score + '] ' + s.item.snippet.title.slice(0, 60) +
            ' (' + parseDuration(s.item.contentDetails.duration) + 's)');
        });
      }

      var best = scored[0];
      if (!best || best.score < 20) return null;  // seuil qualité minimum

      var vid = best.item;
      var dur = parseDuration(vid.contentDetails.duration);
      var isShort = dur <= 90 || vid.id.includes('Shorts') || (vid.snippet.title||'').toLowerCase().includes('#short');
      var url = isShort
        ? 'https://www.youtube.com/shorts/' + vid.id
        : 'https://www.youtube.com/watch?v=' + vid.id;

      return {
        url:      url,
        verified: false,  // à vérifier manuellement
        source:   chan.handle,
        title:    vid.snippet.title.slice(0, 80),
        duration: dur,
        score:    best.score,
        views:    parseInt((vid.statistics && vid.statistics.viewCount) || '0', 10)
      };
    });
}

// Générer des queries diversifiées pour maximiser les chances de trouver la bonne vidéo
function buildQueries(exerciseName, exerciseQuery, lang) {
  var base = exerciseQuery || exerciseName;
  if (lang === 'fr') {
    return [
      exerciseName + ' technique',
      exerciseName,
      base.split(' ').slice(0, 3).join(' ')
    ];
  }
  return [
    base,
    exerciseName + ' proper form',
    exerciseName + ' technique tutorial',
    exerciseName.split(' ').slice(0, 3).join(' ') + ' form'
  ];
}

// ── Sleep (respecter rate limits) ─────────────────────────────────────────────
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

// ── Pipeline principal ────────────────────────────────────────────────────────
async function run() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║    VIDEO REGISTRY GENERATOR — SmartFitCoach v5      ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  if (DRY_RUN) {
    console.log('🔵 DRY RUN — aucun appel API\n');
  }

  // Construire la liste des exercices à traiter
  var exercises = [];

  if (CF_ONLY) {
    Object.keys(CF_QUERIES).forEach(function(key) {
      exercises.push({ key: key, query: CF_QUERIES[key], mode: 'cf' });
    });
    console.log('Mode : CrossFit (' + exercises.length + ' mouvements)');
  } else {
    Object.keys(CURATED_QUERIES).forEach(function(key) {
      exercises.push({ key: key, query: CURATED_QUERIES[key], mode: 'muscu' });
    });
    console.log('Mode : Musculation (' + exercises.length + ' exercices)');
  }

  var batch = exercises.slice(OFFSET, OFFSET + LIMIT);
  console.log('Batch : exercices ' + OFFSET + ' → ' + (OFFSET + batch.length - 1));
  console.log('Quota estimé : ~' + (batch.length * 100) + ' units YouTube API\n');

  if (DRY_RUN) {
    console.log('Queries qui seraient générées :');
    batch.slice(0, 10).forEach(function(ex) {
      var queries = buildQueries(ex.key, ex.query, 'en');
      console.log('  ' + ex.key + ' → "' + queries[0] + '"');
    });
    if (batch.length > 10) console.log('  ... et ' + (batch.length - 10) + ' autres');
    return;
  }

  // Résoudre les channel IDs
  console.log('Résolution des channel IDs...');
  var channelsToResolve = CF_ONLY ? ['CrossFit'] : ['TiboInShape', 'AthleanX', 'JeffNippard'];

  for (var cn of channelsToResolve) {
    try {
      TRUSTED_CHANNELS[cn].id = await resolveChannelId(TRUSTED_CHANNELS[cn].handle);
      console.log('  ✓ ' + cn + ' → ' + TRUSTED_CHANNELS[cn].id);
    } catch(e) {
      console.error('  ✗ ' + cn + ': ' + e.message);
    }
  }
  console.log();

  var registry = {};
  var stats = { total: 0, found: 0, notFound: 0, errors: 0 };

  for (var ex of batch) {
    stats.total++;
    var label = '[' + stats.total + '/' + batch.length + '] ' + ex.key;
    process.stdout.write(label + ' ... ');

    try {
      var entry = {};

      if (ex.mode === 'cf') {
        var cfResult = await findBestVideo(ex.key, ex.query, 'CrossFit');
        entry.cf = cfResult;
      } else {
        // FR beginner (TiboInShape)
        var frResult = await findBestVideo(ex.key, ex.query, 'TiboInShape', { shortOnly: true });
        entry.fr_beginner = frResult;
        await sleep(200);

        // EN any (AthleanX)
        var enResult = await findBestVideo(ex.key, ex.query, 'AthleanX', { shortOnly: true });
        entry.en_any = enResult;
        await sleep(200);

        // Advanced (Jeff Nippard) — uniquement si pas de Short trouvé
        if (!frResult && !enResult) {
          var advResult = await findBestVideo(ex.key, ex.query, 'JeffNippard');
          entry.advanced = advResult;
          await sleep(200);
        }
      }

      // Ne stocker que si au moins une vidéo trouvée
      var hasAny = Object.values(entry).some(function(v) { return v && v.url; });
      if (hasAny) {
        registry[ex.key] = entry;
        stats.found++;
        var urls = Object.entries(entry)
          .filter(function(kv) { return kv[1] && kv[1].url; })
          .map(function(kv) { return kv[0] + ':' + (kv[1].score||0); });
        console.log('✓ (' + urls.join(', ') + ')');
      } else {
        stats.notFound++;
        console.log('○ (aucune vidéo trouvée)');
      }

      await sleep(300); // Respecter rate limits
    } catch(e) {
      stats.errors++;
      console.log('✗ ' + e.message.slice(0, 60));
    }
  }

  // Sauvegarder le résultat
  var outPath = path.join(__dirname, '..', OUT_FILE);
  fs.writeFileSync(outPath, JSON.stringify(registry, null, 2));

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║                    RÉSUMÉ                           ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  Traités   : ' + String(stats.total).padEnd(39) + '║');
  console.log('║  Trouvés   : ' + String(stats.found).padEnd(39) + '║');
  console.log('║  Introuvés : ' + String(stats.notFound).padEnd(39) + '║');
  console.log('║  Erreurs   : ' + String(stats.errors).padEnd(39) + '║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  Output    : ' + OUT_FILE.padEnd(39) + '║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // Générer le snippet JS à coller dans exercise-videos.js
  var jsSnippet = generateJSSnippet(registry);
  var snippetPath = path.join(__dirname, '..', OUT_FILE.replace('.json', '-snippet.js'));
  fs.writeFileSync(snippetPath, jsSnippet);
  console.log('Snippet JS prêt : ' + OUT_FILE.replace('.json', '-snippet.js'));
  console.log('→ Coller dans DIRECT_VIDEO_REGISTRY dans exercise-videos.js\n');
  console.log('⚠  Toutes les entrées sont verified:false.');
  console.log('   Passer verified:true après avoir testé chaque URL.\n');
}

function generateJSSnippet(registry) {
  var lines = ['  // Généré automatiquement par scripts/generate-video-registry.js'];
  lines.push('  // ⚠ verified:false = à tester avant production');
  Object.entries(registry).forEach(function(kv) {
    var key = kv[0], entry = kv[1];
    lines.push("  '" + key + "': {");
    ['fr_beginner','en_any','advanced','cf'].forEach(function(lv) {
      var v = entry[lv];
      if (!v) return;
      lines.push("    " + lv + ": { url: '" + v.url + "', verified: false" +
        ", source: '" + v.source + "', title: " + JSON.stringify((v.title||'').slice(0,60)) +
        ", score: " + (v.score||0) + " },");
    });
    lines.push('  },');
  });
  return lines.join('\n');
}

run().catch(function(e) {
  console.error('\n❌ Erreur fatale:', e.message);
  if (e.message.includes('quota') || e.message.includes('403')) {
    console.error('→ Quota API dépassé. Attendre minuit UTC ou augmenter le quota.');
    console.error('→ https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas');
  }
  process.exit(1);
});
