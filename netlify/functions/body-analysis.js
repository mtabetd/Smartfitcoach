// netlify/functions/body-analysis.js
// Analyse corporelle par vision IA — clé API côté serveur uniquement

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 600; // Réduit : analyse structurée courte

// Domaines autorisés pour CORS
var ALLOWED_ORIGINS = [
  'https://smartfitcoach.netlify.app',
  'https://smartfitcoach.fr',
  'https://www.smartfitcoach.fr',
  'http://localhost:8888',
  'http://localhost:3000',
  'http://127.0.0.1:8888',
  'http://127.0.0.1:3000'
];

// ── Rate Limiting (sliding window horaire + quota journalier) ────────────────
var _hourStore = new Map(); // ip -> [{ts}]
var _dayStore = new Map();  // ip -> {date: 'YYYY-MM-DD', count: N}

var HOUR_WINDOW_MS = 3600000; // 1 heure
var HOUR_MAX = 3;  // max 3 req/heure par IP (vision = très coûteux)
var DAY_MAX = 5;   // max 5 req/jour par IP

function getTodayUTC() {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function checkRateLimit(ip) {
  var now = Date.now();
  var today = getTodayUTC();

  // ── Quota journalier ──
  var dayEntry = _dayStore.get(ip);
  if (!dayEntry || dayEntry.date !== today) {
    dayEntry = { date: today, count: 0 };
  }
  if (dayEntry.count >= DAY_MAX) {
    return { allowed: false, reason: 'quota_day' };
  }

  // ── Sliding window horaire ──
  var hourList = _hourStore.get(ip) || [];
  hourList = hourList.filter(function(t) { return now - t < HOUR_WINDOW_MS; });
  if (hourList.length >= HOUR_MAX) {
    return { allowed: false, reason: 'quota_hour' };
  }

  // Enregistrer la requête
  hourList.push(now);
  _hourStore.set(ip, hourList);
  dayEntry.count += 1;
  _dayStore.set(ip, dayEntry);

  return { allowed: true };
}

// Nettoyer périodiquement pour éviter la fuite mémoire
function pruneRateLimitStore() {
  var now = Date.now();
  var today = getTodayUTC();
  _hourStore.forEach(function(list, ip) {
    var filtered = list.filter(function(t) { return now - t < HOUR_WINDOW_MS; });
    if (filtered.length === 0) _hourStore.delete(ip);
    else _hourStore.set(ip, filtered);
  });
  _dayStore.forEach(function(entry, ip) {
    if (entry.date !== today) _dayStore.delete(ip);
  });
}

// ── Input Sanitization ───────────────────────────────────────────────────────
var PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/gi,
  /disregard\s+(all\s+)?(previous|prior|above)\s+instructions/gi,
  /forget\s+(all\s+)?(previous|prior|above)\s+instructions/gi,
  /reveal\s+(the\s+)?(api\s+key|secret|password|token)/gi,
  /act\s+as\s+(if\s+you\s+are|a\s+different)/gi,
  /you\s+are\s+now\s+(a\s+)?/gi,
  /système\s*:\s*/gi,
  /system\s*:\s*/gi,
  /\[system\]/gi,
  /<<<|>>>/g,
  /###\s*(system|instructions|prompt)/gi
];

function sanitizeString(str, maxLen) {
  if (typeof str !== 'string') return '';
  // Retirer les caractères de contrôle (sauf \n et \t légitimes)
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  // Retirer les séquences de prompt injection connues
  PROMPT_INJECTION_PATTERNS.forEach(function(pattern) {
    str = str.replace(pattern, '[FILTRÉ]');
  });
  // Tronquer
  return str.slice(0, maxLen || 200);
}

function sanitizeContext(ctx) {
  if (!ctx || typeof ctx !== 'object' || Array.isArray(ctx)) return {};

  // Whitelist des champs autorisés uniquement
  var ALLOWED_FIELDS = [
    'prenom', 'sex', 'age', 'weight', 'height', 'goal',
    'sportType', 'sportLevel', 'activity'
  ];

  var safe = {};

  ALLOWED_FIELDS.forEach(function(field) {
    if (!(field in ctx)) return;
    var val = ctx[field];

    if (field === 'age' || field === 'weight' || field === 'height') {
      var num = parseFloat(val);
      if (!isNaN(num) && isFinite(num)) safe[field] = num;
    } else {
      safe[field] = sanitizeString(String(val), 200);
    }
  });

  return safe;
}

exports.handler = async function(event, context) {
  // ── CORS dynamique ─────────────────────────────────────────────────────────
  var origin = event.headers['origin'] || event.headers['Origin'] || '';
  var allowedOrigin = ALLOWED_ORIGINS.indexOf(origin) !== -1 ? origin : ALLOWED_ORIGINS[0];

  var headers = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'false',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: headers, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  // ── Content-Type validation ────────────────────────────────────────────────
  var contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
  if (!contentType.includes('application/json')) {
    return { statusCode: 415, headers: headers, body: JSON.stringify({ error: 'Content-Type doit être application/json' }) };
  }

  // ── Rate Limiting ──────────────────────────────────────────────────────────
  pruneRateLimitStore();
  var clientIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
  // Prendre uniquement la première IP si liste (x-forwarded-for peut contenir plusieurs IPs)
  clientIp = clientIp.split(',')[0].trim();

  var rl = checkRateLimit(clientIp);
  if (!rl.allowed) {
    var retryAfter = rl.reason === 'quota_hour' ? '3600' : '86400';
    var rlMsg = rl.reason === 'quota_day'
      ? 'Quota journalier atteint (5 analyses/jour). Revenez demain.'
      : 'Trop de requêtes (max 3 analyses/heure). Veuillez patienter.';
    return {
      statusCode: 429,
      headers: Object.assign({}, headers, { 'Retry-After': retryAfter }),
      body: JSON.stringify({ error: rlMsg })
    };
  }

  // ── API Key ────────────────────────────────────────────────────────────────
  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({ error: 'Service temporairement indisponible.' })
    };
  }

  // ── Request Size Limit (10MB pour les images) ──────────────────────────────
  var MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB
  var rawBody = event.body || '';
  if (rawBody.length > MAX_BODY_SIZE) {
    return { statusCode: 413, headers: headers, body: JSON.stringify({ error: 'Requête trop volumineuse (max 10MB).' }) };
  }

  // ── JSON Parsing ───────────────────────────────────────────────────────────
  var body;
  try { body = JSON.parse(rawBody); }
  catch(e) { return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Corps de requête invalide' }) }; }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Corps de requête invalide' }) };
  }

  // ── Validation des images ──────────────────────────────────────────────────
  var MAX_IMAGES = 3;
  var images = body.images;

  if (!Array.isArray(images) || images.length < 1) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Au moins une photo est requise.' }) };
  }

  if (images.length > MAX_IMAGES) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Maximum ' + MAX_IMAGES + ' images autorisées.' }) };
  }

  // Valider que les images sont des base64 valides
  var MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB après décodage
  var ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  for (var i = 0; i < images.length; i++) {
    var img = images[i];
    if (typeof img !== 'string' || img.length < 100) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Image invalide.' }) };
    }
    // Vérifier taille estimée (base64 est ~1.33x la taille brute)
    var sizeEstimate = (img.length * 3) / 4;
    if (sizeEstimate > MAX_IMAGE_SIZE) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Image trop volumineuse (max 5MB par image).' }) };
    }
    // Valider le type MIME si présent dans le data URI
    if (img.startsWith('data:')) {
      var mimeMatch = img.match(/^data:([^;]+);base64,/);
      if (!mimeMatch || ALLOWED_MIME_TYPES.indexOf(mimeMatch[1]) === -1) {
        return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Type d\'image non autorisé. Formats acceptés : JPEG, PNG, GIF, WebP.' }) };
      }
    }
  }

  // ── Validation et sanitisation du contexte ─────────────────────────────────
  var ctx = sanitizeContext(body.context || {});

  // ── Validation de exercisesDb ──────────────────────────────────────────────
  var MAX_EXERCISES = 100;
  var MAX_EXERCISE_LENGTH = 100;
  var exercisesDb = [];
  if (Array.isArray(body.exercisesDb)) {
    exercisesDb = body.exercisesDb
      .slice(0, MAX_EXERCISES)
      .filter(function(e) { return typeof e === 'string'; })
      .map(function(e) { return sanitizeString(e, MAX_EXERCISE_LENGTH); })
      .filter(function(e) { return e.length > 0; });
  }

  var systemPrompt = buildSystemPrompt(ctx, exercisesDb);

  // Construire le contenu multimodal (images + texte)
  var messageContent = [];
  var imageLabels = ['Photo face', 'Photo dos', 'Photo profil'];
  for (var j = 0; j < images.length; j++) {
    // Détecter le type MIME depuis le base64 header ou utiliser jpeg par défaut
    var mediaType = 'image/jpeg';
    var imgData = images[j];
    if (imgData.startsWith('data:')) {
      var parts = imgData.split(',');
      if (parts.length === 2) {
        var mimeMatchInner = parts[0].match(/data:([^;]+);/);
        if (mimeMatchInner) mediaType = mimeMatchInner[1];
        imgData = parts[1];
      }
    }
    messageContent.push({
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: imgData }
    });
    messageContent.push({
      type: 'text',
      text: imageLabels[j] || ('Photo ' + (j + 1))
    });
  }
  messageContent.push({
    type: 'text',
    text: 'Analyse ces photos selon le système prompt et génère le JSON demandé.'
  });

  try {
    var https = require('https');
    var requestBody = JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: messageContent }]
    });

    var response = await new Promise(function(resolve, reject) {
      var options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(requestBody)
        }
      };
      var req = https.request(options, function(res) {
        var data = '';
        res.on('data', function(chunk) { data += chunk; });
        res.on('end', function() {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch(e) { reject(new Error('Réponse API invalide')); }
        });
      });
      req.on('error', reject);
      req.write(requestBody);
      req.end();
    });

    if (response.status !== 200) {
      // Ne pas exposer les détails d'erreur API à l'extérieur
      console.error('[body-analysis] Erreur API Anthropic status:', response.status);
      return { statusCode: 502, headers: headers, body: JSON.stringify({ error: 'Erreur du service IA. Veuillez réessayer.' }) };
    }

    var rawText = response.body.content && response.body.content[0] && response.body.content[0].text || '';

    // Parser le JSON de la réponse (Claude peut ajouter du texte autour)
    var result = null;
    try {
      // Extraire le JSON entre le premier { et le dernier } (robuste aux textes parasites)
      var jsonStart = rawText.indexOf('{');
      var jsonEnd = rawText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        result = JSON.parse(rawText.substring(jsonStart, jsonEnd + 1));
      }
    } catch(e) {
      return { statusCode: 200, headers: headers, body: JSON.stringify({ rawText: rawText, parseError: true }) };
    }

    if (!result) {
      return { statusCode: 200, headers: headers, body: JSON.stringify({ rawText: rawText, parseError: true }) };
    }

    return { statusCode: 200, headers: headers, body: JSON.stringify({ result: result }) };

  } catch(err) {
    // Logger l'erreur interne sans exposer les détails à l'extérieur
    console.error('[body-analysis] Erreur interne:', err.message);
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({ error: 'Erreur serveur. Veuillez réessayer.' })
    };
  }
};

function buildSystemPrompt(ctx, exercisesDb) {
  var prenom = ctx.prenom || 'toi';
  // Limiter la liste d'exercices pour réduire les tokens en entrée
  var defaultExs = 'Développé couché, Squat, Soulevé de terre, Tractions, Dips, Rowing barre, Curl biceps, Presse à cuisses, Fentes, Hip thrust, Gainage, Burpee, Kettlebell swing, Thruster';
  var exercisesList = exercisesDb.length > 0 ? exercisesDb.slice(0, 30).join(', ') : defaultExs;

  var lines = [
    'Coach morpho de ' + prenom + ' sur SmartFitCoach. Analyse photos corporelles.',
    'RÈGLES: français, termes positifs, JSON valide uniquement, exercices depuis EXERCISES_AVAILABLE seulement.',
    'Photos illisibles → {"error":"Photos non exploitables"}',
    ''
  ];

  // Profil compact
  var profile = [];
  if (ctx.sex) profile.push('Sexe:' + ctx.sex);
  if (ctx.age) profile.push('Âge:' + ctx.age);
  if (ctx.weight) profile.push('Poids:' + ctx.weight + 'kg');
  if (ctx.height) profile.push('Taille:' + ctx.height + 'cm');
  if (ctx.goal) profile.push('Obj:' + ctx.goal);
  if (ctx.sportType) profile.push('Sport:' + ctx.sportType);
  if (ctx.sportLevel) profile.push('Niv:' + ctx.sportLevel);
  if (profile.length) lines.push('PROFIL: ' + profile.join(' | '));

  lines.push('EXERCISES_AVAILABLE: ' + exercisesList);

  lines.push('');
  lines.push('JSON ATTENDU:');
  lines.push('{"analyse":{"pointsForts":["..."],"axesDeveloppement":["..."],"postureNotes":"...","morphologie":"..."},"programme":{"titre":"...","disciplines":["muscu"],"objectif":"...","duree":"12 semaines","frequence":"4j/sem","semaines":[{"numero":1,"focus":"...","seances":[{"jour":"Lundi","discipline":"muscu","titre":"...","exercices":[{"nom":"NOM_EXACT","series":4,"reps":"8-10","repos":"90s","note":"..."}]}]}],"conseilsNutrition":"...","messageCoach":"..."}}');

  return lines.join('\n');
}
