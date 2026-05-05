// netlify/functions/register.js
// Server-side registration with strong password enforcement.
// Validates password strength before proxying to Supabase auth.signUp()
// so that the rules cannot be bypassed by calling Supabase directly.
'use strict';

const { createClient } = require('@supabase/supabase-js');

// Anon key is intentionally public (same key exposed in client JS bundle).
// Using anon key (not service key) preserves email confirmation flow exactly.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uwaoxkgsgbzohakzgyvq.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3YW94a2dzZ2J6b2hha3pneXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODUxMjUsImV4cCI6MjA5MDQ2MTEyNX0.N2ohXmi6ctG322205S0yE2UaE4fS43QCc8xBhO9iVyo';

// Mirrors isValidPassword() in app-core.js — single authoritative rule set
function isValidPassword(pw) {
  if (!pw || typeof pw !== 'string') return false;
  if (pw.length < 6 || pw.length > 128) return false;
  if (!/[A-Z]/.test(pw)) return false;
  if (!/[0-9]/.test(pw)) return false;
  if (!/[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(pw)) return false;
  return true;
}

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ||
  'https://smartfitcoach.netlify.app,https://smartfitcoach.fr,https://www.smartfitcoach.fr,https://smartfitcoach.fitness,https://www.smartfitcoach.fitness')
  .split(',').map(function(s) { return s.trim(); });
ALLOWED_ORIGINS.push('http://localhost:8888', 'http://localhost:3000', 'http://127.0.0.1:3000');

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.indexOf(origin) !== -1) return true;
  if (/^https:\/\/[a-z0-9-]+--smartfitcoach\.netlify\.app$/.test(origin)) return true;
  return false;
}

function getCorsHeaders(event) {
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || '';
  const allowed = isAllowedOrigin(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? (origin || ALLOWED_ORIGINS[0]) : 'null',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}

exports.handler = async function(event) {
  const headers = getCorsHeaders(event);

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Corps de requête invalide.' }) };
  }

  const { name, email, password, extra } = body;
  const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const trimmedName  = typeof name  === 'string' ? name.trim().slice(0, 50)   : '';

  if (!trimmedEmail || !password) {
    return { statusCode: 422, headers, body: JSON.stringify({ error: 'Email et mot de passe obligatoires.' }) };
  }

  // SERVER-SIDE password validation — cannot be bypassed by frontend JS tricks
  if (!isValidPassword(password)) {
    return {
      statusCode: 422,
      headers,
      body: JSON.stringify({
        error: 'Le mot de passe doit contenir au moins 6 caractères, une majuscule, un chiffre et un caractère spécial.'
      })
    };
  }

  const metadata = { name: trimmedName };
  if (extra && typeof extra.nom   === 'string') metadata.nom   = extra.nom.trim().slice(0, 100);
  if (extra && typeof extra.phone === 'string') metadata.phone = extra.phone.trim().slice(0, 30);

  // Use anon-key client: email confirmation email is sent automatically (same as direct signUp)
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  let data, error;
  try {
    const result = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: { data: metadata }
    });
    data  = result.data;
    error = result.error;
  } catch (err) {
    console.error('[register] Supabase exception:', err && err.message);
    return { statusCode: 503, headers, body: JSON.stringify({ error: 'Service temporairement indisponible. Réessayez.' }) };
  }

  if (error) {
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('already registered') || msg.includes('email already')) {
      return { statusCode: 422, headers, body: JSON.stringify({ error: 'Un compte existe déjà avec cet email.' }) };
    }
    return { statusCode: 422, headers, body: JSON.stringify({ error: error.message || 'Erreur lors de la création du compte.' }) };
  }

  if (!data || !data.user) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Erreur inattendue. Réessayez.' }) };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      user: { id: data.user.id, email: data.user.email },
      needsConfirmation: true
    })
  };
};
