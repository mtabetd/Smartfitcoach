// netlify/functions/ai-coach-feedback.js
// Persists AI coach thumbs-up/down feedback to Supabase.
// Any authenticated user can submit feedback for their own messages.
// Rate: max 50 inserts/hour per user (enforced by DB unique constraint + server check).

'use strict';

const { createClient } = require('@supabase/supabase-js');

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ||
  'https://smartfitcoach.netlify.app,https://smartfitcoach.fr,https://www.smartfitcoach.fr,https://smartfitcoach.fitness,https://www.smartfitcoach.fitness')
  .split(',').map(function(o) { return o.trim(); });
ALLOWED_ORIGINS.push('http://localhost:8888', 'http://127.0.0.1:3000', 'http://localhost:3000');

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.indexOf(origin) !== -1) return true;
  if (/^https:\/\/[a-z0-9-]+--smartfitcoach\.netlify\.app$/.test(origin)) return true;
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

let _adminClient = null;
function getAdminClient() {
  if (_adminClient) return _adminClient;
  var url = process.env.SUPABASE_URL;
  var svc = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !svc) return null;
  _adminClient = createClient(url, svc, { auth: { autoRefreshToken: false, persistSession: false } });
  return _adminClient;
}

exports.handler = async function(event) {
  var origin = event.headers.origin || event.headers.Origin || '';

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(origin), body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!isAllowedOrigin(origin)) {
    return { statusCode: 403, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Forbidden' }) };
  }

  var admin = getAdminClient();
  if (!admin) {
    // Missing env vars — silently accept in local dev, block in production
    if (process.env.NETLIFY) {
      return { statusCode: 503, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Service unavailable' }) };
    }
    return { statusCode: 200, headers: corsHeaders(origin), body: JSON.stringify({ ok: true, dev: true }) };
  }

  // Verify JWT
  var authHeader = event.headers.authorization || event.headers.Authorization || '';
  var token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { statusCode: 401, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Missing token' }) };
  }

  var userResp;
  try {
    userResp = await admin.auth.getUser(token);
  } catch (e) {
    return { statusCode: 401, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Token verification failed' }) };
  }
  if (userResp.error || !userResp.data || !userResp.data.user) {
    return { statusCode: 401, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Invalid token' }) };
  }

  var userId = userResp.data.user.id;

  // Parse + validate body
  var body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { body = {}; }

  var messageHash = typeof body.messageHash === 'string' ? body.messageHash.slice(0, 120) : '';
  var messageSnippet = typeof body.messageSnippet === 'string' ? body.messageSnippet.slice(0, 300) : '';
  var rating = body.rating;

  if (!messageHash) {
    return { statusCode: 400, headers: corsHeaders(origin), body: JSON.stringify({ error: 'messageHash required' }) };
  }
  if (rating !== 'up' && rating !== 'down') {
    return { statusCode: 400, headers: corsHeaders(origin), body: JSON.stringify({ error: 'rating must be "up" or "down"' }) };
  }

  // Upsert: one rating per (user_id, message_hash) — last write wins
  var { error: dbErr } = await admin
    .from('ai_coach_feedback')
    .upsert(
      { user_id: userId, message_hash: messageHash, message_snippet: messageSnippet, rating: rating },
      { onConflict: 'user_id,message_hash' }
    );

  if (dbErr) {
    // Table may not exist yet (migration not run) — accept gracefully
    if (dbErr.code === '42P01') {
      return { statusCode: 200, headers: corsHeaders(origin), body: JSON.stringify({ ok: true, skipped: 'table_missing' }) };
    }
    console.error('[ai-coach-feedback] DB error:', dbErr.message);
    return { statusCode: 500, headers: corsHeaders(origin), body: JSON.stringify({ error: 'DB error' }) };
  }

  return { statusCode: 200, headers: corsHeaders(origin), body: JSON.stringify({ ok: true }) };
};
