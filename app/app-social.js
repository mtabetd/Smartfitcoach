/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
/* ═══════════════════════════════════════════════════════════════
   APP-SOCIAL.JS — Projet 2.0 Phase A
   Pseudo + amis par email + feed privé + likes + commentaires
   Notifications in-app uniquement (pas de push)
   Tout passe par RLS Supabase — aucune donnée sans friendship acceptée
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';

// ══════════════════════════════════════════════════════════════
// CONSTANTES
// ══════════════════════════════════════════════════════════════
var PSEUDO_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;
var RESERVED_PSEUDOS = [
  'admin','smartfit','smartfitcoach','support','coach','system','mod',
  'moderateur','moderator','null','undefined','anonymous','anonyme',
  'deleted','supprime','sfc','root','test','none'
];
// Palette Hermès : or profond + complémentaires sobres
var AVATAR_COLORS = [
  '#C9A84C', // or
  '#8B6914', // bronze profond
  '#2F4F4F', // ardoise
  '#7B3F00', // cuir havane
  '#4682B4', // bleu acier
  '#556B2F', // vert olive
  '#6B3A8A', // prune
  '#B8860B'  // or antique
];
var MAX_COMMENT_LENGTH = 500;
var MAX_BIO_LENGTH = 160;
var RATE_LIMIT_FRIEND_REQ = 20;       // par 24h
var RATE_LIMIT_COMMENT = 10;          // par heure

// ══════════════════════════════════════════════════════════════
// ÉTAT EN MÉMOIRE (non persisté)
// ══════════════════════════════════════════════════════════════
var _myProfile = null;        // {id, pseudo, avatar_color, sport_main, sport_level, bio}
var _feed = [];               // posts enrichis avec profil auteur + compteurs
var _friends = [];            // [{id, pseudo, avatar_color, ...}]
var _pendingIn = [];          // demandes reçues
var _pendingOut = [];         // demandes envoyées
var _notifications = [];
var _unreadCount = 0;
var _loadingFeed = false;
var _loadingFriends = false;
var _dbReady  = null;         // null = inconnu, true = confirmé, false = dernier essai échoué
var _dbFailTs = 0;            // timestamp du dernier échec — pour le cooldown de retry
var _lastLoad = {};           // throttle par clé
var _rtChannel = null;        // Supabase Realtime channel (feed + notifications)

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════
function db(){ return (window.getSupabaseClient && window.getSupabaseClient()) || null; }
function uid(){ var u = window.AUTH && window.AUTH.getUser(); return u ? u.id : null; }
function isLogged(){ return !!(window.AUTH && window.AUTH.isLoggedIn && window.AUTH.isLoggedIn()); }
function now(){ return Date.now(); }

function sanitizeText(s){
  if (typeof s !== 'string') return '';
  // Supprime les caractères de contrôle, garde tout le reste (Unicode OK)
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

function escapeHtml(s){
  if (s == null) return '';
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function colorForId(id){
  if (!id) return AVATAR_COLORS[0];
  var sum = 0;
  for (var i=0; i<id.length; i++) sum += id.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function timeAgo(iso){
  if (!iso) return '';
  var then, nowMs;
  try { then = new Date(iso).getTime(); } catch(e){ return ''; }
  if (!then || isNaN(then)) return '';
  nowMs = now();
  var diff = Math.max(0, Math.floor((nowMs - then) / 1000));
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return 'il y a ' + Math.floor(diff/60) + ' min';
  if (diff < 86400) return 'il y a ' + Math.floor(diff/3600) + ' h';
  if (diff < 604800) return 'il y a ' + Math.floor(diff/86400) + ' j';
  try { return window.formatDate(iso, {day:'2-digit', month:'short'}); }
  catch(e){ return ''; }
}

// Validation pseudo (côté client — le serveur fait aussi via CHECK + UNIQUE)
function validatePseudoFormat(p){
  if (typeof p !== 'string') return { ok:false, reason:'Pseudo invalide.' };
  var t = p.trim();
  if (t.length < 3) return { ok:false, reason:'Minimum 3 caractères.' };
  if (t.length > 20) return { ok:false, reason:'Maximum 20 caractères.' };
  if (!PSEUDO_REGEX.test(t)) return { ok:false, reason:'Lettres, chiffres, _ et - uniquement.' };
  if (RESERVED_PSEUDOS.indexOf(t.toLowerCase()) !== -1) return { ok:false, reason:'Ce pseudo est réservé.' };
  return { ok:true };
}

// Rate limiting client-side (complément du serveur)
function rateLimitCheck(key, max, windowMs){
  try {
    var storeKey = 'sfc_rl_' + key + '_' + (uid()||'anon');
    var raw = localStorage.getItem(storeKey);
    var arr = raw ? JSON.parse(raw) : [];
    var nowMs = now();
    arr = arr.filter(function(t){ return nowMs - t < windowMs; });
    if (arr.length >= max) return false;
    arr.push(nowMs);
    localStorage.setItem(storeKey, JSON.stringify(arr));
    return true;
  } catch(e){ return true; /* fail-open en cas d'erreur storage */ }
}

// Détecte si les tables sociales sont accessibles.
// true  → mis en cache définitivement (la table ne disparaît pas).
// false → jamais mis en cache définitivement : retry après 30 s ou au retour
//         en premier plan, pour ne pas bloquer l'onglet Social sur un glitch réseau.
var DB_RETRY_MS = 30000;
function probeDb(){
  if (_dbReady === true) return Promise.resolve(true);
  if (_dbReady === false && (Date.now() - _dbFailTs) < DB_RETRY_MS) {
    return Promise.resolve(false);
  }
  _dbReady = null;
  var c = db();
  if (!c) { _dbReady = false; _dbFailTs = Date.now(); return Promise.resolve(false); }
  return c.from('social_profiles').select('id').limit(1).then(function(r){
    if (r.error) { _dbReady = false; _dbFailTs = Date.now(); return false; }
    _dbReady = true;
    return true;
  }).catch(function(){ _dbReady = false; _dbFailTs = Date.now(); return false; });
}

// ══════════════════════════════════════════════════════════════
// PROFIL SOCIAL — CRUD
// ══════════════════════════════════════════════════════════════
async function fetchMyProfile(){
  var c = db(); if (!c) return null;
  var id = uid(); if (!id) return null;
  try {
    var r = await c.from('social_profiles').select('*').eq('id', id).maybeSingle();
    if (r.error) { console.warn('[SOCIAL] fetchMyProfile error', r.error.message); return null; }
    _myProfile = r.data || null;
    return _myProfile;
  } catch(e){ return null; }
}

async function checkPseudoAvailable(pseudo){
  var c = db(); if (!c) return { ok:false, reason:'Connexion indisponible.' };
  var vf = validatePseudoFormat(pseudo);
  if (!vf.ok) return { ok:false, reason: vf.reason };
  try {
    var r = await c.from('social_profiles').select('id').eq('pseudo_lower', pseudo.toLowerCase()).limit(1);
    if (r.error) return { ok:false, reason:'Erreur de vérification.' };
    if (r.data && r.data.length > 0){
      // Si c'est notre propre pseudo (profil déjà créé), c'est OK
      if (_myProfile && _myProfile.pseudo_lower === pseudo.toLowerCase()) return { ok:true };
      return { ok:false, reason:'Ce pseudo est déjà pris.' };
    }
    return { ok:true };
  } catch(e){ return { ok:false, reason:'Erreur réseau.' }; }
}

async function createOrUpdateProfile(fields){
  var c = db(); if (!c) throw new Error('db_unavailable');
  var id = uid(); if (!id) throw new Error('not_logged');
  var payload = { id: id };
  if (fields.pseudo)       payload.pseudo = sanitizeText(fields.pseudo);
  if (fields.avatar_color) payload.avatar_color = fields.avatar_color;
  if (fields.avatar_url !== undefined)  payload.avatar_url = fields.avatar_url; // null possible = retirer
  if (fields.sport_main !== undefined)  payload.sport_main = fields.sport_main;
  if (fields.sport_level !== undefined) payload.sport_level = fields.sport_level;
  if (fields.bio !== undefined) payload.bio = String(fields.bio || '').slice(0, MAX_BIO_LENGTH);
  var r = await c.from('social_profiles').upsert(payload, { onConflict:'id' }).select().single();
  if (r.error) throw new Error(r.error.message || 'upsert_failed');
  _myProfile = r.data;
  return _myProfile;
}

function getMyProfileCached(){ return _myProfile; }

// ══════════════════════════════════════════════════════════════
// INIT (appelé après login)
// ══════════════════════════════════════════════════════════════
async function initProfile(){
  if (!isLogged()) return null;
  var ready = await probeDb();
  if (!ready) return null;
  await fetchMyProfile();
  if (_myProfile) {
    // Pré-charge counter notifs non lues pour la pastille
    try { await refreshUnreadCount(); } catch(e){}
  }
  return _myProfile;
}

// Compteur notifs non lues (pastille)
async function refreshUnreadCount(){
  var c = db(); if (!c) return 0;
  var me = uid(); if (!me) return 0;
  try {
    var r = await c.from('social_notifications').select('id', { count:'exact', head:true })
      .eq('user_id', me).eq('read', false);
    if (r.error) return 0;
    _unreadCount = r.count || 0;
    return _unreadCount;
  } catch(e){ return 0; }
}

function getUnreadCountCached(){ return _unreadCount; }

async function loadNotifications(limit){
  var c = db(); if (!c) return [];
  var me = uid(); if (!me) return [];
  var r = await c.from('social_notifications').select('*')
    .eq('user_id', me).order('created_at', { ascending:false }).limit(limit || 30);
  if (r.error) return [];
  var rows = r.data || [];
  if (!rows.length){ _notifications = []; return []; }
  var ids = {};
  rows.forEach(function(x){ if (x.actor_id) ids[x.actor_id] = 1; });
  var list = Object.keys(ids);
  var profs = {};
  if (list.length){
    var rp = await c.from('social_profiles').select('id,pseudo,avatar_color,avatar_url').in('id', list);
    (rp.data || []).forEach(function(p){ profs[p.id] = p; });
  }
  _notifications = rows.map(function(x){
    return Object.assign({}, x, { _actor: profs[x.actor_id] || { pseudo:'Membre SmartFit', avatar_color:'#888' } });
  });
  return _notifications;
}

async function markAllRead(){
  var c = db(); if (!c) return;
  var me = uid(); if (!me) return;
  var r = await c.from('social_notifications').update({ read:true })
    .eq('user_id', me).eq('read', false);
  if (!r.error){ _unreadCount = 0; _notifications.forEach(function(n){ n.read = true; }); }
}

function getNotificationsCached(){ return _notifications.slice(); }

// ══════════════════════════════════════════════════════════════
// UI HELPERS
// ══════════════════════════════════════════════════════════════
function _h(tag, attrs, ch){ return window.h(tag, attrs, ch); }

function _initials(pseudo){
  if (!pseudo) return '?';
  var p = String(pseudo).trim();
  if (!p) return '?';
  // Premier caractère alphanumérique majuscule + second si dispo
  var first = p[0].toUpperCase();
  var second = p.length > 1 ? p[1].toLowerCase() : '';
  return first + second;
}

function _avatar(profile, size){
  size = size || 40;
  var photoUrl = profile && profile.avatar_url;
  // Photo si disponible — sinon initiales sur fond couleur
  if (photoUrl) {
    var safeUrl = String(photoUrl).replace(/"/g, '%22');
    return _h('div', {
      'class': 'sfc-avatar sfc-avatar-photo',
      'aria-hidden': 'true',
      style: 'width:'+size+'px;height:'+size+'px;border-radius:0;'+
        'background-image:url("'+safeUrl+'");background-size:cover;background-position:center;'+
        'background-color:#F4F1EA;flex-shrink:0;border:1px solid var(--line,#D8D8D0);'
    });
  }
  var color = (profile && profile.avatar_color) || colorForId(profile && profile.id || '');
  var initials = _initials(profile && profile.pseudo);
  return _h('div', {
    'class': 'sfc-avatar',
    'aria-hidden': 'true',
    style: 'width:'+size+'px;height:'+size+'px;border-radius:0;background:'+color+
      ';color:#FAF9F6;display:flex;align-items:center;justify-content:center;'+
      'font-family:Georgia,serif;font-size:'+Math.round(size*0.38)+'px;font-weight:400;'+
      'font-feature-settings:"onum" 1;letter-spacing:0.02em;flex-shrink:0;'+
      'user-select:none;text-transform:uppercase;border:1px solid rgba(0,0,0,0.08);'
  }, initials);
}

// Thumbnail carré JPEG — 128×128 qualité 70% → ~8-15KB data URL
function _makeThumbnail(dataUrl, size, quality){
  return new Promise(function(resolve){
    if (!dataUrl) return resolve(null);
    try {
      var img = new Image();
      img.onload = function(){
        var s = size || 128;
        var q = quality != null ? quality : 0.7;
        var canvas = document.createElement('canvas');
        canvas.width = s; canvas.height = s;
        var ctx = canvas.getContext('2d');
        // cover (recadrage centré)
        var scale = Math.max(s / img.width, s / img.height);
        var w = img.width * scale, h = img.height * scale;
        ctx.fillStyle = '#F4F1EA';
        ctx.fillRect(0, 0, s, s);
        ctx.drawImage(img, (s - w)/2, (s - h)/2, w, h);
        try { resolve(canvas.toDataURL('image/jpeg', q)); }
        catch(e){ resolve(null); }
      };
      img.onerror = function(){ resolve(null); };
      img.src = dataUrl;
    } catch(e){ resolve(null); }
  });
}

// Sanitise un prénom en pseudo valide (retire accents, chars invalides)
function _suggestPseudoFromName(name){
  if (!name) return '';
  try {
    return String(name).toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 20);
  } catch(e){ return ''; }
}

function _realNameInitials(){
  var S = window.S;
  var p = S && S.prenom ? String(S.prenom).trim() : '';
  var n = S && S.nom ? String(S.nom).trim() : '';
  if (!p && !n) return '';
  var i1 = p ? p[0] : '';
  var i2 = n ? n[0] : (p && p.length > 1 ? p[1] : '');
  return (i1 + i2).toUpperCase();
}

function _emptyState(title, subtitle, ctaText, ctaCb){
  var wrap = _h('div', { style:'padding:48px 24px;text-align:center;max-width:380px;margin:0 auto' });
  wrap.appendChild(_h('div', {
    style:'font-family:Georgia,serif;font-size:22px;color:var(--black);margin-bottom:12px;letter-spacing:-0.3px'
  }, title));
  if (subtitle) wrap.appendChild(_h('div', {
    style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey);line-height:1.7;margin-bottom:24px;font-weight:300'
  }, subtitle));
  if (ctaText){
    var btn = _h('button', { 'class':'btn-primary', style:'max-width:280px;margin:0 auto', onclick: ctaCb }, ctaText);
    wrap.appendChild(btn);
  }
  return wrap;
}

function _toast(msg, kind){
  if (window.showToast) { window.showToast(msg, kind); return; }
  kind = kind || 'info';
  try {
    var bg = kind === 'error' ? 'var(--error,#7A1F1F)' : (kind === 'success' ? 'var(--success,#3E5C3A)' : 'var(--ink-900,#0A0A09)');
    var el = document.createElement('div');
    el.textContent = msg;
    el.setAttribute('style',
      'position:fixed;bottom:28px;left:50%;transform:translateX(-50%);'+
      'background:'+bg+';color:#FAF9F6;padding:12px 24px;border-radius:2px;'+
      'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;'+
      'text-transform:uppercase;z-index:99999;'+
      'max-width:90vw;text-align:center;opacity:0;transition:opacity .2s ease'
    );
    document.body.appendChild(el);
    requestAnimationFrame(function(){ el.style.opacity = '1'; });
    setTimeout(function(){ el.style.opacity = '0'; setTimeout(function(){ if(el.parentNode)el.parentNode.removeChild(el); }, 250); }, 2600);
  } catch(e){}
}

// Section-label façon Hermès
function _eyebrow(text){
  return _h('div', { 'class':'eyebrow', style:'margin-bottom:12px' }, text);
}

// ══════════════════════════════════════════════════════════════
// UI — SETUP PROFIL (première visite)
// ══════════════════════════════════════════════════════════════
function renderProfileSetup(container){
  container.innerHTML = '';
  var wrap = _h('div', { style:'max-width:520px;margin:0 auto;padding:24px 0' });

  wrap.appendChild(_eyebrow('Projet Social'));
  wrap.appendChild(_h('h1', { style:'font-family:Georgia,serif;font-size:32px;margin-bottom:12px;letter-spacing:-0.5px' },
    'Créez votre identité'));
  wrap.appendChild(_h('p', { 'class':'subtitle' },
    'Votre pseudo est public auprès de vos amis uniquement. Aucune recherche publique, aucun annuaire. Vous seul décidez qui vous ajoute.'));

  var S = window.S;
  // Suggestion pseudo depuis prenom (si pas encore de profil créé)
  var suggested = _suggestPseudoFromName(S && S.prenom);
  if (suggested && suggested.length < 3 && S && S.nom) {
    suggested += _suggestPseudoFromName(S.nom).slice(0, 20 - suggested.length);
  }
  // Photo de profil existante (base64 JPEG) → on crée un thumbnail pour l'avatar social
  var existingPhoto = S && S.profilePhoto ? S.profilePhoto : null;
  var selectedPhotoUrl = null;    // thumbnail base64 (chargé async)
  var usePhoto = !!existingPhoto; // auto-activé si photo dispo

  // Pseudo
  var pseudoVal = (_myProfile && _myProfile.pseudo) || suggested || '';
  var colorVal = (_myProfile && _myProfile.avatar_color) || AVATAR_COLORS[0];

  var pField = _h('div', { 'class':'field', style:'margin-bottom:24px' });
  pField.appendChild(_h('label', { 'class':'field-label' }, 'Pseudo'));
  var pInput = _h('input', {
    type:'text', value: pseudoVal, maxlength:'20', autocomplete:'off',
    placeholder:'mon_pseudo', 'aria-label':'Pseudo', spellcheck:'false'
  });
  pField.appendChild(pInput);
  var hint = _h('div', { style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey3);margin-top:6px;letter-spacing:0.3px', id:'sfc-pseudo-hint' },
    '3–20 caractères · lettres, chiffres, _ et -');
  pField.appendChild(hint);
  wrap.appendChild(pField);

  // Photo de profil (si dispo dans S.profilePhoto)
  if (existingPhoto) {
    wrap.appendChild(_h('div', { 'class':'section-label' }, 'Photo'));
    var photoRow = _h('div', {
      style:'display:flex;align-items:center;gap:16px;padding:14px 16px;background:var(--ivory2);border:1px solid var(--border);border-radius:2px;margin-bottom:24px'
    });
    var photoThumbHolder = _h('div', { style:'flex-shrink:0' });
    var _placeholder = _h('div', {
      style:'width:48px;height:48px;border-radius:0;background:#F4F1EA;'+
        'display:flex;align-items:center;justify-content:center;color:var(--grey3);font-size:10px'
    }, '…');
    photoThumbHolder.appendChild(_placeholder);
    photoRow.appendChild(photoThumbHolder);

    var photoLabel = _h('div', { style:'flex:1;min-width:0' });
    photoLabel.appendChild(_h('div', { style:'font-family:Georgia,serif;font-size:14px;margin-bottom:2px' },
      'Photo de profil détectée'));
    photoLabel.appendChild(_h('div', {
      style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);line-height:1.5'
    }, 'Utilisée comme avatar auprès de vos amis.'));
    photoRow.appendChild(photoLabel);

    var photoToggle = _h('button', {
      type:'button',
      style:'background:transparent;border:1px solid var(--border);padding:8px 12px;border-radius:2px;'+
        'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;'+
        'color:var(--grey);cursor:pointer;flex-shrink:0'
    }, 'Retirer');
    photoToggle.addEventListener('click', function(){
      usePhoto = !usePhoto;
      photoToggle.textContent = usePhoto ? 'Retirer' : 'Utiliser';
      updatePreview();
    });
    photoRow.appendChild(photoToggle);
    wrap.appendChild(photoRow);

    // Génère le thumbnail au chargement
    _makeThumbnail(existingPhoto, 128, 0.7).then(function(thumb){
      selectedPhotoUrl = thumb;
      photoThumbHolder.innerHTML = '';
      photoThumbHolder.appendChild(_avatar({ avatar_url: thumb }, 48));
      updatePreview();
    });
  }

  // Avatar color
  wrap.appendChild(_h('div', { 'class':'section-label' }, 'Couleur d\'avatar' + (existingPhoto ? ' (fallback sans photo)' : '')));
  var palette = _h('div', { style:'display:flex;flex-wrap:wrap;gap:12px;margin-bottom:28px' });
  var selectedColor = colorVal;
  var previewAvatarBox = _h('div', { style:'display:flex;justify-content:center;margin:20px 0 8px' });
  var updatePreview = function(){
    previewAvatarBox.innerHTML = '';
    // Si photo sélectionnée → photo. Sinon initiales depuis pseudo (ou nom réel en fallback)
    var displayPseudo = pInput.value || suggested || _realNameInitials() || '??';
    previewAvatarBox.appendChild(_avatar({
      pseudo: displayPseudo,
      avatar_color: selectedColor,
      avatar_url: usePhoto ? selectedPhotoUrl : null
    }, 72));
  };
  AVATAR_COLORS.forEach(function(col){
    var chip = _h('button', {
      type:'button',
      style:'width:36px;height:36px;border-radius:0;border:2px solid '+
        (col === selectedColor ? '#0A0A09' : 'transparent')+';background:'+col+';'+
        'cursor:pointer;outline:none;transition:transform .15s ease, border-color .15s',
      'aria-label':'Couleur '+col
    });
    chip.addEventListener('click', function(){
      selectedColor = col;
      // Re-render palette highlight
      Array.prototype.forEach.call(palette.children, function(c){
        c.style.borderColor = (c.dataset.col === col) ? '#0A0A09' : 'transparent';
      });
      updatePreview();
    });
    chip.dataset.col = col;
    palette.appendChild(chip);
  });
  wrap.appendChild(palette);
  wrap.appendChild(previewAvatarBox);
  wrap.appendChild(_h('div', {
    style:'text-align:center;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--grey3);margin-bottom:32px'
  }, 'Aperçu'));
  updatePreview();

  // Live validation
  var validateTimer = null;
  var errMsg = _h('div', {
    style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:#7B3F00;min-height:16px;margin-bottom:16px'
  }, '');
  wrap.appendChild(errMsg);
  var submitBtn = _h('button', { 'class':'btn-primary' }, 'Confirmer mon pseudo');
  wrap.appendChild(submitBtn);

  var validating = false;
  function doValidate(){
    var val = pInput.value.trim();
    var vf = validatePseudoFormat(val);
    if (!vf.ok){
      hint.textContent = vf.reason;
      hint.style.color = '#7B3F00';
      submitBtn.disabled = true;
      return;
    }
    hint.textContent = (window.isEnglish && window.isEnglish()) ? 'Checking availability…' : 'Vérification de disponibilité…';
    hint.style.color = 'var(--grey3)';
    submitBtn.disabled = true;
    checkPseudoAvailable(val).then(function(r){
      if (r.ok){
        hint.textContent = (window.isEnglish && window.isEnglish()) ? '✓ Available' : '✓ Disponible';
        hint.style.color = '#556B2F';
        submitBtn.disabled = false;
      } else {
        hint.textContent = r.reason || 'Indisponible';
        hint.style.color = '#7B3F00';
        submitBtn.disabled = true;
      }
    });
  }
  pInput.addEventListener('input', function(){
    clearTimeout(validateTimer);
    submitBtn.disabled = true;
    hint.textContent = (window.isEnglish && window.isEnglish()) ? 'Checking…' : 'Vérification…';
    validateTimer = setTimeout(doValidate, 350);
    updatePreview();
  });
  // Validation initiale si pseudo déjà saisi
  if (pseudoVal) { setTimeout(doValidate, 200); } else { submitBtn.disabled = true; }

  submitBtn.addEventListener('click', async function(){
    if (validating) return;
    validating = true;
    errMsg.textContent = '';
    try {
      var payload = { pseudo: pInput.value.trim(), avatar_color: selectedColor };
      // Inclut la photo thumbnail si sélectionnée
      if (usePhoto && selectedPhotoUrl) payload.avatar_url = selectedPhotoUrl;
      await createOrUpdateProfile(payload);
      _toast((window.isEnglish && window.isEnglish()) ? 'Username confirmed' : 'Pseudo confirmé', 'success');
      // Re-render la vue social (on passe au hub)
      if (window.render) window.render();
    } catch(e){
      errMsg.textContent = e.message === 'duplicate key value violates unique constraint "pseudo_unique"'
        ? 'Ce pseudo est déjà pris.'
        : 'Impossible d\'enregistrer. Réessayez.';
    } finally { validating = false; }
  });

  container.appendChild(wrap);
}

// ══════════════════════════════════════════════════════════════
// UI — HUB PRINCIPAL (feed + amis + notifs)
// ══════════════════════════════════════════════════════════════
function renderSocialHub(container){
  container.innerHTML = '';
  var S = window.S;
  if (!S.socialTab) S.socialTab = 'feed';

  // En-tête : avatar user + pseudo + settings
  var header = _h('div', {
    style:'display:flex;align-items:center;gap:14px;padding:12px 0 20px;border-bottom:1px solid var(--border);margin-bottom:24px'
  });
  header.appendChild(_avatar(_myProfile, 44));
  var hMeta = _h('div', { style:'flex:1' });
  hMeta.appendChild(_h('div', {
    style:'font-family:Georgia,serif;font-size:17px;letter-spacing:-0.2px'
  }, _myProfile.pseudo));
  hMeta.appendChild(_h('div', {
    style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-top:2px'
  }, _friends.length + ' ' + (window.locPlural ? window.locPlural(_friends.length, {fr:{one:'ami',other:'amis'},en:{one:'friend',other:'friends'}}) : (_friends.length > 1 ? 'amis' : 'ami')) + (_pendingIn.length ? ' · ' + _pendingIn.length + ' ' + (window.locPlural ? window.locPlural(_pendingIn.length, {fr:{one:'demande',other:'demandes'},en:{one:'request',other:'requests'}}) : (_pendingIn.length > 1 ? 'demandes' : 'demande')) : '')));
  header.appendChild(hMeta);

  var settingsBtn = _h('button', {
    'aria-label':'Modifier mon profil',
    style:'background:transparent;border:1px solid var(--border);padding:10px 14px;cursor:pointer;'+
      'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;'+
      'text-transform:uppercase;color:var(--grey);border-radius:2px;'+
      'transition:all .25s cubic-bezier(0.25,0.46,0.45,0.94)',
    onmouseover: function(){ this.style.borderColor='var(--black)'; this.style.color='var(--black)'; },
    onmouseout:  function(){ this.style.borderColor='var(--border)'; this.style.color='var(--grey)'; },
    onclick: function(){ S.socialView = 'editProfile'; window.render(); }
  }, 'Modifier');
  header.appendChild(settingsBtn);
  container.appendChild(header);

  // Tabs
  var tabs = _h('div', {
    style:'display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:24px;overflow-x:auto'
  });
  function _tab(key, label, badgeCount){
    var isActive = S.socialTab === key;
    var btn = _h('button', {
      style:'flex:1;min-width:100px;background:none;border:none;padding:14px 12px;cursor:pointer;'+
        'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:3px;'+
        'text-transform:uppercase;color:'+(isActive?'var(--black)':'var(--grey)')+';'+
        'border-bottom:2px solid '+(isActive?'#C9A84C':'transparent')+';'+
        'transition:all .2s ease;position:relative;white-space:nowrap',
      onclick: function(){ S.socialTab = key; window.render(); }
    }, label);
    if (badgeCount){
      var badge = _h('span', {
        style:'display:inline-block;margin-left:6px;background:#C9A84C;color:#FAF9F6;'+
          'font-size:9px;padding:2px 6px;border-radius:8px;letter-spacing:0;font-weight:500'
      }, String(badgeCount));
      btn.appendChild(badge);
    }
    return btn;
  }
  tabs.appendChild(_tab('feed', 'Fil', 0));
  tabs.appendChild(_tab('friends', 'Amis', _pendingIn.length));
  tabs.appendChild(_tab('notifs', 'Activité', _unreadCount));
  container.appendChild(tabs);

  // Contenu onglet
  var body = _h('div');
  container.appendChild(body);

  if (S.socialTab === 'feed') renderFeedTab(body);
  else if (S.socialTab === 'friends') renderFriendsTab(body);
  else if (S.socialTab === 'notifs') renderNotificationsTab(body);
}

// ══════════════════════════════════════════════════════════════
// UI — ONGLET FEED
// ══════════════════════════════════════════════════════════════
function _postTypeLabel(type){
  var _ptEN = window.isEnglish && window.isEnglish();
  if (type === 'workout')  return _ptEN ? 'Session' : 'Séance';
  if (type === 'pr')       return 'Record';
  if (type === 'challenge')return 'Challenge';
  if (type === 'streak')   return _ptEN ? 'Streak' : 'Série';
  return _ptEN ? 'Activity' : 'Activité';
}

function _postSummary(post){
  var d = post.data || {};
  if (post.type === 'workout'){
    var s = d.sport || ((window.isEnglish && window.isEnglish()) ? 'Session' : 'Séance');
    var dur = d.duration ? ' · ' + d.duration + ' min' : '';
    var ex = d.exercises ? ' · ' + d.exercises + ((window.isEnglish && window.isEnglish()) ? ' exercises' : ' exercices') : '';
    return { title: s, sub: (dur + ex).replace(/^ · /, '') };
  }
  if (post.type === 'pr'){
    return { title: d.exercise || ((window.isEnglish && window.isEnglish()) ? 'Personal record' : 'Record personnel'), sub: [d.weight?(d.weight+' '+(d.unit||'kg')):'', d.reps?(d.reps+' reps'):''].filter(Boolean).join(' · ') };
  }
  if (post.type === 'challenge'){
    return { title: d.name || 'Challenge terminé', sub: d.days ? d.days+' jours' : '' };
  }
  if (post.type === 'streak'){
    return { title: (d.days||0) + ' jours de suite', sub: 'Série active' };
  }
  return { title: d.title || 'Activité', sub: d.text || '' };
}

function _postCard(post){
  var me = uid();
  var isMine = post.user_id === me;
  var card = _h('article', {
    style:'background:var(--ivory);border:1px solid var(--border);border-radius:2px;padding:20px;margin-bottom:16px'
  });

  // Header
  var header = _h('div', { style:'display:flex;align-items:center;gap:12px;margin-bottom:16px' });
  header.appendChild(_avatar(post._author, 38));
  var meta = _h('div', { style:'flex:1;min-width:0' });
  meta.appendChild(_h('div', { style:'font-family:Georgia,serif;font-size:14px' }, post._author.pseudo));
  meta.appendChild(_h('div', {
    style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--grey3);margin-top:2px'
  }, timeAgo(post.created_at)));
  header.appendChild(meta);
  if (isMine){
    header.appendChild(_h('button', {
      'aria-label':'Supprimer',
      style:'background:none;border:none;color:var(--grey3);cursor:pointer;font-size:16px;padding:4px 8px',
      onclick: async function(){
        if (!(window.sfcConfirm || confirm)('Supprimer ce post ?')) return;
        try { await deletePost(post.id); _toast((window.isEnglish && window.isEnglish()) ? 'Deleted' : 'Supprimé', 'success'); await loadFeed(); window.render(); }
        catch(e){ _toast('Erreur de suppression', 'error'); }
      }
    }, '×'));
  }
  card.appendChild(header);

  // Type badge — discrète, type "eyebrow Hermès"
  card.appendChild(_h('div', {
    style:'display:inline-block;font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:4px;'+
      'text-transform:uppercase;color:#8B6914;padding:0 0 10px;font-weight:500'
  }, _postTypeLabel(post.type)));

  // Summary
  var sum = _postSummary(post);
  card.appendChild(_h('div', {
    style:'font-family:Georgia,serif;font-size:18px;color:var(--black);letter-spacing:-0.2px;margin-bottom:4px'
  }, sum.title));
  if (sum.sub) card.appendChild(_h('div', {
    style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey);font-weight:300;margin-bottom:14px'
  }, sum.sub));

  // Actions
  var actions = _h('div', {
    style:'display:flex;gap:16px;padding-top:14px;border-top:1px solid var(--border);margin-top:14px'
  });

  var likeBtn = _h('button', {
    style:'background:none;border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;'+
      'color:'+(post._myLike?'#7B3F00':'var(--grey)')+';cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:4px 0',
    'aria-label': post._myLike ? 'Retirer le like' : 'Liker'
  });
  likeBtn.appendChild(_h('span', {'aria-hidden':'true'}, post._myLike ? '♥' : '♡'));
  likeBtn.appendChild(document.createTextNode(' ' + post._likes));
  likeBtn.addEventListener('click', async function(){
    try {
      var r = await toggleLike(post.id);
      post._myLike = r.liked;
      post._likes += r.liked ? 1 : -1;
      if (post._likes < 0) post._likes = 0;
      likeBtn.textContent = '';
      likeBtn.appendChild(_h('span', {'aria-hidden':'true'}, post._myLike ? '♥' : '♡'));
      likeBtn.appendChild(document.createTextNode(' ' + post._likes));
      likeBtn.style.color = post._myLike ? '#7B3F00' : 'var(--grey)';
    } catch(e){ _toast('Erreur', 'error'); }
  });
  actions.appendChild(likeBtn);

  var commentBtn = _h('button', {
    style:'background:none;border:none;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;'+
      'color:var(--grey);cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:4px 0'
  });
  commentBtn.appendChild(_h('span', {'aria-hidden':'true'}, '💬'));
  commentBtn.appendChild(document.createTextNode(' ' + post._comments));
  actions.appendChild(commentBtn);
  card.appendChild(actions);

  // Comments zone (lazy)
  var commentsBox = _h('div', { style:'margin-top:14px;display:none' });
  card.appendChild(commentsBox);

  commentBtn.addEventListener('click', async function(){
    if (commentsBox.style.display === 'none'){
      commentsBox.style.display = 'block';
      commentsBox.innerHTML = '<div style="font-size:11px;color:var(--grey3);padding:8px 0">' + ((window.isEnglish && window.isEnglish()) ? 'Loading…' : 'Chargement…') + '</div>';
      try {
        var comments = await loadComments(post.id);
        _renderCommentsBox(commentsBox, post, comments);
      } catch(e){
        commentsBox.innerHTML = '<div style="font-size:11px;color:#7B3F00">' + ((window.isEnglish && window.isEnglish()) ? 'Loading error' : 'Erreur de chargement') + '</div>';
      }
    } else {
      commentsBox.style.display = 'none';
    }
  });

  return card;
}

function _renderCommentsBox(box, post, comments){
  box.innerHTML = '';
  var me = uid();
  if (comments && comments.length){
    comments.forEach(function(c){
      var row = _h('div', { style:'display:flex;gap:10px;margin-bottom:10px;padding:10px;background:var(--ivory2);border-radius:2px' });
      row.appendChild(_avatar(c._author, 28));
      var rMeta = _h('div', { style:'flex:1;min-width:0' });
      rMeta.appendChild(_h('div', { style:'display:flex;gap:8px;align-items:baseline;margin-bottom:2px' }, [
        _h('span', { style:'font-family:Georgia,serif;font-size:12px' }, c._author.pseudo),
        _h('span', { style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;color:var(--grey3);letter-spacing:1px' }, timeAgo(c.created_at))
      ]));
      rMeta.appendChild(_h('div', {
        style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--black);line-height:1.5;word-break:break-word'
      }, c.text));
      row.appendChild(rMeta);
      if (c.user_id === me){
        var delBtn = _h('button', {
          style:'background:none;border:none;color:var(--grey3);cursor:pointer;font-size:14px;padding:0 4px',
          'aria-label':'Supprimer',
          onclick: async function(){
            if (!(window.sfcConfirm || confirm)('Supprimer ce commentaire ?')) return;
            try { await deleteComment(c.id); row.style.display = 'none'; } catch(e){ _toast('Erreur', 'error'); }
          }
        }, '×');
        row.appendChild(delBtn);
      }
      box.appendChild(row);
    });
  }

  // Formulaire
  var form = _h('div', { style:'display:flex;gap:8px;margin-top:10px' });
  var input = _h('input', {
    type:'text', maxlength: String(MAX_COMMENT_LENGTH),
    placeholder:'Écrire un commentaire…',
    style:'flex:1;background:var(--ivory);border:1px solid var(--border);padding:10px 12px;border-radius:2px;'+
      'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--black);outline:none'
  });
  var sendBtn = _h('button', {
    style:'background:var(--black);color:var(--ivory);border:none;padding:10px 16px;border-radius:2px;'+
      'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;cursor:pointer'
  }, 'Envoyer');
  var submitting = false;
  async function submit(){
    if (submitting) return;
    var val = input.value.trim();
    if (!val) return;
    submitting = true;
    sendBtn.disabled = true;
    try {
      await addComment(post.id, val);
      input.value = '';
      var fresh = await loadComments(post.id);
      _renderCommentsBox(box, post, fresh);
      post._comments = fresh.length;
    } catch(e){
      if (e.message === 'rate_limit') _toast((window.isEnglish && window.isEnglish()) ? 'Too many comments. Please try again in a few minutes.' : 'Trop de commentaires. Réessayez dans quelques minutes.', 'error');
      else if (e.message === 'too_long') _toast((window.isEnglish && window.isEnglish()) ? 'Comment too long' : 'Commentaire trop long', 'error');
      else _toast((window.isEnglish && window.isEnglish()) ? 'Send error' : 'Erreur d\'envoi', 'error');
    } finally { submitting = false; sendBtn.disabled = false; }
  }
  sendBtn.addEventListener('click', submit);
  input.addEventListener('keydown', function(e){ if (e.key === 'Enter') submit(); });
  form.appendChild(input);
  form.appendChild(sendBtn);
  box.appendChild(form);
}

function renderFeedTab(container){
  container.innerHTML = '';

  // Compose post CTA
  var composeWrap = _h('div', { style:'margin-bottom:20px' });
  var composeBtn = _h('button', {
    'class':'btn-secondary', style:'margin-top:0',
    onclick: function(){ window.S.socialView = 'composePost'; window.render(); }
  }, '+ Partager une activité');
  composeWrap.appendChild(composeBtn);
  container.appendChild(composeWrap);

  if (_loadingFeed && !_feed.length){
    container.appendChild(_h('div', {
      style:'padding:40px;text-align:center;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey3);letter-spacing:2px'
    }, 'Chargement…'));
    return;
  }

  if (!_feed.length){
    container.appendChild(_emptyState(
      'Le fil est silencieux',
      _friends.length
        ? 'Personne n\'a partagé d\'activité récente. Soyez le premier.'
        : 'Invitez vos amis pour voir leurs activités ici.',
      _friends.length ? 'Partager une activité' : 'Ajouter un ami',
      function(){
        window.S.socialView = _friends.length ? 'composePost' : null;
        window.S.socialTab  = _friends.length ? 'feed' : 'friends';
        window.render();
      }
    ));
    return;
  }

  _feed.forEach(function(p){ container.appendChild(_postCard(p)); });
}

// ══════════════════════════════════════════════════════════════
// UI — ONGLET AMIS
// ══════════════════════════════════════════════════════════════
function renderFriendsTab(container){
  container.innerHTML = '';

  // Ajouter un ami (form email)
  var addBox = _h('div', {
    style:'background:var(--ivory2);border:1px solid var(--border);border-radius:2px;padding:20px;margin-bottom:24px'
  });
  addBox.appendChild(_h('div', {
    style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:12px'
  }, 'Ajouter un ami'));

  var addRow = _h('div', { style:'display:flex;gap:8px;flex-wrap:wrap' });
  var emailInput = _h('input', {
    type:'email', placeholder:'email@exemple.com', autocomplete:'off', spellcheck:'false',
    style:'flex:1;min-width:200px;background:var(--ivory);border:1px solid var(--border);padding:12px 14px;'+
      'border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:14px;color:var(--black);outline:none'
  });
  var sendBtn = _h('button', {
    style:'background:var(--black);color:var(--ivory);border:none;padding:12px 20px;border-radius:2px;'+
      'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;white-space:nowrap'
  }, 'Envoyer la demande');
  var feedback = _h('div', {
    style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey);min-height:16px;margin-top:10px;letter-spacing:0.3px'
  }, '');
  addRow.appendChild(emailInput);
  addRow.appendChild(sendBtn);
  addBox.appendChild(addRow);
  addBox.appendChild(feedback);
  addBox.appendChild(_h('div', {
    style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey3);margin-top:10px;line-height:1.6'
  }, (window.isEnglish && window.isEnglish()) ? 'No public directory — only an exact email address can find someone.' : 'Aucun annuaire public — seul l\'email exact permet de trouver quelqu\'un.'));

  var submitting = false;
  async function doSend(){
    if (submitting) return;
    var e = emailInput.value.trim();
    if (!e){ feedback.textContent = (window.isEnglish && window.isEnglish()) ? 'Email required.' : 'Email requis.'; feedback.style.color = '#7B3F00'; return; }
    submitting = true; sendBtn.disabled = true;
    feedback.textContent = (window.isEnglish && window.isEnglish()) ? 'Sending…' : 'Envoi…'; feedback.style.color = 'var(--grey)';
    try {
      var r = await sendFriendRequestByEmail(e);
      feedback.textContent = ((window.isEnglish && window.isEnglish()) ? 'Request sent to ' : 'Demande envoyée à ') + r.target.pseudo;
      feedback.style.color = '#556B2F';
      emailInput.value = '';
      await loadFriendships();
      setTimeout(function(){ window.render(); }, 1200);
    } catch(err){
      var map = {
        user_not_found: 'Cet email n\'est pas inscrit sur SmartFitCoach.',
        profile_not_setup: 'Cet utilisateur n\'a pas encore créé son pseudo — demandez-lui d\'aller dans l\'onglet Amis.',
        self: 'Vous ne pouvez pas vous ajouter vous-même.',
        already_friends: 'Vous êtes déjà amis.',
        already_pending: 'Une demande est déjà en attente.',
        blocked: 'Cet utilisateur a bloqué les demandes.',
        rate_limit: 'Trop de demandes aujourd\'hui (max 20).',
        no_profile: 'Créez d\'abord votre pseudo.'
      };
      feedback.textContent = map[err.message] || 'Erreur : ' + err.message;
      feedback.style.color = '#7B3F00';
    } finally { submitting = false; sendBtn.disabled = false; }
  }
  sendBtn.addEventListener('click', doSend);
  emailInput.addEventListener('keydown', function(ev){ if (ev.key === 'Enter') doSend(); });
  container.appendChild(addBox);

  // Demandes reçues
  if (_pendingIn.length){
    container.appendChild(_h('div', { 'class':'section-label' }, ((window.isEnglish && window.isEnglish()) ? 'Received requests (' : 'Demandes reçues (') + _pendingIn.length + ')'));
    _pendingIn.forEach(function(p){
      container.appendChild(_friendRow(p, 'incoming'));
    });
  }

  // Demandes envoyées
  if (_pendingOut.length){
    container.appendChild(_h('div', { 'class':'section-label' }, ((window.isEnglish && window.isEnglish()) ? 'Pending (' : 'En attente (') + _pendingOut.length + ')'));
    _pendingOut.forEach(function(p){
      container.appendChild(_friendRow(p, 'outgoing'));
    });
  }

  // Amis
  container.appendChild(_h('div', { 'class':'section-label' }, 'Mes amis (' + _friends.length + ')'));
  if (!_friends.length){
    container.appendChild(_h('div', {
      style:'padding:24px;text-align:center;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey3);font-style:italic'
    }, 'Aucun ami pour le moment.'));
  } else {
    _friends.forEach(function(f){
      container.appendChild(_friendRow(f, 'friend'));
    });
  }
}

function _friendRow(f, kind){
  var row = _h('div', {
    style:'display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--ivory);'+
      'border:1px solid var(--border);border-radius:2px;margin-bottom:8px'
  });
  row.appendChild(_avatar(f, 40));
  var meta = _h('div', { style:'flex:1;min-width:0' });
  meta.appendChild(_h('div', { style:'font-family:Georgia,serif;font-size:14px' }, f.pseudo || 'Membre SmartFit'));
  if (f.sport_main) meta.appendChild(_h('div', {
    style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--grey3);margin-top:2px'
  }, f.sport_main));
  row.appendChild(meta);

  var actions = _h('div', { style:'display:flex;gap:8px;flex-shrink:0' });
  function _act(label, cb, kind2){
    var bg = kind2 === 'primary' ? '#0A0A09' : 'transparent';
    var fg = kind2 === 'primary' ? '#FAF9F6' : 'var(--grey)';
    var br = kind2 === 'primary' ? '#0A0A09' : 'var(--border)';
    return _h('button', {
      style:'background:'+bg+';color:'+fg+';border:1px solid '+br+';padding:8px 12px;border-radius:2px;'+
        'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;cursor:pointer',
      onclick: cb
    }, label);
  }
  if (kind === 'incoming'){
    actions.appendChild(_act('Accepter', async function(){
      try { await acceptFriendRequest(f._fsId); _toast(f.pseudo+' est maintenant ami', 'success'); await loadFriendships(); window.render(); }
      catch(e){ _toast('Erreur', 'error'); }
    }, 'primary'));
    actions.appendChild(_act('Refuser', async function(){
      if (!(window.sfcConfirm || confirm)((window.isEnglish && window.isEnglish()) ? ('Decline request from ' + f.pseudo + '?') : ('Refuser la demande de ' + f.pseudo + ' ?'))) return;
      try { await declineFriendRequest(f._fsId); _toast((window.isEnglish && window.isEnglish()) ? 'Request declined' : 'Demande refusée', 'success'); await loadFriendships(); window.render(); }
      catch(e){ _toast('Erreur', 'error'); }
    }));
  } else if (kind === 'outgoing'){
    actions.appendChild(_act('Annuler', async function(){
      if (!(window.sfcConfirm || confirm)('Annuler la demande ?')) return;
      try { await cancelFriendRequest(f._fsId); await loadFriendships(); window.render(); }
      catch(e){ _toast('Erreur', 'error'); }
    }));
  } else { // friend
    actions.appendChild(_act('Retirer', async function(){
      if (!(window.sfcConfirm || confirm)((window.isEnglish && window.isEnglish()) ? ('Remove ' + f.pseudo + ' from your friends?') : ('Retirer ' + f.pseudo + ' de vos amis ?'))) return;
      try { await removeFriend(f._fsId); _toast((window.isEnglish && window.isEnglish()) ? 'Friend removed' : 'Ami retiré'); await loadFriendships(); window.render(); }
      catch(e){ _toast('Erreur', 'error'); }
    }));
    actions.appendChild(_act('Bloquer', async function(){
      if (!(window.sfcConfirm || confirm)((window.isEnglish && window.isEnglish()) ? ('Block ' + f.pseudo + '? This person will no longer be able to contact you.') : ('Bloquer ' + f.pseudo + ' ? Cette personne ne pourra plus vous contacter.'))) return;
      try { await blockUser(f.id); _toast((window.isEnglish && window.isEnglish()) ? 'User blocked' : 'Utilisateur bloqué', 'success'); await loadFriendships(); window.render(); }
      catch(e){ _toast('Erreur de blocage', 'error'); }
    }));
  }
  row.appendChild(actions);
  return row;
}

// ══════════════════════════════════════════════════════════════
// UI — ONGLET NOTIFICATIONS
// ══════════════════════════════════════════════════════════════
function renderNotificationsTab(container){
  container.innerHTML = '';
  if (!_notifications.length){
    container.appendChild(_emptyState(
      'Aucune activité',
      'Les likes, commentaires et demandes d\'amis apparaîtront ici.',
      null, null
    ));
    return;
  }

  // Bouton "Tout marquer lu"
  if (_unreadCount > 0){
    var header = _h('div', { style:'display:flex;justify-content:flex-end;margin-bottom:12px' });
    header.appendChild(_h('button', {
      style:'background:none;border:1px solid var(--border);padding:8px 14px;cursor:pointer;'+
        'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;'+
        'text-transform:uppercase;color:var(--grey);border-radius:2px',
      onclick: async function(){ await markAllRead(); window.render(); }
    }, 'Tout marquer lu'));
    container.appendChild(header);
  }

  _notifications.forEach(function(n){
    var row = _h('div', {
      style:'display:flex;align-items:center;gap:12px;padding:14px 16px;background:'+
        (n.read?'var(--ivory)':'var(--ivory2)')+';border:1px solid var(--border);border-radius:2px;margin-bottom:8px'
    });
    row.appendChild(_avatar(n._actor, 36));
    var txt;
    var _ntEN = window.isEnglish && window.isEnglish();
    if (n.type === 'friend_request') txt = n._actor.pseudo + (_ntEN ? ' sent you a friend request' : ' vous a envoyé une demande d\'ami');
    else if (n.type === 'friend_accepted') txt = n._actor.pseudo + (_ntEN ? ' accepted your request' : ' a accepté votre demande');
    else if (n.type === 'like') txt = n._actor.pseudo + (_ntEN ? ' liked your post' : ' a aimé votre publication');
    else if (n.type === 'comment') txt = n._actor.pseudo + (_ntEN ? ' commented on your post' : ' a commenté votre publication');
    else txt = _ntEN ? 'Activity' : 'Activité';

    var body = _h('div', { style:'flex:1;min-width:0' });
    body.appendChild(_h('div', {
      style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--black);line-height:1.5'
    }, txt));
    body.appendChild(_h('div', {
      style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--grey3);margin-top:2px'
    }, timeAgo(n.created_at)));
    row.appendChild(body);
    if (!n.read){
      row.appendChild(_h('span', {
        style:'width:8px;height:8px;background:var(--ink-900,#0A0A09);flex-shrink:0'
      }));
    }
    container.appendChild(row);
  });
}

// ══════════════════════════════════════════════════════════════
// UI — COMPOSER UN POST
// ══════════════════════════════════════════════════════════════
function renderComposePost(container){
  container.innerHTML = '';
  var wrap = _h('div', { style:'max-width:520px;margin:0 auto;padding:20px 0' });

  // Back
  wrap.appendChild(_h('button', {
    'class':'btn-back',
    onclick: function(){ window.S.socialView = null; window.render(); }
  }, '← Retour'));

  wrap.appendChild(_eyebrow('Partager'));
  wrap.appendChild(_h('h1', { style:'font-family:Georgia,serif;font-size:28px;letter-spacing:-0.5px;margin-bottom:8px' },
    'Nouvelle publication'));
  wrap.appendChild(_h('p', { 'class':'subtitle' },
    'Visible uniquement par vos amis acceptés. Vous pouvez supprimer à tout moment.'));

  // Type selector
  var typeValue = 'custom';
  wrap.appendChild(_h('div', { 'class':'section-label' }, 'Type d\'activité'));
  var typeBox = _h('div', { style:'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px' });
  var types = [
    { k:'workout',   l:'Séance' },
    { k:'pr',        l:'Record' },
    { k:'streak',    l:'Série' },
    { k:'challenge', l:'Challenge' },
    { k:'custom',    l:'Autre' }
  ];
  types.forEach(function(t){
    var isActive = typeValue === t.k;
    var btn = _h('button', {
      type:'button',
      style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;'+
        'padding:8px 14px;border:1px solid '+(isActive?'#0A0A09':'var(--border)')+';'+
        'background:'+(isActive?'#0A0A09':'transparent')+';color:'+(isActive?'#FAF9F6':'var(--grey)')+';'+
        'border-radius:2px;cursor:pointer;transition:all .2s'
    }, t.l);
    btn.addEventListener('click', function(){
      typeValue = t.k;
      Array.prototype.forEach.call(typeBox.children, function(c, i){
        var active = types[i].k === typeValue;
        c.style.borderColor = active ? '#0A0A09' : 'var(--border)';
        c.style.background = active ? '#0A0A09' : 'transparent';
        c.style.color = active ? '#FAF9F6' : 'var(--grey)';
      });
    });
    typeBox.appendChild(btn);
  });
  wrap.appendChild(typeBox);

  // Titre
  wrap.appendChild(_h('div', { 'class':'section-label' }, 'Titre'));
  var titleField = _h('div', { 'class':'field', style:'margin-bottom:20px' });
  var titleInput = _h('input', {
    type:'text', maxlength:'80', autocomplete:'off',
    placeholder:'Ex : Séance jambes · PR développé couché 100kg'
  });
  titleField.appendChild(titleInput);
  wrap.appendChild(titleField);

  // Description (optionnelle)
  wrap.appendChild(_h('div', { 'class':'section-label' }, 'Détails (facultatif)'));
  var descField = _h('div', { 'class':'field', style:'margin-bottom:28px' });
  var descInput = _h('textarea', {
    maxlength:'280', rows:'3',
    placeholder:'Un mot pour vos amis…'
  });
  descField.appendChild(descInput);
  wrap.appendChild(descField);

  // Buttons
  var submitBtn = _h('button', { 'class':'btn-primary' }, 'Publier');
  wrap.appendChild(submitBtn);
  wrap.appendChild(_h('button', {
    'class':'btn-secondary',
    onclick: function(){ window.S.socialView = null; window.render(); }
  }, 'Annuler'));

  var submitting = false;
  submitBtn.addEventListener('click', async function(){
    if (submitting) return;
    var title = sanitizeText(titleInput.value);
    if (!title){ _toast('Titre requis', 'error'); return; }
    submitting = true; submitBtn.disabled = true;
    try {
      await publishPost(typeValue, {
        title: title,
        text: sanitizeText(descInput.value)
      }, true);
      _toast((window.isEnglish && window.isEnglish()) ? 'Published' : 'Publié', 'success');
      window.S.socialView = null;
      window.S.socialTab = 'feed';
      await loadFeed();
      window.render();
    } catch(e){
      _toast('Erreur de publication', 'error');
    } finally { submitting = false; submitBtn.disabled = false; }
  });

  container.appendChild(wrap);
}

// ══════════════════════════════════════════════════════════════
// UI — ÉDITION DE PROFIL (après setup initial)
// ══════════════════════════════════════════════════════════════
function renderEditProfile(container){
  container.innerHTML = '';
  var wrap = _h('div', { style:'max-width:520px;margin:0 auto;padding:20px 0' });

  wrap.appendChild(_h('button', {
    'class':'btn-back',
    onclick: function(){ window.S.socialView = null; window.render(); }
  }, '← Retour'));

  wrap.appendChild(_eyebrow('Mon profil'));
  wrap.appendChild(_h('h1', { style:'font-family:Georgia,serif;font-size:28px;letter-spacing:-0.5px;margin-bottom:24px' },
    'Modifier'));

  // Pseudo (non modifiable ici pour MVP — stabilise les mentions)
  wrap.appendChild(_h('div', { 'class':'section-label' }, 'Pseudo'));
  wrap.appendChild(_h('div', {
    style:'font-family:Georgia,serif;font-size:18px;color:var(--black);margin-bottom:6px'
  }, _myProfile.pseudo));
  wrap.appendChild(_h('div', {
    style:'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;color:var(--grey3);margin-bottom:24px'
  }, 'Le pseudo ne peut pas être modifié pour l\'instant.'));

  // Aperçu avatar courant
  var currentPhotoUrl = _myProfile.avatar_url || null;
  var previewBox = _h('div', { style:'display:flex;justify-content:center;margin:12px 0 8px' });
  var refreshEditPreview = function(){
    previewBox.innerHTML = '';
    previewBox.appendChild(_avatar({
      pseudo: _myProfile.pseudo,
      avatar_color: currentColor,
      avatar_url: currentPhotoUrl
    }, 80));
  };

  // Photo section (si S.profilePhoto existe ou avatar_url déjà défini)
  var S = window.S;
  var hasLocalPhoto = !!(S && S.profilePhoto);
  if (hasLocalPhoto || currentPhotoUrl) {
    wrap.appendChild(_h('div', { 'class':'section-label' }, 'Photo de profil'));
    var photoActions = _h('div', { style:'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px' });
    if (hasLocalPhoto) {
      var useBtn = _h('button', {
        type:'button', 'class':'btn-secondary',
        style:'margin:0;flex:1;min-width:150px'
      }, currentPhotoUrl ? ((window.isEnglish && window.isEnglish()) ? 'Re-generate from my profile' : 'Regénérer depuis mon profil') : ((window.isEnglish && window.isEnglish()) ? 'Use my profile photo' : 'Utiliser ma photo de profil'));
      useBtn.addEventListener('click', async function(){
        useBtn.disabled = true;
        useBtn.textContent = (window.isEnglish && window.isEnglish()) ? 'Generating…' : 'Génération…';
        var thumb = await _makeThumbnail(S.profilePhoto, 128, 0.7);
        if (thumb) { currentPhotoUrl = thumb; refreshEditPreview(); }
        useBtn.disabled = false;
        useBtn.textContent = (window.isEnglish && window.isEnglish()) ? 'Re-generate from my profile' : 'Regénérer depuis mon profil';
      });
      photoActions.appendChild(useBtn);
    }
    if (currentPhotoUrl) {
      var removeBtn = _h('button', {
        type:'button', 'class':'btn-secondary',
        style:'margin:0;flex:1;min-width:120px'
      }, 'Retirer la photo');
      removeBtn.addEventListener('click', function(){
        currentPhotoUrl = null;
        refreshEditPreview();
      });
      photoActions.appendChild(removeBtn);
    }
    wrap.appendChild(photoActions);
  }

  // Couleur
  wrap.appendChild(_h('div', { 'class':'section-label' }, 'Couleur d\'avatar (fallback sans photo)'));
  var currentColor = _myProfile.avatar_color || AVATAR_COLORS[0];
  var palette = _h('div', { style:'display:flex;flex-wrap:wrap;gap:12px;margin-bottom:20px' });
  AVATAR_COLORS.forEach(function(col){
    var chip = _h('button', {
      type:'button',
      style:'width:36px;height:36px;border-radius:0;border:2px solid '+
        (col === currentColor ? '#0A0A09' : 'transparent')+';background:'+col+';cursor:pointer;outline:none',
      'aria-label':'Couleur '+col
    });
    chip.dataset.col = col;
    chip.addEventListener('click', function(){
      currentColor = col;
      Array.prototype.forEach.call(palette.children, function(c){
        c.style.borderColor = (c.dataset.col === col) ? '#0A0A09' : 'transparent';
      });
      refreshEditPreview();
    });
    palette.appendChild(chip);
  });
  wrap.appendChild(palette);
  wrap.appendChild(previewBox);
  refreshEditPreview();

  // Bio
  wrap.appendChild(_h('div', { 'class':'section-label' }, 'Bio (facultatif)'));
  var bioField = _h('div', { 'class':'field', style:'margin-bottom:24px' });
  var bioInput = _h('textarea', {
    maxlength: String(MAX_BIO_LENGTH), rows:'2',
    placeholder:'Un mot sur vous…'
  });
  bioInput.value = _myProfile.bio || '';
  bioField.appendChild(bioInput);
  wrap.appendChild(bioField);

  // Save
  var saveBtn = _h('button', { 'class':'btn-primary' }, 'Enregistrer');
  wrap.appendChild(saveBtn);

  saveBtn.addEventListener('click', async function(){
    saveBtn.disabled = true;
    try {
      await createOrUpdateProfile({
        avatar_color: currentColor,
        avatar_url: currentPhotoUrl,   // null = retirer la photo
        bio: sanitizeText(bioInput.value)
      });
      _toast((window.isEnglish && window.isEnglish()) ? 'Profile updated' : 'Profil mis à jour', 'success');
      window.S.socialView = null;
      window.render();
    } catch(e){
      _toast('Erreur', 'error');
      saveBtn.disabled = false;
    }
  });

  container.appendChild(wrap);
}

// ══════════════════════════════════════════════════════════════
// SYSTÈME D'AMIS
// ══════════════════════════════════════════════════════════════

// Normalise un friendship row en {id, status, otherId, role:'requester'|'addressee', created_at}
function _normalizeFs(row, meId){
  if (!row) return null;
  var isReq = row.requester_id === meId;
  return {
    id: row.id,
    status: row.status,
    role: isReq ? 'requester' : 'addressee',
    otherId: isReq ? row.addressee_id : row.requester_id,
    requester_id: row.requester_id,
    addressee_id: row.addressee_id,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

// Charge friendships + hydrate profils amis en une seule passe
async function _fetchFriendProfilesByIds(c, otherIds) {
  // Direct query first (works for confirmed friends — RLS passes)
  var rp = await c.from('social_profiles').select('id,pseudo,avatar_color,avatar_url,sport_main,sport_level').in('id', otherIds);
  var byId = {};
  (rp.data || []).forEach(function(p){ byId[p.id] = p; });

  // Fallback via server-side function pour : IDs absents (RLS) OU profils sans pseudo (auto-créés sans pseudo)
  var missing = otherIds.filter(function(id){ return !byId[id] || !byId[id].pseudo; });
  if (!missing.length) return byId;

  try {
    var sess = await c.auth.getSession();
    var token = sess && sess.data && sess.data.session && sess.data.session.access_token;
    if (!token) return byId;
    var resp = await fetch('/.netlify/functions/get-friend-profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ ids: missing })
    });
    if (resp.ok) {
      var json = await resp.json();
      (json.data || []).forEach(function(p){ byId[p.id] = p; });
    }
  } catch(err) { console.warn('[SOCIAL] fetchFriendProfiles fallback error', err && err.message); }
  return byId;
}

async function loadFriendships(){
  var c = db(); if (!c) return;
  var me = uid(); if (!me) return;
  _loadingFriends = true;
  try {
    var r = await c.from('friendships').select('*')
      .or('requester_id.eq.'+me+',addressee_id.eq.'+me)
      .order('updated_at', { ascending:false });
    if (r.error) { console.warn('[SOCIAL] loadFriendships error', r.error.message); return; }
    var rows = (r.data || []).map(function(row){ return _normalizeFs(row, me); });
    var otherIds = rows.map(function(x){ return x.otherId; }).filter(Boolean);
    var uniq = {};
    otherIds = otherIds.filter(function(id){ if(uniq[id])return false; uniq[id]=1; return true; });
    var profByI = otherIds.length ? await _fetchFriendProfilesByIds(c, otherIds) : {};
    var _fallback = function(x){ return profByI[x.otherId] || { id: x.otherId, pseudo: '···' }; };
    _friends    = rows.filter(function(x){ return x.status === 'accepted'; })
      .map(function(x){ return Object.assign({}, _fallback(x), {_fsId:x.id, _fsRole:x.role, _fsDate:x.updated_at}); });
    _pendingIn  = rows.filter(function(x){ return x.status === 'pending' && x.role === 'addressee'; })
      .map(function(x){ return Object.assign({}, _fallback(x), {_fsId:x.id, _fsDate:x.created_at}); });
    _pendingOut = rows.filter(function(x){ return x.status === 'pending' && x.role === 'requester'; })
      .map(function(x){ return Object.assign({}, _fallback(x), {_fsId:x.id, _fsDate:x.created_at}); });
  } finally { _loadingFriends = false; }
}

// Trouve un utilisateur par email via RPC sécurisée
async function findUserByEmail(email){
  var c = db(); if (!c) return null;
  var e = (email || '').trim();
  if (!e || e.indexOf('@') === -1) return null;
  try {
    var r = await c.rpc('find_social_profile_by_email', { lookup_email: e });
    if (r.error) { console.warn('[SOCIAL] findUserByEmail error', r.error.message); return null; }
    var rows = r.data || [];
    return rows.length ? rows[0] : null;
  } catch(err){ return null; }
}

// Envoie une demande d'ami par email
async function sendFriendRequestByEmail(email){
  var c = db(); if (!c) throw new Error('db_unavailable');
  var me = uid(); if (!me) throw new Error('not_logged');
  if (!_myProfile) throw new Error('no_profile');
  if (!rateLimitCheck('friend_req', RATE_LIMIT_FRIEND_REQ, 24*60*60*1000))
    throw new Error('rate_limit');

  var target = await findUserByEmail(email);
  if (!target) throw new Error('user_not_found');
  if (!target.pseudo) throw new Error('profile_not_setup');
  if (target.id === me) throw new Error('self');

  // Vérifie si une friendship existe déjà (dans un sens ou l'autre)
  var existing = await c.from('friendships').select('*')
    .or('and(requester_id.eq.'+me+',addressee_id.eq.'+target.id+'),and(requester_id.eq.'+target.id+',addressee_id.eq.'+me+')')
    .limit(1);
  if (existing.data && existing.data.length){
    var row = existing.data[0];
    if (row.status === 'accepted') throw new Error('already_friends');
    if (row.status === 'pending') throw new Error('already_pending');
    if (row.status === 'blocked') throw new Error('blocked');
  }

  var r = await c.from('friendships').insert({
    requester_id: me, addressee_id: target.id, status: 'pending'
  }).select().single();
  if (r.error) throw new Error(r.error.message || 'insert_failed');

  // Notification à l'autre
  await _insertNotification(target.id, 'friend_request', me, null);
  return { ok:true, target: target };
}

async function acceptFriendRequest(friendshipId){
  var c = db(); if (!c) throw new Error('db_unavailable');
  var me = uid(); if (!me) throw new Error('not_logged');
  var r = await c.from('friendships').update({ status:'accepted', updated_at: new Date().toISOString() })
    .eq('id', friendshipId).eq('addressee_id', me).select().single();
  if (r.error) throw new Error(r.error.message);
  // Notification au demandeur
  if (r.data) await _insertNotification(r.data.requester_id, 'friend_accepted', me, null);
  return r.data;
}

async function declineFriendRequest(friendshipId){
  var c = db(); if (!c) throw new Error('db_unavailable');
  var me = uid(); if (!me) throw new Error('not_logged');
  var r = await c.from('friendships').delete().eq('id', friendshipId).eq('addressee_id', me);
  if (r.error) throw new Error(r.error.message);
  return true;
}

async function cancelFriendRequest(friendshipId){
  var c = db(); if (!c) throw new Error('db_unavailable');
  var me = uid(); if (!me) throw new Error('not_logged');
  var r = await c.from('friendships').delete().eq('id', friendshipId).eq('requester_id', me);
  if (r.error) throw new Error(r.error.message);
  return true;
}

async function removeFriend(friendshipId){
  var c = db(); if (!c) throw new Error('db_unavailable');
  var me = uid(); if (!me) throw new Error('not_logged');
  var r = await c.from('friendships').delete().eq('id', friendshipId)
    .or('requester_id.eq.'+me+',addressee_id.eq.'+me);
  if (r.error) throw new Error(r.error.message);
  return true;
}

async function blockUser(otherId){
  var c = db(); if (!c) throw new Error('db_unavailable');
  var me = uid(); if (!me) throw new Error('not_logged');
  if (otherId === me) throw new Error('self');
  // 1. Supprime toute friendship existante dans les deux sens
  await c.from('friendships').delete()
    .or('and(requester_id.eq.'+me+',addressee_id.eq.'+otherId+'),and(requester_id.eq.'+otherId+',addressee_id.eq.'+me+')');
  // 2. Insère un bloc (me → other)
  var r = await c.from('friendships').insert({
    requester_id: me, addressee_id: otherId, status: 'blocked'
  });
  if (r.error) throw new Error(r.error.message);
  return true;
}

// Insère une notification (fire-and-forget)
async function _insertNotification(toUserId, type, actorId, postId){
  if (!toUserId || toUserId === actorId) return null;
  var c = db(); if (!c) return null;
  try {
    var payload = { user_id: toUserId, type: type, actor_id: actorId || null, post_id: postId || null };
    var r = await c.from('social_notifications').insert(payload);
    return r.error ? null : true;
  } catch(e){ return null; }
}

// Getters en cache
function getFriendsCached(){ return _friends.slice(); }
function getPendingInCached(){ return _pendingIn.slice(); }
function getPendingOutCached(){ return _pendingOut.slice(); }

// ══════════════════════════════════════════════════════════════
// FEED — POSTS, RÉACTIONS, COMMENTAIRES
// ══════════════════════════════════════════════════════════════

// Publie un post dans le feed (type = 'workout'|'pr'|'challenge'|'streak'|'custom')
async function publishPost(type, data, isShared){
  var c = db(); if (!c) throw new Error('db_unavailable');
  var me = uid(); if (!me) throw new Error('not_logged');
  if (!_myProfile) throw new Error('no_profile');
  var allowed = ['workout','pr','challenge','streak','custom'];
  if (allowed.indexOf(type) === -1) throw new Error('invalid_type');
  var payload = {
    user_id: me, type: type,
    data: data || {},
    is_shared: isShared !== false
  };
  var r = await c.from('feed_posts').insert(payload).select().single();
  if (r.error) throw new Error(r.error.message || 'insert_failed');
  return r.data;
}

async function deletePost(postId){
  var c = db(); if (!c) throw new Error('db_unavailable');
  var me = uid(); if (!me) throw new Error('not_logged');
  var r = await c.from('feed_posts').delete().eq('id', postId).eq('user_id', me);
  if (r.error) throw new Error(r.error.message);
  return true;
}

// Charge le feed (own + friends) avec profils + compteurs
async function loadFeed(limit){
  var c = db(); if (!c) return;
  var me = uid(); if (!me) return;
  _loadingFeed = true;
  try {
    // 1. Posts visibles via RLS (own + amis)
    var rp = await c.from('feed_posts').select('*')
      .order('created_at', { ascending:false })
      .limit(limit || 50);
    if (rp.error){ console.warn('[SOCIAL] loadFeed error', rp.error.message); return; }
    var posts = rp.data || [];
    if (!posts.length){ _feed = []; return; }

    // 2. Profils des auteurs
    var authorIds = {};
    posts.forEach(function(p){ authorIds[p.user_id] = 1; });
    var ids = Object.keys(authorIds);
    var profs = {};
    if (ids.length){
      var rpr = await c.from('social_profiles').select('id,pseudo,avatar_color,avatar_url,sport_main')
        .in('id', ids);
      (rpr.data || []).forEach(function(p){ profs[p.id] = p; });
    }

    // 3. Compteurs réactions (+ si l'user a liké)
    var postIds = posts.map(function(p){ return p.id; });
    var reactionsByPost = {};
    var myLikes = {};
    if (postIds.length){
      var rr = await c.from('post_reactions').select('post_id,user_id').in('post_id', postIds);
      (rr.data || []).forEach(function(x){
        if (!reactionsByPost[x.post_id]) reactionsByPost[x.post_id] = 0;
        reactionsByPost[x.post_id]++;
        if (x.user_id === me) myLikes[x.post_id] = 1;
      });
    }

    // 4. Compteurs commentaires (non supprimés)
    var commentsByPost = {};
    if (postIds.length){
      var rc = await c.from('post_comments').select('post_id').eq('deleted', false).in('post_id', postIds);
      (rc.data || []).forEach(function(x){
        commentsByPost[x.post_id] = (commentsByPost[x.post_id] || 0) + 1;
      });
    }

    // 5. Enrichissement
    _feed = posts.map(function(p){
      return Object.assign({}, p, {
        _author: profs[p.user_id] || { id: p.user_id, pseudo: 'Membre SmartFit', avatar_color: '#888' },
        _likes: reactionsByPost[p.id] || 0,
        _comments: commentsByPost[p.id] || 0,
        _myLike: !!myLikes[p.id]
      });
    });
  } finally { _loadingFeed = false; }
}

function getFeedCached(){ return _feed.slice(); }

// Toggle like
async function toggleLike(postId){
  var c = db(); if (!c) throw new Error('db_unavailable');
  var me = uid(); if (!me) throw new Error('not_logged');
  // Vérifie l'état actuel
  var existing = await c.from('post_reactions').select('id').eq('post_id', postId).eq('user_id', me).limit(1);
  if (existing.data && existing.data.length){
    // Unlike
    var rd = await c.from('post_reactions').delete().eq('post_id', postId).eq('user_id', me);
    if (rd.error) throw new Error(rd.error.message);
    return { liked:false };
  } else {
    // Like
    var ri = await c.from('post_reactions').insert({ post_id: postId, user_id: me });
    if (ri.error) throw new Error(ri.error.message);
    // Notifier l'auteur (sauf si c'est nous-même)
    var rp = await c.from('feed_posts').select('user_id').eq('id', postId).maybeSingle();
    if (rp.data && rp.data.user_id !== me){
      await _insertNotification(rp.data.user_id, 'like', me, postId);
    }
    return { liked:true };
  }
}

// Commentaires
async function loadComments(postId){
  var c = db(); if (!c) return [];
  var r = await c.from('post_comments').select('*')
    .eq('post_id', postId).eq('deleted', false)
    .order('created_at', { ascending:true });
  if (r.error) return [];
  var rows = r.data || [];
  if (!rows.length) return [];
  // Hydrate profils
  var ids = {};
  rows.forEach(function(x){ ids[x.user_id] = 1; });
  var list = Object.keys(ids);
  var profs = {};
  if (list.length){
    var rp = await c.from('social_profiles').select('id,pseudo,avatar_color,avatar_url').in('id', list);
    (rp.data || []).forEach(function(p){ profs[p.id] = p; });
  }
  return rows.map(function(x){
    return Object.assign({}, x, { _author: profs[x.user_id] || { pseudo:'Membre SmartFit', avatar_color:'#888' } });
  });
}

async function addComment(postId, text){
  var c = db(); if (!c) throw new Error('db_unavailable');
  var me = uid(); if (!me) throw new Error('not_logged');
  var clean = sanitizeText(text);
  if (clean.length < 1) throw new Error('empty');
  if (clean.length > MAX_COMMENT_LENGTH) throw new Error('too_long');
  if (!rateLimitCheck('comment', RATE_LIMIT_COMMENT, 60*60*1000))
    throw new Error('rate_limit');
  var r = await c.from('post_comments').insert({ post_id: postId, user_id: me, text: clean }).select().single();
  if (r.error) throw new Error(r.error.message);
  // Notifier l'auteur
  var rp = await c.from('feed_posts').select('user_id').eq('id', postId).maybeSingle();
  if (rp.data && rp.data.user_id !== me){
    await _insertNotification(rp.data.user_id, 'comment', me, postId);
  }
  return r.data;
}

async function deleteComment(commentId){
  var c = db(); if (!c) throw new Error('db_unavailable');
  var me = uid(); if (!me) throw new Error('not_logged');
  // Soft-delete pour préserver les threads
  var r = await c.from('post_comments').update({ deleted: true }).eq('id', commentId).eq('user_id', me);
  if (r.error) throw new Error(r.error.message);
  return true;
}

// ══════════════════════════════════════════════════════════════
// EXPORT MINIMAL (étendu dans les prochains blocs)
// ══════════════════════════════════════════════════════════════
window.SOCIAL = {
  // Constantes/helpers
  AVATAR_COLORS: AVATAR_COLORS,
  MAX_COMMENT_LENGTH: MAX_COMMENT_LENGTH,
  MAX_BIO_LENGTH: MAX_BIO_LENGTH,
  validatePseudoFormat: validatePseudoFormat,
  colorForId: colorForId,
  timeAgo: timeAgo,
  escapeHtml: escapeHtml,
  // Profil
  initProfile: initProfile,
  fetchMyProfile: fetchMyProfile,
  getMyProfileCached: getMyProfileCached,
  checkPseudoAvailable: checkPseudoAvailable,
  createOrUpdateProfile: createOrUpdateProfile,
  probeDb: probeDb,
  // Amis
  loadFriendships: loadFriendships,
  findUserByEmail: findUserByEmail,
  sendFriendRequestByEmail: sendFriendRequestByEmail,
  acceptFriendRequest: acceptFriendRequest,
  declineFriendRequest: declineFriendRequest,
  cancelFriendRequest: cancelFriendRequest,
  removeFriend: removeFriend,
  blockUser: blockUser,
  getFriendsCached: getFriendsCached,
  getPendingInCached: getPendingInCached,
  getPendingOutCached: getPendingOutCached,
  // Feed + réactions + commentaires
  publishPost: publishPost,
  deletePost: deletePost,
  loadFeed: loadFeed,
  getFeedCached: getFeedCached,
  toggleLike: toggleLike,
  loadComments: loadComments,
  addComment: addComment,
  deleteComment: deleteComment,
  // Notifications
  refreshUnreadCount: refreshUnreadCount,
  getUnreadCountCached: getUnreadCountCached,
  loadNotifications: loadNotifications,
  markAllRead: markAllRead,
  getNotificationsCached: getNotificationsCached,
  // UI dispatcher (appelé depuis app-main.js)
  render: render,
  // Hooks publics pour partage depuis autres modules
  shareWorkout: shareWorkout,
  sharePR: sharePR,
  shareStreak: shareStreak,
  shareChallenge: shareChallenge,
  // Realtime
  stopRealtime: _stopRealtime,
  // État
  _state: function(){ return {
    myProfile: _myProfile, feed: _feed, friends: _friends,
    pendingIn: _pendingIn, pendingOut: _pendingOut,
    notifications: _notifications, unreadCount: _unreadCount,
    dbReady: _dbReady
  }; }
};

// ══════════════════════════════════════════════════════════════
// DISPATCHER — point d'entrée appelé depuis app-main.js
// ══════════════════════════════════════════════════════════════
function render(container){
  if (!isLogged()){
    container.appendChild(_h('div', {
      style:'padding:48px 24px;text-align:center;font-family:"Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--grey)'
    }, 'Connectez-vous pour accéder au fil social.'));
    return;
  }
  _showLoader(container);
  probeDb().then(function(ready){
    if (!ready){
      container.innerHTML = '';
      var w = _h('div', { style:'max-width:520px;margin:0 auto;padding:48px 24px;text-align:center' });
      w.appendChild(_h('div', { 'class':'eyebrow' }, 'Fonctionnalité sociale'));
      w.appendChild(_h('h2', { style:'font-family:Georgia,serif;font-size:24px;margin-bottom:12px;letter-spacing:-0.3px' },
        'Bientôt disponible'));
      w.appendChild(_h('p', { 'class':'subtitle' },
        'Les fonctionnalités sociales (fil d\'amis, likes, commentaires) seront activées dès la mise à jour de la base de données.'));
      container.appendChild(w);
      return;
    }
    _boot(container);
  });
}

function _showLoader(container){
  container.innerHTML = '';
  container.appendChild(_h('div', {
    style:'padding:80px 24px;text-align:center;font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--grey3)'
  }, 'Chargement…'));
}

// ══════════════════════════════════════════════════════════════
// REALTIME — feed_posts + social_notifications live updates
// ══════════════════════════════════════════════════════════════
function _stopRealtime() {
  try {
    var c = db();
    if (_rtChannel && c) { c.removeChannel(_rtChannel); }
  } catch(e) {}
  _rtChannel = null;
}

function _startRealtime() {
  var c = db();
  var me = uid();
  if (!c || !me || _rtChannel) return; // already running or no client

  try {
    _rtChannel = c.channel('social-live-' + me.slice(0, 8))
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'feed_posts'
      }, function(payload) {
        try {
          var row = payload.new;
          if (!row || row.user_id === me) return; // skip own posts
          // Prepend to feed (skip if already present)
          var exists = _feed.some(function(p) { return p.id === row.id; });
          if (!exists) {
            _feed.unshift(Object.assign({}, row, {
              _author: { id: row.user_id, pseudo: '…', avatar_color: '#C9A84C' },
              _likes: 0, _comments: 0, _myLike: false, _new: true
            }));
          }
          // Re-render only if user is currently on the social feed tab
          var S = window.S || {};
          if (S.view === 'social' && !S.socialView && S.socialTab === 'feed') {
            if (window.render) window.render();
          }
        } catch(e) {}
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'social_notifications',
        filter: 'user_id=eq.' + me
      }, function(payload) {
        try {
          var row = payload.new;
          if (!row) return;
          _unreadCount++;
          // Add to cached notifications list
          _notifications.unshift(Object.assign({}, row, { read: false }));
          if (_notifications.length > 50) _notifications = _notifications.slice(0, 50);
          // Re-render only if social view is visible (to update the badge)
          var S = window.S || {};
          if (S.view === 'social' && !S.socialView && window.render) {
            window.render();
          }
        } catch(e) {}
      })
      .subscribe(function(status) {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Silently drop and clear — next _boot() will retry
          _rtChannel = null;
        }
      });
  } catch(e) {
    _rtChannel = null;
  }
}

async function _boot(container){
  var S = window.S;
  if (!_myProfile){ try { await fetchMyProfile(); } catch(e){} }
  if (!_myProfile){ renderProfileSetup(container); return; }
  try {
    await Promise.all([
      loadFriendships(),
      loadFeed(50),
      loadNotifications(30),
      refreshUnreadCount()
    ]);
  } catch(e){ console.warn('[SOCIAL] boot load error', e); }
  // Start realtime after initial data load
  _startRealtime();
  if (S.socialView === 'editProfile')       renderEditProfile(container);
  else if (S.socialView === 'composePost')  renderComposePost(container);
  else                                       renderSocialHub(container);
}

// Hooks publics pour partage depuis autres modules
async function shareWorkout(data){    return publishPost('workout',   data, true); }
async function sharePR(data){         return publishPost('pr',        data, true); }
async function shareStreak(data){     return publishPost('streak',    data, true); }
async function shareChallenge(data){  return publishPost('challenge', data, true); }

// Retour en premier plan → reset immédiat du cache d'échec pour que le prochain
// clic sur Social relance le probe sans attendre le cooldown de 30 s.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible' && _dbReady === false) {
      _dbReady  = null;
      _dbFailTs = 0;
    }
  });
}

})();
