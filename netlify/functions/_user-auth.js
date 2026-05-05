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

  // No Supabase credentials → local dev / CI only (never in production)
  if (!admin) {
    if (process.env.NETLIFY) {
      // Production with missing env vars: refuse access rather than grant it
      return { error: { statusCode: 503, msg: 'Service temporairement indisponible — réessayez' } };
    }
    return { skip: true }; // local dev / CI
  }

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

  // Fetch subscription status + trial date from profiles table.
  // first_login_date is a write-once server-managed column (see migration
  // 20260505_secure_first_login_date.sql) — users cannot manipulate it via
  // the Supabase client to extend their trial. data.firstLoginDate is only
  // used as a fallback during the migration window for rows not yet backfilled.
  let profile = null;
  try {
    const { data, error: profileErr } = await admin
      .from('profiles')
      .select('subscription_end, first_login_date, data')
      .eq('id', user.id)
      .single();
    // PGRST116 = no row found (new user whose profile hasn't been created yet) — treat as new user
    if (profileErr && profileErr.code !== 'PGRST116') {
      console.warn('[_user-auth] profiles fetch error:', profileErr.message);
      return { error: { statusCode: 503, msg: 'Service temporairement indisponible — réessayez' } };
    }
    profile = data; // null for brand-new users (PGRST116) — handled below as trial grant
  } catch (e) {
    console.warn('[_user-auth] profiles fetch exception:', e && e.message);
    return { error: { statusCode: 503, msg: 'Service temporairement indisponible — réessayez' } };
  }

  const today = new Date().toISOString().slice(0, 10);
  let premium = false;

  if (profile) {
    // 1. Active subscription
    if (profile.subscription_end && profile.subscription_end >= today) premium = true;

    // 2. Trial period — prefer the DB-managed write-once column; fall back to
    //    JSONB only during the migration window when the column may be null.
    if (!premium) {
      const rawDate = profile.first_login_date ||
        (profile.data && typeof profile.data.firstLoginDate === 'string' ? profile.data.firstLoginDate : null);
      if (rawDate) {
        const trialEnd = new Date(rawDate);
        trialEnd.setUTCDate(trialEnd.getUTCDate() + TRIAL_DAYS);
        if (new Date() <= trialEnd) premium = true;
      } else if (!profile.subscription_end) {
        // Truly brand-new user (no trial date, no subscription ever set) — grant trial
        premium = true;
      }
      // If subscription_end exists but expired and no trial date: deny (known lapsed user)
    }
  }

  if (!premium) {
    return { error: { statusCode: 403, msg: 'Fonctionnalité réservée aux membres premium' } };
  }

  return { user: { id: user.id, email: user.email } };
}

module.exports = { requirePremium };
