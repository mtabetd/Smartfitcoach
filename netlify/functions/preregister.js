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
  var SEP = '<tr><td align="center"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:50px;height:1px;background-color:#E0E0DA;font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>';
  var SP = function(h) { return '<tr><td style="height:' + h + 'px;font-size:0;line-height:0;">&nbsp;</td></tr>'; };
  return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">' +
'<html xmlns="http://www.w3.org/1999/xhtml"><head>' +
'<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0" />' +
'<title>Vous &ecirc;tes du premier cercle &mdash; SmartFitCoach</title></head>' +
'<body style="margin:0;padding:0;background-color:#F5F5F0;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;">' +
'<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F5F5F0;"><tr><td align="center" style="padding:20px 10px;">' +
'<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background-color:#FFFFFF;">' +
SP(60) +
'<tr><td align="center" style="padding:0 55px;"><p style="margin:0;font-family:Georgia,\'Times New Roman\',Times,serif;font-size:12px;font-weight:normal;letter-spacing:7px;color:#1A1A1A;text-transform:uppercase;">SMARTFITCOACH</p></td></tr>' +
SP(35) +
SEP +
SP(45) +
'<tr><td align="center" style="padding:0 55px;"><h1 style="margin:0;font-family:Georgia,\'Times New Roman\',Times,serif;font-size:38px;font-weight:normal;font-style:italic;color:#1A1A1A;line-height:1.2;">Vous &ecirc;tes du premier cercle, ' + safe + '.</h1></td></tr>' +
SP(35) +
'<tr><td align="center" style="padding:0 55px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="420" style="max-width:420px;width:100%;"><tr><td>' +
'<p style="margin:0 0 20px 0;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.85;color:#4A4A46;">Peu de personnes verront SmartFitCoach avant son ouverture au grand public. Vous en faites partie &mdash; et ce n&rsquo;est pas un hasard.</p>' +
'<p style="margin:0 0 20px 0;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.85;color:#4A4A46;">En signe de reconnaissance, une offre exclusive vous sera r&eacute;serv&eacute;e le jour de l&rsquo;ouverture. Elle ne sera propos&eacute;e qu&rsquo;une seule fois, et uniquement aux membres du premier cercle.</p>' +
'<p style="margin:0;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.85;color:#4A4A46;">Nous reviendrons vers vous. Sans pr&eacute;avis &mdash; &agrave; l&rsquo;instant choisi.</p>' +
'</td></tr></table></td></tr>' +
SP(55) +
SEP +
SP(40) +
'<tr><td align="center" style="padding:0 55px;"><p style="margin:0;font-family:Georgia,\'Times New Roman\',Times,serif;font-size:12px;letter-spacing:7px;text-transform:uppercase;color:#1A1A1A;">CE QUI VOUS SERA R&Eacute;SERV&Eacute;</p></td></tr>' +
SP(20) +
'<tr><td align="center" style="padding:0 55px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
'<tr><td align="center"><p style="margin:0;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#4A4A46;">Un acc&egrave;s prioritaire,<br />avant l&rsquo;ouverture officielle</p></td></tr>' +
SP(28) +
'<tr><td align="center"><p style="margin:0;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#4A4A46;">Une offre de lancement exclusive,<br />r&eacute;serv&eacute;e au premier cercle</p></td></tr>' +
SP(28) +
'<tr><td align="center"><p style="margin:0;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#4A4A46;">Un programme con&ccedil;u pour vous,<br />d&egrave;s le premier jour</p></td></tr>' +
'</table></td></tr>' +
SP(50) +
'<tr><td align="center" style="padding:0 55px;"><p style="margin:0;font-family:Georgia,\'Times New Roman\',Times,serif;font-size:14px;font-style:italic;color:#1A1A1A;">L&rsquo;&eacute;quipe SmartFitCoach</p></td></tr>' +
SP(45) +
SEP +
SP(20) +
'<tr><td align="center" style="padding:0 55px;">' +
'<p style="margin:0 0 8px 0;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:11px;font-style:italic;color:#9A9A94;">&copy; 2026 SmartFitCoach</p>' +
'<p style="margin:0;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:11px;font-style:italic;color:#9A9A94;line-height:1.6;">Si vous n&rsquo;&ecirc;tes pas &agrave; l&rsquo;origine de cette inscription, ignorez simplement cet email.</p>' +
'</td></tr>' +
SP(40) +
'</table></td></tr></table></body></html>';
}

async function callResend(resendKey, fromAddress, to, subject, html) {
  var res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + resendKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from: fromAddress, to: to, subject: subject, html: html })
  });
  if (!res.ok) {
    var errText = await res.text().catch(function(){ return ''; });
    console.error('[preregister] Resend error ' + res.status + ':', errText);
    return { sent: false, reason: 'resend_error', status: res.status };
  }
  return { sent: true };
}

// Email de confirmation à l'inscrit
async function sendEmail(toEmail, firstName) {
  var resendKey = process.env.RESEND_API_KEY;
  var fromAddress = process.env.RESEND_FROM_EMAIL || 'SmartFitCoach <noreply@smartfitcoach.fitness>';
  if (!resendKey) {
    console.warn('[preregister] RESEND_API_KEY absent — email non envoyé');
    return { sent: false, reason: 'no_api_key' };
  }
  return callResend(resendKey, fromAddress, [toEmail], 'Votre nom est inscrit.', renderEmail(firstName));
}

// Email de notification au propriétaire à chaque nouvelle inscription
async function sendOwnerNotification(firstName, lastName, email, phone) {
  var resendKey = process.env.RESEND_API_KEY;
  var fromAddress = process.env.RESEND_FROM_EMAIL || 'SmartFitCoach <noreply@smartfitcoach.fitness>';
  var ownerEmail = process.env.OWNER_EMAIL || 'smartfitcoach@proton.me';
  if (!resendKey) return { sent: false, reason: 'no_api_key' };

  var now = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'full', timeStyle: 'short' });
  var safeFirst = escapeHtml(firstName);
  var safeLast  = escapeHtml(lastName);
  var safeEmail = escapeHtml(email);
  var safePhone = phone ? escapeHtml(phone) : '—';

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>' +
'<body style="margin:0;padding:0;background:#F5F5F0;font-family:\'Helvetica Neue\',Arial,sans-serif;">' +
'<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F5F5F0;"><tr><td align="center" style="padding:30px 10px;">' +
'<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520" style="max-width:520px;width:100%;background:#FFFFFF;">' +
'<tr><td style="height:40px;"></td></tr>' +
'<tr><td align="center" style="padding:0 40px;">' +
  '<p style="margin:0;font-family:Georgia,serif;font-size:11px;letter-spacing:6px;text-transform:uppercase;color:#1A1A1A;">SMARTFITCOACH</p>' +
'</td></tr>' +
'<tr><td style="height:20px;"></td></tr>' +
'<tr><td align="center"><table cellpadding="0" cellspacing="0" border="0"><tr><td style="width:40px;height:1px;background:#E0E0DA;font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>' +
'<tr><td style="height:28px;"></td></tr>' +
'<tr><td align="center" style="padding:0 40px;">' +
  '<h1 style="margin:0;font-family:Georgia,serif;font-size:26px;font-weight:normal;font-style:italic;color:#1A1A1A;">Nouvelle inscription.</h1>' +
'</td></tr>' +
'<tr><td style="height:24px;"></td></tr>' +
'<tr><td style="padding:0 40px;">' +
  '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #E0E0DA;">' +
    '<tr><td style="padding:12px 0;border-bottom:1px solid #F0F0EA;">' +
      '<p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#9A9A94;font-family:\'Helvetica Neue\',Arial,sans-serif;">Prénom</p>' +
      '<p style="margin:4px 0 0;font-size:15px;color:#1A1A1A;font-family:Georgia,serif;">' + safeFirst + '</p>' +
    '</td></tr>' +
    '<tr><td style="padding:12px 0;border-bottom:1px solid #F0F0EA;">' +
      '<p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#9A9A94;font-family:\'Helvetica Neue\',Arial,sans-serif;">Nom</p>' +
      '<p style="margin:4px 0 0;font-size:15px;color:#1A1A1A;font-family:Georgia,serif;">' + safeLast + '</p>' +
    '</td></tr>' +
    '<tr><td style="padding:12px 0;border-bottom:1px solid #F0F0EA;">' +
      '<p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#9A9A94;font-family:\'Helvetica Neue\',Arial,sans-serif;">Email</p>' +
      '<p style="margin:4px 0 0;font-size:15px;color:#1A1A1A;font-family:\'Helvetica Neue\',Arial,sans-serif;">' + safeEmail + '</p>' +
    '</td></tr>' +
    '<tr><td style="padding:12px 0;border-bottom:1px solid #F0F0EA;">' +
      '<p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#9A9A94;font-family:\'Helvetica Neue\',Arial,sans-serif;">Téléphone</p>' +
      '<p style="margin:4px 0 0;font-size:15px;color:#1A1A1A;font-family:\'Helvetica Neue\',Arial,sans-serif;">' + safePhone + '</p>' +
    '</td></tr>' +
    '<tr><td style="padding:12px 0;">' +
      '<p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#9A9A94;font-family:\'Helvetica Neue\',Arial,sans-serif;">Date</p>' +
      '<p style="margin:4px 0 0;font-size:13px;color:#6B6B65;font-family:\'Helvetica Neue\',Arial,sans-serif;">' + now + '</p>' +
    '</td></tr>' +
  '</table>' +
'</td></tr>' +
'<tr><td style="height:30px;"></td></tr>' +
'<tr><td align="center" style="padding:0 40px;">' +
  '<p style="margin:0;font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;color:#9A9A94;font-style:italic;">Vous recevez cet email car une nouvelle inscription a été enregistrée sur SmartFitCoach.</p>' +
'</td></tr>' +
'<tr><td style="height:30px;"></td></tr>' +
'</table></td></tr></table></body></html>';

  return callResend(resendKey, fromAddress, [ownerEmail], 'Nouvelle inscription — ' + safeFirst + ' ' + safeLast, html);
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

    // Emails — best-effort : un échec d'envoi ne bloque pas l'inscription
    var mailResult;
    try { mailResult = await sendEmail(email, firstName); }
    catch (mailErr) {
      console.error('[preregister] Email send exception:', mailErr && mailErr.message);
      mailResult = { sent: false, reason: 'exception' };
    }

    // Notification propriétaire — best-effort indépendant
    try { await sendOwnerNotification(firstName, lastName, email, phone); }
    catch (ownerErr) {
      console.error('[preregister] Owner notification exception:', ownerErr && ownerErr.message);
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
