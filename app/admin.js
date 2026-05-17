// app/admin.js
// Logic for admin.html. Kept in a separate file because the site-wide CSP
// (script-src 'self') forbids inline <script> blocks and inline event
// handlers. See app/_headers.
//
// No client-side SHA256 gate. Authentication goes through Supabase login,
// and every privileged operation is a fetch() to a Netlify function that
// verifies the caller's JWT + checks ADMIN_EMAILS server-side.

var _client = null;
var _accessToken = null;
var _currentEmail = null;
var _editingUserId = null;

function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(function() { t.style.display = 'none'; }, 3000);
}

function setGateError(msg) {
  document.getElementById('gate-error').textContent = msg || '';
}

function getClient() {
  if (_client) return _client;
  try {
    if (typeof window.getSupabaseClient === 'function') {
      _client = window.getSupabaseClient();
    }
  } catch(e) {}
  return _client;
}

async function tryLogin() {
  setGateError('');
  var email = (document.getElementById('admin-email').value || '').trim();
  var pw = document.getElementById('admin-pw').value || '';
  if (!email || !pw) { setGateError('Email et mot de passe requis'); return; }

  var c = getClient();
  if (!c) { setGateError('Client Supabase indisponible — rechargez la page'); return; }

  try {
    var res = await c.auth.signInWithPassword({ email: email, password: pw });
    if (res.error || !res.data || !res.data.session) {
      setGateError('Email ou mot de passe invalide');
      return;
    }
    _accessToken = res.data.session.access_token;
    _currentEmail = (res.data.user && res.data.user.email) || email;
    await openApp();
  } catch (e) {
    setGateError('Erreur de connexion : ' + (e.message || 'inconnue'));
  }
}

async function openApp() {
  // Probe the admin endpoint once to confirm this email is actually in
  // ADMIN_EMAILS. Avoids showing the full UI to a regular user who would
  // then hit 403s on every action.
  var r;
  try {
    r = await fetch('/.netlify/functions/admin-list-users', {
      headers: { 'Authorization': 'Bearer ' + _accessToken }
    });
  } catch (e) {
    setGateError('Serveur injoignable. Réessayez dans un instant.');
    return;
  }

  if (r.status === 403) {
    setGateError('Ce compte (' + _currentEmail + ') n\'est pas déclaré admin. Ajoutez-le à ADMIN_EMAILS dans Netlify.');
    await signOut(true);
    return;
  }
  if (r.status === 500) {
    var body = null;
    try { body = await r.json(); } catch(e) {}
    setGateError('Configuration serveur : ' + ((body && body.error) || 'erreur 500'));
    return;
  }
  if (!r.ok) {
    setGateError('Échec de chargement (HTTP ' + r.status + ')');
    return;
  }

  document.getElementById('admin-gate').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  document.getElementById('who').textContent = _currentEmail || '';

  var json = await r.json();
  renderUsers(json.users || []);
}

async function signOut(silent) {
  var c = getClient();
  if (c) {
    try { await c.auth.signOut(); } catch(e) {}
  }
  _accessToken = null;
  _currentEmail = null;
  if (!silent) {
    document.getElementById('app').style.display = 'none';
    document.getElementById('admin-gate').style.display = 'flex';
    document.getElementById('admin-pw').value = '';
  }
}

// ── LOAD USERS ──
async function loadUsers() {
  if (!_accessToken) return;
  try {
    var r = await fetch('/.netlify/functions/admin-list-users', {
      headers: { 'Authorization': 'Bearer ' + _accessToken }
    });
    if (r.status === 401) { showToast('Session expirée, reconnectez-vous'); return signOut(); }
    if (!r.ok) { showToast('Échec du chargement (HTTP ' + r.status + ')'); return; }
    var json = await r.json();
    renderUsers(json.users || []);
  } catch (e) {
    showToast('Erreur: ' + (e.message || 'inconnue'));
  }
}

function renderUsers(users) {
  var tbody = document.getElementById('users-body');
  tbody.innerHTML = '';

  var now = new Date();
  var statsTrials = 0, statsActive = 0, statsExpired = 0, statsUnlimited = 0;

  users.forEach(function(user) {
    var profile = user.data || {};
    // Prefer the server-authoritative columns; fall back to the legacy
    // JSONB for pre-migration rows until every profile is backfilled.
    var subEnd  = user.subscription_end  || profile.subscriptionEnd  || null;
    var subPlan = user.subscription_plan || profile.subscriptionPlan || null;
    var firstLogin = profile.firstLoginDate || null;

    // Build the badge as a real DOM element — subPlan originates from
    // user-writable JSONB on legacy rows, so string-concat + innerHTML
    // would enable stored XSS against the admin. Use textContent.
    var status, badgeEl = document.createElement('span');
    badgeEl.className = 'badge';
    if (subPlan === 'unlimited') {
      status = 'unlimited';
      badgeEl.classList.add('badge-unlimited');
      badgeEl.textContent = 'Illimité';
      statsUnlimited++;
    } else if (subEnd && new Date(subEnd) > now) {
      status = 'active';
      badgeEl.classList.add('badge-active');
      badgeEl.textContent = 'Actif · ' + (subPlan || '');
      statsActive++;
    } else if (firstLogin) {
      var trialEnd = new Date(firstLogin);
      trialEnd.setUTCDate(trialEnd.getUTCDate() + 7);
      if (trialEnd > now) {
        var daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
        status = 'trial';
        badgeEl.classList.add('badge-trial');
        badgeEl.textContent = 'Trial · ' + daysLeft + 'j restants';
        statsTrials++;
      } else {
        status = 'expired';
        badgeEl.classList.add('badge-expired');
        badgeEl.textContent = 'Expiré';
        statsExpired++;
      }
    } else {
      status = 'trial';
      badgeEl.classList.add('badge-trial');
      badgeEl.textContent = 'Nouveau';
      statsTrials++;
    }

    var tr = document.createElement('tr');
    function _td(text) { var td = document.createElement('td'); td.textContent = text || '—'; return td; }
    tr.appendChild(_td(profile.prenom || user.name));
    tr.appendChild(_td(user.email));
    tr.appendChild(_td(firstLogin));
    var badgeTd = document.createElement('td'); badgeTd.appendChild(badgeEl); tr.appendChild(badgeTd);
    tr.appendChild(_td(subPlan === 'unlimited' ? '∞' : subEnd));
    var actionTd = document.createElement('td');
    var actionBtn = document.createElement('button');
    actionBtn.className = 'btn-sm';
    actionBtn.textContent = 'Gérer';
    actionBtn.onclick = (function(uid, uname, uplan, uend) { return function() { openModal(uid, uname, uplan, uend); }; })(user.id, profile.prenom || user.name || '', subPlan || '', subEnd || '');
    actionTd.appendChild(actionBtn);
    tr.appendChild(actionTd);
    tbody.appendChild(tr);
  });

  document.getElementById('user-count').textContent = users.length + ' ' + window.locPlural(users.length, {fr:{one:'utilisateur',other:'utilisateurs'},en:{one:'user',other:'users'}});

  // Stats block: all values are trusted integers, safe to inline.
  document.getElementById('stats').innerHTML =
    '<div class="stat-card"><div class="stat-val">' + users.length + '</div><div class="stat-label">Total</div></div>' +
    '<div class="stat-card"><div class="stat-val">' + statsTrials + '</div><div class="stat-label">Trials</div></div>' +
    '<div class="stat-card"><div class="stat-val">' + statsActive + '</div><div class="stat-label">Actifs</div></div>' +
    '<div class="stat-card"><div class="stat-val">' + statsUnlimited + '</div><div class="stat-label">Illimités</div></div>' +
    '<div class="stat-card"><div class="stat-val">' + statsExpired + '</div><div class="stat-label">Expirés</div></div>';
}

// ── MODAL ──
// Legacy plan values from older records: '1m','3m','6m','12m' → map to tier 'athlete'
var _LEGACY_DURATIONS = { '1m': '1m', '3m': '3m', '6m': '6m', '12m': '12m' };
var _TIER_VALUES = ['trial', 'athlete', 'champion', 'legende', 'unlimited'];

function _updateDateFromDuration() {
  var tier = document.getElementById('modal-tier').value;
  var dur  = document.getElementById('modal-duration').value;
  var durationField = document.getElementById('modal-duration-field');

  if (tier === 'unlimited') {
    durationField.style.display = 'none';
    document.getElementById('modal-date').value = '2099-12-31';
    return;
  }
  if (tier === 'trial') {
    durationField.style.display = 'none';
    var t = new Date();
    t.setUTCDate(t.getUTCDate() + 7);
    document.getElementById('modal-date').value = t.toISOString().slice(0, 10);
    return;
  }
  durationField.style.display = 'block';
  var d = new Date();
  if (dur === '1m')  d.setMonth(d.getMonth() + 1);
  else if (dur === '3m')  d.setMonth(d.getMonth() + 3);
  else if (dur === '6m')  d.setMonth(d.getMonth() + 6);
  else if (dur === '12m') d.setFullYear(d.getFullYear() + 1);
  document.getElementById('modal-date').value = d.toISOString().slice(0, 10);
}

function openModal(userId, name, currentPlan, currentEnd) {
  _editingUserId = userId;
  document.getElementById('modal-title').textContent = 'Abonnement · ' + (name || userId);

  var tierEl = document.getElementById('modal-tier');
  var durEl  = document.getElementById('modal-duration');

  // Detect legacy duration-as-plan (e.g. '3m') vs new tier values
  if (currentPlan && _LEGACY_DURATIONS[currentPlan]) {
    tierEl.value = 'athlete';   // default tier for legacy records
    durEl.value  = currentPlan;
  } else if (currentPlan && _TIER_VALUES.indexOf(currentPlan) !== -1) {
    tierEl.value = currentPlan;
    durEl.value  = '3m';        // sensible default duration
  } else {
    tierEl.value = 'trial';
    durEl.value  = '3m';
  }

  // If we have an existing end date, keep it; otherwise compute from duration
  if (currentEnd) {
    document.getElementById('modal-date').value = currentEnd;
    var durationField = document.getElementById('modal-duration-field');
    durationField.style.display = (tierEl.value === 'trial' || tierEl.value === 'unlimited') ? 'none' : 'block';
  } else {
    _updateDateFromDuration();
  }

  document.getElementById('modal').classList.add('open');

  tierEl.onchange = _updateDateFromDuration;
  durEl.onchange  = _updateDateFromDuration;
}

function closeModal() {
  _editingUserId = null;
  document.getElementById('modal').classList.remove('open');
}

async function saveSubscription() {
  if (!_editingUserId || !_accessToken) return;
  var plan = document.getElementById('modal-tier').value;
  var endDate = document.getElementById('modal-date').value;
  if (plan === 'unlimited') endDate = '2099-12-31';

  try {
    var r = await fetch('/.netlify/functions/admin-update-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + _accessToken
      },
      body: JSON.stringify({ userId: _editingUserId, plan: plan, end: endDate })
    });
    if (r.status === 401) { showToast('Session expirée'); return signOut(); }
    var json = null; try { json = await r.json(); } catch(e) {}
    if (!r.ok) {
      showToast('Erreur: ' + ((json && json.error) || ('HTTP ' + r.status)));
      return;
    }
    showToast('Abonnement mis à jour');
    closeModal();
    loadUsers();
  } catch (e) {
    showToast('Erreur: ' + (e.message || 'inconnue'));
  }
}

// ── BOOT ──
// CSP forbids inline event handlers — wire everything up via JS.
document.addEventListener('DOMContentLoaded', function() {
  var btnLogin       = document.getElementById('btn-login');
  var btnSignOut     = document.getElementById('btn-signout');
  var btnRefresh     = document.getElementById('btn-refresh');
  var btnSave        = document.getElementById('btn-save');
  var btnCancel      = document.getElementById('btn-cancel');
  var pw             = document.getElementById('admin-pw');

  if (btnLogin)    btnLogin.addEventListener('click', tryLogin);
  if (btnSignOut)  btnSignOut.addEventListener('click', function(){ signOut(); });
  if (btnRefresh)  btnRefresh.addEventListener('click', loadUsers);
  if (btnSave)     btnSave.addEventListener('click', saveSubscription);
  if (btnCancel)   btnCancel.addEventListener('click', closeModal);
  if (pw)          pw.addEventListener('keydown', function(e) { if (e.key === 'Enter') tryLogin(); });

  // Auto-login if session already present (e.g. refresh)
  var c = getClient();
  if (c) {
    c.auth.getSession().then(function(r) {
      if (r && r.data && r.data.session) {
        _accessToken = r.data.session.access_token;
        _currentEmail = (r.data.session.user && r.data.session.user.email) || null;
        openApp();
      }
    }).catch(function(){});
  }
});
