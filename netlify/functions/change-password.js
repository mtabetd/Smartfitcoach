// netlify/functions/change-password.js
// Authenticated password change with server-side strength enforcement.
// Requires a valid Supabase JWT + new password meeting full strength rules.
'use strict';

const { createClient } = require('@supabase/supabase-js');

let _adminClient = null;
function getAdminClient() {
  if (_adminClient) return _adminClient;
  const url = process.env.SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !svc) return null;
  _adminClient = createClient(url, svc, { auth: { autoRefreshToken: false, persistSession: false } });
  return _adminClient;
}

// Mirrors isValidPassword() in app-core.js
function isValidPassword(pw) {
  if (!pw || typeof pw !== 'string') return false;
  if (pw.length < 6 || pw.length > 128) return false;
  if (!/[A-Z]/.test(pw)) return false;
  if (!/[0-9]/.test(pw)) return false;
  if (!/[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(pw)) return false;
  return true;
}

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ||
  'https://smartfitcoach.netlify.app,https://smartfitcoach.fr,https://www.smartfitcoach.fr,https://smartfitcoach.fitness,https://www.smartfitcoach.fitness')
  .split(',').map(function(s) { return s.trim(); });
ALLOWED_ORIGINS.push('http://localhost:8888', 'http://localhost:3000', 'http://127.0.0.1:3000');

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.indexOf(origin) !== -1) return true;
  if (/^https:\/\/[a-z0-9-]+--smartfitcoach\.netlify\.app$/.test(origin)) return true;
  return false;
}

function getCorsHeaders(event) {
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || '';
  const allowed = isAllowedOrigin(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? (origin || ALLOWED_ORIGINS[0]) : 'null',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}

exports.handler = async function(event) {
  const headers = getCorsHeaders(event);

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const admin = getAdminClient();
  if (!admin) {
    if (process.env.NETLIFY) {
      return { statusCode: 503, headers, body: JSON.stringify({ error: 'Service temporairement indisponible.' }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, dev: true }) };
  }

  // Verify JWT
  const authHeader = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authentification requise.' }) };
  }

  let userResp;
  try {
    userResp = await admin.auth.getUser(token);
  } catch (e) {
    console.warn('[change-password] getUser exception:', e && e.message);
    return { statusCode: 503, headers, body: JSON.stringify({ error: 'Service temporairement indisponible.' }) };
  }

  if (userResp.error || !userResp.data || !userResp.data.user) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Session expirée — reconnectez-vous.' }) };
  }

  const userId = userResp.data.user.id;

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Corps de requête invalide.' }) };
  }

  const { password } = body;

  // SERVER-SIDE password validation
  if (!isValidPassword(password)) {
    return {
      statusCode: 422,
      headers,
      body: JSON.stringify({
        error: 'Le mot de passe doit contenir au moins 6 caractères, une majuscule, un chiffre et un caractère spécial.'
      })
    };
  }

  let updateResp;
  try {
    updateResp = await admin.auth.admin.updateUserById(userId, { password });
  } catch (e) {
    console.error('[change-password] updateUserById exception:', e && e.message);
    return { statusCode: 503, headers, body: JSON.stringify({ error: 'Service temporairement indisponible.' }) };
  }

  if (updateResp.error) {
    return { statusCode: 422, headers, body: JSON.stringify({ error: updateResp.error.message || 'Erreur lors de la mise à jour.' }) };
  }

  return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
};
