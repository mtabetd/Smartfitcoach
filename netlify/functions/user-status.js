// netlify/functions/user-status.js
// GET /.netlify/functions/user-status
// Returns authoritative premium / trial status for the authenticated user.
// This is the canonical server-side source of truth — the client must never
// compute isPremium() solely from localStorage for security-sensitive gating.
//
// Response: { premium: bool, plan: string, planEnd: string|null, trialDaysLeft: number }

'use strict';

const { createClient } = require('@supabase/supabase-js');

const TRIAL_DAYS = 7;

var ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://smartfitcoach.netlify.app,https://smartfitcoach.fr,https://www.smartfitcoach.fr,https://smartfitcoach.fitness,https://www.smartfitcoach.fitness')
  .split(',').map(function(o) { return o.trim(); });
ALLOWED_ORIGINS.push('http://localhost:8888', 'http://127.0.0.1:3000', 'http://localhost:3000');

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.indexOf(origin) !== -1) return true;
  if (/^https:\/\/[a-z0-9-]+--smartfitcoach\.netlify\.app$/.test(origin)) return true;
  return false;
}

function corsHeaders(origin, methods) {
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? (origin || ALLOWED_ORIGINS[0]) : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': (methods || 'GET') + ', OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
}

let _adminClient = null;
function getAdminClient() {
  if (_adminClient) return _adminClient;
  const url = process.env.SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !svc) return null;
  _adminClient = createClient(url, svc, { auth: { autoRefreshToken: false, persistSession: false } });
  return _adminClient;
}

exports.handler = async function(event) {
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || '';
  const headers = corsHeaders(origin, 'GET');

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: headers, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const admin = getAdminClient();
  if (!admin) {
    if (process.env.NETLIFY) {
      return { statusCode: 503, headers: headers, body: JSON.stringify({ error: 'Service temporairement indisponible' }) };
    }
    // Local dev / CI: return safe default rather than blocking
    return { statusCode: 200, headers: headers, body: JSON.stringify({ premium: true, plan: 'dev', planEnd: null, trialDaysLeft: 7 }) };
  }

  const authHeader = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { statusCode: 401, headers: headers, body: JSON.stringify({ error: 'Authentification requise' }) };
  }

  // Verify JWT
  let userResp;
  try {
    userResp = await admin.auth.getUser(token);
  } catch (e) {
    console.warn('[user-status] getUser exception:', e && e.message);
    return { statusCode: 503, headers: headers, body: JSON.stringify({ error: 'Service temporairement indisponible' }) };
  }

  if (userResp.error || !userResp.data || !userResp.data.user) {
    return { statusCode: 401, headers: headers, body: JSON.stringify({ error: 'Session expirée — reconnectez-vous' }) };
  }

  const userId = userResp.data.user.id;

  // Fetch authoritative subscription + first_login_date
  let profile = null;
  try {
    const { data, error } = await admin
      .from('profiles')
      .select('subscription_plan, subscription_end, first_login_date, data')
      .eq('id', userId)
      .single();
    if (!error) profile = data;
  } catch (e) {
    console.warn('[user-status] profiles fetch exception:', e && e.message);
    return { statusCode: 503, headers: headers, body: JSON.stringify({ error: 'Service temporairement indisponible' }) };
  }

  if (!profile) {
    // New user — no profile yet; treat as fresh trial
    const today = new Date().toISOString().slice(0, 10);
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({ premium: true, plan: 'trial', planEnd: null, trialDaysLeft: TRIAL_DAYS, firstLoginDate: today })
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const nowMs = Date.now();
  let premium = false;
  let plan = 'trial';
  let planEnd = null;
  let trialDaysLeft = 0;

  // 1. Active paid subscription
  if (profile.subscription_end && profile.subscription_end >= today) {
    premium = true;
    plan = profile.subscription_plan || 'paid';
    planEnd = profile.subscription_end;
  }

  // 2. Trial period — use DB-managed first_login_date (write-once, server-set)
  if (!premium) {
    // Prefer the protected column; fall back to JSONB only during migration window
    // when first_login_date may not yet be populated for the row.
    const rawDate = profile.first_login_date ||
      (profile.data && typeof profile.data.firstLoginDate === 'string' ? profile.data.firstLoginDate : null);

    if (rawDate) {
      const trialEnd = new Date(rawDate);
      trialEnd.setUTCDate(trialEnd.getUTCDate() + TRIAL_DAYS);
      const msLeft = trialEnd.getTime() - nowMs;
      if (msLeft > 0) {
        premium = true;
        plan = 'trial';
        trialDaysLeft = Math.ceil(msLeft / 86400000);
      }
    } else {
      // No date at all → brand-new user, full trial
      premium = true;
      plan = 'trial';
      trialDaysLeft = TRIAL_DAYS;
    }
  }

  // Canonical firstLoginDate to sync back to client
  const firstLoginDate = profile.first_login_date ||
    (profile.data && profile.data.firstLoginDate) ||
    today;

  return {
    statusCode: 200,
    headers: headers,
    body: JSON.stringify({
      premium: premium,
      plan: plan,
      planEnd: planEnd,
      trialDaysLeft: trialDaysLeft,
      firstLoginDate: firstLoginDate
    })
  };
};
