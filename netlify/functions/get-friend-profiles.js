'use strict';
const { createClient } = require('@supabase/supabase-js');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let _admin = null;
function adminClient() {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !svc) return null;
  _admin = createClient(url, svc, { auth: { autoRefreshToken: false, persistSession: false } });
  return _admin;
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  const admin = adminClient();
  if (!admin) return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, data: [] }) };

  // Verify JWT
  const authHeader = (event.headers.authorization || event.headers.Authorization || '');
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };

  let userId;
  try {
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (error || !user) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Invalid token' }) };
    userId = user.id;
  } catch(e) {
    return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'Auth unavailable' }) };
  }

  let ids;
  try {
    const body = JSON.parse(event.body || '{}');
    ids = (Array.isArray(body.ids) ? body.ids : []).filter(id => typeof id === 'string' && UUID_RE.test(id));
  } catch(e) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Bad request' }) };
  }

  if (!ids.length) return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, data: [] }) };

  try {
    // Security: only return profiles for users who share a friendship record with the caller
    const { data: friendships } = await admin
      .from('friendships')
      .select('requester_id,addressee_id')
      .or('requester_id.eq.' + userId + ',addressee_id.eq.' + userId);

    const allowed = new Set();
    (friendships || []).forEach(function(f) {
      allowed.add(f.requester_id);
      allowed.add(f.addressee_id);
    });
    allowed.delete(userId);

    const safeIds = ids.filter(function(id) { return allowed.has(id); });
    if (!safeIds.length) return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, data: [] }) };

    const { data, error } = await admin
      .from('social_profiles')
      .select('id,pseudo,avatar_color,avatar_url,sport_main,sport_level')
      .in('id', safeIds);

    if (error) throw error;
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, data: data || [] }) };
  } catch(e) {
    console.warn('[get-friend-profiles] error:', e && e.message);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, data: [] }) };
  }
};
