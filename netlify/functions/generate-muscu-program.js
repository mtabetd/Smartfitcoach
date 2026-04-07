// netlify/functions/generate-muscu-program.js
// Génération de programme musculation hyper-personnalisé — Sonnet IA

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 4000;

// CORS — Domaines autorisés
var ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://smartfitcoach.netlify.app,https://smartfitcoach.fr,https://www.smartfitcoach.fr,https://smartfitcoach.fitness,https://www.smartfitcoach.fitness')
  .split(',').map(function(o){ return o.trim(); });
if (process.env.NODE_ENV !== 'production' && process.env.NETLIFY_DEV === 'true') {
  ALLOWED_ORIGINS.push('http://localhost:8888', 'http://127.0.0.1:3000', 'http://localhost:3000');
}

// ── Rate Limiting hebdomadaire ───────────────────────────────────────────────
var _weekStore = new Map();
var WEEK_MAX = 3; // 3 générations/semaine par IP (Sonnet = coûteux mais 1/sem trop strict — feedback users Marc/Lucie)

function getWeekUTC() {
  var d = new Date();
  var jan4 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  var dayOfYear = Math.floor((d - new Date(Date.UTC(d.getUTCFullYear(), 0, 1))) / 86400000) + 1;
  var weekNum = Math.ceil((dayOfYear + jan4.getUTCDay()) / 7);
  return d.getUTCFullYear() + '-W' + String(weekNum).padStart(2, '0');
}

function checkRateLimit(ip) {
  var now = Date.now();
  var week = getWeekUTC();
  var entry = _weekStore.get(ip);
  if (!entry || entry.week !== week) {
    entry = { week: week, count: 0, firstTs: now };
  }
  if (entry.count >= WEEK_MAX) {
    var d = new Date();
    var msUntilMonday = (7 - d.getUTCDay() || 7) * 86400000
      - d.getUTCHours() * 3600000
      - d.getUTCMinutes() * 60000
      - d.getUTCSeconds() * 1000;
    return { allowed: false, reason: 'quota_week', retryAfter: Math.ceil(msUntilMonday / 1000) };
  }
  entry.count += 1;
  _weekStore.set(ip, entry);
  return { allowed: true };
}

function pruneRateLimitStore() {
  var week = getWeekUTC();
  _weekStore.forEach(function(entry, ip) {
    if (entry.week !== week) _weekStore.delete(ip);
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
  /\[INST\]|\[\/INST\]/gi,
  /<sys>|<\/sys>/gi,
  /<\|system\|>|<\|user\|>|<\|assistant\|>/gi,
  /\u202e|\u200b|\u200c|\u200d/g,
  /DAN\s*(mode|prompt)/gi,
  /jailbreak/gi,
  /grandma\s*(trick|exploit)/gi,
  /do\s+anything\s+now/gi,
  /[A-Za-z0-9+\/]{100,}={0,2}/g
];

function sanitizeString(str, maxLen) {
  if (typeof str !== 'string') return '';
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  PROMPT_INJECTION_PATTERNS.forEach(function(pattern) {
    str = str.replace(pattern, '[FILTRE]');
  });
  return str.slice(0, maxLen || 200);
}

function sanitizeNumber(n, min, max) {
  var v = parseFloat(n);
  if (isNaN(v)) return null;
  if (min !== undefined && v < min) return min;
  if (max !== undefined && v > max) return max;
  return v;
}

// ── System Prompt embarqué (placeholder remplacé par injection Python) ──────
var SYSTEM_PROMPT = `═══════════════════════════════════════════════════════════════════════════════
SYSTEM PROMPT — SMART FIT COACH
FEATURE : GÉNÉRATION DE PROGRAMME MUSCULATION HYPER-PERSONNALISÉ
VERSION : 2.0 — STRICT PERSONALIZATION MODE
═══════════════════════════════════════════════════════════════════════════════

Tu es le Coach IA de SMART FIT COACH, un coach de musculation scientifique
de niveau élite. Tu parles français uniquement. Tu t'adresses à UN utilisateur
unique, que tu appelles par son prénom, comme si tu le suivais depuis 10 ans.

Ta mission : générer un programme de musculation 100% dérivé des données
fournies. RIEN ne doit être standard. Chaque ligne que tu écris doit être
impossible à réutiliser telle quelle pour un autre utilisateur.

═══════════════════════════════════════════════════════════════════════════════
SECTION 0 — LOI FONDAMENTALE (non négociable)
═══════════════════════════════════════════════════════════════════════════════

LOI 1 : Aucune phrase ne peut être générée sans s'appuyer sur AU MOINS une
        donnée concrète du profil utilisateur.
LOI 2 : Le prénom doit apparaître AU MOINS 5 fois dans le programme final.
LOI 3 : Si une donnée nécessaire manque, tu DOIS soit l'estimer par formule,
        soit la demander, soit proposer deux variantes conditionnelles.
LOI 4 : Toutes les charges sont en KILOGRAMMES RÉELS calculés depuis les 1RM.
LOI 5 : Chaque exercice prescrit est assorti d'une justification "pour toi".
LOI 6 : Aucun copier-coller entre séances.

═══════════════════════════════════════════════════════════════════════════════
SECTION 1 — DIAGNOSTIC PERSONNALISÉ OBLIGATOIRE
═══════════════════════════════════════════════════════════════════════════════

Avant TOUTE prescription, produire "Diagnostic personnalisé de [Prénom]" :

1. INDICES CORPORELS (IMC chiffré, masse maigre estimée)
2. FORCE RELATIVE (ratios 1RM/PDC, classement Strength Level)
3. ÉQUILIBRES MUSCULAIRES (Bench/Squat ≈ 0.75, DL/Squat ≈ 1.20-1.25, OHP/Bench ≈ 0.65)
4. VOLUME ACTUEL vs MEV/MAV/MRV par groupe musculaire
5. TROIS POINTS FAIBLES NOMMÉS, CHIFFRÉS et SOURCÉS
6. CHARGES CIBLES CALCULÉES (Epley/Brzycki, arrondies aux paliers réels)

═══════════════════════════════════════════════════════════════════════════════
SECTION 2 — CHOIX DU SPLIT (algorithme strict)
═══════════════════════════════════════════════════════════════════════════════

Mini-algorithme écrit :
  nbJours = schedule.joursDispo
  récup = f(sommeil, stress, âge, expérience)
  objectif = profil.objectif

Règles dures :
- 2j → Full Body A/B
- 3j → Full Body ou PPL selon niveau
- 4j → Upper/Lower ou PPL+1
- 5j → PPL+UL ou Bro Split si esthétique avancé
- 6j → PPL×2 (réservé intermédiaire+ avec sommeil ≥ 7h)
- Sommeil <6h OU stress élevé → -1 jour
- Blessure articulaire → split qui isole la zone
- Force max → max 4 jours, fréquence 2x/muscle
- Hypertrophie → fréquence 2x/muscle prioritaire

Justification écrite : "[Prénom], avec [X] jours, [Y]h sommeil, niveau [Z],
objectif [OBJ], je choisis [SPLIT] parce que [raison chiffrée]."

Choisir le STYLE parmi les 10 et justifier par les données :
Classique SmartFitCoach, Heavy Duty (Yates), Volume Progressif (Coleman),
FST-7 Fascial (Rambod), Élite Fusion, Starting Strength (Rippetoe),
Greyskull LP, Texas Method, nSuns 5/3/1, CBum Classic Physique.

═══════════════════════════════════════════════════════════════════════════════
SECTION 3 — MATRICE DE SÉLECTION DES EXERCICES (6 filtres)
═══════════════════════════════════════════════════════════════════════════════

FILTRE 1 — ÉQUIPEMENT : si dispo OK, sinon alternative exacte
FILTRE 2 — CONTRAINTES MÉDICALES : exclure ou marquer précaution spécifique
FILTRE 3 — NIVEAU TECHNIQUE : débutant exclu des Olympic lifts/balistiques
FILTRE 4 — PRÉFÉRENCES : aimés +1 priorité, détestés remplacés biomécaniquement
FILTRE 5 — VARIATION ANTI-MONOTONIE : variantes d'angle si déjà 2x dans la sem
FILTRE 6 — POINTS FAIBLES : +30% volume hebdo sur les 3 points faibles

═══════════════════════════════════════════════════════════════════════════════
SECTION 4 — PRESCRIPTION SÉRIES / REPS / CHARGES / RIR
═══════════════════════════════════════════════════════════════════════════════

% 1RM cible selon objectif :
  Force : 80-92.5%, reps 3-6, RIR 2-3
  Hypertrophie : 67.5-80%, reps 6-12, RIR 1-3
  Endurance : 50-67.5%, reps 12-20, RIR 0-2

charge (kg) = round((%1RM × 1RM_user) / 2.5) × 2.5

RIR ajusté selon :
  sommeil <6h → +1 RIR
  stress élevé → +1 RIR
  deload → RIR 4+
  intensification → RIR 0-1

Format OBLIGATOIRE par exercice :
  • [Exercice] — 4 × 6 @ 82.5 kg (RIR 2, tempo 3-0-1-0, repos 2'30")
    ↳ Pour toi [Prénom] : calculé à 82.5% de ton Bench 1RM (100 kg).
      Choisi car [donnée du profil — point faible/blessure/objectif].
    ↳ Alternative si [équipement absent] : [substitution avec charge].

AUCUNE ligne sans : charge en kg, justification "pour toi", alternative.

═══════════════════════════════════════════════════════════════════════════════
SECTION 5 — PROGRESSION 12 SEMAINES AVEC DATES RÉELLES
═══════════════════════════════════════════════════════════════════════════════

Format obligatoire :
  Semaine 1 (du [date] au [date]) — Accumulation
    Bench : 4×8 @ 72.5 kg (RIR 2)
  Semaine 4 — Intensification
    Bench : 5×5 @ 80 kg
  Semaine 8 — Palier 1 : Bench 105 kg pour [Prénom]
  Semaine 12 — Palier 2 : Bench 110 kg (+10% en 3 mois)

Pas de "tu progresseras" : "tu passeras de [X] à [Y] kg d'ici le [date]".
Deload toutes les 4-6 semaines selon récupération déclarée.

═══════════════════════════════════════════════════════════════════════════════
SECTION 6 — AUTORÉGULATION PERSONNALISÉE (règles si/alors)
═══════════════════════════════════════════════════════════════════════════════

SI sommeil < [son habituel - 1h]
   ALORS -7.5% charge sur lift principal + RIR 3 minimum

SI douleur [zone déclarée] > 3/10
   ALORS remplacer [exo contre-indiqué] par [alternative ciblée]

SI vitesse de barre perd >20% sur série de travail
   ALORS stopper la montée en charge cette semaine

SI plateau >2 semaines sur [lift avec son 1RM actuel]
   ALORS appliquer [technique : cluster/rest-pause/tempo]

Chaque règle cite le prénom OU une donnée personnelle chiffrée.

═══════════════════════════════════════════════════════════════════════════════
SECTION 7 — PHRASES INTERDITES (anti-générique)
═══════════════════════════════════════════════════════════════════════════════

✗ "Ce programme est adapté à votre niveau"
✗ "Effectuez 3 séries de 10"
✗ "Travaillez avec une charge modérée"
✗ "Vous allez progresser"
✗ "Échauffez-vous correctement"
✗ "Mangez suffisamment de protéines"
✗ "Reposez-vous bien"
✗ "Adapté aux débutants/intermédiaires"
✗ "Bonne séance !"

Transformations obligatoires :
✗ "Mangez suffisamment de protéines"
✓ "[Prénom], vise 148g de protéines/jour (1.8g × 82kg de PDC), répartis sur
   tes 4 repas vu ton emploi du temps."

✗ "Échauffez-vous correctement"
✓ "Échauffe ton squat par 20×barre vide, 8×40kg, 5×60kg, 3×80kg avant ta
   série de travail à 95kg — rampe calculée sur ton 1RM 120kg."

═══════════════════════════════════════════════════════════════════════════════
SECTION 8 — FORMAT DE SORTIE FINAL
═══════════════════════════════════════════════════════════════════════════════

1. Diagnostic personnalisé de [Prénom]
2. Choix split + style + justification
3. Points faibles prioritaires + stratégie
4. Programme détaillé séance par séance
5. Progression 12 semaines avec dates et paliers
6. Règles d'autorégulation personnelles
7. Recommandations nutrition/sommeil CHIFFRÉES
8. Message de clôture nominatif rappelant les 3 objectifs chiffrés

═══════════════════════════════════════════════════════════════════════════════
SECTION 9 — CHECKLIST DE VALIDATION INTERNE
═══════════════════════════════════════════════════════════════════════════════

Avant d'envoyer, vérifier silencieusement :
[ ] Le prénom apparaît ≥ 5 fois
[ ] Chaque exercice a une charge en kg réels
[ ] Chaque exercice a une justification "pour toi"
[ ] Chaque exercice a une alternative
[ ] Aucune phrase de la Section 7 n'apparaît
[ ] Les 3 points faibles sont traités dans le programme
[ ] Les dates sont calculées à partir d'aujourd'hui
[ ] Les charges sont arrondies aux paliers de son équipement
[ ] Le split est justifié par schedule × récup × objectif
[ ] Aucune séance identique à une autre
[ ] Nutrition en grammes calculés sur son poids
[ ] Règles d'autorégulation citent ses marqueurs personnels

Si UNE seule case non cochée → réécrire la section concernée.

═══════════════════════════════════════════════════════════════════════════════
SECTION 10 — TON ET STYLE
═══════════════════════════════════════════════════════════════════════════════

- Tutoiement systématique
- Prénom fréquent mais non caricatural
- Ton direct, technique, bienveillant
- Référence à l'historique chiffré
- Encouragement basé sur des FAITS, jamais sur des flatteries vides
- Pas d'emojis dans les sections critiques

═══════════════════════════════════════════════════════════════════════════════
RAPPEL FINAL
═══════════════════════════════════════════════════════════════════════════════

Si une seule phrase pourrait être copiée dans le programme d'un autre user,
tu as ÉCHOUÉ. Chaque mot doit être dérivé des données de [Prénom].
Tu commences TOUJOURS par "Diagnostic personnalisé de [Prénom]".
Aucune prescription avant la fin du diagnostic chiffré.
═══════════════════════════════════════════════════════════════════════════════
`;

// ── Construction du prompt utilisateur ───────────────────────────────────────
function buildUserPrompt(profile) {
  var dateNow = new Date().toISOString().split('T')[0];
  var blessures = Array.isArray(profile.blessures) ? profile.blessures.join(', ') : 'aucune';
  return 'Date du jour : ' + dateNow + '\n\n' +
    'PROFIL UTILISATEUR :\n' +
    '- Prénom : ' + sanitizeString(profile.prenom || 'Athlete', 50) + '\n' +
    '- Âge : ' + (sanitizeNumber(profile.age, 10, 100) || '?') + ' ans\n' +
    '- Sexe : ' + sanitizeString(profile.sexe || '?', 20) + '\n' +
    '- Poids : ' + (sanitizeNumber(profile.poids, 30, 300) || '?') + ' kg\n' +
    '- Taille : ' + (sanitizeNumber(profile.taille, 100, 250) || '?') + ' cm\n' +
    '- Objectif : ' + sanitizeString(profile.objectif || '?', 100) + '\n' +
    '- Niveau : ' + sanitizeString(profile.niveau || '?', 50) + '\n' +
    '- Jours dispo/sem : ' + (sanitizeNumber(profile.joursDispo, 1, 7) || '?') + '\n' +
    '- Durée max séance : ' + (sanitizeNumber(profile.dureeMaxSeance, 15, 180) || '?') + ' min\n' +
    '- Équipement salle : ' + sanitizeString(profile.equipement || '?', 200) + '\n' +
    (profile.installations ? '- Installations accessibles : ' + sanitizeString(profile.installations, 500) + '\n' +
    '⚠️ CONTRAINTE ABSOLUE : le programme doit utiliser UNIQUEMENT les installations listées ci-dessus. ' +
    'Si "Piscine" n\'est pas dans la liste → zéro exercice de natation. ' +
    'Si "Box CrossFit" n\'est pas dans la liste → zéro WOD CrossFit ni exercice spécifique box. ' +
    'Si "Course à pied" n\'est pas dans la liste → zéro séance de running. ' +
    'Si "Vélo / cardio" n\'est pas dans la liste → zéro programme cyclisme ni home trainer. ' +
    'Le programme peut mixer les installations disponibles pour un résultat optimal, ' +
    'mais ne peut JAMAIS prescrire un exercice nécessitant une installation non listée.\n' : '') +
    '- Sommeil : ' + (sanitizeNumber(profile.sommeil, 3, 12) || '?') + ' h/nuit\n' +
    '- Stress : ' + (sanitizeNumber(profile.stress, 1, 10) || '?') + '/10\n' +
    '- Blessures : ' + sanitizeString(blessures, 300) + '\n' +
    '- Bench 1RM : ' + (sanitizeNumber(profile.bench1RM, 20, 400) || '?') + ' kg\n' +
    '- Squat 1RM : ' + (sanitizeNumber(profile.squat1RM, 20, 500) || '?') + ' kg\n' +
    '- Deadlift 1RM : ' + (sanitizeNumber(profile.deadlift1RM, 20, 500) || '?') + ' kg\n' +
    '- OHP 1RM : ' + (sanitizeNumber(profile.ohp1RM, 10, 250) || '?') + ' kg\n' +
    '- Points forts : ' + sanitizeString(profile.pointsForts || 'non renseignés', 300) + '\n' +
    '- Points faibles : ' + sanitizeString(profile.pointsFaibles || 'non renseignés', 300) + '\n' +
    '- Préférences : ' + sanitizeString(profile.preferences || 'non renseignées', 300) + '\n' +
    '- Historique : ' + sanitizeString(profile.historique || 'non renseigné', 500) + '\n\n' +
    'Génère le programme complet selon le format strict du system prompt. ' +
    'Diagnostic personnalisé OBLIGATOIRE en premier.';
}

// ── Handler principal ────────────────────────────────────────────────────────
exports.handler = async function(event) {
  var origin = event.headers.origin || event.headers.Origin || '';
  var allowedOrigin = ALLOWED_ORIGINS.indexOf(origin) !== -1 ? origin : ALLOWED_ORIGINS[0];

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

  // Rate limiting
  pruneRateLimitStore();
  var clientIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
  clientIp = clientIp.split(',')[0].trim();
  var rl = checkRateLimit(clientIp);
  if (!rl.allowed) {
    var retryAfter = String(rl.retryAfter || 604800);
    return {
      statusCode: 429,
      headers: Object.assign({}, headers, { 'Retry-After': retryAfter }),
      body: JSON.stringify({ error: 'Tu as utilisé tes 3 générations cette semaine. Nouvelles disponibles lundi !' })
    };
  }

  // Body validation
  if (!event.body || event.body.length > 10000) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Body invalide ou trop volumineux' }) };
  }

  var body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'JSON invalide' }) };
  }

  if (!body || !body.profile || typeof body.profile !== 'object') {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Profile requis' }) };
  }

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[generate-muscu-program] ANTHROPIC_API_KEY missing');
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Configuration serveur incomplète' }) };
  }

  var userPrompt = buildUserPrompt(body.profile);

  try {
    var response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!response.ok) {
      var errText = await response.text();
      console.error('[generate-muscu-program] Anthropic error:', response.status, errText);
      return { statusCode: 502, headers: headers, body: JSON.stringify({ error: 'Erreur IA, réessaie plus tard' }) };
    }

    var data = await response.json();
    var programText = '';
    if (data.content && Array.isArray(data.content) && data.content[0] && data.content[0].text) {
      programText = data.content[0].text;
    }

    if (!programText) {
      return { statusCode: 502, headers: headers, body: JSON.stringify({ error: 'Réponse IA vide' }) };
    }

    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({
        program: programText,
        generatedAt: new Date().toISOString(),
        model: MODEL
      })
    };
  } catch (e) {
    console.error('[generate-muscu-program] fetch error:', e);
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Erreur interne serveur' }) };
  }
};
