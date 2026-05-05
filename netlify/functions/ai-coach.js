// netlify/functions/ai-coach.js
// Proxy sécurisé vers l'API Anthropic — la clé API reste côté serveur

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const { createClient } = require('@supabase/supabase-js');
const { requirePremium } = require('./_user-auth');
// UPGRADE 2026-04 : Haiku → Sonnet 4.6 pour coach adaptatif avec raisonnement fin
// (ajustements charges ISSN/ACSM, interprétation RPE + cycle + wellness).
// Rate limit déjà strict (10/h, 30/j par IP) → coût maîtrisé.
const MODEL = 'claude-sonnet-4-6';
// 650 tokens: Sonnet 4.6 ~35-45 tok/s → ~15-19s nominal, well within 25s client timeout.
const MAX_TOKENS = 650;

// Domaines autorisés pour CORS
var ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://smartfitcoach.netlify.app,https://smartfitcoach.fr,https://www.smartfitcoach.fr,https://smartfitcoach.fitness,https://www.smartfitcoach.fitness')
  .split(',').map(function(o){ return o.trim(); });
// Localhost pour dev
ALLOWED_ORIGINS.push('http://localhost:8888', 'http://127.0.0.1:3000', 'http://localhost:3000');

function isAllowedOrigin(origin) {
  if (!origin) return true; // same-origin requests (pas de header Origin)
  if (ALLOWED_ORIGINS.indexOf(origin) !== -1) return true;
  // Only smartfitcoach deploy previews and branch deploys. The broader
  // ^https://[a-z0-9-]+\.netlify\.app$ regex would accept any attacker-
  // owned netlify.app subdomain and enable API key abuse.
  if (/^https:\/\/[a-z0-9-]+--smartfitcoach\.netlify\.app$/.test(origin)) return true;
  return false;
}

// ── Rate Limiting ────────────────────────────────────────────────────────────
// Primaire  : Supabase table `rate_limits` (persistant cross-cold-starts).
// Fallback  : Maps en mémoire (si Supabase indisponible → pas de blocage user).
// Migration : supabase/migrations/20260422_rate_limits.sql

var HOUR_WINDOW_MS = 3600000; // 1 heure
var HOUR_MAX = 10;             // max 10 req/heure par IP
var DAY_MAX  = 30;             // max 30 req/jour par IP

// ── Fallback in-memory (inchangé) ────────────────────────────────────────────
var _hourStore = new Map();
var _dayStore  = new Map();

function getTodayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function checkRateLimitMemory(ip) {
  var now   = Date.now();
  var today = getTodayUTC();
  var dayEntry = _dayStore.get(ip);
  if (!dayEntry || dayEntry.date !== today) dayEntry = { date: today, count: 0 };
  if (dayEntry.count >= DAY_MAX) return { allowed: false, reason: 'quota_day', hourRemaining: 0, dayRemaining: 0 };
  var hourList = (_hourStore.get(ip) || []).filter(function(t) { return now - t < HOUR_WINDOW_MS; });
  if (hourList.length >= HOUR_MAX) return { allowed: false, reason: 'quota_hour', hourRemaining: 0, dayRemaining: Math.max(0, DAY_MAX - dayEntry.count) };
  hourList.push(now);
  _hourStore.set(ip, hourList);
  dayEntry.count += 1;
  _dayStore.set(ip, dayEntry);
  return { allowed: true, hourRemaining: Math.max(0, HOUR_MAX - hourList.length), dayRemaining: Math.max(0, DAY_MAX - dayEntry.count) };
}

function pruneStores() {
  var now   = Date.now();
  var today = getTodayUTC();
  _hourStore.forEach(function(list, ip) {
    var f = list.filter(function(t) { return now - t < HOUR_WINDOW_MS; });
    if (f.length === 0) _hourStore.delete(ip); else _hourStore.set(ip, f);
  });
  _dayStore.forEach(function(entry, ip) {
    if (entry.date !== today) _dayStore.delete(ip);
  });
}

// ── Supabase client (lazy, module-level pour réutilisation entre invocations chaudes) ──
var _supabaseRl = null;
function getSupabaseRl() {
  if (_supabaseRl) return _supabaseRl;
  var url = process.env.SUPABASE_URL;
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  try {
    _supabaseRl = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  } catch(e) {
    console.warn('[ai-coach] Supabase client init failed:', e.message);
    return null;
  }
  return _supabaseRl;
}

// ── Rate limiting persistant via Supabase ─────────────────────────────────────
// Retourne un objet { allowed, reason?, hourRemaining, dayRemaining }
// ou null si Supabase est indisponible (→ caller utilise checkRateLimitMemory).
async function checkRateLimitDb(ip) {
  var db = getSupabaseRl();
  if (!db) return null;

  try {
    var now = new Date();

    // Lire l'entrée courante
    var sel = await db
      .from('rate_limits')
      .select('hour_count, hour_reset_at, day_count, day_reset_at')
      .eq('ip', ip)
      .maybeSingle();

    if (sel.error) throw sel.error;

    var hourCount, dayCount, hourResetAt, dayResetAt;

    if (!sel.data) {
      // Première requête de cette IP : on initialise
      hourCount   = 0;
      dayCount    = 0;
      hourResetAt = new Date(now.getTime() + HOUR_WINDOW_MS).toISOString();
      dayResetAt  = new Date(now.getTime() + 86400000).toISOString();
    } else {
      var row         = sel.data;
      var hourExpired = now >= new Date(row.hour_reset_at);
      var dayExpired  = now >= new Date(row.day_reset_at);
      hourCount   = hourExpired ? 0 : row.hour_count;
      dayCount    = dayExpired  ? 0 : row.day_count;
      hourResetAt = hourExpired ? new Date(now.getTime() + HOUR_WINDOW_MS).toISOString() : row.hour_reset_at;
      dayResetAt  = dayExpired  ? new Date(now.getTime() + 86400000).toISOString()       : row.day_reset_at;

      // Vérifier les limites AVANT d'incrémenter
      if (hourCount >= HOUR_MAX) {
        return { allowed: false, reason: 'quota_hour', hourRemaining: 0, dayRemaining: Math.max(0, DAY_MAX - dayCount) };
      }
      if (dayCount >= DAY_MAX) {
        return { allowed: false, reason: 'quota_day', hourRemaining: Math.max(0, HOUR_MAX - hourCount), dayRemaining: 0 };
      }
    }

    var newHour = hourCount + 1;
    var newDay  = dayCount  + 1;

    // Écriture fire-and-forget : si l'upsert échoue, la requête passe quand même.
    // Pire cas : 1-2 requêtes supplémentaires en cas d'erreur transitoire. Acceptable.
    db.from('rate_limits').upsert({
      ip:            ip,
      hour_count:    newHour,
      hour_reset_at: hourResetAt,
      day_count:     newDay,
      day_reset_at:  dayResetAt,
      updated_at:    now.toISOString()
    }, { onConflict: 'ip' }).then(function(r) {
      if (r.error) console.warn('[ai-coach] rate_limits upsert error:', r.error.message);
    });

    return {
      allowed:        true,
      hourRemaining:  Math.max(0, HOUR_MAX - newHour),
      dayRemaining:   Math.max(0, DAY_MAX  - newDay)
    };

  } catch(e) {
    console.warn('[ai-coach] checkRateLimitDb failed, using in-memory fallback:', e.message);
    return null; // signal au caller d'utiliser le fallback mémoire
  }
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
    'nextSessionScheduled', 'cyclePhase',
    // POLISH 2026-04 (INSIGHTS) : synthèse hebdo + patterns détectés côté client
    'weekInsights',
    // P3 ELITE : langue de réponse demandée par le client
    'lang'
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
    else if (field === 'weekInsights') {
      // { sessions, sleepAvg, rpeAvg, patterns:[{id, severity, label}] }
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        var wi = {};
        var s = parseFloat(val.sessions);
        if (!isNaN(s) && isFinite(s)) wi.sessions = Math.round(s);
        var sa = parseFloat(val.sleepAvg);
        if (!isNaN(sa) && isFinite(sa) && sa >= 0 && sa <= 5) wi.sleepAvg = Math.round(sa * 10) / 10;
        var ra = parseFloat(val.rpeAvg);
        if (!isNaN(ra) && isFinite(ra) && ra >= 0 && ra <= 10) wi.rpeAvg = Math.round(ra * 10) / 10;
        if (Array.isArray(val.patterns)) {
          wi.patterns = val.patterns.slice(0, 3).map(function(p) {
            if (!p || typeof p !== 'object') return null;
            var pp = {};
            if (p.id) pp.id = sanitizeString(String(p.id), 30);
            if (p.severity) pp.severity = sanitizeString(String(p.severity), 10);
            if (p.label) pp.label = sanitizeString(String(p.label), 120);
            return pp;
          }).filter(function(x) { return x && x.id; });
        }
        safe.weekInsights = wi;
      }
    }
    else if (field === 'lang') {
      if (typeof val === 'string' && (val === 'fr' || val === 'en')) safe.lang = val;
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
  var clientIp = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
  clientIp = clientIp.split(',')[0].trim();

  var rl = await checkRateLimitDb(clientIp);
  if (!rl) {
    // Supabase indisponible → fallback in-memory (jamais de blocage utilisateur par erreur)
    pruneStores();
    rl = checkRateLimitMemory(clientIp);
  }
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
  var systemPrompt = (userContext.lang === 'en') ? buildSystemPromptEN(userContext) : buildSystemPrompt(userContext);

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
    // POLISH 2026-04 (V1.3) : inclure les quotas restants pour affichage UI client.
    return { statusCode: 200, headers: headers, body: JSON.stringify({
      reply: replyText,
      remaining: { hourRemaining: rl.hourRemaining, dayRemaining: rl.dayRemaining }
    })};

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

  // POLISH 2026-04 (INSIGHTS) : insights hebdo + patterns détectés côté client.
  // Permet à l'IA de référencer spontanément les signaux forts (fatigue, progression).
  if (ctx.weekInsights) {
    var wi2 = ctx.weekInsights;
    var wiParts = [];
    if (typeof wi2.sessions === 'number') wiParts.push(wi2.sessions + ' séances');
    if (typeof wi2.sleepAvg === 'number') wiParts.push('sommeil moyen ' + wi2.sleepAvg + '/5');
    if (typeof wi2.rpeAvg === 'number') wiParts.push('RPE moyen ' + wi2.rpeAvg + '/10');
    if (wiParts.length) lines.push('INSIGHTS 7J: ' + wiParts.join(' | '));
    if (Array.isArray(wi2.patterns) && wi2.patterns.length) {
      wi2.patterns.forEach(function(p) {
        var sev = p.severity === 'alert' ? '⚠️' : (p.severity === 'warning' ? '⚡' : 'ℹ️');
        lines.push(sev + ' PATTERN (' + p.id + ') : ' + (p.label || ''));
      });
    }
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
    // Si patterns détectés, l'IA doit les adresser proactivement sans attendre
    // que l'user pose la question (sauf si user change de sujet clairement).
    if (ctx.weekInsights && Array.isArray(ctx.weekInsights.patterns) && ctx.weekInsights.patterns.length) {
      lines.push('- Si un PATTERN est signalé ci-dessus (alert/warning), l\'intégrer naturellement dans ta réponse sans paraître alarmiste.');
    }
  }

  return lines.join('\n');
}

function buildSystemPromptEN(ctx) {
  var name = ctx.prenom || 'you';
  var lines = [
    'You are the private sport/nutrition coach for ' + name + ' on SmartFitCoach.',
    'RULES: always reply in English, use ' + name + '\'s first name, be concise (2-3 paragraphs max).',
    'Format: [Direct answer] / [Context from profile] / [1-3 specific actions with numbers].',
    'You answer ONLY sport and nutrition questions. Off-topic → "I\'m here for your sport and nutrition, ' + name + '."',
    'Base advice on the profile below. If data is missing, ask for it.',
    ''
  ];

  var profile = [];
  if (ctx.prenom) profile.push('Name:' + ctx.prenom);
  if (ctx.sex) profile.push('Sex:' + ctx.sex);
  if (ctx.age) profile.push('Age:' + ctx.age);
  if (ctx.weight) profile.push('Weight:' + ctx.weight + 'kg');
  if (ctx.height) profile.push('Height:' + ctx.height + 'cm');
  if (ctx.goal) profile.push('Goal:' + ctx.goal);
  if (ctx.activity) profile.push('Activity:' + ctx.activity);
  if (profile.length) lines.push('PROFILE: ' + profile.join(' | '));

  if (ctx.sportType) {
    var sport = ['Sport:' + ctx.sportType];
    if (ctx.sportLevel) sport.push('Level:' + ctx.sportLevel);
    if (ctx.sportDays) sport.push('Days/wk:' + ctx.sportDays);
    if (ctx.crossfitWeek) sport.push('CrossFit wk:' + ctx.crossfitWeek);
    if (ctx.triathlonGoal) sport.push('Tri goal:' + ctx.triathlonGoal);
    if (ctx.triathlonFTP) sport.push('FTP:' + ctx.triathlonFTP + 'W');
    if (ctx.hyroxLevel) sport.push('Hyrox:' + ctx.hyroxLevel);
    if (ctx.runningGoal) sport.push('Run goal:' + ctx.runningGoal);
    if (ctx.cyclingGoal) sport.push('Cycling goal:' + ctx.cyclingGoal);
    lines.push('SPORT: ' + sport.join(' | '));
  }

  if (ctx.wellness) {
    var ww = ctx.wellness;
    lines.push('WELLNESS: sleep=' + ww.sleep + '/5 muscles=' + ww.muscles + ' energy=' + ww.energy + (ww.adaptation ? ' → ' + ww.adaptation : ''));
  }

  if (ctx.todayNutrition) {
    var n = ctx.todayNutrition;
    var meals = [];
    if (n.breakfast) meals.push('Breakfast:' + n.breakfast);
    if (n.lunch) meals.push('Lunch:' + n.lunch);
    if (n.snack) meals.push('Snack:' + n.snack);
    if (n.dinner) meals.push('Dinner:' + n.dinner);
    if (n.totalKcal) meals.push('Total:' + n.totalKcal + 'kcal');
    if (meals.length) lines.push("TODAY'S NUTRITION: " + meals.join(' | '));
  }

  var constraints = [];
  if (ctx.regime) constraints.push('Diet:' + ctx.regime);
  if (Array.isArray(ctx.allergies) && ctx.allergies.length) constraints.push('Allergies:' + ctx.allergies.join(','));
  if (Array.isArray(ctx.intolerances) && ctx.intolerances.length) constraints.push('Intolerances:' + ctx.intolerances.join(','));
  if (ctx.halal) constraints.push('Halal');
  if (ctx.excluded) constraints.push('Exclusions:' + ctx.excluded);
  if (ctx.mealsPerDay) constraints.push('Meals/day:' + ctx.mealsPerDay);
  if (constraints.length) lines.push('CONSTRAINTS: ' + constraints.join(' | '));

  var health = [];
  if (ctx.pregnant) {
    if (ctx.pregnancyWeek) {
      var pw = Number(ctx.pregnancyWeek);
      var trim = pw <= 12 ? 'T1' : pw <= 26 ? 'T2' : 'T3';
      health.push('⚠️ PREGNANT week ' + pw + ' (' + trim + ')');
    } else {
      health.push('⚠️ PREGNANT');
    }
  }
  if (ctx.breastfeeding) health.push('⚠️ BREASTFEEDING');
  if (ctx.cycleTracking && ctx.cycleLength) health.push('Cycle:' + ctx.cycleLength + 'd');
  if (health.length) {
    lines.push('HEALTH: ' + health.join(' | '));
    if (ctx.pregnant) {
      var _trimTextEN = '';
      if (ctx.pregnancyWeek) {
        var _pw = Number(ctx.pregnancyWeek);
        if (_pw <= 12) _trimTextEN = 'T1: no caloric surplus. Avoid alcohol, raw meat, high-mercury fish.';
        else if (_pw <= 26) _trimTextEN = 'T2: +340 kcal/day (ACOG 2022). Calcium 1000mg, iron 27mg, folate 600µg.';
        else _trimTextEN = 'T3: +450 kcal/day (ACOG 2022). Protein 71g/day, moderate activity OK.';
      } else {
        _trimTextEN = 'Ask the trimester before advising caloric intake.';
      }
      lines.push('⚠️ CLINICAL SAFETY (PREGNANCY): no caloric deficit, no intermittent fasting, no unsanctioned supplements. ' + _trimTextEN);
    }
    if (ctx.breastfeeding) {
      lines.push('⚠️ BREASTFEEDING SAFETY: +450 kcal/day (ACOG 2022). Enhanced hydration (3L/day). Limit caffeine <300mg/day, avoid alcohol.');
    }
  }

  var medicalNotes = [];
  if (Array.isArray(ctx.medical) && ctx.medical.length) medicalNotes.push('Medical:' + ctx.medical.join(','));
  if (ctx.muscuMedical && typeof ctx.muscuMedical === 'object') {
    var muscuLimits = Object.keys(ctx.muscuMedical).filter(function(k) { return ctx.muscuMedical[k]; });
    if (muscuLimits.length) medicalNotes.push('Restrictions:' + muscuLimits.join(','));
  }
  if (medicalNotes.length) lines.push('LIMITATIONS: ' + medicalNotes.join(' | '));

  var sportContext = [];
  if (Array.isArray(ctx.trainingDaysSelected) && ctx.trainingDaysSelected.length) {
    var dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    sportContext.push('Training days:' + ctx.trainingDaysSelected.map(function(i) { return dayNames[i] || i; }).join(','));
  }
  if (ctx.trainTime) sportContext.push('Session time:' + ctx.trainTime);
  if (sportContext.length) lines.push('SCHEDULE: ' + sportContext.join(' | '));

  if (ctx.streak && ctx.streak > 0) {
    lines.push('STREAK: ' + ctx.streak + ' consecutive day' + (ctx.streak > 1 ? 's' : '') + ' (mention if relevant for motivation)');
  }

  if (ctx.muscuWeights) {
    var wobj = ctx.muscuWeights;
    var wlist = Object.keys(wobj).filter(function(k) { return wobj[k]; }).map(function(k) { return k + ':' + wobj[k] + 'kg'; });
    if (wlist.length) lines.push('WORKING WEIGHTS: ' + wlist.join(' | '));
  }

  if (ctx.cyclePhase && ctx.cyclePhase.phase) {
    var cp = ctx.cyclePhase;
    var cpLine = 'CYCLE: phase=' + cp.phase;
    if (cp.dayInCycle) cpLine += ' (D' + cp.dayInCycle + ')';
    if (cp.intensityFactor) cpLine += ' — recommended intensity factor ×' + cp.intensityFactor;
    lines.push(cpLine);
  }

  if (ctx.lastSessionFeedback && ctx.lastSessionFeedback.date) {
    var lsf = ctx.lastSessionFeedback;
    var lsfParts = ['Date:' + lsf.date];
    if (lsf.sessionId) lsfParts.push('ID:' + lsf.sessionId);
    if (typeof lsf.rpe === 'number') lsfParts.push('RPE:' + lsf.rpe + '/10');
    if (lsf.feeling) lsfParts.push('Feeling:' + lsf.feeling);
    if (lsf.pain) lsfParts.push('⚠️ Pain:' + lsf.pain);
    if (lsf.chargeActual && Object.keys(lsf.chargeActual).length) {
      var chList = Object.keys(lsf.chargeActual).slice(0, 6).map(function(k) { return k + ':' + lsf.chargeActual[k] + 'kg'; });
      lsfParts.push('Actual loads:' + chList.join(','));
    }
    if (lsf.notes) lsfParts.push('Notes:' + lsf.notes);
    lines.push('LAST SESSION: ' + lsfParts.join(' | '));
  }

  if (ctx.weekPerformance) {
    var wperf = ctx.weekPerformance;
    var wpParts = [];
    if (typeof wperf.sessionsCount === 'number') wpParts.push('Sessions:' + wperf.sessionsCount);
    if (typeof wperf.rpeAvg === 'number') wpParts.push('Avg RPE:' + wperf.rpeAvg + '/10');
    if (typeof wperf.chargeProgressionPct === 'number') {
      var sign2 = wperf.chargeProgressionPct >= 0 ? '+' : '';
      wpParts.push('Load progression:' + sign2 + wperf.chargeProgressionPct + '%');
    }
    if (wperf.lastPain) wpParts.push('⚠️ Recent pain:' + wperf.lastPain);
    if (wpParts.length) lines.push('WEEK PERFORMANCE: ' + wpParts.join(' | '));
  }

  if (ctx.nextSessionScheduled && ctx.nextSessionScheduled.date) {
    var nss = ctx.nextSessionScheduled;
    var nssParts = ['Date:' + nss.date];
    if (nss.dayLabel) nssParts.push(nss.dayLabel);
    if (nss.type) nssParts.push(nss.type);
    lines.push('NEXT SESSION: ' + nssParts.join(' | '));
  }

  if (ctx.weekInsights) {
    var wi2 = ctx.weekInsights;
    var wiParts = [];
    if (typeof wi2.sessions === 'number') wiParts.push(wi2.sessions + ' sessions');
    if (typeof wi2.sleepAvg === 'number') wiParts.push('avg sleep ' + wi2.sleepAvg + '/5');
    if (typeof wi2.rpeAvg === 'number') wiParts.push('avg RPE ' + wi2.rpeAvg + '/10');
    if (wiParts.length) lines.push('WEEK INSIGHTS: ' + wiParts.join(' | '));
    if (Array.isArray(wi2.patterns) && wi2.patterns.length) {
      wi2.patterns.forEach(function(p) {
        var sev = p.severity === 'alert' ? '⚠️' : (p.severity === 'warning' ? '⚡' : 'ℹ️');
        lines.push(sev + ' PATTERN (' + p.id + '): ' + (p.label || ''));
      });
    }
  }

  if (ctx.lastSessionFeedback || ctx.weekPerformance || ctx.sportType) {
    lines.push('');
    lines.push('ADAPTIVE COACHING RULES (ISSN 2017 / ACSM):');
    lines.push('- If LAST SESSION is missing and user mentions their session → ask for actual loads + RPE + feeling.');
    lines.push('- RPE ≤ 6 → suggest +2.5 to 5% load on compound lifts (squat, bench, deadlift, OHP).');
    lines.push('- RPE 7-8 → maintain volume, focus on technique and tempo.');
    lines.push('- RPE ≥ 9 or pain reported → propose deload -10% volume or substitute exercise.');
    lines.push('- Max volume progression: +10%/week (ACSM). Beyond that → injury risk.');
    if (ctx.cyclePhase && ctx.cyclePhase.phase) {
      lines.push('- Current cycle: adapt intensity to factor above. Menstruation (D1-5) = reduced load OK, Follicular (D6-13) = peak performance, Luteal (D17-28) = moderate volume.');
    }
    if (ctx.pregnant) {
      lines.push('- Pregnancy: no Valsalva, no maximal loads, moderate intensity, extra hydration.');
    }
    lines.push('- Always quantify adjustments (e.g. "move from 60 to 62.5kg on bench") rather than vague advice.');
    if (ctx.weekInsights && Array.isArray(ctx.weekInsights.patterns) && ctx.weekInsights.patterns.length) {
      lines.push('- If a PATTERN is flagged above (alert/warning), address it naturally without being alarmist.');
    }
  }

  return lines.join('\n');
}
