// netlify/functions/push-subscribe.js
// Register or remove a browser Web Push subscription for the authenticated user.
// POST { subscription: { endpoint, keys: { p256dh, auth } }, action: 'subscribe'|'unsubscribe' }

'use strict';

var ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://smartfitcoach.netlify.app,https://smartfitcoach.fr,https://www.smartfitcoach.fr,https://smartfitcoach.fitness,https://www.smartfitcoach.fitness')
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
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? (origin || ALLOWED_ORIGINS[0]) : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'false',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff'
  };
}

var { requirePremium } = require('./_user-auth');

exports.handler = async function(event) {
  var origin = event.headers.origin || event.headers.Origin || '';
  var headers = corsHeaders(origin);

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

  // Authenticate — require valid session (premium or trial)
  var auth = await requirePremium(event);
  if (auth.error) {
    return { statusCode: auth.error.statusCode, headers: headers, body: JSON.stringify({ error: auth.error.msg }) };
  }

  // Parse body
  var body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Corps de requête invalide' }) };
  }

  if (!body || typeof body !== 'object') {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Corps de requête invalide' }) };
  }

  var action = body.action === 'unsubscribe' ? 'unsubscribe' : 'subscribe';
  var sub = body.subscription;

  if (!sub || typeof sub !== 'object') {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'subscription manquant' }) };
  }

  var endpoint = typeof sub.endpoint === 'string' ? sub.endpoint.trim() : '';
  if (!endpoint || endpoint.length > 2048) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'endpoint invalide' }) };
  }

  // In skip-mode (no Supabase env) just return OK so local dev works
  if (auth.skip) {
    return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true, skipped: true }) };
  }

  var userId = auth.user.id;
  var { getAdminClient } = require('./_user-auth');

  // _user-auth does not export getAdminClient — build admin client directly
  var { createClient } = require('@supabase/supabase-js');
  var url = process.env.SUPABASE_URL;
  var svc = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !svc) {
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Service non configuré' }) };
  }
  var admin = createClient(url, svc, { auth: { autoRefreshToken: false, persistSession: false } });

  try {
    if (action === 'unsubscribe') {
      var del = await admin
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint);

      if (del.error) throw del.error;
      return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true, action: 'unsubscribed' }) };
    }

    // subscribe — upsert the subscription keys
    var keys = (sub.keys && typeof sub.keys === 'object') ? sub.keys : {};
    var p256dh = typeof keys.p256dh === 'string' ? keys.p256dh.trim() : '';
    var authKey = typeof keys.auth === 'string' ? keys.auth.trim() : '';

    if (!p256dh || !authKey) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Clés VAPID manquantes (p256dh, auth)' }) };
    }

    var userAgent = String(event.headers['user-agent'] || '').slice(0, 300);

    var upsert = await admin
      .from('push_subscriptions')
      .upsert({
        user_id:    userId,
        endpoint:   endpoint,
        p256dh:     p256dh,
        auth_key:   authKey,
        user_agent: userAgent
      }, { onConflict: 'user_id,endpoint' });

    if (upsert.error) throw upsert.error;

    return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true, action: 'subscribed' }) };

  } catch (err) {
    console.error('[push-subscribe] DB error:', err && err.message);
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Erreur serveur' }) };
  }
};
