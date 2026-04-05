// netlify/functions/body-analysis.js
// Analyse corporelle par vision IA — clé API côté serveur uniquement

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 4096;

exports.handler = async function(event, context) {
  var headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: headers, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY non configurée.' }) };
  }

  var body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Corps de requête invalide' }) }; }

  var images = body.images || [];
  var ctx = body.context || {};
  var exercisesDb = body.exercisesDb || [];

  if (!images.length || images.length < 1) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Au moins une photo est requise.' }) };
  }

  // Valider que les images sont des base64 valides
  var MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB après décodage
  for (var i = 0; i < images.length; i++) {
    var img = images[i];
    if (typeof img !== 'string' || img.length < 100) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Image invalide.' }) };
    }
    // Vérifier taille estimée (base64 est ~1.33x la taille brute)
    var sizeEstimate = (img.length * 3) / 4;
    if (sizeEstimate > MAX_IMAGE_SIZE) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Image trop volumineuse (max 5MB).' }) };
    }
  }

  var prenom = ctx.prenom || 'toi';
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
        var mimeMatch = parts[0].match(/data:([^;]+);/);
        if (mimeMatch) mediaType = mimeMatch[1];
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
      var errMsg = (response.body && response.body.error && response.body.error.message) || 'Erreur API';
      return { statusCode: response.status, headers: headers, body: JSON.stringify({ error: errMsg }) };
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
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Erreur serveur : ' + (err.message || 'inconnue') }) };
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
