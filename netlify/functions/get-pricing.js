'use strict';
const { createClient } = require('@supabase/supabase-js');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  // Dev / CI sans credentials — retourne tableau vide, l'app utilise les prix par défaut
  if (!url || !key) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, data: [] }) };
  }

  try {
    const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await client
      .from('pricing_config')
      .select('tier, duration, price_mad, price_eur, label_mad, label_eur, savings_pct, visible')
      .eq('visible', true)
      .order('tier')
      .order('duration');

    if (error) throw error;

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ ok: true, data: data || [] })
    };
  } catch (e) {
    console.warn('[get-pricing] error:', e && e.message);
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ ok: true, data: [] })
    };
  }
};
