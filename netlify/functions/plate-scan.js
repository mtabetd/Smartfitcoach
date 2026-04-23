// netlify/functions/plate-scan.js
// Proxy sécurisé vers l'API Anthropic — analyse d'assiette par vision IA

const { requirePremium } = require('./_user-auth');

// UPGRADE 2026-04 : Haiku 4.5 → Sonnet 4.6 pour meilleure précision vision.
// Bénéfice : reconnaissance plus fine des ingrédients, estimation macros
// plus cohérente avec portion visible, meilleure gestion des plats composés.
// Coût : ~3× (reste <0.02€/scan avec 5/h max/IP = <0.50€/utilisateur/mois).
// Rate limit INCHANGÉ (5/h) → coût total maîtrisé.
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 300; // Sonnet peut raisonner mieux avec + de tokens

// Domaines autorisés pour CORS
var ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://smartfitcoach.netlify.app,https://smartfitcoach.fr,https://www.smartfitcoach.fr,https://smartfitcoach.fitness,https://www.smartfitcoach.fitness')
  .split(',').map(function(o){ return o.trim(); });
ALLOWED_ORIGINS.push('http://localhost:8888', 'http://127.0.0.1:3000', 'http://localhost:3000');

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.indexOf(origin) !== -1) return true;
  if (/^https:\/\/[a-z0-9-]+--smartfitcoach\.netlify\.app$/.test(origin)) return true;
  return false;
}

// ── Rate Limiting (sliding window horaire) ───────────────────────────────────
var _scanHourStore = new Map(); // ip -> [{ts}]

var SCAN_HOUR_WINDOW_MS = 3600000; // 1 heure
var SCAN_HOUR_MAX = 5; // max 5 scans/heure par IP

function checkScanRateLimit(ip) {
  var now = Date.now();

  var hourList = _scanHourStore.get(ip) || [];
  hourList = hourList.filter(function(t) { return now - t < SCAN_HOUR_WINDOW_MS; });
  if (hourList.length >= SCAN_HOUR_MAX) {
    return { allowed: false };
  }

  hourList.push(now);
  _scanHourStore.set(ip, hourList);
  return { allowed: true };
}

function pruneScanStore() {
  var now = Date.now();
  _scanHourStore.forEach(function(list, ip) {
    var filtered = list.filter(function(t) { return now - t < SCAN_HOUR_WINDOW_MS; });
    if (filtered.length === 0) _scanHourStore.delete(ip);
    else _scanHourStore.set(ip, filtered);
  });
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
  pruneScanStore();
  var clientIp = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
  clientIp = clientIp.split(',')[0].trim();

  var rl = checkScanRateLimit(clientIp);
  if (!rl.allowed) {
    return {
      statusCode: 429,
      headers: Object.assign({}, headers, { 'Retry-After': '3600' }),
      body: JSON.stringify({ error: 'Limite atteinte : max 5 scans/heure. Veuillez patienter.' })
    };
  }

  // ── Premium check ─────────────────────────────────────────────────────────
  var auth = await requirePremium(event);
  if (auth.error) {
    return { statusCode: auth.error.statusCode, headers: headers, body: JSON.stringify({ error: auth.error.msg }) };
  }

  // ── API Key ────────────────────────────────────────────────────────────────
  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Service temporairement indisponible.' }) };
  }

  // ── Request Size Limit (1MB base64 limit) ─────────────────────────────────
  var rawBody = event.body || '';
  var MAX_BODY_SIZE = 1.5 * 1024 * 1024; // 1.5MB raw body (base64 overhead)
  if (rawBody.length > MAX_BODY_SIZE) {
    return { statusCode: 413, headers: headers, body: JSON.stringify({ error: 'Image trop volumineuse. Max 1MB.' }) };
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

  var imageBase64 = body.image;
  var mediaType = body.mediaType || 'image/jpeg';

  if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Champ image manquant ou invalide.' }) };
  }

  // Extraire le type MIME et les données pures si format data URI (data:image/jpeg;base64,...)
  var ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (imageBase64.startsWith('data:')) {
    var dataUriParts = imageBase64.split(',');
    if (dataUriParts.length < 2) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Format data URI invalide.' }) };
    }
    var mimeHeader = dataUriParts[0]; // "data:image/jpeg;base64"
    var mimeMatch = mimeHeader.match(/^data:([^;]+);base64$/);
    if (!mimeMatch) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Format data URI invalide.' }) };
    }
    var extractedMime = mimeMatch[1];
    if (ALLOWED_MEDIA_TYPES.indexOf(extractedMime) !== -1) {
      mediaType = extractedMime;
    }
    imageBase64 = dataUriParts[1];
  }

  // Vérifier la taille de l'image base64 (> 1MB = 1048576 chars avant décodage)
  if (imageBase64.length > 1048576) {
    return { statusCode: 413, headers: headers, body: JSON.stringify({ error: 'Image trop volumineuse. Max 1MB.' }) };
  }

  // Valider le type MIME
  if (ALLOWED_MEDIA_TYPES.indexOf(mediaType) === -1) {
    mediaType = 'image/jpeg';
  }

  try {
    var https = require('https');
    var requestBody = JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: 'Tu es un nutritionniste expert en analyse d\'assiettes. '
            + 'Tu retournes UNIQUEMENT du JSON valide, pas de prose ni markdown. '
            + 'Si plusieurs plats, concatène dans "name" (ex: "Poulet riz brocoli"). '
            + 'Estimations basées sur tables Ciqual / USDA, arrondies à l\'entier.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64
              }
            },
            {
              type: 'text',
              text: 'Identifie ce plat et estime les macronutriments pour la portion VISIBLE sur la photo. '
                  + 'Réponds UNIQUEMENT avec ce JSON (aucun texte avant ou après, aucun markdown ```) : '
                  + '{"name":"...","kcal":X,"p":X,"g":X,"l":X,"portion":"Xg"} '
                  + 'où kcal=calories totales de la portion, p=protéines g, g=glucides g, l=lipides g, '
                  + 'portion="poids estimé en grammes". Si incertain sur la portion, prends 300g par défaut.'
            }
          ]
        }
      ]
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
      console.error('[plate-scan] Erreur API Anthropic status:', response.status);
      return { statusCode: 502, headers: headers, body: JSON.stringify({ error: 'Erreur du service IA. Veuillez réessayer.' }) };
    }

    var replyText = (response.body.content && response.body.content[0] && response.body.content[0].text) || '';
    if (!replyText || replyText.trim().length === 0) {
      console.error('[plate-scan] Réponse IA vide reçue');
      return { statusCode: 502, headers: headers, body: JSON.stringify({ error: 'Réponse IA vide. Veuillez réessayer.' }) };
    }

    // Extraire le JSON de la réponse via comptage de profondeur (robuste aux objets imbriqués)
    var jsonStr = null;
    (function() {
      var depth = 0, start = -1;
      for (var i = 0; i < replyText.length; i++) {
        var ch = replyText[i];
        if (ch === '{') { if (start === -1) start = i; depth++; }
        else if (ch === '}') { depth--; if (depth === 0 && start !== -1) { jsonStr = replyText.substring(start, i + 1); return; } }
      }
    })();
    if (!jsonStr) {
      console.error('[plate-scan] Pas de JSON dans la réponse:', replyText);
      return { statusCode: 502, headers: headers, body: JSON.stringify({ error: 'Réponse IA invalide. Veuillez réessayer.' }) };
    }

    var result;
    try {
      result = JSON.parse(jsonStr);
    } catch(e) {
      console.error('[plate-scan] JSON invalide dans la réponse:', jsonStr);
      return { statusCode: 502, headers: headers, body: JSON.stringify({ error: 'Réponse IA invalide. Veuillez réessayer.' }) };
    }

    // Valider et nettoyer le résultat
    var cleanResult = {
      name: typeof result.name === 'string' ? result.name.slice(0, 100) : 'Plat inconnu',
      kcal: typeof result.kcal === 'number' ? Math.round(result.kcal) : 0,
      p: typeof result.p === 'number' ? Math.round(result.p) : 0,
      g: typeof result.g === 'number' ? Math.round(result.g) : 0,
      l: typeof result.l === 'number' ? Math.round(result.l) : 0,
      portion: typeof result.portion === 'string' ? result.portion.slice(0, 20) : ''
    };

    return { statusCode: 200, headers: headers, body: JSON.stringify(cleanResult) };

  } catch(err) {
    console.error('[plate-scan] Erreur interne:', err.message);
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Erreur serveur. Veuillez réessayer.' }) };
  }
};
