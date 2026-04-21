/* Widget feedback in-app — envoie un email à smartfitcoach@proton.me via Netlify Functions */
(function () {
  var _lastSent = 0;
  var MIN_INTERVAL_MS = 5 * 60 * 1000; // 1 feedback toutes les 5 min max

  function _currentPage() {
    var h = window.location.hash || '';
    if (h) return h.replace(/^#\/?/, '');
    var activeTab = document.querySelector('[aria-selected="true"], .tab-active, .nav-item.active');
    return activeTab ? (activeTab.textContent || '').trim().slice(0, 40) : 'accueil';
  }

  function _createWidget() {
    // ── Bouton flottant ──────────────────────────────────────────────────────
    var btn = document.createElement('button');
    btn.id = 'feedback-fab';
    btn.setAttribute('aria-label', 'Donner mon avis');
    btn.setAttribute('title', 'Donner mon avis');
    btn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style="display:block">' +
      '<path d="M2 2h12v9H9l-3 3v-3H2V2z" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linejoin="round"/>' +
      '</svg>';
    btn.style.cssText =
      'position:fixed;bottom:80px;left:16px;z-index:8900;' +
      'width:44px;height:44px;min-width:44px;min-height:44px;' +
      'background:var(--ink-900,#0A0A09);color:var(--paper,#FAF9F6);' +
      'border:none;border-radius:0;cursor:pointer;' +
      'display:flex;align-items:center;justify-content:center;' +
      'opacity:.75;transition:opacity 180ms;';
    btn.addEventListener('mouseenter', function(){ btn.style.opacity = '1'; });
    btn.addEventListener('mouseleave', function(){ btn.style.opacity = '.85'; });

    // ── Overlay ──────────────────────────────────────────────────────────────
    var overlay = document.createElement('div');
    overlay.id = 'feedback-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.cssText =
      'display:none;position:fixed;inset:0;background:rgba(10,10,9,.45);z-index:9500;' +
      'opacity:0;transition:opacity 220ms;';

    // ── Bottom sheet ─────────────────────────────────────────────────────────
    var sheet = document.createElement('div');
    sheet.id = 'feedback-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-labelledby', 'feedback-sheet-title');
    sheet.style.cssText =
      'position:fixed;bottom:0;left:0;right:0;z-index:9501;' +
      'background:var(--paper,#FAF9F6);' +
      'border-top:1px solid var(--line,#D8D8D0);' +
      'padding:24px 20px 40px;' +
      'transform:translateY(100%);transition:transform 260ms cubic-bezier(.4,0,.2,1);';

    sheet.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">' +
        '<span id="feedback-sheet-title" style="font-family:Georgia,serif;font-size:15px;font-style:italic;color:var(--ink-900,#0A0A09)">Votre avis</span>' +
        '<button id="feedback-close" aria-label="Fermer" style="background:none;border:none;font-family:Georgia,serif;font-size:22px;color:var(--ink-500,#6B6B65);cursor:pointer;line-height:1;padding:4px 6px;min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center">&times;</button>' +
      '</div>' +
      '<textarea id="feedback-text" placeholder="Ce qui manque, ce qui vous plaît, ce qui bloque…" maxlength="1000" rows="4" ' +
        'style="width:100%;box-sizing:border-box;padding:12px;resize:none;' +
        'font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:14px;line-height:1.65;' +
        'border:1px solid var(--line,#D8D8D0);background:var(--paper,#FAF9F6);color:var(--ink-900,#0A0A09);outline:none;"></textarea>' +
      '<div id="feedback-char" style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:10px;color:var(--ink-300,#A8A8A0);text-align:right;margin-top:4px">0 / 1000</div>' +
      '<div id="feedback-msg" style="display:none;margin-top:10px;font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:12px;padding:8px 10px"></div>' +
      '<button id="feedback-send" style="margin-top:14px;width:100%;padding:14px;min-height:44px;' +
        'background:var(--ink-900,#0A0A09);color:var(--paper,#FAF9F6);' +
        'border:1px solid var(--ink-900,#0A0A09);border-radius:0;' +
        'font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;cursor:pointer;">Envoyer</button>';

    document.body.appendChild(btn);
    document.body.appendChild(overlay);
    document.body.appendChild(sheet);

    var textarea = document.getElementById('feedback-text');
    var charCount = document.getElementById('feedback-char');
    var msgBox    = document.getElementById('feedback-msg');
    var sendBtn   = document.getElementById('feedback-send');

    textarea.addEventListener('input', function() {
      charCount.textContent = textarea.value.length + ' / 1000';
    });

    function openSheet() {
      overlay.style.display = 'block';
      sheet.style.display = 'block';
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          overlay.style.opacity = '1';
          sheet.style.transform = 'translateY(0)';
          textarea.focus();
        });
      });
    }

    function closeSheet() {
      overlay.style.opacity = '0';
      sheet.style.transform = 'translateY(100%)';
      setTimeout(function() {
        overlay.style.display = 'none';
        msgBox.style.display = 'none';
        sendBtn.disabled = false;
        sendBtn.textContent = 'Envoyer';
      }, 260);
    }

    btn.addEventListener('click', openSheet);
    overlay.addEventListener('click', closeSheet);
    document.getElementById('feedback-close').addEventListener('click', closeSheet);

    sendBtn.addEventListener('click', function() {
      var msg = textarea.value.trim();
      if (!msg || msg.length < 3) {
        _showMsg(msgBox, 'Écrivez quelques mots avant d\'envoyer.', 'warn');
        return;
      }
      var now = Date.now();
      if (now - _lastSent < MIN_INTERVAL_MS) {
        _showMsg(msgBox, 'Merci, votre avis a déjà été envoyé.', 'warn');
        return;
      }
      sendBtn.disabled = true;
      sendBtn.textContent = 'Envoi…';
      msgBox.style.display = 'none';

      fetch('/.netlify/functions/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          page: _currentPage(),
          version: String(window.APP_VERSION || window.CACHE_VERSION || 'unknown'),
          ua: String(navigator.userAgent || '').slice(0, 200)
        })
      })
      .then(function(r) { return r.json().then(function(d){ return { ok: r.ok, data: d }; }); })
      .then(function(res) {
        if (res.ok) {
          _lastSent = Date.now();
          textarea.value = '';
          charCount.textContent = '0 / 1000';
          _showMsg(msgBox, 'Merci pour votre retour.', 'ok');
          sendBtn.textContent = 'Envoyé';
          setTimeout(closeSheet, 2200);
        } else {
          sendBtn.disabled = false;
          sendBtn.textContent = 'Envoyer';
          _showMsg(msgBox, (res.data && res.data.error) || 'Erreur. Réessayez.', 'err');
        }
      })
      .catch(function() {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Envoyer';
        _showMsg(msgBox, 'Connexion impossible. Réessayez.', 'err');
      });
    });
  }

  function _showMsg(el, text, type) {
    el.textContent = text;
    var styles = {
      ok:   'color:var(--success,#3E5C3A);border:1px solid var(--success,#3E5C3A);background:rgba(62,92,58,.06)',
      warn: 'color:var(--warning,#B07A2A);border:1px solid var(--warning,#B07A2A);background:rgba(176,122,42,.06)',
      err:  'color:var(--error,#7A1F1F);border:1px solid var(--error,#7A1F1F);background:rgba(122,31,31,.06)'
    };
    el.style.cssText = 'display:block;padding:8px 10px;font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:12px;margin-top:10px;' + (styles[type] || styles.err);
  }

  // N'afficher le bouton que quand l'app est visible (gate passée)
  function _waitForApp() {
    var app = document.getElementById('app');
    if (!app) { setTimeout(_waitForApp, 300); return; }
    if (app.style.display !== 'none' && app.style.display !== '') {
      _createWidget();
      return;
    }
    var obs = new MutationObserver(function() {
      if (app.style.display !== 'none' && app.style.display !== '') {
        obs.disconnect();
        _createWidget();
      }
    });
    obs.observe(app, { attributes: true, attributeFilter: ['style'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _waitForApp);
  } else {
    _waitForApp();
  }
})();
