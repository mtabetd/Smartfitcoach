// netlify/functions/ai-coach.js
// Proxy sécurisé vers l'API Anthropic — la clé API reste côté serveur

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
// UPGRADE 2026-04 : Haiku → Sonnet 4.6 pour coach adaptatif avec raisonnement fin
// (ajustements charges ISSN/ACSM, interprétation RPE + cycle + wellness).
// Rate limit déjà strict (10/h, 30/j par IP) → coût maîtrisé.
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 500; // Sonnet peut mieux — +100 tokens pour analyses progression

// Domaines autorisés pour CORS
var ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://smartfitcoach.netlify.app,https://smartfitcoach.fr,https://www.smartfitcoach.fr,https://smartfitcoach.fitness,https://www.smartfitcoach.fitness')
  .split(',').map(function(o){ return o.trim(); });
// Localhost pour dev
ALLOWED_ORIGINS.push('http://localhost:8888', 'http://127.0.0.1:3000', 'http://localhost:3000');

function isAllowedOrigin(origin) {
  if (!origin) return true; // same-origin requests (pas de header Origin)
  if (ALLOWED_ORIGINS.indexOf(origin) !== -1) return true;
  // Accepter tout sous-domaine Netlify (deploy previews)
  if (/^https:\/\/[a-z0-9-]+--smartfitcoach\.netlify\.app$/.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.netlify\.app$/.test(origin)) return true;
  return false;
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
    'cyclingLevel', 'cyclingGoal', 'appMode',
    // FIX COACH IA CONTEXT 2026-04 : pertinence + sécurité (grossesse, blessures, streak)
    'pregnant', 'pregnancyWeek', 'breastfeeding',
    'cycleTracking', 'cycleLength', 'lastPeriodDate',
    'trainingDaysSelected', 'trainTime', 'mealsPerDay',
    'muscuMedical', 'medical', 'streak',
    'intolerances', 'halal',
    // COACH ADAPTATIF 2026-04 (phase A) : feedback séances + performance semaine + cycle
    'lastSessionFeedback', 'weekPerformance',
    'nextSessionScheduled', 'cyclePhase'
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
               field === 'hyroxWeek' || field === 'runningWeek' ||
               field === 'pregnancyWeek' || field === 'cycleLength' ||
               field === 'mealsPerDay' || field === 'streak') {
      var num = parseFloat(val);
      if (!isNaN(num) && isFinite(num)) safe[field] = num;
    }
    // FIX F2 CONTRE-AUDIT 2026-04 : handlers typés pour booléens / arrays / objects.
    // AVANT : le fallback `else` convertissait tout en string via sanitizeString("false"),
    //         résultat : une string "false" est TRUTHY → alerte ⚠️ ENCEINTE émise POUR TOUS
    //         les users (hommes inclus). Safety warnings COMPLÈTEMENT inversés !
    // MAINTENANT : typage strict par champ.
    else if (field === 'pregnant' || field === 'breastfeeding' ||
             field === 'cycleTracking' || field === 'halal') {
      // Booléen strict (true uniquement si val === true OR 'true')
      safe[field] = (val === true || val === 'true');
    }
    else if (field === 'trainingDaysSelected' || field === 'medical' ||
             field === 'intolerances' || field === 'sportGoals') {
      // Tableau (max 20 éléments, 50 chars chacun)
      if (Array.isArray(val)) {
        safe[field] = val.slice(0, 20).map(function(x) { return sanitizeString(String(x), 50); });
      }
    }
    else if (field === 'muscuMedical') {
      // Objet (shallow copy, max 20 clés)
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        var safeMuscuMed = {};
        Object.keys(val).slice(0, 20).forEach(function(k) {
          var sk = sanitizeString(k, 40);
          safeMuscuMed[sk] = !!val[k];
        });
        safe.muscuMedical = safeMuscuMed;
      }
    }
    else if (field === 'lastPeriodDate' || field === 'trainTime') {
      // String courte (date ISO ou token enum)
      if (val != null) safe[field] = sanitizeString(String(val), 30);
    }
    else if (field === 'crossfit1RM' || field === 'strengthProfile') {
      // Objet numérique (1RM bench: 100, squat: 140, etc.)
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        var safe1RM = {};
        Object.keys(val).slice(0, 20).forEach(function(k) {
          var sk = sanitizeString(k, 30);
          var num = parseFloat(val[k]);
          if (!isNaN(num) && isFinite(num)) safe1RM[sk] = num;
        });
        safe[field] = safe1RM;
      }
    }
    // COACH ADAPTATIF 2026-04 : handlers typés pour feedback + perf
    else if (field === 'lastSessionFeedback') {
      // { date, sessionId, rpe, feeling, pain, chargeActual:{exo:kg}, reps:{exo:n}, notes }
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        var sfb = {};
        if (val.date) sfb.date = sanitizeString(String(val.date), 30);
        if (val.sessionId) sfb.sessionId = sanitizeString(String(val.sessionId), 40);
        var rpeN = parseFloat(val.rpe);
        if (!isNaN(rpeN) && isFinite(rpeN) && rpeN >= 1 && rpeN <= 10) sfb.rpe = rpeN;
        if (val.feeling) sfb.feeling = sanitizeString(String(val.feeling), 20);
        if (val.pain) sfb.pain = sanitizeString(String(val.pain), 30);
        if (val.notes) sfb.notes = sanitizeString(String(val.notes), 200);
        if (val.chargeActual && typeof val.chargeActual === 'object' && !Array.isArray(val.chargeActual)) {
          var sc = {};
          Object.keys(val.chargeActual).slice(0, 15).forEach(function(k) {
            var sk = sanitizeString(k, 40);
            var n = parseFloat(val.chargeActual[k]);
            if (!isNaN(n) && isFinite(n)) sc[sk] = n;
          });
          sfb.chargeActual = sc;
        }
        if (val.reps && typeof val.reps === 'object' && !Array.isArray(val.reps)) {
          var sr = {};
          Object.keys(val.reps).slice(0, 15).forEach(function(k) {
            var sk = sanitizeString(k, 40);
            var n = parseFloat(val.reps[k]);
            if (!isNaN(n) && isFinite(n)) sr[sk] = n;
          });
          sfb.reps = sr;
        }
        safe.lastSessionFeedback = sfb;
      }
    }
    else if (field === 'weekPerformance') {
      // { sessionsCount, rpeAvg, chargeProgressionPct, lastPain }
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        var wp = {};
        var sc2 = parseFloat(val.sessionsCount);
        if (!isNaN(sc2) && isFinite(sc2)) wp.sessionsCount = sc2;
        var rpeA = parseFloat(val.rpeAvg);
        if (!isNaN(rpeA) && isFinite(rpeA)) wp.rpeAvg = Math.round(rpeA * 10) / 10;
        var cp = parseFloat(val.chargeProgressionPct);
        if (!isNaN(cp) && isFinite(cp)) wp.chargeProgressionPct = Math.round(cp * 10) / 10;
        if (val.lastPain) wp.lastPain = sanitizeString(String(val.lastPain), 30);
        safe.weekPerformance = wp;
      }
    }
    else if (field === 'nextSessionScheduled') {
      // { date, dayLabel, type } (ex: { date:'2026-04-16', dayLabel:'Jeudi', type:'muscu Jour 3' })
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        var ns = {};
        if (val.date) ns.date = sanitizeString(String(val.date), 30);
        if (val.dayLabel) ns.dayLabel = sanitizeString(String(val.dayLabel), 30);
        if (val.type) ns.type = sanitizeString(String(val.type), 60);
        safe.nextSessionScheduled = ns;
      }
    }
    else if (field === 'cyclePhase') {
      // { phase, dayInCycle, intensityFactor } — déjà calculé côté client
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        var cp2 = {};
        if (val.phase) cp2.phase = sanitizeString(String(val.phase), 30);
        var dic = parseFloat(val.dayInCycle);
        if (!isNaN(dic) && isFinite(dic)) cp2.dayInCycle = Math.round(dic);
        var ifac = parseFloat(val.intensityFactor);
        if (!isNaN(ifac) && isFinite(ifac)) cp2.intensityFactor = Math.round(ifac * 100) / 100;
        safe.cyclePhase = cp2;
      }
    }
    else {
      safe[field] = sanitizeString(String(val), 100);
    }
  });

  return safe;
}

exports.handler = async function(event, context) {
  // ── CORS dynamique ─────────────────────────────────────────────────────────
  var origin = event.headers['origin'] || event.headers['Origin'] || '';
  var allowedOrigin = isAllowedOrigin(origin) ? (origin || ALLOWED_ORIGINS[0]) : null;
  if (!allowedOrigin && event.httpMethod !== 'OPTIONS') {
    return { statusCode: 403, body: JSON.stringify({ error: 'Origin non autorisé' }) };
  }
  if (!allowedOrigin) allowedOrigin = ALLOWED_ORIGINS[0];

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
      req.setTimeout(23000, function() {
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
  if (Array.isArray(ctx.intolerances) && ctx.intolerances.length) constraints.push('Intolérances:' + ctx.intolerances.join(','));
  if (ctx.halal) constraints.push('Halal');
  if (ctx.excluded) constraints.push('Exclusions:' + ctx.excluded);
  if (ctx.mealsPerDay) constraints.push('Repas/jour:' + ctx.mealsPerDay);
  if (constraints.length) lines.push('CONTRAINTES: ' + constraints.join(' | '));

  // FIX COACH IA CONTEXT 2026-04 : bloc SANTÉ FÉMININE (sécurité critique)
  // L'IA DOIT savoir si l'user est enceinte / allaite / suit son cycle pour éviter
  // des recommandations dangereuses (jeûne intermittent, restriction calorique, etc.)
  var health = [];
  if (ctx.pregnant) {
    var trim = '';
    if (ctx.pregnancyWeek) {
      var w = Number(ctx.pregnancyWeek);
      if (w <= 12) trim = 'T1';
      else if (w <= 26) trim = 'T2';
      else trim = 'T3';
      health.push('⚠️ ENCEINTE semaine ' + w + ' (' + trim + ')');
    } else {
      health.push('⚠️ ENCEINTE');
    }
  }
  if (ctx.breastfeeding) health.push('⚠️ ALLAITEMENT en cours');
  if (ctx.cycleTracking && ctx.cycleLength) health.push('Cycle:' + ctx.cycleLength + 'j');
  if (health.length) {
    lines.push('SANTÉ: ' + health.join(' | '));
    // FIX F9 CONTRE-AUDIT 2026-04 : instructions ACOG CONDITIONNELLES au trimestre.
    // Avant : on envoyait le même message "+340 T2, +450 T3" peu importe le trimestre →
    //         IA pouvait conseiller +340 kcal à une femme en T1 (alors que surplus = 0 en T1).
    // Maintenant : recommandations précises par trimestre.
    if (ctx.pregnant) {
      var _trimText = '';
      if (ctx.pregnancyWeek) {
        var _w = Number(ctx.pregnancyWeek);
        if (_w <= 12) _trimText = 'T1 : aucun surplus calorique (alimentation normale). Éviter alcool, viandes crues, poisson au mercure.';
        else if (_w <= 26) _trimText = 'T2 : +340 kcal/j (ACOG 2022). Calcium 1000mg, fer 27mg, folate 600µg.';
        else _trimText = 'T3 : +450 kcal/j (ACOG 2022). Protéines 71g/j, activité modérée OK sauf décollement placenta.';
      } else {
        _trimText = 'Demander le trimestre avant de conseiller un apport calorique.';
      }
      lines.push('⚠️ SÉCURITÉ CLINIQUE (GROSSESSE) : pas de déficit calorique, pas de jeûne intermittent, pas de compléments non validés médecin. ' + _trimText);
    }
    if (ctx.breastfeeding) {
      lines.push('⚠️ SÉCURITÉ ALLAITEMENT : +450 kcal/j (ACOG 2022). Hydratation renforcée (3L/j). Éviter caféine > 300mg/j, alcool.');
    }
  }

  // FIX 2026-04 : blessures et restrictions médicales muscu
  var medicalNotes = [];
  if (Array.isArray(ctx.medical) && ctx.medical.length) {
    medicalNotes.push('Médical:' + ctx.medical.join(','));
  }
  if (ctx.muscuMedical && typeof ctx.muscuMedical === 'object') {
    var muscuLimits = Object.keys(ctx.muscuMedical).filter(function(k) { return ctx.muscuMedical[k]; });
    if (muscuLimits.length) medicalNotes.push('Restrictions muscu:' + muscuLimits.join(','));
  }
  if (medicalNotes.length) lines.push('LIMITATIONS: ' + medicalNotes.join(' | '));

  // FIX 2026-04 : jours d'entraînement et timing — pour conseils nutrition pré/post-séance
  var sportContext = [];
  if (Array.isArray(ctx.trainingDaysSelected) && ctx.trainingDaysSelected.length) {
    var dayNames = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
    sportContext.push('Jours training:' + ctx.trainingDaysSelected.map(function(i) { return dayNames[i] || i; }).join(','));
  }
  if (ctx.trainTime) sportContext.push('Heure séance:' + ctx.trainTime);
  if (sportContext.length) lines.push('PLANNING: ' + sportContext.join(' | '));

  // FIX 2026-04 : streak pour personnalisation motivationnelle
  if (ctx.streak && ctx.streak > 0) {
    lines.push('STREAK: ' + ctx.streak + ' jour' + (ctx.streak > 1 ? 's' : '') + ' consécutif' + (ctx.streak > 1 ? 's' : '') + ' (mentionner si pertinent pour encourager)');
  }

  if (ctx.muscuWeights) {
    var wobj = ctx.muscuWeights;
    var wlist = Object.keys(wobj).filter(function(k) { return wobj[k]; }).map(function(k) { return k + ':' + wobj[k] + 'kg'; });
    if (wlist.length) lines.push('CHARGES: ' + wlist.join(' | '));
  }

  // COACH ADAPTATIF 2026-04 (phase A) : cycle + feedback séance + perf hebdo + prochaine séance.
  // L'IA doit pouvoir ajuster les conseils en fonction de la dernière séance et de la phase du
  // cycle hormonal. Principes ISSN 2017 + ACSM (volume ≤ +10%/sem, RPE → progression/deload).
  if (ctx.cyclePhase && ctx.cyclePhase.phase) {
    var cp = ctx.cyclePhase;
    var cpLine = 'CYCLE: phase=' + cp.phase;
    if (cp.dayInCycle) cpLine += ' (J' + cp.dayInCycle + ')';
    if (cp.intensityFactor) cpLine += ' — facteur intensité recommandé ×' + cp.intensityFactor;
    lines.push(cpLine);
  }

  if (ctx.lastSessionFeedback && ctx.lastSessionFeedback.date) {
    var lsf = ctx.lastSessionFeedback;
    var lsfParts = ['Date:' + lsf.date];
    if (lsf.sessionId) lsfParts.push('ID:' + lsf.sessionId);
    if (typeof lsf.rpe === 'number') lsfParts.push('RPE:' + lsf.rpe + '/10');
    if (lsf.feeling) lsfParts.push('Ressenti:' + lsf.feeling);
    if (lsf.pain) lsfParts.push('⚠️ Douleur:' + lsf.pain);
    if (lsf.chargeActual && Object.keys(lsf.chargeActual).length) {
      var chList = Object.keys(lsf.chargeActual).slice(0, 6).map(function(k) {
        return k + ':' + lsf.chargeActual[k] + 'kg';
      });
      lsfParts.push('Charges réelles:' + chList.join(','));
    }
    if (lsf.notes) lsfParts.push('Notes:' + lsf.notes);
    lines.push('DERNIÈRE SÉANCE: ' + lsfParts.join(' | '));
  }

  if (ctx.weekPerformance) {
    var wperf = ctx.weekPerformance;
    var wpParts = [];
    if (typeof wperf.sessionsCount === 'number') wpParts.push('Séances:' + wperf.sessionsCount);
    if (typeof wperf.rpeAvg === 'number') wpParts.push('RPE moyen:' + wperf.rpeAvg + '/10');
    if (typeof wperf.chargeProgressionPct === 'number') {
      var sign = wperf.chargeProgressionPct >= 0 ? '+' : '';
      wpParts.push('Progression charges:' + sign + wperf.chargeProgressionPct + '%');
    }
    if (wperf.lastPain) wpParts.push('⚠️ Douleur récente:' + wperf.lastPain);
    if (wpParts.length) lines.push('PERFORMANCE SEMAINE: ' + wpParts.join(' | '));
  }

  if (ctx.nextSessionScheduled && ctx.nextSessionScheduled.date) {
    var nss = ctx.nextSessionScheduled;
    var nssParts = ['Date:' + nss.date];
    if (nss.dayLabel) nssParts.push(nss.dayLabel);
    if (nss.type) nssParts.push(nss.type);
    lines.push('PROCHAINE SÉANCE: ' + nssParts.join(' | '));
  }

  // Règles adaptatives — seulement si on a des infos sport pour éviter du bruit
  if (ctx.lastSessionFeedback || ctx.weekPerformance || ctx.sportType) {
    lines.push('');
    lines.push('RÈGLES COACH ADAPTATIF (ISSN 2017 / ACSM) :');
    lines.push('- Si DERNIÈRE SÉANCE absente et user parle de sa séance → demander charges réelles + RPE + ressenti.');
    lines.push('- RPE ≤ 6 sur la/les dernière(s) séance(s) → suggérer +2,5 à 5% de charge sur les compound (squat, DC, DT, OHP).');
    lines.push('- RPE 7-8 → maintenir volume, focus technique et tempo.');
    lines.push('- RPE ≥ 9 OU douleur signalée → proposer dé-load -10% volume ou exo de substitution (ex: goblet squat si dos).');
    lines.push('- Progression volume max +10%/semaine (ACSM). Au-delà → risque blessure.');
    if (ctx.cyclePhase && ctx.cyclePhase.phase) {
      lines.push('- Cycle actuel : adapter intensité au facteur indiqué. Menstruation (J1-5) = baisse OK si souhaité, Folliculaire (J6-13) = pic perf, Lutéale (J17-28) = volume modéré.');
    }
    if (ctx.pregnant) {
      lines.push('- Grossesse : pas de Valsalva, pas de charges maximales, intensité modérée, hydratation +++.');
    }
    lines.push('- Toujours chiffrer les ajustements (ex: "passe de 60 à 62,5kg au DC") plutôt que vague.');
  }

  return lines.join('\n');
}
