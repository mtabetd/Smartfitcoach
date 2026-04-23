// netlify/functions/analytics-track.js
// Lightweight product analytics endpoint — no auth required (anonymous events).
// Stores events in Supabase analytics_events for business visibility.
'use strict';

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const ALLOWED_EVENTS = new Set([
  'page_view', 'workout_completed', 'meal_logged', 'ai_coach_used',
  'paywall_hit', 'program_generated', 'onboarding_completed',
  'scan_used', 'weight_logged', 'social_post_created'
]);

// Reflect origin only for known domains — same allowlist as other functions
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://smartfitcoach.netlify.app,https://smartfitcoach.fr,https://www.smartfitcoach.fr,https://smartfitcoach.fitness,https://www.smartfitcoach.fitness')
  .split(',').map(function(o) { return o.trim(); });
ALLOWED_ORIGINS.push('http://localhost:8888', 'http://127.0.0.1:3000', 'http://localhost:3000');

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.indexOf(origin) !== -1) return true;
  if (/^https:\/\/[a-z0-9-]+--smartfitcoach\.netlify\.app$/.test(origin)) return true;
  return false;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

exports.handler = async function(event) {
  const origin = (event.headers && event.headers['origin']) || '';
  const allowedOrigin = isAllowedOrigin(origin) ? (origin || ALLOWED_ORIGINS[0]) : null;
  const CORS_HEADERS = {
    'Access-Control-Allow-Origin': allowedOrigin || 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Skip silently in dev (no Supabase credentials)
  const url = process.env.SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !svc) {
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true, skipped: true }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (_) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { event: eventName, session_id, user_id, properties } = body;

  if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Unknown event' }) };
  }
  if (!session_id || typeof session_id !== 'string' || session_id.length > 64) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid session_id' }) };
  }

  // Accept user_id only if it matches UUID format — reject arbitrary strings
  const validUserId = (user_id && typeof user_id === 'string' && UUID_RE.test(user_id)) ? user_id : null;

  const ip = (event.headers && (event.headers['x-forwarded-for'] || event.headers['client-ip'] || '')) || '';
  const ip_hash = ip ? crypto.createHash('sha256').update(ip.split(',')[0].trim()).digest('hex').slice(0, 16) : null;

  try {
    const client = createClient(url, svc, { auth: { autoRefreshToken: false, persistSession: false } });
    await client.from('analytics_events').insert({
      session_id: String(session_id).slice(0, 64),
      user_id: validUserId,
      event: eventName,
      properties: (properties && typeof properties === 'object' && !Array.isArray(properties)) ? properties : {},
      ip_hash
    });
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.warn('[analytics-track] insert error:', e && e.message);
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true }) };
  }
};
