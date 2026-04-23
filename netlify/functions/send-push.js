// netlify/functions/send-push.js
// Admin-only: send a Web Push notification to one user or broadcast to all.
// POST { userId?: string, title: string, body: string, url?: string }
// Requires admin auth (ADMIN_EMAILS or app_metadata.role === 'admin').
// Expired/invalid subscriptions are automatically pruned from the DB.

'use strict';

var { isAllowedOrigin, corsHeaders, requireAdmin } = require('./_admin-auth');

exports.handler = async function(event) {
  var origin = event.headers.origin || event.headers.Origin || '';
  var headers = corsHeaders(origin, 'POST');

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!isAllowedOrigin(origin)) {
    return { statusCode: 403, headers: headers, body: JSON.stringify({ error: 'Origin non autorisé' }) };
  }

  // Admin auth
  var auth = await requireAdmin(event);
  if (auth.error) {
    return { statusCode: auth.error.statusCode, headers: headers, body: JSON.stringify({ error: auth.error.msg }) };
  }

  // VAPID config check
  var vapidPublic  = process.env.VAPID_PUBLIC_KEY  || '';
  var vapidPrivate = process.env.VAPID_PRIVATE_KEY || '';
  var vapidEmail   = process.env.VAPID_EMAIL       || '';

  if (!vapidPublic || !vapidPrivate || !vapidEmail) {
    console.error('[send-push] VAPID env vars not set');
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'VAPID non configuré (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL)' }) };
  }

  // Parse body
  var body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Corps de requête invalide' }) };
  }

  var title   = String(body.title  || 'SmartFitCoach').slice(0, 200);
  var message = String(body.body   || '').slice(0, 500);
  var url     = String(body.url    || '/').slice(0, 500);
  var userId  = (typeof body.userId === 'string' && body.userId.trim()) ? body.userId.trim() : null;

  if (!message) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'body manquant' }) };
  }

  // Build Supabase admin client
  var { createClient } = require('@supabase/supabase-js');
  var supabaseUrl = process.env.SUPABASE_URL;
  var supabaseSvc = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseSvc) {
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Supabase non configuré' }) };
  }
  var admin = createClient(supabaseUrl, supabaseSvc, { auth: { autoRefreshToken: false, persistSession: false } });

  // Fetch subscriptions
  var query = admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth_key, user_id');

  if (userId) {
    query = query.eq('user_id', userId);
  }

  var { data: subs, error: fetchErr } = await query;
  if (fetchErr) {
    console.error('[send-push] fetch subscriptions error:', fetchErr.message);
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Erreur lecture abonnements' }) };
  }

  if (!subs || subs.length === 0) {
    return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true, sent: 0, failed: 0, pruned: 0 }) };
  }

  // Configure web-push
  var webpush = require('web-push');
  webpush.setVapidDetails(
    vapidEmail.startsWith('mailto:') ? vapidEmail : 'mailto:' + vapidEmail,
    vapidPublic,
    vapidPrivate
  );

  var payload = JSON.stringify({ title: title, body: message, url: url, tag: 'sfc-push' });

  var sent   = 0;
  var failed = 0;
  var staleIds = [];

  // Send to each subscription — fire in parallel but cap concurrency to avoid overwhelming
  // the push service. Process in batches of 25.
  var BATCH = 25;
  for (var i = 0; i < subs.length; i += BATCH) {
    var batch = subs.slice(i, i + BATCH);
    await Promise.all(batch.map(async function(sub) {
      var pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth:   sub.auth_key
        }
      };
      try {
        await webpush.sendNotification(pushSub, payload);
        sent++;
      } catch (err) {
        var statusCode = err && err.statusCode;
        // 410 Gone or 404 Not Found → subscription expired/unregistered → prune
        if (statusCode === 410 || statusCode === 404) {
          staleIds.push(sub.id);
        } else {
          console.warn('[send-push] send error for endpoint', sub.endpoint.slice(0, 60), ':', statusCode || (err && err.message));
          failed++;
        }
      }
    }));
  }

  // Prune stale subscriptions
  var pruned = 0;
  if (staleIds.length > 0) {
    try {
      var del = await admin
        .from('push_subscriptions')
        .delete()
        .in('id', staleIds);
      if (del.error) {
        console.warn('[send-push] prune error:', del.error.message);
      } else {
        pruned = staleIds.length;
      }
    } catch (e) {
      console.warn('[send-push] prune exception:', e && e.message);
    }
  }

  console.log('[send-push] sent=' + sent + ' failed=' + failed + ' pruned=' + pruned + ' total=' + subs.length);

  return {
    statusCode: 200,
    headers: headers,
    body: JSON.stringify({ ok: true, sent: sent, failed: failed, pruned: pruned })
  };
};
