// netlify/functions/feedback.js
// Reçoit les feedbacks in-app et les transfère via Resend à smartfitcoach@proton.me

var DEST_EMAIL = 'smartfitcoach@proton.me';

var ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://smartfitcoach.netlify.app,https://smartfitcoach.fr,https://www.smartfitcoach.fr,https://smartfitcoach.fitness,https://www.smartfitcoach.fitness')
  .split(',').map(function(o){ return o.trim(); });
ALLOWED_ORIGINS.push('http://localhost:8888', 'http://127.0.0.1:3000', 'http://localhost:3000');

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.indexOf(origin) !== -1) return true;
  if (/^https:\/\/[a-z0-9-]+--smartfitcoach\.netlify\.app$/.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.netlify\.app$/.test(origin)) return true;
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

var _rateLimit = new Map();
var RATE_WINDOW_MS = 60 * 60 * 1000; // 1h
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
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
    .replace(/\n/g, '<br>');
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
    return { statusCode: 429, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Trop de retours envoyés. Merci de patienter.' }) };
  }

  var body;
  try { body = JSON.parse(event.body || '{}'); }
  catch (_) { return { statusCode: 400, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Corps invalide' }) }; }

  var message = String(body.message || '').trim().slice(0, 2000);
  var page    = String(body.page    || '').slice(0, 100);
  var version = String(body.version || 'unknown').slice(0, 30);
  var ua      = String(body.ua      || '').slice(0, 300);

  if (!message || message.length < 3) {
    return { statusCode: 400, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Message trop court.' }) };
  }

  var resendKey   = process.env.RESEND_API_KEY;
  var fromAddress = process.env.RESEND_FROM_EMAIL || 'SmartFitCoach <noreply@smartfitcoach.fitness>';

  if (!resendKey) {
    console.warn('[feedback] RESEND_API_KEY absent');
    return { statusCode: 503, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Service email non configuré.' }) };
  }

  var subject = 'Feedback SFC — ' + message.slice(0, 60).replace(/\n/g, ' ') + (message.length > 60 ? '…' : '');

  var html =
    '<!DOCTYPE html><html><body style="font-family:Helvetica Neue,Arial,sans-serif;background:#F5F5F0;padding:24px">' +
    '<div style="max-width:560px;margin:0 auto;background:#fff;padding:32px">' +
    '<p style="font-family:Georgia,serif;font-size:20px;font-style:italic;margin:0 0 24px">Nouveau feedback</p>' +
    '<div style="border-left:3px solid #E86F1E;padding:12px 16px;background:#FDF6EF;margin-bottom:24px;font-size:15px;line-height:1.7;color:#1A1A1A">' +
    escapeHtml(message) +
    '</div>' +
    '<table style="width:100%;border-collapse:collapse;font-size:12px;color:#6B6B65">' +
    (page    ? '<tr><td style="padding:4px 0;width:80px">Écran</td><td>' + escapeHtml(page)    + '</td></tr>' : '') +
    (version ? '<tr><td style="padding:4px 0">Version</td><td>'    + escapeHtml(version) + '</td></tr>' : '') +
    (ua      ? '<tr><td style="padding:4px 0">Appareil</td><td>'   + escapeHtml(ua)      + '</td></tr>' : '') +
    '<tr><td style="padding:4px 0">Date</td><td>' + new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }) + '</td></tr>' +
    '</table>' +
    '</div></body></html>';

  var res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: fromAddress, to: [DEST_EMAIL], subject: subject, html: html })
  });

  if (!res.ok) {
    var errText = await res.text().catch(function(){ return ''; });
    console.error('[feedback] Resend error:', res.status, errText);
    return { statusCode: 502, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Échec envoi email.' }) };
  }

  return { statusCode: 200, headers: corsHeaders(origin), body: JSON.stringify({ success: true }) };
};
