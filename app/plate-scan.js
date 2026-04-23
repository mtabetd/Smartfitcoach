/**
 * SmartFitCoach — Proprietary Software
 * Copyright (c) 2024-2026 SmartFitCoach. All rights reserved.
 * Unauthorized copying, modification, distribution, or use of this software
 * is strictly prohibited without explicit written permission.
 * Contact: contact@smartfitcoach.com
 */
// plate-scan.js — Scanner de repas par IA (photo → macros → plan)
// Module isolé : un seul point de contact avec l'état = S.weekPlan[idx][slot]
(function() {
'use strict';

var FUNCTION_URL = '/.netlify/functions/plate-scan';
var _scanning = false;

// ── Compress image before sending (max 800px, 0.7 quality) ──
function compressImage(file, callback) {
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var MAX = 800;
      var w = img.width, ht = img.height;
      if (w > MAX || ht > MAX) {
        if (w > ht) { ht = Math.round(ht * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / ht); ht = MAX; }
      }
      var canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = ht;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, ht);
      callback(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = function() { callback(null); };
    img.src = e.target.result;
  };
  reader.onerror = function() { callback(null); };
  reader.readAsDataURL(file);
}

// ── Open scan modal ──
function openScan(mealSlot) {
  if (_scanning) return;
  var S = window.S;
  if (!S) return;
  // Premium gate — scanner repas = feature premium
  if (window.isPremium && !window.isPremium()) {
    if (window.showPaywall) window.showPaywall('scanner');
    else if (window.showToast) window.showToast('Fonctionnalit\u00e9 r\u00e9serv\u00e9e aux abonn\u00e9s', 'error', 3500);
    return;
  }

  // Determine today index
  var todayIdx = (new Date().getDay() + 6) % 7;
  var slotNames = { breakfast: 'Petit-d\u00e9jeuner', lunch: 'D\u00e9jeuner', snack: 'Collation', dinner: 'D\u00eener' };
  var slotLabel = slotNames[mealSlot] || mealSlot;

  // Remove existing modal
  var old = document.getElementById('plate-scan-modal');
  if (old && old.parentNode) old.parentNode.removeChild(old);

  // Build modal overlay
  var overlay = document.createElement('div');
  overlay.id = 'plate-scan-modal';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(10,10,9,0.55);z-index:9500;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity 0.25s cubic-bezier(0.25,0.46,0.45,0.94);';

  var sheet = document.createElement('div');
  sheet.style.cssText = 'width:100%;max-width:520px;background:var(--ivory,#FAF9F6);padding:24px;border-radius:2px 2px 0 0;max-height:90vh;overflow-y:auto;transform:translateY(100%);transition:transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94);';

  // Header
  var header = document.createElement('div');
  header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;';
  var title = document.createElement('div');
  title.style.cssText = 'font-family:Georgia,serif;font-size:20px;color:var(--black,#0A0A09);';
  title.textContent = 'Scanner mon repas';
  var closeBtn = document.createElement('button');
  closeBtn.style.cssText = 'background:none;border:none;font-size:20px;color:var(--grey,#6B6B65);cursor:pointer;padding:8px;min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;transition:color 0.2s ease;';
  closeBtn.onmouseover = function() { closeBtn.style.color = 'var(--black,#0A0A09)'; };
  closeBtn.onmouseout = function() { closeBtn.style.color = 'var(--grey,#6B6B65)'; };
  closeBtn.textContent = '\u00d7';
  closeBtn.onclick = function() { closeModal(); };
  header.appendChild(title);
  header.appendChild(closeBtn);
  sheet.appendChild(header);

  // Subtitle
  var sub = document.createElement('div');
  sub.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--grey,#6B6B65);line-height:1.6;margin-bottom:20px;letter-spacing:0.3px;';
  sub.textContent = 'Prenez une photo de votre ' + slotLabel.toLowerCase() + '. Notre IA estimera les calories et macronutriments en quelques secondes.';
  sheet.appendChild(sub);

  // Photo zone
  var photoZone = document.createElement('div');
  photoZone.style.cssText = 'border:1px dashed var(--border,#D8D8D0);border-radius:2px;padding:24px 16px;text-align:center;cursor:pointer;transition:all 0.2s ease;min-height:140px;display:flex;flex-direction:column;align-items:center;justify-content:center;margin-bottom:20px;';
  photoZone.onmouseover = function() { if (!_scanning) { photoZone.style.background = 'var(--ivory2,#F4F4F0)'; photoZone.style.borderColor = 'var(--black,#0A0A09)'; } };
  photoZone.onmouseout = function() { if (!_scanning) { photoZone.style.background = 'transparent'; photoZone.style.borderColor = 'var(--border,#D8D8D0)'; } };

  var photoLabel = document.createElement('div');
  photoLabel.style.cssText = 'font-size:28px;margin-bottom:8px;';
  photoLabel.textContent = '\uD83D\uDCF7';
  var photoText = document.createElement('div');
  photoText.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--grey,#6B6B65);';
  photoText.textContent = 'Prendre une photo';

  var fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.capture = 'environment';
  fileInput.style.display = 'none';

  photoZone.appendChild(photoLabel);
  photoZone.appendChild(photoText);
  photoZone.appendChild(fileInput);
  photoZone.onclick = function() { fileInput.click(); };
  sheet.appendChild(photoZone);

  // Result zone (hidden initially)
  var resultZone = document.createElement('div');
  resultZone.style.cssText = 'display:none;';
  sheet.appendChild(resultZone);

  // Loader (hidden initially)
  var loader = document.createElement('div');
  loader.style.cssText = 'display:none;text-align:center;padding:24px 0;';
  loader.innerHTML = '<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:16px;animation:platePulse 2s ease-in-out infinite;">ANALYSE EN COURS</div><div style="display:flex;justify-content:center;gap:6px;margin-bottom:16px;"><span style="width:6px;height:6px;background:var(--black,#0A0A09);border-radius:50%;animation:platePulse 1.2s ease infinite;"></span><span style="width:6px;height:6px;background:var(--black,#0A0A09);border-radius:50%;animation:platePulse 1.2s ease 0.2s infinite;"></span><span style="width:6px;height:6px;background:var(--black,#0A0A09);border-radius:50%;animation:platePulse 1.2s ease 0.4s infinite;"></span></div><div style="font-family:Georgia,serif;font-size:14px;font-style:italic;color:var(--grey);">Notre IA identifie votre repas\u2026</div><style>@keyframes platePulse{0%,100%{opacity:0.3}50%{opacity:1}}</style>';
  sheet.appendChild(loader);

  // File input handler
  var selectedImage = null;
  fileInput.onchange = function(e) {
    var file = e.target.files && e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    compressImage(file, function(b64) {
      if (!b64) { if (window.showToast) window.showToast('Impossible de lire cette image', 'error', 3000); return; }
      selectedImage = b64;

      // Show preview
      photoZone.innerHTML = '';
      var preview = document.createElement('img');
      preview.src = b64;
      preview.style.cssText = 'width:100%;max-height:200px;object-fit:cover;border-radius:2px;';
      photoZone.appendChild(preview);
      var checkText = document.createElement('div');
      checkText.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--green,#1A4A1A);margin-top:8px;';
      checkText.textContent = '\u2713 Photo prise';
      photoZone.appendChild(checkText);
      photoZone.style.borderStyle = 'solid';
      photoZone.style.borderColor = 'var(--green,#1A4A1A)';

      // Send to API
      _scanning = true;
      photoZone.style.display = 'none';
      loader.style.display = 'block';
      resultZone.style.display = 'none';

      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function() { ctrl.abort(); }, 24000) : null;

      (window.AUTH && window.AUTH.getJWT ? window.AUTH.getJWT() : Promise.resolve(null)).then(function(_jwt) {
        var _hdrs = { 'Content-Type': 'application/json' };
        if (_jwt) _hdrs['Authorization'] = 'Bearer ' + _jwt;
        return fetch(FUNCTION_URL, {
          method: 'POST',
          headers: _hdrs,
          body: JSON.stringify({ image: b64, mediaType: 'image/jpeg' }),
          signal: ctrl ? ctrl.signal : undefined
        });
      })
      .then(function(res) {
        if (timer) clearTimeout(timer);
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) { if (window.showPaywall) window.showPaywall('scanner'); var _pe = new Error('paywall'); _pe._paywall = true; throw _pe; }
          return res.json().catch(function() { return {}; }).then(function(e) { throw new Error(e.error || 'Erreur ' + res.status); });
        }
        return res.json();
      })
      .then(function(data) {
        _scanning = false;
        loader.style.display = 'none';
        photoZone.style.display = 'flex';
        showResult(data);
      })
      .catch(function(err) {
        if (timer) clearTimeout(timer);
        _scanning = false;
        loader.style.display = 'none';
        photoZone.style.display = 'flex';
        if (err && err._paywall) return;
        var msg = (err && err.name === 'AbortError')
          ? 'L\u2019analyse prend trop de temps. R\u00e9essayez.'
          : (err && err.message) || 'Erreur de connexion.';
        resultZone.style.display = 'block';
        resultZone.innerHTML = '';
        var errDiv = document.createElement('div');
        errDiv.style.cssText = 'border-left:3px solid var(--red,#5A1010);background:var(--redbg,rgba(90,16,16,0.06));padding:12px 16px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:var(--red,#5A1010);margin-bottom:16px;';
        errDiv.textContent = msg;
        resultZone.appendChild(errDiv);
      });
    });
  };

  // Show result
  function showResult(data) {
    resultZone.style.display = 'block';
    resultZone.innerHTML = '';

    var card = document.createElement('div');
    card.style.cssText = 'border:1px solid var(--border,#D8D8D0);border-left:4px solid var(--green,#1A4A1A);border-radius:2px;padding:16px;margin-bottom:16px;background:var(--ivory2,#F4F4F0);box-shadow:0 1px 3px rgba(10,10,9,0.05);';

    var name = document.createElement('div');
    name.style.cssText = 'font-family:Georgia,serif;font-size:18px;color:var(--black,#0A0A09);margin-bottom:8px;';
    name.textContent = data.name || 'Plat identifi\u00e9';
    card.appendChild(name);

    if (data.portion) {
      var portion = document.createElement('div');
      portion.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);margin-bottom:12px;';
      portion.textContent = 'Portion estim\u00e9e : ' + data.portion;
      card.appendChild(portion);
    }

    // Macros grid
    var grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center;';
    var macros = [
      { label: 'KCAL', val: data.kcal || 0, color: 'var(--black,#0A0A09)' },
      { label: 'PROT', val: (data.p || 0) + 'g', color: 'var(--green,#1A4A1A)' },
      { label: 'GLUC', val: (data.g || 0) + 'g', color: 'var(--orange,#6A4A1A)' },
      { label: 'LIP', val: (data.l || 0) + 'g', color: 'var(--blue,#1A3A6A)' }
    ];
    macros.forEach(function(m) {
      var cell = document.createElement('div');
      cell.style.cssText = 'padding:12px 8px;border:1px solid var(--border,#D8D8D0);border-radius:2px;background:var(--ivory,#FAF9F6);';
      var val = document.createElement('div');
      val.style.cssText = 'font-family:Georgia,serif;font-size:16px;color:' + m.color + ';font-weight:500;';
      val.textContent = m.val;
      var lbl = document.createElement('div');
      lbl.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:9px;letter-spacing:2px;color:var(--grey,#6B6B65);margin-top:4px;';
      lbl.textContent = m.label;
      cell.appendChild(val);
      cell.appendChild(lbl);
      grid.appendChild(cell);
    });
    card.appendChild(grid);
    resultZone.appendChild(card);

    // Disclaimer
    var disc = document.createElement('div');
    disc.style.cssText = 'font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey3,#9A9A90);font-style:italic;margin-bottom:16px;text-align:center;';
    disc.textContent = 'Estimation par IA \u2014 les valeurs peuvent varier de \u00b120%';
    resultZone.appendChild(disc);

    // Add button
    var addBtn = document.createElement('button');
    addBtn.style.cssText = 'display:block;width:100%;padding:14px;background:var(--green,#1A4A1A);color:var(--ivory,#FAF9F6);border:none;border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:600;cursor:pointer;transition:all 0.25s cubic-bezier(0.25,0.46,0.45,0.94);min-height:48px;box-shadow:0 2px 8px rgba(26,74,26,0.15);margin-bottom:8px;';
    addBtn.onmouseover = function() { addBtn.style.boxShadow = '0 6px 16px rgba(26,74,26,0.25)'; addBtn.style.transform = 'translateY(-1px)'; };
    addBtn.onmouseout = function() { addBtn.style.boxShadow = '0 2px 8px rgba(26,74,26,0.15)'; addBtn.style.transform = 'translateY(0)'; };
    addBtn.textContent = '\u2713 Ajouter \u00e0 ma journ\u00e9e';
    addBtn.onclick = function() {
      // Replace meal in weekPlan
      if (Array.isArray(S.weekPlan) && S.weekPlan[todayIdx]) {
        S.weekPlan[todayIdx][mealSlot] = {
          n: data.name || 'Repas scann\u00e9',
          k: data.kcal || 0, kcal: data.kcal || 0,
          p: data.p || 0, g: data.g || 0, l: data.l || 0,
          f: '\u25CE', custom: true, scanned: true
        };
        if (window.saveProfile) { try { window.saveProfile(); } catch(e) {} }
      }
      closeModal();
      if (window.render) window.render();
    };
    resultZone.appendChild(addBtn);

    // Cancel
    var cancelBtn = document.createElement('button');
    cancelBtn.style.cssText = 'display:block;width:100%;padding:14px;background:transparent;border:1px solid var(--border,#D8D8D0);border-radius:2px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:11px;color:var(--grey,#6B6B65);cursor:pointer;min-height:44px;transition:all 0.2s ease;';
    cancelBtn.onmouseover = function() { cancelBtn.style.borderColor = 'var(--black,#0A0A09)'; cancelBtn.style.color = 'var(--black,#0A0A09)'; };
    cancelBtn.onmouseout = function() { cancelBtn.style.borderColor = 'var(--border,#D8D8D0)'; cancelBtn.style.color = 'var(--grey,#6B6B65)'; };
    cancelBtn.textContent = 'Annuler';
    cancelBtn.onclick = function() { closeModal(); };
    resultZone.appendChild(cancelBtn);
  }

  function closeModal() {
    _scanning = false;
    var m = document.getElementById('plate-scan-modal');
    if (m) {
      m.style.opacity = '0';
      var s = m.querySelector('div');
      if (s) s.style.transform = 'translateY(100%)';
      setTimeout(function() { if (m.parentNode) m.parentNode.removeChild(m); }, 250);
    }
  }

  // Close on overlay click
  overlay.onclick = function(e) { if (e.target === overlay) closeModal(); };

  overlay.appendChild(sheet);
  document.body.appendChild(overlay);

  // Animate in
  requestAnimationFrame(function() {
    overlay.style.opacity = '1';
    sheet.style.transform = 'translateY(0)';
  });
}

// ── Expose globally ──
window.PLATE_SCAN = { open: openScan };

})();
