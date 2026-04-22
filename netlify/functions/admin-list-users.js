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

    // Project only the JSONB fields the admin UI actually renders. Full
    // profiles.data contains weight history, medical flags, progress
    // photos (base64), PARQ answers — admin-reading is allowed but
    // unnecessary, and Netlify 5xx logs could retain the body.
    var slim = (result.data || []).map(function(u) {
      var d = u.data || {};
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        subscription_plan: u.subscription_plan,
        subscription_end: u.subscription_end,
        updated_at: u.updated_at,
        data: {
          prenom: d.prenom || null,
          firstLoginDate: d.firstLoginDate || null,
          // Legacy fallback so pre-migration rows still render the
          // right badge while the admin is reviewing them.
          subscriptionPlan: d.subscriptionPlan || null,
          subscriptionEnd: d.subscriptionEnd || null
        }
      };
    });

    return { statusCode: 200, headers: headers, body: JSON.stringify({ users: slim }) };
  } catch (e) {
    console.error('[admin-list-users] error:', e);
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
