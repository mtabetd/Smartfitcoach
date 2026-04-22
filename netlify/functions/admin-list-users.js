// netlify/functions/admin-list-users.js
// Returns every profile row. Admin-only. Service role bypasses RLS.

const { corsHeaders, requireAdmin } = require('./_admin-auth.js');

exports.handler = async function(event) {
  var origin = event.headers.origin || event.headers.Origin || '';
  var headers = corsHeaders(origin, 'GET');

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: headers, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  var gate = await requireAdmin(event);
  if (gate.error) {
    return { statusCode: gate.error.statusCode, headers: headers, body: JSON.stringify({ error: gate.error.msg }) };
  }

  try {
    var result = await gate.admin
      .from('profiles')
      .select('id, email, name, data, subscription_plan, subscription_end, updated_at')
      .order('updated_at', { ascending: false });

    if (result.error) {
      return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'DB error' }) };
    }
    return { statusCode: 200, headers: headers, body: JSON.stringify({ users: result.data || [] }) };
  } catch (e) {
    console.error('[admin-list-users] error:', e);
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
