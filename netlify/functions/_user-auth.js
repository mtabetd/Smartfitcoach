// netlify/functions/_user-auth.js
// Shared helper: verify Supabase JWT + check premium/trial status.
// Used by ai-coach, generate-muscu-program, body-analysis, plate-scan.

'use strict';

const { createClient } = require('@supabase/supabase-js');

const TRIAL_DAYS = 7;

// Module-level client reused across warm Netlify invocations
let _adminClient = null;
function getAdminClient() {
  if (_adminClient) return _adminClient;
  const url = process.env.SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !svc) return null;
  _adminClient = createClient(url, svc, { auth: { autoRefreshToken: false, persistSession: false } });
  return _adminClient;
}

/**
 * Verify the caller's Supabase JWT and check premium / trial status.
 *
 * Returns { user: { id, email } } on success.
 * Returns { error: { statusCode, msg } } when access must be denied.
 * Returns { skip: true } when SUPABASE env vars are absent (dev / CI env) —
 * callers should continue without blocking so local dev keeps working.
 *
 * Premium logic (mirrors isPremium() in app-core.js):
 *   1. Active subscription  : profiles.subscription_end >= today
 *   2. 7-day trial          : profiles.data.firstLoginDate + 7d >= today
 */
async function requirePremium(event) {
  const admin = getAdminClient();

  // No Supabase credentials → local dev / CI — skip enforcement
  if (!admin) return { skip: true };

  const authHeader = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { error: { statusCode: 401, msg: 'Authentification requise' } };
  }

  // Verify JWT
  let userResp;
  try {
    userResp = await admin.auth.getUser(token);
  } catch (e) {
    console.warn('[_user-auth] Supabase getUser exception:', e && e.message);
    return { error: { statusCode: 503, msg: 'Service temporairement indisponible — réessayez' } };
  }

  if (userResp.error || !userResp.data || !userResp.data.user) {
    return { error: { statusCode: 401, msg: 'Session expirée — reconnectez-vous' } };
  }

  const user = userResp.data.user;

  // Fetch subscription status + trial date from profiles table
  let profile = null;
  try {
    const { data } = await admin
      .from('profiles')
      .select('subscription_end, data')
      .eq('id', user.id)
      .single();
    profile = data;
  } catch (e) {
    console.warn('[_user-auth] profiles fetch exception:', e && e.message);
    return { error: { statusCode: 503, msg: 'Service temporairement indisponible — réessayez' } };
  }

  const today = new Date().toISOString().slice(0, 10);
  let premium = false;

  if (profile) {
    // 1. Active subscription
    if (profile.subscription_end && profile.subscription_end >= today) premium = true;

    // 2. Trial period (mirrors client-side logic in app-main.js)
    if (!premium && profile.data && profile.data.firstLoginDate) {
      const trialEnd = new Date(profile.data.firstLoginDate);
      trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
      if (new Date() <= trialEnd) premium = true;
    }
  }

  if (!premium) {
    return { error: { statusCode: 403, msg: 'Fonctionnalité réservée aux membres premium' } };
  }

  return { user: { id: user.id, email: user.email } };
}

module.exports = { requirePremium };
