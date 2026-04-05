// netlify/functions/ai-coach.js
// Proxy sécurisé vers l'API Anthropic — la clé API reste côté serveur

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 1024;

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
var RATE_LIMIT_MAX_AI_COACH = 20; // max 20 req/min pour ai-coach

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
    'prenom', 'sex', 'age', 'weight', 'height', 'goal', 'activity',
    'sportType', 'sportLevel', 'sportDays', 'crossfitWeek',
    'triathlonGoal', 'triathlonLevel', 'triathlonFTP',
    'calisthenicsLevel', 'wellness', 'todayNutrition',
    'regime', 'allergies', 'excluded', 'muscuWeights'
  ];

  var safe = {};

  ALLOWED_FIELDS.forEach(function(field) {
    if (!(field in ctx)) return;
    var val = ctx[field];

    if (field === 'wellness') {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        safe.wellness = {
          sleep: sanitizeString(String(val.sleep || ''), 10),
          muscles: sanitizeString(String(val.muscles || ''), 100),
          energy: sanitizeString(String(val.energy || ''), 100),
          adaptation: sanitizeString(String(val.adaptation || ''), 200)
        };
      }
    } else if (field === 'todayNutrition') {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        safe.todayNutrition = {
          breakfast: sanitizeString(String(val.breakfast || ''), 300),
          lunch: sanitizeString(String(val.lunch || ''), 300),
          snack: sanitizeString(String(val.snack || ''), 300),
          dinner: sanitizeString(String(val.dinner || ''), 300),
          totalKcal: sanitizeString(String(val.totalKcal || ''), 20)
        };
      }
    } else if (field === 'allergies') {
      if (Array.isArray(val)) {
        safe.allergies = val.slice(0, 20).map(function(a) {
          return sanitizeString(String(a), 100);
        });
      }
    } else if (field === 'muscuWeights') {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        var safeWeights = {};
        Object.keys(val).slice(0, 30).forEach(function(k) {
          var safeKey = sanitizeString(k, 50);
          safeWeights[safeKey] = sanitizeString(String(val[k] || ''), 20);
        });
        safe.muscuWeights = safeWeights;
      }
    } else if (field === 'age' || field === 'weight' || field === 'height' ||
               field === 'sportDays' || field === 'crossfitWeek' || field === 'triathlonFTP') {
      // Champs numériques
      var num = parseFloat(val);
      if (!isNaN(num) && isFinite(num)) safe[field] = num;
    } else {
      // Champs textuels simples
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

  if (!checkRateLimit(clientIp, RATE_LIMIT_MAX_AI_COACH)) {
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

  // ── Request Size Limit (1MB) ───────────────────────────────────────────────
  var MAX_BODY_SIZE = 1 * 1024 * 1024; // 1MB
  var rawBody = event.body || '';
  if (rawBody.length > MAX_BODY_SIZE) {
    return { statusCode: 413, headers: headers, body: JSON.stringify({ error: 'Requête trop volumineuse (max 1MB).' }) };
  }

  // ── JSON Parsing ───────────────────────────────────────────────────────────
  var body;
  try {
    body = JSON.parse(rawBody);
  } catch(e) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Corps de requête invalide' }) };
  }

  // ── Input Validation ───────────────────────────────────────────────────────
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Corps de requête invalide' }) };
  }

  // Valider messages
  if (!Array.isArray(body.messages)) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Le champ messages doit être un tableau.' }) };
  }

  var MAX_MESSAGES = 20;
  var MAX_CONTENT_LENGTH = 4000;
  var VALID_ROLES = ['user', 'assistant'];

  var rawMessages = body.messages.slice(0, MAX_MESSAGES);
  var validatedMessages = [];

  for (var i = 0; i < rawMessages.length; i++) {
    var msg = rawMessages[i];
    if (!msg || typeof msg !== 'object') continue;
    if (typeof msg.role !== 'string' || VALID_ROLES.indexOf(msg.role) === -1) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Rôle de message invalide. Valeurs autorisées : user, assistant.' }) };
    }
    if (typeof msg.content !== 'string') {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Le contenu du message doit être une chaîne de caractères.' }) };
    }
    if (msg.content.length > MAX_CONTENT_LENGTH) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Message trop long (max ' + MAX_CONTENT_LENGTH + ' caractères).' }) };
    }
    validatedMessages.push({ role: msg.role, content: msg.content });
  }

  if (validatedMessages.length === 0) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Au moins un message est requis.' }) };
  }

  // ── Sanitize Context (anti-prompt injection) ───────────────────────────────
  var userContext = sanitizeContext(body.context || {});

  // Construire le system prompt avec le contexte sanitisé
  var systemPrompt = buildSystemPrompt(userContext);

  // Limiter l'historique à 10 messages pour maîtriser les coûts
  var messages = validatedMessages.slice(-10);

  try {
    var https = require('https');
    var requestBody = JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: messages
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
      console.error('[ai-coach] Erreur API Anthropic status:', response.status);
      return { statusCode: 502, headers: headers, body: JSON.stringify({ error: 'Erreur du service IA. Veuillez réessayer.' }) };
    }

    var replyText = response.body.content && response.body.content[0] && response.body.content[0].text || '';
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({ reply: replyText })
    };

  } catch(err) {
    // Logger l'erreur interne sans exposer les détails à l'extérieur
    console.error('[ai-coach] Erreur interne:', err.message);
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({ error: 'Erreur serveur. Veuillez réessayer.' })
    };
  }
};

function buildSystemPrompt(ctx) {
  var prenom = ctx.prenom || 'toi';
  var lines = [
    'Tu es le coach personnel privé de ' + prenom + ' sur SmartFitCoach.',
    'Ton rôle est STRICTEMENT limité à deux domaines : la NUTRITION et le SPORT de ' + prenom + '.',
    'Tu ne réponds à AUCUNE autre question. Si ' + prenom + ' te parle d\'autre chose (actualité, technologie, vie personnelle hors sport/nutrition, etc.), tu réponds poliment : "Je suis uniquement là pour t\'accompagner sur ta nutrition et ton sport, ' + prenom + '. Sur quoi puis-je t\'aider dans ces domaines ?"',
    '',
    'RÈGLES ABSOLUES :',
    '- Tu appelles TOUJOURS ' + prenom + ' par son prénom dans chaque réponse.',
    '- Tu réponds TOUJOURS en français.',
    '- Tu tutoies ' + prenom + '.',
    '- Tes conseils sont 100% basés sur le profil réel de ' + prenom + ' ci-dessous — jamais de généralités.',
    '- Sois concis, précis, actionnable. Maximum 3-4 paragraphes.',
    '- Ne jamais inventer des données absentes du profil. Si une info manque, demande-la à ' + prenom + '.',
    '- Ton style : bienveillant, direct, comme un vrai coach privé haut de gamme.',
    '',
    '## PROFIL DE ' + prenom.toUpperCase()
  ];

  if (ctx.prenom) lines.push('Prénom : ' + ctx.prenom);
  if (ctx.sex) lines.push('Sexe : ' + ctx.sex);
  if (ctx.age) lines.push('Âge : ' + ctx.age + ' ans');
  if (ctx.weight) lines.push('Poids : ' + ctx.weight + ' kg');
  if (ctx.height) lines.push('Taille : ' + ctx.height + ' cm');
  if (ctx.goal) lines.push('Objectif : ' + ctx.goal);
  if (ctx.activity) lines.push('Niveau activité : ' + ctx.activity);

  if (ctx.sportType) {
    lines.push('');
    lines.push('## SPORT EN COURS');
    lines.push('Sport : ' + ctx.sportType);
    if (ctx.sportLevel) lines.push('Niveau : ' + ctx.sportLevel);
    if (ctx.sportDays) lines.push('Jours/semaine : ' + ctx.sportDays);
    if (ctx.crossfitWeek) lines.push('Semaine CrossFit : ' + ctx.crossfitWeek + '/52');
    if (ctx.triathlonGoal) lines.push('Objectif triathlon : ' + ctx.triathlonGoal);
    if (ctx.triathlonLevel) lines.push('Niveau triathlon : ' + ctx.triathlonLevel);
    if (ctx.triathlonFTP) lines.push('FTP vélo : ' + ctx.triathlonFTP + 'W');
    if (ctx.calisthenicsLevel) lines.push('Niveau callisthénie : ' + ctx.calisthenicsLevel);
  }

  if (ctx.wellness) {
    lines.push('');
    lines.push('## ÉTAT DE FORME AUJOURD\'HUI');
    lines.push('Sommeil : ' + ctx.wellness.sleep + '/5');
    lines.push('Muscles : ' + ctx.wellness.muscles);
    lines.push('Énergie : ' + ctx.wellness.energy);
    if (ctx.wellness.adaptation) lines.push('Adaptation recommandée : ' + ctx.wellness.adaptation);
  }

  if (ctx.todayNutrition) {
    lines.push('');
    lines.push('## NUTRITION AUJOURD\'HUI');
    if (ctx.todayNutrition.breakfast) lines.push('Petit-déj : ' + ctx.todayNutrition.breakfast);
    if (ctx.todayNutrition.lunch) lines.push('Déjeuner : ' + ctx.todayNutrition.lunch);
    if (ctx.todayNutrition.snack) lines.push('Collation : ' + ctx.todayNutrition.snack);
    if (ctx.todayNutrition.dinner) lines.push('Dîner : ' + ctx.todayNutrition.dinner);
    if (ctx.todayNutrition.totalKcal) lines.push('Total estimé : ' + ctx.todayNutrition.totalKcal + ' kcal');
  }

  if (ctx.regime || ctx.allergies) {
    lines.push('');
    lines.push('## CONTRAINTES ALIMENTAIRES');
    if (ctx.regime) lines.push('Régime : ' + ctx.regime);
    if (Array.isArray(ctx.allergies) && ctx.allergies.length) lines.push('Allergies : ' + ctx.allergies.join(', '));
    if (ctx.excluded) lines.push('Exclusions : ' + ctx.excluded);
  }

  if (ctx.muscuWeights) {
    lines.push('');
    lines.push('## CHARGES ACTUELLES (musculation)');
    var wobj = ctx.muscuWeights;
    Object.keys(wobj).forEach(function(k) {
      if (wobj[k]) lines.push(k + ' : ' + wobj[k] + ' kg');
    });
  }

  lines.push('');
  lines.push('## INSTRUCTIONS COACH');
  lines.push('- Commence chaque réponse en appelant ' + prenom + ' par son prénom.');
  lines.push('- SPORT : si ' + prenom + ' parle de charges, suggère une progression +2.5kg ou +5kg selon l\'exercice et son niveau.');
  lines.push('- SPORT : si l\'état de forme est mauvais (sommeil ≤ 2, muscles douloureux), recommande récupération active plutôt que séance intense.');
  lines.push('- NUTRITION : analyse les macros du plan de ' + prenom + ' si disponibles. Ajuste selon son objectif (' + (ctx.goal || 'non précisé') + ').');
  lines.push('- NUTRITION : respecte toujours les contraintes alimentaires de ' + prenom + ' (régime, allergies, exclusions).');
  lines.push('- Cite des références concrètes quand pertinent (règle des 10%, méthode Friel, RPE, periodisation nutritionnelle).');
  lines.push('- Si une question sort du cadre nutrition/sport, rappelle poliment à ' + prenom + ' ton rôle.');

  return lines.join('\n');
}
