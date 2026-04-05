// netlify/functions/body-analysis.js
// Analyse corporelle par vision IA — clé API côté serveur uniquement

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 4096;

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

// ── Rate Limiting ────────────────────────────────────────────────────────────
var _rateLimitStore = {};
var RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
var RATE_LIMIT_MAX_BODY_ANALYSIS = 5; // max 5 req/min (vision = coûteux)

function checkRateLimit(ip, maxRequests) {
  var now = Date.now();
  if (!_rateLimitStore[ip]) _rateLimitStore[ip] = [];
  // Nettoyer les entrées expirées (sliding window)
  _rateLimitStore[ip] = _rateLimitStore[ip].filter(function(t) {
    return now - t < RATE_LIMIT_WINDOW_MS;
  });
  if (_rateLimitStore[ip].length >= maxRequests) {
    return false; // Rate limit dépassé
  }
  _rateLimitStore[ip].push(now);
  return true;
}

// Nettoyer périodiquement le store pour éviter la fuite mémoire
function pruneRateLimitStore() {
  var now = Date.now();
  Object.keys(_rateLimitStore).forEach(function(ip) {
    _rateLimitStore[ip] = _rateLimitStore[ip].filter(function(t) {
      return now - t < RATE_LIMIT_WINDOW_MS;
    });
    if (_rateLimitStore[ip].length === 0) delete _rateLimitStore[ip];
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

  if (!checkRateLimit(clientIp, RATE_LIMIT_MAX_BODY_ANALYSIS)) {
    return {
      statusCode: 429,
      headers: Object.assign({}, headers, { 'Retry-After': '60' }),
      body: JSON.stringify({ error: 'Trop de requêtes. Veuillez patienter avant de réessayer.' })
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
  var prenom = ctx.prenom || 'cet utilisateur';
  var exercisesList = exercisesDb.length > 0 ? exercisesDb.join(', ') : 'Développé couché, Squat, Soulevé de terre, Tractions, Dips, Rowing barre, Curl biceps, Extension triceps, Presse à cuisses, Fentes, Hip thrust, Gainage, Crunch, Burpee, Box jump, Kettlebell swing, Thruster, Wall ball, Double under, Row ergomètre, Ski erg';

  var lines = [
    'Tu es le coach morphologique privé de ' + prenom + ' sur SmartFitCoach.',
    'Tu analyses des photos corporelles avec bienveillance, précision et expertise.',
    '',
    'RÈGLES ABSOLUES :',
    '- Appelle toujours ' + prenom + ' par son prénom',
    '- Réponds TOUJOURS en français',
    '- Formule TOUT en termes positifs : "potentiel de développement", "axe de progression", jamais de critique négative',
    '- Si les photos ne montrent pas clairement un corps humain, retourne {"error": "Photos non exploitables pour l\'analyse"}',
    '- Ta programmation utilise UNIQUEMENT les exercices listés dans EXERCISES_AVAILABLE',
    '- Tu peux combiner plusieurs disciplines si optimal (ex: musculation + crossfit, muscu + hyrox)',
    '- Réponds UNIQUEMENT en JSON valide, sans texte autour',
    '',
    '## PROFIL DE ' + prenom.toUpperCase()
  ];

  if (ctx.sex) lines.push('Sexe : ' + ctx.sex);
  if (ctx.age) lines.push('Âge : ' + ctx.age + ' ans');
  if (ctx.weight) lines.push('Poids : ' + ctx.weight + ' kg');
  if (ctx.height) lines.push('Taille : ' + ctx.height + ' cm');
  if (ctx.goal) lines.push('Objectif : ' + ctx.goal);
  if (ctx.sportType) lines.push('Sport actuel : ' + ctx.sportType);
  if (ctx.sportLevel) lines.push('Niveau : ' + ctx.sportLevel);

  lines.push('');
  lines.push('## EXERCISES_AVAILABLE');
  lines.push(exercisesList);

  lines.push('');
  lines.push('## FORMAT DE RÉPONSE JSON OBLIGATOIRE');
  lines.push(JSON.stringify({
    analyse: {
      pointsForts: ['string — point fort formulé positivement', '...'],
      axesDeveloppement: ['string — opportunité de progression', '...'],
      postureNotes: 'string — observation posturale bienveillante',
      morphologie: 'string — type morpho + implications pour la programmation'
    },
    programme: {
      titre: 'string — ex: "Programme Force & Symétrie — 12 semaines"',
      disciplines: ['muscu', 'crossfit'],
      objectif: 'string — objectif principal en 1 phrase',
      duree: '12 semaines',
      frequence: '4 jours/semaine',
      semaines: [
        {
          numero: 1,
          focus: 'string — focus de la semaine',
          seances: [
            {
              jour: 'Lundi',
              discipline: 'muscu',
              titre: 'string — titre de la séance',
              exercices: [
                { nom: 'string — nom EXACT depuis EXERCISES_AVAILABLE', series: 4, reps: '8-10', repos: '90s', note: 'string — conseil technique court' }
              ]
            }
          ]
        }
      ],
      conseilsNutrition: 'string — nutrition adaptée à l\'objectif morphologique',
      messageCoach: 'string — message motivant personnalisé de clôture avec prénom'
    }
  }, null, 0));

  return lines.join('\n');
}
