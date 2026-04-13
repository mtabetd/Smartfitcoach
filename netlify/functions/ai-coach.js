// netlify/functions/ai-coach.js
// Proxy sécurisé vers l'API Anthropic — la clé API reste côté serveur

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 400; // Réduit : réponses courtes suffisent pour un coach

// Domaines autorisés pour CORS
var ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://smartfitcoach.netlify.app,https://smartfitcoach.fr,https://www.smartfitcoach.fr,https://smartfitcoach.fitness,https://www.smartfitcoach.fitness')
  .split(',').map(function(o){ return o.trim(); });
// Ajouter localhost UNIQUEMENT en dev
if (process.env.NODE_ENV !== 'production' && process.env.NETLIFY_DEV === 'true') {
  ALLOWED_ORIGINS.push('http://localhost:8888', 'http://127.0.0.1:3000', 'http://localhost:3000');
}

// ── Rate Limiting (sliding window horaire + quota journalier) ────────────────
var _hourStore = new Map(); // ip -> [{ts}]
var _dayStore = new Map();  // ip -> {date: 'YYYY-MM-DD', count: N}

var HOUR_WINDOW_MS = 3600000; // 1 heure
var HOUR_MAX = 10;  // max 10 req/heure par IP
var DAY_MAX = 30;   // max 30 req/jour par IP

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
function pruneStores() {
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
  /###\s*(system|instructions|prompt)/gi,
  // Formats alternatifs LLM
  /\[INST\]|\[\/INST\]/gi,
  /<sys>|<\/sys>/gi,
  /<\|system\|>|<\|user\|>|<\|assistant\|>/gi,
  // Unicode tricks
  /\u202e|\u200b|\u200c|\u200d/g,
  // Encodages base64 suspects (longues chaînes)
  /[A-Za-z0-9+\/]{100,}={0,2}/g,
  // Tentatives de jailbreak courantes
  /DAN\s*(mode|prompt)/gi,
  /jailbreak/gi,
  /grandma\s*(trick|exploit)/gi,
  /do\s+anything\s+now/gi,
];

function sanitizeString(str, maxLen) {
  if (typeof str !== 'string') return '';
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  PROMPT_INJECTION_PATTERNS.forEach(function(pattern) {
    str = str.replace(pattern, '[FILTRÉ]');
  });
  return str.slice(0, maxLen || 200);
}

function sanitizeContext(ctx) {
  if (!ctx || typeof ctx !== 'object' || Array.isArray(ctx)) return {};

  var ALLOWED_FIELDS = [
    'prenom', 'sex', 'age', 'weight', 'height', 'goal', 'activity',
    'sportType', 'sportLevel', 'sportDays', 'sportGoals', 'sportEquipment',
    'crossfitWeek', 'crossfit1RM',
    'triathlonGoal', 'triathlonLevel', 'triathlonFTP',
    'triathlonSwimPace', 'triathlonRunPace', 'triathlonWeek',
    'calisthenicsLevel', 'calisthPullups', 'calisthPushups',
    'wellness', 'todayNutrition',
    'regime', 'allergies', 'excluded',
    'muscuWeights', 'strengthProfile',
    'hyroxLevel', 'hyroxGoal', 'hyroxWeek',
    'runningLevel', 'runningGoal', 'runningWeek',
    'cyclingLevel', 'cyclingGoal', 'appMode'
  ];

  var safe = {};

  ALLOWED_FIELDS.forEach(function(field) {
    if (!(field in ctx)) return;
    var val = ctx[field];

    if (field === 'wellness') {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        safe.wellness = {
          sleep: sanitizeString(String(val.sleep || ''), 10),
          muscles: sanitizeString(String(val.muscles || ''), 50),
          energy: sanitizeString(String(val.energy || ''), 50),
          adaptation: sanitizeString(String(val.adaptation || ''), 100)
        };
      }
    } else if (field === 'todayNutrition') {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        safe.todayNutrition = {
          breakfast: sanitizeString(String(val.breakfast || ''), 150),
          lunch: sanitizeString(String(val.lunch || ''), 150),
          snack: sanitizeString(String(val.snack || ''), 100),
          dinner: sanitizeString(String(val.dinner || ''), 150),
          totalKcal: sanitizeString(String(val.totalKcal || ''), 10)
        };
      }
    } else if (field === 'allergies') {
      if (Array.isArray(val)) {
        safe.allergies = val.slice(0, 10).map(function(a) {
          return sanitizeString(String(a), 50);
        });
      }
    } else if (field === 'muscuWeights') {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        var safeWeights = {};
        Object.keys(val).slice(0, 15).forEach(function(k) {
          var safeKey = sanitizeString(k, 30);
          safeWeights[safeKey] = sanitizeString(String(val[k] || ''), 10);
        });
        safe.muscuWeights = safeWeights;
      }
    } else if (field === 'age' || field === 'weight' || field === 'height' ||
               field === 'sportDays' || field === 'crossfitWeek' || field === 'triathlonFTP' ||
               field === 'hyroxWeek' || field === 'runningWeek') {
      var num = parseFloat(val);
      if (!isNaN(num) && isFinite(num)) safe[field] = num;
    } else {
      safe[field] = sanitizeString(String(val), 100);
    }
  });

  return safe;
}

exports.handler = async function(event, context) {
  // ── CORS dynamique ─────────────────────────────────────────────────────────
  var origin = event.headers['origin'] || event.headers['Origin'] || '';
  var allowedOrigin = ALLOWED_ORIGINS.indexOf(origin) !== -1 ? origin : null;
  if (!allowedOrigin && event.httpMethod !== 'OPTIONS') {
    return { statusCode: 403, body: JSON.stringify({ error: 'Origin non autorisé' }) };
  }
  if (!allowedOrigin) allowedOrigin = ALLOWED_ORIGINS[0]; // OPTIONS preflight only

  var headers = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'false',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: headers, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  var contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
  if (!contentType.includes('application/json')) {
    return { statusCode: 415, headers: headers, body: JSON.stringify({ error: 'Content-Type doit être application/json' }) };
  }

  // ── Rate Limiting ──────────────────────────────────────────────────────────
  pruneStores();
  var clientIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
  clientIp = clientIp.split(',')[0].trim();

  var rl = checkRateLimit(clientIp);
  if (!rl.allowed) {
    var retryAfter = rl.reason === 'quota_hour' ? '3600' : '86400';
    var rlMsg = rl.reason === 'quota_day'
      ? 'Quota journalier atteint (30 req/jour). Revenez demain.'
      : 'Trop de requêtes (max 10/heure). Veuillez patienter.';
    return {
      statusCode: 429,
      headers: Object.assign({}, headers, { 'Retry-After': retryAfter }),
      body: JSON.stringify({ error: rlMsg })
    };
  }

  // ── API Key ────────────────────────────────────────────────────────────────
  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Service temporairement indisponible.' }) };
  }

  // ── Request Size Limit (512KB) ─────────────────────────────────────────────
  var MAX_BODY_SIZE = 512 * 1024; // 512KB (réduit — pas d'images ici)
  var rawBody = event.body || '';
  if (rawBody.length > MAX_BODY_SIZE) {
    return { statusCode: 413, headers: headers, body: JSON.stringify({ error: 'Requête trop volumineuse.' }) };
  }

  // ── JSON Parsing ───────────────────────────────────────────────────────────
  var body;
  try {
    body = JSON.parse(rawBody);
  } catch(e) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Corps de requête invalide' }) };
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Corps de requête invalide' }) };
  }

  if (!Array.isArray(body.messages)) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Le champ messages doit être un tableau.' }) };
  }

  var MAX_MSG_CONTENT = 500; // Tronquer chaque message à 500 chars
  var VALID_ROLES = ['user', 'assistant'];

  // Garder seulement les 10 derniers messages (5 échanges) avant validation
  var rawMessages = body.messages.slice(-10);
  var validatedMessages = [];

  for (var i = 0; i < rawMessages.length; i++) {
    var msg = rawMessages[i];
    if (!msg || typeof msg !== 'object') continue;
    if (typeof msg.role !== 'string' || VALID_ROLES.indexOf(msg.role) === -1) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Rôle de message invalide.' }) };
    }
    if (typeof msg.content !== 'string') {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Le contenu du message doit être une chaîne.' }) };
    }
    // Tronquer le contenu à 500 chars
    var content = msg.content.slice(0, MAX_MSG_CONTENT);
    validatedMessages.push({ role: msg.role, content: content });
  }

  if (validatedMessages.length === 0) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Au moins un message est requis.' }) };
  }

  // ── Sanitize Context ───────────────────────────────────────────────────────
  var userContext = sanitizeContext(body.context || {});
  var systemPrompt = buildSystemPrompt(userContext);

  // Garder max 10 messages (5 échanges user/assistant)
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
      req.setTimeout(85000, function() {
        req.destroy(new Error('Timeout API Anthropic'));
      });
      req.on('error', reject);
      req.write(requestBody);
      req.end();
    });

    if (response.status !== 200) {
      console.error('[ai-coach] Erreur API Anthropic status:', response.status);
      return { statusCode: 502, headers: headers, body: JSON.stringify({ error: 'Erreur du service IA. Veuillez réessayer.' }) };
    }

    var replyText = (response.body.content && response.body.content[0] && response.body.content[0].text) || '';
    if (!replyText || replyText.trim().length === 0) {
      console.error('[ai-coach] Réponse IA vide reçue');
      return { statusCode: 502, headers: headers, body: JSON.stringify({ error: 'Réponse IA vide. Veuillez réessayer.' }) };
    }
    return { statusCode: 200, headers: headers, body: JSON.stringify({ reply: replyText }) };

  } catch(err) {
    console.error('[ai-coach] Erreur interne:', err.message);
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Erreur serveur. Veuillez réessayer.' }) };
  }
};

function buildSystemPrompt(ctx) {
  var prenom = ctx.prenom || 'toi';
  // System prompt concis — pas de répétitions
  var lines = [
    'Tu es le coach sport/nutrition privé de ' + prenom + ' sur SmartFitCoach.',
    'RÈGLES : réponds TOUJOURS en français, tutoie ' + prenom + ', appelle-le/la par son prénom, sois concis (2-3 paragraphes max).',
    'Tu réponds UNIQUEMENT aux questions sport et nutrition. Hors sujet → "Je suis là pour ton sport et ta nutrition, ' + prenom + '."',
    'Base tes conseils sur le profil ci-dessous. Si une donnée manque, demande-la.',
    ''
  ];

  // Profil compact
  var profile = [];
  if (ctx.prenom) profile.push('Prénom:' + ctx.prenom);
  if (ctx.sex) profile.push('Sexe:' + ctx.sex);
  if (ctx.age) profile.push('Âge:' + ctx.age);
  if (ctx.weight) profile.push('Poids:' + ctx.weight + 'kg');
  if (ctx.height) profile.push('Taille:' + ctx.height + 'cm');
  if (ctx.goal) profile.push('Objectif:' + ctx.goal);
  if (ctx.activity) profile.push('Activité:' + ctx.activity);
  if (profile.length) lines.push('PROFIL: ' + profile.join(' | '));

  if (ctx.sportType) {
    var sport = ['Sport:' + ctx.sportType];
    if (ctx.sportLevel) sport.push('Niveau:' + ctx.sportLevel);
    if (ctx.sportDays) sport.push('Jours/sem:' + ctx.sportDays);
    if (ctx.crossfitWeek) sport.push('S.CrossFit:' + ctx.crossfitWeek);
    if (ctx.triathlonGoal) sport.push('Tri-objectif:' + ctx.triathlonGoal);
    if (ctx.triathlonFTP) sport.push('FTP:' + ctx.triathlonFTP + 'W');
    if (ctx.hyroxLevel) sport.push('Hyrox:' + ctx.hyroxLevel);
    if (ctx.runningGoal) sport.push('Run-objectif:' + ctx.runningGoal);
    if (ctx.cyclingGoal) sport.push('Vélo-objectif:' + ctx.cyclingGoal);
    lines.push('SPORT: ' + sport.join(' | '));
  }

  if (ctx.wellness) {
    var w = ctx.wellness;
    lines.push('FORME: sommeil=' + w.sleep + '/5 muscles=' + w.muscles + ' énergie=' + w.energy + (w.adaptation ? ' → ' + w.adaptation : ''));
  }

  if (ctx.todayNutrition) {
    var n = ctx.todayNutrition;
    var meals = [];
    if (n.breakfast) meals.push('Petit-déj:' + n.breakfast);
    if (n.lunch) meals.push('Déj:' + n.lunch);
    if (n.snack) meals.push('Collation:' + n.snack);
    if (n.dinner) meals.push('Dîner:' + n.dinner);
    if (n.totalKcal) meals.push('Total:' + n.totalKcal + 'kcal');
    if (meals.length) lines.push('NUTRITION AUJOURD\'HUI: ' + meals.join(' | '));
  }

  var constraints = [];
  if (ctx.regime) constraints.push('Régime:' + ctx.regime);
  if (Array.isArray(ctx.allergies) && ctx.allergies.length) constraints.push('Allergies:' + ctx.allergies.join(','));
  if (ctx.excluded) constraints.push('Exclusions:' + ctx.excluded);
  if (constraints.length) lines.push('CONTRAINTES: ' + constraints.join(' | '));

  if (ctx.muscuWeights) {
    var wobj = ctx.muscuWeights;
    var wlist = Object.keys(wobj).filter(function(k) { return wobj[k]; }).map(function(k) { return k + ':' + wobj[k] + 'kg'; });
    if (wlist.length) lines.push('CHARGES: ' + wlist.join(' | '));
  }

  return lines.join('\n');
}
