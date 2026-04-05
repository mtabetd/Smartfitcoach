// netlify/functions/ai-coach.js
// Proxy sécurisé vers l'API Anthropic — la clé API reste côté serveur

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 1024;

exports.handler = async function(event, context) {
  // CORS headers
  var headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY non configurée dans les variables Netlify.' })
    };
  }

  var body;
  try {
    body = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Corps de requête invalide' }) };
  }

  var userMessages = body.messages || [];
  var userContext = body.context || {};

  // Construire le system prompt avec le contexte utilisateur
  var systemPrompt = buildSystemPrompt(userContext);

  // Limiter l'historique à 10 messages pour maîtriser les coûts
  var messages = userMessages.slice(-10);

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
      var errMsg = (response.body && response.body.error && response.body.error.message) || 'Erreur API Anthropic';
      return { statusCode: response.status, headers: headers, body: JSON.stringify({ error: errMsg }) };
    }

    var replyText = response.body.content && response.body.content[0] && response.body.content[0].text || '';
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({ reply: replyText })
    };

  } catch(err) {
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({ error: 'Erreur serveur : ' + (err.message || 'inconnue') })
    };
  }
};

function buildSystemPrompt(ctx) {
  var lines = [
    'Tu es le coach personnel IA de SmartFitCoach — expert en nutrition sportive et programmation athlétique.',
    'Tu réponds TOUJOURS en français. Sois concis, précis, actionnable. Maximum 3-4 paragraphes.',
    'Tu t\'adresses directement à l\'utilisateur (tutoiement). Ton style : bienveillant mais direct, comme un vrai coach.',
    '',
    '## PROFIL UTILISATEUR'
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
    if (ctx.allergies && ctx.allergies.length) lines.push('Allergies : ' + ctx.allergies.join(', '));
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
  lines.push('## INSTRUCTIONS');
  lines.push('- Si l\'utilisateur parle de charges, suggère une progression +2.5kg ou +5kg selon l\'exercice');
  lines.push('- Si l\'état de forme est mauvais (sommeil < 3, muscles douloureux), recommande récupération');
  lines.push('- Pour la nutrition, calcule et commente les macros si données disponibles');
  lines.push('- Cite des sources concrètes quand pertinent (ex: règle des 10%, méthode Friel, RPE)');
  lines.push('- Ne jamais inventer des données que tu n\'as pas. Si info manquante, demande-la.');

  return lines.join('\n');
}
