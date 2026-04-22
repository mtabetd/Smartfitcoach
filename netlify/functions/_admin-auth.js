// netlify/functions/_admin-auth.js
// Shared helper: authenticate + authorize admin callers for the admin-*
// functions. Pattern follows delete-account.js (same CORS block, same
// getUser(token) JWT verification).

const { createClient } = require('@supabase/supabase-js');

var ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://smartfitcoach.netlify.app,https://smartfitcoach.fr,https://www.smartfitcoach.fr,https://smartfitcoach.fitness,https://www.smartfitcoach.fitness')
  .split(',').map(function(o){ return o.trim(); });
ALLOWED_ORIGINS.push('http://localhost:8888', 'http://127.0.0.1:3000', 'http://localhost:3000');

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.indexOf(origin) !== -1) return true;
  // Allow only smartfitcoach deploy previews and branches. The wider
  // ^https://[a-z0-9-]+\.netlify\.app$ regex would accept any attacker-
  // owned netlify.app subdomain, which becomes an account-takeover
  // vector the moment auth moves to cookies. Keep strict.
  if (/^https:\/\/[a-z0-9-]+--smartfitcoach\.netlify\.app$/.test(origin)) return true;
  return false;
}

function corsHeaders(origin, methods) {
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': (methods || 'POST') + ', OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
}

// Authenticate caller and verify they are in ADMIN_EMAILS.
// Returns { admin, user } on success, or { error: {statusCode, msg} } on failure.
// The admin client uses SUPABASE_SERVICE_ROLE_KEY so it bypasses RLS.
async function requireAdmin(event) {
  var url = process.env.SUPABASE_URL;
  var svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svc) {
    return { error: { statusCode: 500, msg: 'Server misconfigured (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)' } };
  }

  var admins = (process.env.ADMIN_EMAILS || '')
    .split(',').map(function(s){ return s.trim().toLowerCase(); })
    .filter(Boolean);
  if (admins.length === 0) {
    return { error: { statusCode: 500, msg: 'ADMIN_EMAILS env var not set' } };
  }

  var authHeader = event.headers.authorization || event.headers.Authorization || '';
  var token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { error: { statusCode: 401, msg: 'Missing authorization token' } };
  }

  var admin = createClient(url, svc, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  var userResp;
  try {
    userResp = await admin.auth.getUser(token);
  } catch (e) {
    return { error: { statusCode: 401, msg: 'Token verification failed' } };
  }
  if (userResp.error || !userResp.data || !userResp.data.user) {
    return { error: { statusCode: 401, msg: 'Invalid token' } };
  }

  var email = (userResp.data.user.email || '').toLowerCase();
  var role = (userResp.data.user.app_metadata && userResp.data.user.app_metadata.role) || '';
  var isAdmin = role === 'admin' || admins.indexOf(email) !== -1;
  if (!isAdmin) {
    return { error: { statusCode: 403, msg: 'Forbidden — not an admin' } };
  }

  return { admin: admin, user: userResp.data.user };
}

module.exports = {
  isAllowedOrigin: isAllowedOrigin,
  corsHeaders: corsHeaders,
  requireAdmin: requireAdmin
};
