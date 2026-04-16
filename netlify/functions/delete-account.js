// netlify/functions/delete-account.js
// Suppression de compte GDPR — côté serveur avec service_role key
// L'utilisateur envoie son JWT d'authentification, la function vérifie
// l'identité puis supprime le compte et toutes les données associées.

const { createClient } = require('@supabase/supabase-js');

var ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://smartfitcoach.netlify.app,https://smartfitcoach.fr,https://www.smartfitcoach.fr,https://smartfitcoach.fitness,https://www.smartfitcoach.fitness')
  .split(',').map(function(o){ return o.trim(); });
ALLOWED_ORIGINS.push('http://localhost:8888', 'http://127.0.0.1:3000', 'http://localhost:3000');

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.indexOf(origin) !== -1) return true;
  if (/^https:\/\/[a-z0-9-]+--smartfitcoach\.netlify\.app$/.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.netlify\.app$/.test(origin)) return true;
  return false;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
}

exports.handler = async function(event) {
  var origin = event.headers.origin || event.headers.Origin || '';

  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(origin), body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!isAllowedOrigin(origin)) {
    return { statusCode: 403, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Forbidden' }) };
  }

  // Vérifier les variables d'environnement
  var supabaseUrl = process.env.SUPABASE_URL;
  var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return { statusCode: 500, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Server configuration error' }) };
  }

  // Extraire le JWT de l'Authorization header
  var authHeader = event.headers.authorization || event.headers.Authorization || '';
  var token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { statusCode: 401, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Missing authorization token' }) };
  }

  try {
    // Client admin avec service_role key
    var adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Vérifier le JWT pour obtenir l'user ID (sécurité : on ne fait pas confiance au body)
    var { data: userData, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !userData || !userData.user) {
      return { statusCode: 401, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Invalid token' }) };
    }

    var userId = userData.user.id;

    // Supprimer les données utilisateur de TOUTES les tables
    var tables = ['profiles', 'weight_history', 'sport_sessions', 'muscu_session_logs',
                  'food_journal', 'water_log', 'badges', 'streaks', 'meal_plans'];
    for (var i = 0; i < tables.length; i++) {
      try {
        await adminClient.from(tables[i]).delete().eq('user_id', userId);
      } catch(e) {
        // Table peut ne pas exister — continuer
        console.warn('[delete-account] table ' + tables[i] + ' skip:', e.message);
      }
    }

    // Supprimer le compte auth (irréversible)
    var { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      return { statusCode: 500, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Failed to delete auth account: ' + deleteError.message }) };
    }

    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: JSON.stringify({ success: true, message: 'Account and all associated data deleted.' })
    };

  } catch(e) {
    console.error('[delete-account] Error:', e);
    return { statusCode: 500, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
