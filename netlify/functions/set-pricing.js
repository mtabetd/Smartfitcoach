'use strict';
// netlify/functions/set-pricing.js
// Admin-only endpoint — upsert one or more rows in the pricing_config table.
// Requires a valid Supabase JWT whose email is in ADMIN_EMAILS (server-side check via _admin-auth.js).
// POST body: { rows: [ { tier, duration, price_mad, price_eur, label_mad, label_eur, savings_pct, visible }, ... ] }

const { requireAdmin, corsHeaders } = require('./_admin-auth');

// Validate a single pricing row — reject any unknown fields / bad types before
// touching the DB, so a mis-typed payload fails loud rather than silently.
function validateRow(row) {
  if (!row || typeof row !== 'object') return 'invalid row';
  var validTiers     = ['athlete', 'champion', 'legende'];
  var validDurations = ['saison', 'cycle', 'engagement'];
  if (validTiers.indexOf(row.tier)         === -1) return 'invalid tier: ' + row.tier;
  if (validDurations.indexOf(row.duration) === -1) return 'invalid duration: ' + row.duration;
  if (typeof row.price_mad !== 'number' || row.price_mad < 0) return 'price_mad must be a non-negative number';
  if (row.price_eur !== undefined && row.price_eur !== null && typeof row.price_eur !== 'number') return 'price_eur must be a number or null';
  if (row.savings_pct !== undefined && row.savings_pct !== null && typeof row.savings_pct !== 'number') return 'savings_pct must be a number or null';
  if (row.visible !== undefined && typeof row.visible !== 'boolean') return 'visible must be boolean';
  var strFields = ['label_mad', 'label_eur'];
  for (var i = 0; i < strFields.length; i++) {
    var f = strFields[i];
    if (row[f] !== undefined && row[f] !== null && typeof row[f] !== 'string') return f + ' must be a string or null';
    if (typeof row[f] === 'string' && row[f].length > 40) return f + ' too long (max 40 chars)';
  }
  return null;
}

exports.handler = async function(event) {
  var origin = event.headers.origin || event.headers.Origin || '';
  var cors = corsHeaders(origin, 'POST');

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  var auth = await requireAdmin(event);
  if (auth.error) {
    return {
      statusCode: auth.error.statusCode,
      headers: cors,
      body: JSON.stringify({ error: auth.error.msg })
    };
  }

  var body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  var rows = body.rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'rows must be a non-empty array' }) };
  }
  if (rows.length > 20) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Too many rows (max 20)' }) };
  }

  // Validate all rows before touching the DB.
  for (var i = 0; i < rows.length; i++) {
    var err = validateRow(rows[i]);
    if (err) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Row ' + i + ': ' + err }) };
    }
  }

  // Build clean records (no extra fields that could smuggle unknown columns).
  var records = rows.map(function(row) {
    var rec = {
      tier:        row.tier,
      duration:    row.duration,
      price_mad:   row.price_mad,
      visible:     row.visible !== false
    };
    if (row.price_eur !== undefined)  rec.price_eur  = row.price_eur  === null ? null : Number(row.price_eur);
    if (row.label_mad !== undefined)  rec.label_mad  = row.label_mad  || null;
    if (row.label_eur !== undefined)  rec.label_eur  = row.label_eur  || null;
    if (row.savings_pct !== undefined) rec.savings_pct = row.savings_pct === null ? null : Number(row.savings_pct);
    return rec;
  });

  try {
    var { error } = await auth.admin
      .from('pricing_config')
      .upsert(records, { onConflict: 'tier,duration' });

    if (error) throw error;

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ ok: true, updated: records.length })
    };
  } catch (e) {
    console.error('[set-pricing] DB error:', e && e.message);
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: 'Database error: ' + (e && e.message || 'unknown') })
    };
  }
};
