// netlify/functions/preregister.js
// Pré-inscription early-member — insert Supabase + envoi email via Resend.
// Appelée par la gate (app/gate.js). Aucune auth requise côté client.

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

function hashIp(ip) {
  if (!ip || ip === 'unknown') return null;
  return crypto.createHash('sha256').update(String(ip) + '|sfc_ip_salt').digest('hex');
}

var ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://smartfitcoach.netlify.app,https://smartfitcoach.fr,https://www.smartfitcoach.fr,https://smartfitcoach.fitness,https://www.smartfitcoach.fitness')
  .split(',').map(function(o){ return o.trim(); });
ALLOWED_ORIGINS.push('http://localhost:8888', 'http://127.0.0.1:3000', 'http://localhost:3000');

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.indexOf(origin) !== -1) return true;
  if (/^https:\/\/[a-z0-9-]+--smartfitcoach\.netlify\.app$/.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+--smartfitcoach\.netlify\.app$/.test(origin)) return true;
  return false;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}

// Rate-limit IP basique en mémoire (reset à chaque cold start — anti-spam léger suffisant)
var _rateLimit = new Map();
var RATE_WINDOW_MS = 60 * 1000;
var RATE_MAX = 5;
function tooManyRequests(ip) {
  var now = Date.now();
  var entry = _rateLimit.get(ip) || { count: 0, resetAt: now + RATE_WINDOW_MS };
  if (now > entry.resetAt) entry = { count: 0, resetAt: now + RATE_WINDOW_MS };
  entry.count++;
  _rateLimit.set(ip, entry);
  return entry.count > RATE_MAX;
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Template email HTML (inliné — évite les aléas de bundling esbuild) ──
// Source canonique : /email-template-early-member.html à la racine du projet.
// Synchronisez-les lors de toute mise à jour visuelle.
function renderEmail(firstName) {
  var safe = escapeHtml(firstName);
  return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n' +
'<html xmlns="http://www.w3.org/1999/xhtml"><head>' +
'<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0" />' +
'<title>Bienvenue dans le cercle &mdash; SmartFitCoach</title></head>' +
'<body style="margin:0;padding:0;background-color:#F5F5F0;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;">' +
'<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F5F5F0;"><tr><td align="center" style="padding:20px 10px;">' +
'<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background-color:#FFFFFF;">' +
'<tr><td style="height:60px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
'<tr><td align="center" style="padding:0 55px;"><p style="margin:0;font-family:Georgia,\'Times New Roman\',Times,serif;font-size:12px;font-weight:normal;letter-spacing:7px;color:#1A1A1A;text-transform:uppercase;">SMARTFITCOACH</p></td></tr>' +
'<tr><td style="height:35px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
'<tr><td align="center"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:50px;height:1px;background-color:#E0E0DA;font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>' +
'<tr><td style="height:45px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
'<tr><td align="center" style="padding:0 55px;"><h1 style="margin:0;font-family:Georgia,\'Times New Roman\',Times,serif;font-size:38px;font-weight:normal;font-style:italic;color:#1A1A1A;line-height:1.2;">Bienvenue, ' + safe + '.</h1></td></tr>' +
'<tr><td style="height:35px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
'<tr><td align="center" style="padding:0 55px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="420" style="max-width:420px;width:100%;"><tr><td>' +
'<p style="margin:0 0 20px 0;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.85;color:#4A4A46;">Merci d&rsquo;avoir laiss&eacute; votre nom. Vous figurez parmi les tout premiers &agrave; nous avoir rejoints, avant m&ecirc;me que les portes ne s&rsquo;ouvrent.</p>' +
'<p style="margin:0 0 20px 0;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.85;color:#4A4A46;">En reconnaissance de cette confiance, une promotion exclusive vous sera r&eacute;serv&eacute;e le jour de l&rsquo;ouverture. Elle ne sera offerte qu&rsquo;une fois, et qu&rsquo;aux membres du premier cercle.</p>' +
'<p style="margin:0;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.85;color:#4A4A46;">Tr&egrave;s bient&ocirc;t, nous reviendrons vers vous. Sans pr&eacute;avis, &agrave; l&rsquo;instant juste.</p>' +
'</td></tr></table></td></tr>' +
'<tr><td style="height:55px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
'<tr><td align="center"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:50px;height:1px;background-color:#E0E0DA;font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>' +
'<tr><td style="height:40px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
'<tr><td align="center" style="padding:0 55px;"><p style="margin:0;font-family:Georgia,\'Times New Roman\',Times,serif;font-size:12px;letter-spacing:7px;text-transform:uppercase;color:#1A1A1A;">CE QUI VOUS ATTEND</p></td></tr>' +
'<tr><td style="height:20px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
'<tr><td align="center" style="padding:0 55px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
'<tr><td align="center"><p style="margin:0;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#4A4A46;">Une nutrition pes&eacute;e au gramme,<br />&eacute;crite pour vous seul</p></td></tr>' +
'<tr><td style="height:28px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
'<tr><td align="center"><p style="margin:0;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#4A4A46;">Des entra&icirc;nements taill&eacute;s,<br />&agrave; la mesure de votre niveau</p></td></tr>' +
'<tr><td style="height:28px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
'<tr><td align="center"><p style="margin:0;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#4A4A46;">Une progression observ&eacute;e,<br />semaine apr&egrave;s semaine</p></td></tr>' +
'</table></td></tr>' +
'<tr><td style="height:50px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
'<tr><td align="center" style="padding:0 55px;"><p style="margin:0;font-family:Georgia,\'Times New Roman\',Times,serif;font-size:14px;font-style:italic;color:#1A1A1A;">L&rsquo;&eacute;quipe SmartFitCoach</p></td></tr>' +
'<tr><td style="height:45px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
'<tr><td align="center"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:50px;height:1px;background-color:#E0E0DA;font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>' +
'<tr><td style="height:20px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
'<tr><td align="center" style="padding:0 55px;">' +
'<p style="margin:0 0 8px 0;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:11px;font-style:italic;color:#9A9A94;">&copy; 2026 SmartFitCoach</p>' +
'<p style="margin:0;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:11px;font-style:italic;color:#9A9A94;line-height:1.6;">Si vous ne vous &ecirc;tes pas inscrit, ignorez simplement cet email.</p>' +
'</td></tr>' +
'<tr><td style="height:40px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
'</table></td></tr></table></body></html>';
}

async function sendEmail(toEmail, firstName) {
  var resendKey = process.env.RESEND_API_KEY;
  var fromAddress = process.env.RESEND_FROM_EMAIL || 'SmartFitCoach <noreply@smartfitcoach.fitness>';
  if (!resendKey) {
    console.warn('[preregister] RESEND_API_KEY absent — email non envoyé');
    return { sent: false, reason: 'no_api_key' };
  }

  var html = renderEmail(firstName);

  var res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + resendKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [toEmail],
      subject: 'Votre nom est inscrit.',
      html: html
    })
  });

  if (!res.ok) {
    var errText = await res.text().catch(function(){ return ''; });
    console.error('[preregister] Resend error:', res.status, errText);
    return { sent: false, reason: 'resend_error', status: res.status };
  }
  return { sent: true };
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

  var ip = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || 'unknown';
  if (ip.indexOf(',') !== -1) ip = ip.split(',')[0].trim();
  if (tooManyRequests(ip)) {
    return { statusCode: 429, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Trop de requêtes. Merci de patienter.' }) };
  }

  var body;
  try { body = JSON.parse(event.body || '{}'); }
  catch (_) { return { statusCode: 400, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Corps de requête invalide' }) }; }

  var firstName = String(body.first_name || '').trim().slice(0, 60);
  var lastName  = String(body.last_name  || '').trim().slice(0, 60);
  var email     = String(body.email      || '').trim().toLowerCase().slice(0, 120);
  var phone     = String(body.phone      || '').trim().slice(0, 30);

  if (!firstName || !lastName) {
    return { statusCode: 400, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Prénom et nom requis.' }) };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Adresse email invalide.' }) };
  }
  if (phone && !/^[\d\s+\-().]{6,30}$/.test(phone)) {
    return { statusCode: 400, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Numéro de téléphone invalide.' }) };
  }

  var supabaseUrl = process.env.SUPABASE_URL;
  var supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[preregister] Missing Supabase env vars');
    return { statusCode: 500, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Erreur de configuration serveur.' }) };
  }

  try {
    var adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    var insertRes = await adminClient.from('early_registrations').insert({
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone || null,
      ip_hash: hashIp(ip),
      user_agent: String(event.headers['user-agent'] || '').slice(0, 300)
    }).select('id').single();

    if (insertRes.error) {
      // 23505 = unique_violation (email déjà inscrit)
      if (insertRes.error.code === '23505') {
        return { statusCode: 409, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Vous figurez déjà parmi les premiers inscrits.' }) };
      }
      console.error('[preregister] Supabase insert error:', insertRes.error);
      return { statusCode: 500, headers: corsHeaders(origin), body: JSON.stringify({
        error: 'Impossible d\'enregistrer votre inscription.'
      }) };
    }

    // Email — best-effort : un échec d'envoi ne bloque pas l'inscription
    var mailResult;
    try { mailResult = await sendEmail(email, firstName); }
    catch (mailErr) {
      console.error('[preregister] Email send exception:', mailErr && mailErr.message);
      mailResult = { sent: false, reason: 'exception' };
    }

    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: JSON.stringify({ success: true, email_sent: !!(mailResult && mailResult.sent) })
    };

  } catch (e) {
    console.error('[preregister] Unexpected error:', e);
    return { statusCode: 500, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Erreur interne.' }) };
  }
};
