// netlify/functions/admin-update-subscription.js
// Admin-only: writes subscription_plan + subscription_end on a profile.
// Service role bypasses RLS so the write succeeds even though the user's
// own UPDATE policy forbids modifying these two columns.

const { corsHeaders, requireAdmin } = require('./_admin-auth.js');

// Tier-based values (new) + legacy duration-based values (backward compat)
var VALID_PLANS = ['trial', 'athlete', 'champion', 'legende', 'unlimited', '1m', '3m', '6m', '12m'];
var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

exports.handler = async function(event) {
  var origin = event.headers.origin || event.headers.Origin || '';
  var headers = corsHeaders(origin, 'POST');

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  var gate = await requireAdmin(event);
  if (gate.error) {
    return { statusCode: gate.error.statusCode, headers: headers, body: JSON.stringify({ error: gate.error.msg }) };
  }

  var body;
  try { body = JSON.parse(event.body || '{}'); }
  catch (e) { return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  var userId = body.userId;
  var plan = body.plan;
  var endDate = body.end || body.endDate;

  if (!userId || !UUID_RE.test(userId)) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Invalid userId' }) };
  }
  if (VALID_PLANS.indexOf(plan) === -1) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Invalid plan' }) };
  }
  if (plan === 'unlimited') endDate = '2099-12-31';
  if (!endDate || !DATE_RE.test(endDate)) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Invalid end date (expected YYYY-MM-DD)' }) };
  }

  try {
    var result = await gate.admin
      .from('profiles')
      .update({
        subscription_plan: plan,
        subscription_end: endDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (result.error) {
      console.error('[admin-update-subscription] DB error:', result.error.message);
      return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'DB write failed' }) };
    }
    return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true, userId: userId, plan: plan, end: endDate }) };
  } catch (e) {
    console.error('[admin-update-subscription] error:', e);
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
